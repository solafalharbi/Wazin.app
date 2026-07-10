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
import { openai } from "../lib/openai";
import { logger } from "../lib/logger";

const router: IRouter = Router();
const DEFAULT_USER_ID = 1;

function parseScenario(row: typeof aiScenariosTable.$inferSelect) {
  const options = JSON.parse(row.optionsJson) as Array<{
    id: string;
    labelEn: string;
    labelAr: string;
    riskLevel: string;
    xpReward: number;
    outcomePreviewEn: string;
    outcomePreviewAr: string;
  }>;
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
  const scenarios = await db
    .select()
    .from(aiScenariosTable)
    .where(and(eq(aiScenariosTable.userId, DEFAULT_USER_ID), eq(aiScenariosTable.isActive, true)))
    .orderBy(desc(aiScenariosTable.createdAt))
    .limit(10);

  res.json(GetActiveScenariosResponse.parse(scenarios.map(parseScenario)));
});

router.post("/scenarios/generate", async (req, res): Promise<void> => {
  const parsed = GenerateScenarioBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Gather user context
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, DEFAULT_USER_ID));
  const [sim] = await db
    .select()
    .from(simulationsTable)
    .where(eq(simulationsTable.userId, DEFAULT_USER_ID))
    .orderBy(desc(simulationsTable.createdAt))
    .limit(1);

  const recentDecisions = await db
    .select()
    .from(userDecisionsTable)
    .where(eq(userDecisionsTable.userId, DEFAULT_USER_ID))
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
User: ${user?.username ?? "Solaf"}, Level ${user?.level ?? 7}, XP ${user?.xp ?? 3120}, Coins ${user?.coins ?? 850}
Monthly Budget: SAR ${sim ? parseFloat(sim.totalBudget) : 7200}
Budget Health Score: ${sim?.healthScore ?? 75}/100
Recent decisions risk profile: ${recentDecisions.length > 0 ? "mixed" : "no history yet"}
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 1200,
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

Output JSON with this exact structure (no markdown, no extra text):
{
  "titleEn": "short punchy title in English",
  "titleAr": "نفس العنوان بالعربية",
  "descriptionEn": "2-3 sentences describing the scenario in vivid detail, make it feel real and urgent",
  "descriptionAr": "2-3 جمل تصف السيناريو بتفاصيل حية، اجعله يبدو حقيقياً وعاجلاً",
  "type": "${scenarioType}",
  "severity": "low|medium|high|critical",
  "impactAmount": <number in SAR, can be negative for expenses>,
  "options": [
    {
      "id": "a",
      "labelEn": "first option label",
      "labelAr": "نص الخيار الأول",
      "riskLevel": "safe|moderate|risky",
      "xpReward": <10-80>,
      "outcomePreviewEn": "what happens if you choose this",
      "outcomePreviewAr": "ماذا يحدث إذا اخترت هذا"
    },
    {
      "id": "b",
      "labelEn": "second option label",
      "labelAr": "نص الخيار الثاني",
      "riskLevel": "safe|moderate|risky",
      "xpReward": <10-80>,
      "outcomePreviewEn": "what happens if you choose this",
      "outcomePreviewAr": "ماذا يحدث إذا اخترت هذا"
    },
    {
      "id": "c",
      "labelEn": "third option label",
      "labelAr": "نص الخيار الثالث",
      "riskLevel": "safe|moderate|risky",
      "xpReward": <10-80>,
      "outcomePreviewEn": "what happens if you choose this",
      "outcomePreviewAr": "ماذا يحدث إذا اخترت هذا"
    }
  ]
}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const data = JSON.parse(raw);

    const [row] = await db
      .insert(aiScenariosTable)
      .values({
        userId: DEFAULT_USER_ID,
        titleEn: data.titleEn,
        titleAr: data.titleAr,
        descriptionEn: data.descriptionEn,
        descriptionAr: data.descriptionAr,
        type: data.type ?? scenarioType,
        severity: data.severity ?? "medium",
        impactAmount: String(data.impactAmount ?? 0),
        optionsJson: JSON.stringify(data.options ?? []),
        isActive: true,
        responded: false,
      })
      .returning();

    res.json(GenerateScenarioResponse.parse(parseScenario(row)));
  } catch (err) {
    logger.error({ err }, "OpenAI scenario generation failed");
    res.status(500).json({ error: "Failed to generate scenario" });
  }
});

