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
const DEFAULT_USER_ID = 1;

function parseTwin(row: typeof financialTwinsTable.$inferSelect) {
  const projection = JSON.parse(row.projectionJson);
  const risks = JSON.parse(row.risksJson);
  const goals = JSON.parse(row.goalsJson);
  const scenarios = JSON.parse(row.scenariosJson);
  return {
    id: row.id,
    summaryEn: row.summaryEn,
    summaryAr: row.summaryAr,
    currentMonthlyIncome: parseFloat(row.currentMonthlyIncome),
    currentSavingsRate: parseFloat(row.currentSavingsRate),
    projection,
    risks,
    goals,
    scenarios,
    createdAt: row.createdAt.toISOString(),
  };
}

router.get("/twin/projection", async (req, res): Promise<void> => {
  const [twin] = await db
    .select()
    .from(financialTwinsTable)
    .where(eq(financialTwinsTable.userId, DEFAULT_USER_ID))
    .orderBy(desc(financialTwinsTable.createdAt))
    .limit(1);

  if (!twin) {
    res.status(404).json({ error: "No Financial Twin yet. Generate one first." });
    return;
  }

  res.json(GetTwinProjectionResponse.parse(parseTwin(twin)));
});

router.post("/twin/generate", async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, DEFAULT_USER_ID));
  const [sim] = await db
    .select()
    .from(simulationsTable)
    .where(eq(simulationsTable.userId, DEFAULT_USER_ID))
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
    .where(eq(userDecisionsTable.userId, DEFAULT_USER_ID))
    .orderBy(desc(userDecisionsTable.createdAt))
    .limit(10);

  const [latestAnalysis] = await db
    .select()
    .from(personalityAnalysesTable)
    .where(eq(personalityAnalysesTable.userId, DEFAULT_USER_ID))
    .orderBy(desc(personalityAnalysesTable.createdAt))
    .limit(1);

  const currentYear = new Date().getFullYear();

  const userContext = `
User: ${user?.username ?? "Solaf"}, Level ${user?.level ?? 7}
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
          content: `Generate a Financial Twin 10-year projection for this user:

${userContext}

Output this EXACT JSON structure:
{
  "summaryEn": "2-3 sentence executive summary of the user's financial trajectory",
  "summaryAr": "ملخص تنفيذي من 2-3 جمل عن المسار المالي للمستخدم",
  "projection": [
    {
      "year": ${currentYear + 1},
      "savings": <cumulative savings in SAR>,
      "netWorth": <estimated net worth in SAR>,
      "income": <annual income in SAR>,
      "expenses": <annual expenses in SAR>,
      "milestone": "milestone label if notable year, else null",
      "milestoneAr": "Arabic milestone label or null"
    }
    // ... repeat for years ${currentYear + 1} through ${currentYear + 10}
  ],
  "risks": [
    {
      "titleEn": "Risk title",
      "titleAr": "عنوان المخاطرة",
      "descriptionEn": "What could go wrong",
      "descriptionAr": "ما الذي قد يسوء",
      "severity": "low|medium|high",
      "probability": <0-100>
    }
  ],
  "goals": [
    {
      "titleEn": "Goal title",
      "titleAr": "عنوان الهدف",
      "descriptionEn": "How to achieve it",
      "descriptionAr": "كيفية تحقيقه",
      "targetYear": <year>,
      "targetAmount": <SAR amount>,
      "isAchievable": <true|false>
    }
  ],
  "scenarios": [
    {
      "type": "optimistic",
      "labelEn": "Best Case",
      "labelAr": "أفضل حالة",
      "projections": [
        {"year": ${currentYear + 1}, "savings": <SAR>, "netWorth": <SAR>, "income": <SAR>, "expenses": <SAR>, "milestone": null, "milestoneAr": null}
        // ... repeat for all 10 years, 20% better outcomes
      ]
    },
    {
      "type": "base",
      "labelEn": "Expected",
      "labelAr": "المتوقع",
      "projections": [/* same as main projection */]
    },
    {
      "type": "pessimistic",
      "labelEn": "Worst Case",
      "labelAr": "أسوأ حالة",
      "projections": [
        {"year": ${currentYear + 1}, "savings": <SAR>, "netWorth": <SAR>, "income": <SAR>, "expenses": <SAR>, "milestone": null, "milestoneAr": null}
        // ... repeat for all 10 years, 30% worse outcomes
      ]
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
        userId: DEFAULT_USER_ID,
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
    logger.error({ err }, "OpenAI financial twin generation failed");
    res.status(500).json({ error: "Failed to generate Financial Twin" });
  }
});

export default router;
