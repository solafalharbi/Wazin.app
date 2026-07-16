import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import {
  db,
  personalityAnalysesTable,
  userDecisionsTable,
  aiScenariosTable,
  economicEventsTable,
  eventOptionsTable,
} from "@workspace/db";
import {
  GetPersonalityAnalysisResponse,
  GeneratePersonalityAnalysisResponse,
} from "@workspace/api-zod";
import { openai, AI_MODEL, extractJson } from "../lib/openai";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function parseAnalysis(row: typeof personalityAnalysesTable.$inferSelect) {
  return {
    id: row.id,
    personalityTypeEn: row.personalityTypeEn,
    personalityTypeAr: row.personalityTypeAr,
    descriptionEn: row.descriptionEn,
    descriptionAr: row.descriptionAr,
    strengths: JSON.parse(row.strengthsJson),
    improvements: JSON.parse(row.improvementsJson),
    traits: JSON.parse(row.traitsJson),
    overallScore: row.overallScore,
    badgeEn: row.badgeEn,
    badgeAr: row.badgeAr,
    createdAt: row.createdAt.toISOString(),
  };
}

router.get("/analysis/personality", async (req, res): Promise<void> => {
  const userId = req.session.userId!;

  const [analysis] = await db
    .select()
    .from(personalityAnalysesTable)
    .where(eq(personalityAnalysesTable.userId, userId))
    .orderBy(desc(personalityAnalysesTable.createdAt))
    .limit(1);

  if (!analysis) {
    res.status(404).json({ error: "No analysis yet. Generate one first." });
    return;
  }

  res.json(GetPersonalityAnalysisResponse.parse(parseAnalysis(analysis)));
});

router.post("/analysis/personality/generate", async (req, res): Promise<void> => {
  const userId = req.session.userId!;

  const decisions = await db
    .select()
    .from(userDecisionsTable)
    .where(eq(userDecisionsTable.userId, userId))
    .orderBy(desc(userDecisionsTable.createdAt))
    .limit(20);

  const aiScenarioDecisions = await db
    .select()
    .from(aiScenariosTable)
    .where(eq(aiScenariosTable.userId, userId))
    .orderBy(desc(aiScenariosTable.createdAt))
    .limit(10);

  const decisionSummaries: string[] = [];

  for (const d of decisions) {
    const [ev] = await db.select().from(economicEventsTable).where(eq(economicEventsTable.id, d.eventId));
    const [opt] = await db.select().from(eventOptionsTable).where(eq(eventOptionsTable.eventId, d.eventId));
    if (ev && opt) {
      decisionSummaries.push(`Event: "${ev.titleEn}" (${ev.type}) → Chose: "${opt.labelEn}" (${opt.riskLevel} risk), XP: ${d.xpEarned}`);
    }
  }

  for (const s of aiScenarioDecisions.filter((s) => s.responded && s.chosenOptionId)) {
    const opts = JSON.parse(s.optionsJson) as Array<{ id: string; labelEn: string; riskLevel: string }>;
    const chosen = opts.find((o) => o.id === s.chosenOptionId);
    if (chosen) {
      decisionSummaries.push(`AI Scenario: "${s.titleEn}" (${s.type}) → Chose: "${chosen.labelEn}" (${chosen.riskLevel} risk), XP: ${s.xpEarned}`);
    }
  }

  const hasHistory = decisionSummaries.length > 0;
  const decisionContext = hasHistory
    ? decisionSummaries.slice(0, 15).join("\n")
    : "No decisions yet — user is new to the platform.";

  try {
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      max_tokens: 2000,
      messages: [
        {
          role: "system",
          content: `You are a financial behavioral psychologist specializing in Saudi youth financial habits.
Analyze financial decisions and identify behavioral patterns.
Be specific, insightful, and culturally aware. Output ONLY valid JSON.`,
        },
        {
          role: "user",
          content: `Analyze this user's financial decision history and generate a personality report:

DECISION HISTORY:
${decisionContext}

Output this exact JSON:
{
  "personalityTypeEn": "Type name (e.g. 'The Cautious Planner')",
  "personalityTypeAr": "اسم النوع",
  "descriptionEn": "3-4 sentences describing this financial personality",
  "descriptionAr": "3-4 جمل تصف هذه الشخصية المالية",
  "strengths": [
    {"titleEn": "...", "titleAr": "...", "descriptionEn": "...", "descriptionAr": "..."}
  ],
  "improvements": [
    {"titleEn": "...", "titleAr": "...", "descriptionEn": "...", "descriptionAr": "..."}
  ],
  "traits": [
    {"nameEn": "Risk Tolerance", "nameAr": "تحمل المخاطر", "score": <0-100>},
    {"nameEn": "Savings Discipline", "nameAr": "انضباط الادخار", "score": <0-100>},
    {"nameEn": "Investment Mindset", "nameAr": "عقلية الاستثمار", "score": <0-100>},
    {"nameEn": "Financial Patience", "nameAr": "الصبر المالي", "score": <0-100>},
    {"nameEn": "Budget Adherence", "nameAr": "الالتزام بالميزانية", "score": <0-100>}
  ],
  "overallScore": <50-95>,
  "badgeEn": "Badge title",
  "badgeAr": "عنوان الشارة"
}

Include 3 strengths and 3 improvements.`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const data = extractJson<Record<string, any>>(raw);

    const [row] = await db
      .insert(personalityAnalysesTable)
      .values({
        userId,
        personalityTypeEn: data.personalityTypeEn,
        personalityTypeAr: data.personalityTypeAr,
        descriptionEn: data.descriptionEn,
        descriptionAr: data.descriptionAr,
        strengthsJson: JSON.stringify(data.strengths ?? []),
        improvementsJson: JSON.stringify(data.improvements ?? []),
        traitsJson: JSON.stringify(data.traits ?? []),
        overallScore: data.overallScore ?? 75,
        badgeEn: data.badgeEn ?? "Financial Explorer",
        badgeAr: data.badgeAr ?? "مستكشف مالي",
      })
      .returning();

    res.json(GeneratePersonalityAnalysisResponse.parse(parseAnalysis(row)));
  } catch (err) {
    logger.error({ err }, "Personality analysis generation failed");
    res.status(500).json({ error: "Failed to generate personality analysis" });
  }
});

export default router;