router.post("/scenarios/:scenarioId/respond", async (req, res): Promise<void> => {
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
    .where(and(eq(aiScenariosTable.id, params.data.scenarioId), eq(aiScenariosTable.userId, DEFAULT_USER_ID)));

  if (!scenario) {
    res.status(404).json({ error: "Scenario not found" });
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

  // AI generates personalised feedback
  let feedbackEn = chosen.outcomePreviewEn;
  let feedbackAr = chosen.outcomePreviewAr;
  let impactSummaryEn = `Your decision impacts your budget by SAR ${Math.abs(parseFloat(scenario.impactAmount))}.`;
  let impactSummaryAr = `يؤثر قرارك على ميزانيتك بمقدار ${Math.abs(parseFloat(scenario.impactAmount))} ريال.`;

  try {
    const fbCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 400,
      messages: [
        {
          role: "system",
          content: "You are a wise, encouraging Saudi financial coach. Be concise (2 sentences max per language). Output only JSON.",
        },
        {
          role: "user",
          content: `Scenario: "${scenario.titleEn}"
User chose: "${chosen.labelEn}" (risk: ${chosen.riskLevel})
Impact: SAR ${scenario.impactAmount}

Give personalised feedback in English and Arabic. JSON: {"feedbackEn":"...","feedbackAr":"...","impactSummaryEn":"...","impactSummaryAr":"..."}`,
        },
      ],
    });

    const fbRaw = fbCompletion.choices[0]?.message?.content ?? "{}";
    const fb = JSON.parse(fbRaw);
    feedbackEn = fb.feedbackEn ?? feedbackEn;
    feedbackAr = fb.feedbackAr ?? feedbackAr;
    impactSummaryEn = fb.impactSummaryEn ?? impactSummaryEn;
    impactSummaryAr = fb.impactSummaryAr ?? impactSummaryAr;
  } catch (err) {
    logger.warn({ err }, "AI feedback generation failed, using fallback");
  }

  const xpEarned = chosen.xpReward;
  const coinsEarned = Math.floor(xpEarned / 3);

  // Persist
  await db
    .update(aiScenariosTable)
    .set({
      responded: true,
      isActive: false,
      chosenOptionId: body.data.optionId,
      feedbackEn,
      feedbackAr,
      xpEarned,
    })
    .where(eq(aiScenariosTable.id, scenario.id));

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, DEFAULT_USER_ID));
  const newXp = (user?.xp ?? 0) + xpEarned;
  const newCoins = (user?.coins ?? 0) + coinsEarned;
  const newLevel = Math.floor(newXp / 500) + 1;
  const leveledUp = newLevel > (user?.level ?? 1);

  await db.update(usersTable).set({ xp: newXp, coins: newCoins, level: newLevel }).where(eq(usersTable.id, DEFAULT_USER_ID));

  await db.insert(activitiesTable).values({
    userId: DEFAULT_USER_ID,
    type: "decision",
    titleEn: `AI Scenario: ${scenario.titleEn}`,
    titleAr: `سيناريو ذكاء اصطناعي: ${scenario.titleAr}`,
    descriptionEn: feedbackEn,
    descriptionAr: feedbackAr,
    xpChange: xpEarned,
    coinsChange: coinsEarned,
  });

  res.json(
    RespondToScenarioResponse.parse({
      xpEarned,
      coinsEarned,
      feedbackEn,
      feedbackAr,
      impactSummaryEn,
      impactSummaryAr,
      leveledUp,
      newLevel: leveledUp ? newLevel : null,
    })
  );
});

export default router;
