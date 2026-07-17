import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import {
  db,
  aiScenariosTable,
  usersTable,
  activitiesTable,
  userDecisionsTable,
  simulationsTable,
} from "@workspace/db";
import {
  GetActiveScenariosResponse,
  GenerateScenarioBody,
  GenerateScenarioResponse,
  RespondToScenarioParams,
  RespondToScenarioBody,
  RespondToScenarioResponse,
} from "@workspace/api-zod";
import { openaiManaged, AI_MODEL_MANAGED, extractJson } from "../lib/openai";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const RISK_LEVEL_MAP: Record<string, string> = { low: "safe", medium: "moderate", high: "risky" };

function parseScenario(row: typeof aiScenariosTable.$inferSelect) {
  const options = (JSON.parse(row.optionsJson) as Array<{
    id: string;
    labelEn: string;
    labelAr: string;
    riskLevel: string;
    xpReward: number;
    outcomePreviewEn: string;
    outcomePreviewAr: string;
  }>).map((o) => ({ ...o, riskLevel: RISK_LEVEL_MAP[o.riskLevel] ?? o.riskLevel }));
  return {
    id: row.id,
    titleEn: row.titleEn,
    titleAr: row.titleAr,
    descriptionEn: row.descriptionEn,
    descriptionAr: row.descriptionAr,
    type: row.type,
    severity: row.severity,
    impactAmount: parseFloat(row.impactAmount),
    options,
    isActive: row.isActive,
    responded: row.responded,
    chosenOptionId: row.chosenOptionId ?? null,
    feedbackEn: row.feedbackEn ?? null,
    feedbackAr: row.feedbackAr ?? null,
    xpEarned: row.xpEarned,
    createdAt: row.createdAt.toISOString(),
  };
}

router.get("/scenarios/active", async (req, res): Promise<void> => {
  const userId = req.session.userId!;

  const scenarios = await db
    .select()
    .from(aiScenariosTable)
    .where(and(eq(aiScenariosTable.userId, userId), eq(aiScenariosTable.isActive, true)))
    .orderBy(desc(aiScenariosTable.createdAt))
    .limit(10);

  res.json(GetActiveScenariosResponse.parse(scenarios.map(parseScenario)));
});

