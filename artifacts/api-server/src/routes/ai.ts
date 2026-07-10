import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, chatMessagesTable, usersTable } from "@workspace/db";
import {
  GetChatHistoryResponse,
  SendChatMessageBody,
  SendChatMessageResponse,
  GetAIInsightResponse,
} from "@workspace/api-zod";
import { openai } from "../lib/openai";
import { logger } from "../lib/logger";

const router: IRouter = Router();
const DEFAULT_USER_ID = 1;

router.get("/ai/chat", async (req, res): Promise<void> => {
  const messages = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.userId, DEFAULT_USER_ID))
    .orderBy(chatMessagesTable.createdAt)
    .limit(50);

  res.json(GetChatHistoryResponse.parse(messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))));
});

router.post("/ai/chat", async (req, res): Promise<void> => {
  const parsed = SendChatMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { message, language } = parsed.data;

  // Persist user message
  await db.insert(chatMessagesTable).values({
    userId: DEFAULT_USER_ID,
    role: "user",
    contentEn: language === "en" ? message : message,
    contentAr: language === "ar" ? message : message,
  });

  // Get recent history for context
  const history = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.userId, DEFAULT_USER_ID))
    .orderBy(desc(chatMessagesTable.createdAt))
    .limit(8);

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, DEFAULT_USER_ID));

  const historyMessages = history
    .reverse()
    .slice(0, -1) // exclude the message we just inserted
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: language === "ar" ? m.contentAr : m.contentEn,
    }));

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 600,
      messages: [
        {
          role: "system",
          content: `You are Wazin AI (وازِن), a warm, expert financial advisor for young Saudi users.
User: ${user?.username ?? "Solaf"}, Level ${user?.level ?? 7}, XP ${user?.xp ?? 3120}, Coins ${user?.coins ?? 850}.
Language: ${language === "ar" ? "Arabic — respond ONLY in Arabic, using formal yet friendly Saudi tone" : "English — respond in clear, friendly English"}.
Keep responses concise (3-5 sentences). Be encouraging, specific, and action-oriented.
Relate advice to real Saudi financial context (Alinma Bank, Vision 2030, real estate, etc.).`,
        },
        ...historyMessages,
        { role: "user", content: message },
      ],
    });

    const aiContent = completion.choices[0]?.message?.content ?? "";

    const [aiMsg] = await db
      .insert(chatMessagesTable)
      .values({
        userId: DEFAULT_USER_ID,
        role: "assistant",
        contentEn: language === "en" ? aiContent : aiContent,
        contentAr: language === "ar" ? aiContent : aiContent,
      })
      .returning();

    res.json(SendChatMessageResponse.parse({ ...aiMsg, createdAt: aiMsg.createdAt.toISOString() }));
  } catch (err) {
    logger.error({ err }, "OpenAI chat failed");
    res.status(500).json({ error: "AI advisor temporarily unavailable" });
  }
});

router.get("/ai/insight", async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, DEFAULT_USER_ID));

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 800,
      messages: [
        {
          role: "system",
          content: "You are a financial analytics AI. Output ONLY valid JSON, no markdown.",
        },
        {
          role: "user",
          content: `Generate a financial insight for:
User: Level ${user?.level ?? 7}, XP ${user?.xp ?? 3120}, Coins ${user?.coins ?? 850}
Budget health: 78/100, Savings rate: 22%

Output JSON:
{
  "summaryEn": "2 sentences about their financial status",
  "summaryAr": "جملتان عن وضعهم المالي",
  "score": <60-90>,
  "trend": "improving|stable|declining",
  "tips": [
    {"titleEn":"tip 1","titleAr":"نصيحة 1","descriptionEn":"detail","descriptionAr":"تفاصيل","priority":"high"},
    {"titleEn":"tip 2","titleAr":"نصيحة 2","descriptionEn":"detail","descriptionAr":"تفاصيل","priority":"medium"},
    {"titleEn":"tip 3","titleAr":"نصيحة 3","descriptionEn":"detail","descriptionAr":"تفاصيل","priority":"low"}
  ]
}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const data = JSON.parse(raw);
    res.json(GetAIInsightResponse.parse({ ...data, score: data.score ?? 78, trend: data.trend ?? "improving" }));
  } catch (err) {
    logger.warn({ err }, "AI insight generation failed, using fallback");
    res.json(
      GetAIInsightResponse.parse({
        summaryEn: "Your financial health is strong this month! You're saving 22% and making smart decisions.",
        summaryAr: "صحتك المالية قوية هذا الشهر! أنت توفر 22٪ وتتخذ قرارات ذكية.",
        score: 78,
        trend: "improving",
        tips: [
          { titleEn: "Boost Savings", titleAr: "زيادة الادخار", descriptionEn: "Try saving 25% to reach your emergency fund 2 months sooner.", descriptionAr: "حاول ادخار 25٪ للوصول إلى صندوق الطوارئ بشهرين أقل.", priority: "high" },
          { titleEn: "Invest Wisely", titleAr: "استثمر بحكمة", descriptionEn: "Consider putting 5% of income in low-risk bonds.", descriptionAr: "فكر في وضع 5٪ من دخلك في السندات منخفضة المخاطر.", priority: "medium" },
          { titleEn: "Track Spending", titleAr: "تتبع الإنفاق", descriptionEn: "Dining out is your biggest variable expense — cook at home twice more weekly.", descriptionAr: "تناول الطعام خارجاً هو أكبر نفقاتك المتغيرة — اطبخ في المنزل مرتين أسبوعياً.", priority: "low" },
        ],
      })
    );
  }
});

export default router;
