import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import {
  db,
  financialTwinsTable,
  usersTable,
  simulationsTable,
  budgetAllocationsTable,
  userDecisionsTable,
  personalityAnalysesTable,
} from "@workspace/db";
import {
  GetTwinProjectionResponse,
  GenerateTwinProjectionResponse,
} from "@workspace/api-zod";
import { openai, AI_MODEL, extractJson } from "../lib/openai";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function parseTwin(row: typeof financialTwinsTable.$inferSelect) {
  return {
    id: row.id,
    summaryEn: row.summaryEn,
    summaryAr: row.summaryAr,
    currentMonthlyIncome: parseFloat(row.currentMonthlyIncome),
    currentSavingsRate: parseFloat(row.currentSavingsRate),
    projection: JSON.parse(row.projectionJson),
    risks: JSON.parse(row.risksJson),
    goals: JSON.parse(row.goalsJson),
    scenarios: JSON.parse(row.scenariosJson),
    createdAt: row.createdAt.toISOString(),
  };
}

router.get("/twin/projection", async (req, res): Promise<void> => {
  const userId = req.session.userId!;

  const [twin] = await db
    .select()
    .from(financialTwinsTable)
    .where(eq(financialTwinsTable.userId, userId))
    .orderBy(desc(financialTwinsTable.createdAt))
    .limit(1);

  if (!twin) {
    res.status(404).json({ error: "No Financial Twin yet. Generate one first." });
    return;
  }

  res.json(GetTwinProjectionResponse.parse(parseTwin(twin)));
});

router.post("/twin/generate", async (req, res): Promise<void> => {
  const userId = req.session.userId!;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  const [sim] = await db
    .select()
    .from(simulationsTable)
    .where(eq(simulationsTable.userId, userId))
    .orderBy(desc(simulationsTable.createdAt))
    .limit(1);

  const allocations = sim
    ? await db.select().from(budgetAllocationsTable).where(eq(budgetAllocationsTable.simulationId, sim.id))
    : [];

  const totalSpent = allocations.reduce((s, a) => s + parseFloat(a.spent), 0);
  const monthlyIncome = sim ? parseFloat(sim.totalBudget) : 7200;
  const monthlySavings = monthlyIncome - totalSpent;
  const savingsRate = monthlyIncome > 0 ? ((monthlySavings / monthlyIncome) * 100).toFixed(1) : "22";

  const decisions = await db
    .select()
    .from(userDecisionsTable)
    .where(eq(userDecisionsTable.userId, userId))
    .orderBy(desc(userDecisionsTable.createdAt))
    .limit(10);

  const [latestAnalysis] = await db
    .select()
    .from(personalityAnalysesTable)
    .where(eq(personalityAnalysesTable.userId, userId))
    .orderBy(desc(personalityAnalysesTable.createdAt))
    .limit(1);

  const currentYear = new Date().getFullYear();

  const userContext = `
User: ${user?.username ?? "User"}, Level ${user?.level ?? 1}
Monthly Income: SAR ${monthlyIncome}
Monthly Savings: SAR ${monthlySavings.toFixed(0)}
Savings Rate: ${savingsRate}%
Budget Health Score: ${sim?.healthScore ?? 75}/100
Financial Personality: ${latestAnalysis?.personalityTypeEn ?? "Unknown — not analyzed yet"}
Number of Financial Decisions Made: ${decisions.length}
Average XP per Decision: ${decisions.length > 0 ? Math.round(decisions.reduce((s, d) => s + d.xpEarned, 0) / decisions.length) : 0}
Current Year: ${currentYear}
`;

  try {
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      max_tokens: 8192,
      messages: [
        {
          role: "system",
          content: `You are a financial projection expert for Saudi Arabia's Vision 2030 era.
Generate realistic 10-year financial projections based on current behavior.
All monetary values in Saudi Riyals (SAR). Be specific and realistic.
Output ONLY valid JSON — no markdown, no commentary.`,
        },
        {
          role: "user",
          content: `Generate a 10-year financial twin projection for this user:

${userContext}

Output this exact JSON structure:
{
  "summaryEn": "2-3 sentence overview of their financial trajectory",
  "summaryAr": "نظرة عامة من 2-3 جمل عن مسارهم المالي",
  "projection": [
    {"year": ${currentYear + 1}, "savings": <SAR>, "netWorth": <SAR>, "income": <SAR>, "expenses": <SAR>, "milestone": "string or null", "milestoneAr": "string or null"}
  ],
  "risks": [
    {"titleEn": "...", "titleAr": "...", "descriptionEn": "...", "descriptionAr": "...", "severity": "high|medium|low"}
  ],
  "goals": [
    {"titleEn": "...", "titleAr": "...", "targetAmount": <SAR>, "timelineYears": <n>, "monthlyRequired": <SAR>}
  ],
  "scenarios": [
    {
      "type": "optimistic",
      "labelEn": "Best Case",
      "labelAr": "أفضل حالة",
      "projections": [{"year": ${currentYear + 1}, "savings": <SAR>, "netWorth": <SAR>, "income": <SAR>, "expenses": <SAR>, "milestone": null, "milestoneAr": null}]
    },
    {
      "type": "base",
      "labelEn": "Expected",
      "labelAr": "المتوقع",
      "projections": []
    },
    {
      "type": "pessimistic",
      "labelEn": "Worst Case",
      "labelAr": "أسوأ حالة",
      "projections": [{"year": ${currentYear + 1}, "savings": <SAR>, "netWorth": <SAR>, "income": <SAR>, "expenses": <SAR>, "milestone": null, "milestoneAr": null}]
    }
  ]
}

Include 3 risks and 3 goals. Make projections culturally relevant to Saudi Arabia.`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const data = extractJson<Record<string, any>>(raw);

    const [row] = await db
      .insert(financialTwinsTable)
      .values({
        userId,
        summaryEn: data.summaryEn,
        summaryAr: data.summaryAr,
        currentMonthlyIncome: String(monthlyIncome),
        currentSavingsRate: String(savingsRate),
        projectionJson: JSON.stringify(data.projection ?? []),
        risksJson: JSON.stringify(data.risks ?? []),
        goalsJson: JSON.stringify(data.goals ?? []),
        scenariosJson: JSON.stringify(data.scenarios ?? []),
      })
      .returning();

    res.json(GenerateTwinProjectionResponse.parse(parseTwin(row)));
  } catch (err) {
    logger.error({ err }, "Financial twin generation failed");
    res.status(500).json({ error: "Failed to generate Financial Twin" });
  }
});

export default router;
