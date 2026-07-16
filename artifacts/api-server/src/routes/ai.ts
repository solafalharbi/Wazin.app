import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, chatMessagesTable, usersTable } from "@workspace/db";
import {
  GetChatHistoryResponse,
  SendChatMessageBody,
  SendChatMessageResponse,
  GetAIInsightResponse,
} from "@workspace/api-zod";
import { openai, AI_MODEL, extractJson } from "../lib/openai";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.get("/ai/chat", async (req, res): Promise<void> => {
  const userId = req.session.userId!;

  const messages = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.userId, userId))
    .orderBy(chatMessagesTable.createdAt)
    .limit(50);

  res.json(GetChatHistoryResponse.parse(messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))));
});

router.post("/ai/chat", async (req, res): Promise<void> => {
  const userId = req.session.userId!;

  const parsed = SendChatMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));

  // Save user message
  await db.insert(chatMessagesTable).values({
    userId,
    role: "user",
    contentEn: parsed.data.message,
    contentAr: parsed.data.message,
  });

  // Fetch recent history for context
  const history = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.userId, userId))
    .orderBy(desc(chatMessagesTable.createdAt))
    .limit(10);

  const historyMessages = history.reverse().slice(0, -1).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.contentEn,
  }));

  try {
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      max_tokens: 500,
      messages: [
        {
          role: "system",
          content: `You are Wazin AI Advisor (مستشار وازِن), a friendly bilingual (Arabic/English) financial coach for young Saudis.
User: ${user?.username ?? "User"}, Level ${user?.level ?? 1}, XP ${user?.xp ?? 0}, Coins ${user?.coins ?? 0}
Respond in the same language as the user's message. Keep responses concise (2–4 sentences). Be encouraging and practical.`,
        },
        ...historyMessages,
        { role: "user", content: parsed.data.message },
      ],
    });

    const reply = completion.choices[0]?.message?.content ?? "I'm here to help with your finances!";

    const [saved] = await db
      .insert(chatMessagesTable)
      .values({
        userId,
        role: "assistant",
        contentEn: reply,
        contentAr: reply,
      })
      .returning();

    res.json(SendChatMessageResponse.parse({ ...saved, createdAt: saved.createdAt.toISOString() }));
  } catch (err) {
    logger.error({ err }, "AI chat failed");
    const fallback = "I'm having trouble right now. Please try again in a moment.";
    const [saved] = await db
      .insert(chatMessagesTable)
      .values({ userId, role: "assistant", contentEn: fallback, contentAr: "أواجه صعوبة الآن. يرجى المحاولة مرة أخرى." })
      .returning();
    res.json(SendChatMessageResponse.parse({ ...saved, createdAt: saved.createdAt.toISOString() }));
  }
});

router.get("/ai/insight", async (req, res): Promise<void> => {
  const userId = req.session.userId!;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));

  try {
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      max_tokens: 800,
      messages: [
        {
          role: "system",
          content: "You are a financial analytics AI. Output ONLY valid JSON, no markdown.",
        },
        {
          role: "user",
          content: `Generate a financial insight for:
User: Level ${user?.level ?? 1}, XP ${user?.xp ?? 0}, Coins ${user?.coins ?? 0}
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
    const data = extractJson<Record<string, unknown>>(raw);
    res.json(GetAIInsightResponse.parse({ ...data, score: data.score ?? 78, trend: data.trend ?? "improving" }));
  } catch (err) {
    logger.warn({ err }, "AI insight generation failed, using fallback");
    res.json(
      GetAIInsightResponse.parse({
        summaryEn: "Your financial health is strong this month! You're making smart decisions.",
        summaryAr: "صحتك المالية قوية هذا الشهر! أنت تتخذ قرارات ذكية.",
        score: 78,
        trend: "improving",
        tips: [
          { titleEn: "Boost Savings", titleAr: "زيادة الادخار", descriptionEn: "Try saving 25% to reach your emergency fund sooner.", descriptionAr: "حاول ادخار 25٪ للوصول إلى صندوق الطوارئ أسرع.", priority: "high" },
          { titleEn: "Invest Wisely", titleAr: "استثمر بحكمة", descriptionEn: "Consider putting 5% of income in low-risk bonds.", descriptionAr: "فكر في وضع 5٪ من دخلك في السندات منخفضة المخاطر.", priority: "medium" },
          { titleEn: "Track Spending", titleAr: "تتبع الإنفاق", descriptionEn: "Cook at home twice more weekly to cut dining costs.", descriptionAr: "اطبخ في المنزل مرتين أسبوعياً لتقليل نفقات الطعام.", priority: "low" },
        ],
      })
    );
  }
});

export default router;