router.post("/scenarios/generate", async (req, res): Promise<void> => {
  const userId = req.session.userId!;

  const parsed = GenerateScenarioBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  const [sim] = await db
    .select()
    .from(simulationsTable)
    .where(eq(simulationsTable.userId, userId))
    .orderBy(desc(simulationsTable.createdAt))
    .limit(1);

  const recentDecisions = await db
    .select()
    .from(userDecisionsTable)
    .where(eq(userDecisionsTable.userId, userId))
    .orderBy(desc(userDecisionsTable.createdAt))
    .limit(5);

  const SCENARIO_TYPES = [
    "market_crash", "bonus", "expense", "investment", "emergency", "opportunity",
  ];
  const forceType = parsed.data.forceType;
  const scenarioType = forceType && SCENARIO_TYPES.includes(forceType)
    ? forceType
    : SCENARIO_TYPES[Math.floor(Math.random() * SCENARIO_TYPES.length)];

  const userContext = `
User: ${user?.username ?? "User"}, Level ${user?.level ?? 1}, XP ${user?.xp ?? 0}, Coins ${user?.coins ?? 0}
Monthly Budget: SAR ${sim ? parseFloat(sim.totalBudget) : 7200}
Budget Health Score: ${sim?.healthScore ?? 75}/100
Recent decisions risk profile: ${recentDecisions.length > 0 ? "mixed" : "no history yet"}
`;

  try {
    const completion = await openaiManaged.chat.completions.create({
      model: AI_MODEL_MANAGED,
      messages: [
        {
          role: "system",
          content: `You are a financial scenario generator for Wazin (وازِن), a Saudi financial education app targeting young people.
Generate a realistic, engaging financial scenario in BOTH English and Arabic.
The scenario must be culturally relevant to Saudi Arabia and feel authentic.
Output ONLY valid JSON matching the exact structure specified.`,
        },
        {
          role: "user",
          content: `Generate a unique "${scenarioType}" financial scenario for this user:

${userContext}

Output this exact JSON:
{
  "titleEn": "Short scenario title",
  "titleAr": "عنوان السيناريو",
  "descriptionEn": "2-3 sentence scenario description",
  "descriptionAr": "وصف السيناريو بجملتين أو ثلاث",
  "type": "${scenarioType}",
  "severity": "low|medium|high",
  "impactAmount": <SAR amount 500-5000>,
  "options": [
    {
      "id": "conservative",
      "labelEn": "Safe choice label",
      "labelAr": "تسمية الخيار الآمن",
      "riskLevel": "safe",
      "xpReward": 50,
      "outcomePreviewEn": "What happens if they choose this",
      "outcomePreviewAr": "ما يحدث إذا اختاروا هذا"
    },
    {
      "id": "balanced",
      "labelEn": "Balanced choice label",
      "labelAr": "تسمية الخيار المتوازن",
      "riskLevel": "moderate",
      "xpReward": 100,
      "outcomePreviewEn": "What happens if they choose this",
      "outcomePreviewAr": "ما يحدث إذا اختاروا هذا"
    },
    {
      "id": "aggressive",
      "labelEn": "Bold choice label",
      "labelAr": "تسمية الخيار الجريء",
      "riskLevel": "risky",
      "xpReward": 150,
      "outcomePreviewEn": "What happens if they choose this",
      "outcomePreviewAr": "ما يحدث إذا اختاروا هذا"
    }
  ]
}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const data = extractJson<Record<string, any>>(raw);

    // Normalize riskLevel values the AI sometimes returns (low/medium/high)
    // into the schema values (safe/moderate/risky).
    const riskLevelMap: Record<string, string> = {
      low: "safe",
      medium: "moderate",
      high: "risky",
    };
    const normalizedOptions = (data.options ?? []).map((opt: any) => ({
      ...opt,
      riskLevel: riskLevelMap[opt?.riskLevel] ?? opt?.riskLevel ?? "safe",
    }));

    const [scenario] = await db
      .insert(aiScenariosTable)
      .values({
        userId,
        titleEn: data.titleEn,
        titleAr: data.titleAr,
        descriptionEn: data.descriptionEn,
        descriptionAr: data.descriptionAr,
        type: data.type ?? scenarioType,
        severity: data.severity ?? "medium",
        impactAmount: String(data.impactAmount ?? 1000),
        optionsJson: JSON.stringify(normalizedOptions),
        isActive: true,
        responded: false,
        xpEarned: 0,
      })
      .returning();

    res.json(GenerateScenarioResponse.parse(parseScenario(scenario)));
  } catch (err) {
    logger.error({ err }, "Scenario generation failed");
    res.status(500).json({ error: "Failed to generate scenario" });
  }
});

router.post("/scenarios/:scenarioId/respond", async (req, res): Promise<void> => {
  const userId = req.session.userId!;

  const rawId = Array.isArray(req.params.scenarioId) ? req.params.scenarioId[0] : req.params.scenarioId;
  const params = RespondToScenarioParams.safeParse({ scenarioId: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = RespondToScenarioBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [scenario] = await db
    .select()
    .from(aiScenariosTable)
    .where(and(eq(aiScenariosTable.id, params.data.scenarioId), eq(aiScenariosTable.userId, userId)));

  if (!scenario) {
    res.status(404).json({ error: "Scenario not found" });
    return;
  }

  if (scenario.responded) {
    res.status(409).json({ error: "Already responded to this scenario" });
    return;
  }

  const options = JSON.parse(scenario.optionsJson) as Array<{
    id: string;
    labelEn: string;
    labelAr: string;
    riskLevel: string;
    xpReward: number;
    outcomePreviewEn: string;
    outcomePreviewAr: string;
  }>;

  const chosen = options.find((o) => o.id === body.data.optionId);
  if (!chosen) {
    res.status(400).json({ error: "Invalid option" });
    return;
  }

  try {
    const completion = await openaiManaged.chat.completions.create({
      model: AI_MODEL_MANAGED,
      messages: [
        {
          role: "system",
          content: "You are a financial outcomes narrator. Output ONLY valid JSON.",
        },
        {
          role: "user",
          content: `The user chose "${chosen.labelEn}" (${chosen.riskLevel} risk) for scenario: "${scenario.titleEn}".
Generate personalised feedback in both English and Arabic.

Output JSON:
{
  "feedbackEn": "2-3 sentences explaining the outcome and financial lesson",
  "feedbackAr": "جملتان أو ثلاث تشرح النتيجة والدرس المالي",
  "impactSummaryEn": "One sentence on budget impact",
  "impactSummaryAr": "جملة واحدة عن تأثير الميزانية"
}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const fb = extractJson<Record<string, string>>(raw);

    const feedbackEn = fb.feedbackEn ?? chosen.outcomePreviewEn;
    const feedbackAr = fb.feedbackAr ?? chosen.outcomePreviewAr;
    const impactSummaryEn = fb.impactSummaryEn ?? "Your budget has been updated.";
    const impactSummaryAr = fb.impactSummaryAr ?? "تم تحديث ميزانيتك.";

    const xpEarned = chosen.xpReward;
    const coinsEarned = Math.floor(xpEarned / 3);

    await db
      .update(aiScenariosTable)
      .set({ responded: true, isActive: false, chosenOptionId: body.data.optionId, feedbackEn, feedbackAr, xpEarned })
      .where(eq(aiScenariosTable.id, scenario.id));

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    const newXp = (user?.xp ?? 0) + xpEarned;
    const newCoins = (user?.coins ?? 0) + coinsEarned;
    const newLevel = Math.floor(newXp / 500) + 1;
    const leveledUp = newLevel > (user?.level ?? 1);

    await db.update(usersTable).set({ xp: newXp, coins: newCoins, level: newLevel }).where(eq(usersTable.id, userId));

    await db.insert(activitiesTable).values({
      userId,
      type: "decision",
      titleEn: `AI Scenario: ${scenario.titleEn}`,
      titleAr: `سيناريو ذكاء اصطناعي: ${scenario.titleAr}`,
      descriptionEn: feedbackEn,
      descriptionAr: feedbackAr,
      xpChange: xpEarned,
      coinsChange: coinsEarned,
    });

    res.json(RespondToScenarioResponse.parse({ xpEarned, coinsEarned, feedbackEn, feedbackAr, impactSummaryEn, impactSummaryAr, leveledUp, newLevel: leveledUp ? newLevel : null }));
  } catch (err) {
    logger.error({ err }, "Scenario respond failed");
    res.status(500).json({ error: "Failed to process response" });
  }
});

export default router;
