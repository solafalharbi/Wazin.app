import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, chatMessagesTable, usersTable, userDecisionsTable } from "@workspace/db";
import {
  GetChatHistoryResponse,
  SendChatMessageBody,
  SendChatMessageResponse,
  GetAIInsightResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const DEFAULT_USER_ID = 1;

const AI_RESPONSES_EN = [
  "Based on your spending patterns, I recommend allocating at least 20% of your income to savings. This will build a solid financial foundation over time.",
  "Your entertainment spending is within healthy limits, but consider reducing dining out by 15% to accelerate your savings goals.",
  "Excellent decision on the investment event! Diversifying early is one of the most powerful wealth-building habits you can develop.",
  "Your budget health score is improving! Keep monitoring your housing costs — they're approaching the recommended 30% threshold.",
  "Consider setting up an emergency fund of 3-6 months of expenses. This is your financial safety net and reduces financial anxiety significantly.",
  "Great progress this week! Your XP gains reflect solid financial decision-making. Level 5 is within reach — keep it up!",
];

const AI_RESPONSES_AR = [
  "بناءً على أنماط إنفاقك، أوصي بتخصيص ما لا يقل عن 20٪ من دخلك للادخار. سيؤسس ذلك قاعدة مالية راسخة مع مرور الوقت.",
  "إنفاقك على الترفيه ضمن الحدود الصحية، لكن فكر في تقليل تناول الطعام خارجاً بنسبة 15٪ لتسريع تحقيق أهداف الادخار.",
  "قرار ممتاز بشأن حدث الاستثمار! التنويع المبكر هو من أقوى عادات بناء الثروة التي يمكنك تطويرها.",
  "تتحسن درجة صحة ميزانيتك! استمر في مراقبة تكاليف السكن — فهي تقترب من حد 30٪ الموصى به.",
  "فكر في إنشاء صندوق طوارئ يغطي نفقات 3-6 أشهر. هذا هو شبكة الأمان المالي لك ويقلل من القلق المالي بشكل كبير.",
  "تقدم رائع هذا الأسبوع! مكاسبك في نقاط الخبرة تعكس اتخاذ قرارات مالية سليمة. المستوى 5 قريب المنال — استمر!",
];

router.get("/ai/chat", async (req, res): Promise<void> => {
  const messages = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.userId, DEFAULT_USER_ID))
    .orderBy(chatMessagesTable.createdAt)
    .limit(50);

  const mapped = messages.map((m) => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
  }));

  res.json(GetChatHistoryResponse.parse(mapped));
});

router.post("/ai/chat", async (req, res): Promise<void> => {
  const parsed = SendChatMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Save user message
  await db.insert(chatMessagesTable).values({
    userId: DEFAULT_USER_ID,
    role: "user",
    contentEn: parsed.data.language === "en" ? parsed.data.message : parsed.data.message,
    contentAr: parsed.data.language === "ar" ? parsed.data.message : parsed.data.message,
  });

  // Generate AI response
  const idx = Math.floor(Math.random() * AI_RESPONSES_EN.length);
  const contentEn = AI_RESPONSES_EN[idx];
  const contentAr = AI_RESPONSES_AR[idx];

  const [aiMsg] = await db
    .insert(chatMessagesTable)
    .values({
      userId: DEFAULT_USER_ID,
      role: "assistant",
      contentEn,
      contentAr,
    })
    .returning();

  res.json(
    SendChatMessageResponse.parse({
      ...aiMsg,
      createdAt: aiMsg.createdAt.toISOString(),
    })
  );
});

router.get("/ai/insight", async (req, res): Promise<void> => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, DEFAULT_USER_ID));

  const response = {
    summaryEn:
      "Your financial health is strong this month! You're saving 22% of income and making smart investment decisions. Your biggest opportunity is optimizing entertainment spending to reach your savings goal faster.",
    summaryAr:
      "صحتك المالية قوية هذا الشهر! أنت توفر 22% من دخلك وتتخذ قرارات استثمارية ذكية. أكبر فرصة لديك هي تحسين إنفاق الترفيه للوصول إلى هدف الادخار بشكل أسرع.",
    tips: [
      {
        titleEn: "Boost Savings Rate",
        titleAr: "زيادة معدل الادخار",
        descriptionEn: "Try saving 25% to reach your emergency fund goal 2 months sooner.",
        descriptionAr: "حاول ادخار 25٪ للوصول إلى هدف صندوق الطوارئ خلال شهرين أقل.",
        priority: "high",
      },
      {
        titleEn: "Investment Opportunity",
        titleAr: "فرصة استثمارية",
        descriptionEn: "Consider putting 5% of income in low-risk bonds for stable returns.",
        descriptionAr: "فكر في وضع 5٪ من دخلك في السندات منخفضة المخاطر للحصول على عوائد مستقرة.",
        priority: "medium",
      },
      {
        titleEn: "Track Entertainment",
        titleAr: "تتبع الترفيه",
        descriptionEn: "Dining out accounts for 60% of entertainment. Cook at home twice more per week.",
        descriptionAr: "يمثل تناول الطعام خارجاً 60٪ من الترفيه. اطبخ في المنزل مرتين إضافيتين أسبوعياً.",
        priority: "low",
      },
    ],
    score: user?.xp ? Math.min(100, Math.floor(user.xp / 30)) : 72,
    trend: "improving" as const,
  };

  res.json(GetAIInsightResponse.parse(response));
});

export default router;
