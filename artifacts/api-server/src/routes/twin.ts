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
import { openai, AI_MODEL_LITE, extractJson } from "../lib/openai";
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

  const years = Array.from({ length: 5 }, (_, i) => currentYear + 1 + i);

  try {
    // Ask the AI for the base-case projection only (risks + goals + summaries).
    // Optimistic / pessimistic scenarios are derived mathematically so the
    // response stays well within the OpenRouter free-tier token budget.
    const completion = await openai.chat.completions.create({
      model: AI_MODEL_LITE,
      max_tokens: 1400,
      messages: [
        {
          role: "system",
          content: `Financial analyst for Saudi Arabia. Reply with ONLY valid JSON, no markdown, no comments.`,
        },
        {
          role: "user",
          content: `Create a 5-year base-case financial projection for:
${userContext}

Respond with ONLY this JSON (replace every 0 with a realistic SAR integer):
{"summaryEn":"one sentence","summaryAr":"جملة واحدة","projection":[{"year":${years[0]},"savings":0,"netWorth":0,"income":0,"expenses":0,"milestone":null,"milestoneAr":null},{"year":${years[1]},"savings":0,"netWorth":0,"income":0,"expenses":0,"milestone":null,"milestoneAr":null},{"year":${years[2]},"savings":0,"netWorth":0,"income":0,"expenses":0,"milestone":null,"milestoneAr":null},{"year":${years[3]},"savings":0,"netWorth":0,"income":0,"expenses":0,"milestone":null,"milestoneAr":null},{"year":${years[4]},"savings":0,"netWorth":0,"income":0,"expenses":0,"milestone":null,"milestoneAr":null}],"risks":[{"titleEn":"","titleAr":"","descriptionEn":"","descriptionAr":"","severity":"medium","probability":0.5},{"titleEn":"","titleAr":"","descriptionEn":"","descriptionAr":"","severity":"low","probability":0.3}],"goals":[{"titleEn":"","titleAr":"","descriptionEn":"","descriptionAr":"","targetYear":${currentYear+3},"targetAmount":0,"isAchievable":true},{"titleEn":"","titleAr":"","descriptionEn":"","descriptionAr":"","targetYear":${currentYear+5},"targetAmount":0,"isAchievable":true}]}

Rules: severity = "low"|"medium"|"high". probability = 0 to 1. Keep descriptions under 12 words each.`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const data = extractJson<Record<string, any>>(raw);

    // Derive optimistic (+25% income, +40% savings, -5% expenses) and
    // pessimistic (-15% income, -30% savings, +10% expenses) from base case.
    const scaleProjection = (
      base: any[],
      incomeMul: number,
      savingsMul: number,
      expMul: number
    ) =>
      base.map((p: any) => ({
        year: p.year,
        savings: Math.round(p.savings * savingsMul),
        netWorth: Math.round(
          p.netWorth * (savingsMul * 0.6 + incomeMul * 0.4)
        ),
        income: Math.round(p.income * incomeMul),
        expenses: Math.round(p.expenses * expMul),
        milestone: null,
        milestoneAr: null,
      }));

    const baseProj: any[] = data.projection ?? [];
    const scenarios = [
      {
        type: "optimistic",
        labelEn: "Best Case",
        labelAr: "أفضل حالة",
        projections: scaleProjection(baseProj, 1.25, 1.4, 0.95),
      },
      {
        type: "base",
        labelEn: "Expected",
        labelAr: "المتوقع",
        projections: baseProj,
      },
      {
        type: "pessimistic",
        labelEn: "Worst Case",
        labelAr: "أسوأ حالة",
        projections: scaleProjection(baseProj, 0.85, 0.7, 1.1),
      },
    ];

    const [row] = await db
      .insert(financialTwinsTable)
      .values({
        userId,
        summaryEn: data.summaryEn ?? "",
        summaryAr: data.summaryAr ?? "",
        currentMonthlyIncome: String(monthlyIncome),
        currentSavingsRate: String(savingsRate),
        projectionJson: JSON.stringify(baseProj),
        risksJson: JSON.stringify(data.risks ?? []),
        goalsJson: JSON.stringify(data.goals ?? []),
        scenariosJson: JSON.stringify(scenarios),
      })
      .returning();

    res.json(GenerateTwinProjectionResponse.parse(parseTwin(row)));
  } catch (err) {
    logger.error({ err }, "Financial twin generation failed");
    res.status(500).json({ error: "Failed to generate Financial Twin" });
  }
});

export default router;
