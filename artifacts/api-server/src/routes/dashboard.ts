import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, usersTable, activitiesTable } from "@workspace/db";
import {
  GetDashboardSummaryResponse,
  GetActivityFeedResponse,
  GetBudgetStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/summary", async (req, res): Promise<void> => {
  const userId = req.session.userId!;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId));

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const xpForNextLevel = user.level * 500;
  const budgetHealth = Math.min(100, Math.max(0, 72 + Math.floor(Math.random() * 5)));

  const response = {
    user: {
      ...user,
      joinedAt: user.joinedAt.toISOString(),
    },
    budgetHealth,
    xpToNextLevel: xpForNextLevel - (user.xp % xpForNextLevel),
    activeChallenges: 3,
    totalRewards: 7,
    weeklyXpGain: 240,
    rank: 4,
    savingsRate: 22.5,
    spendingBreakdown: [
      { category: "Housing", categoryAr: "السكن", amount: 2500, percentage: 35, color: "#7c3aed" },
      { category: "Food", categoryAr: "الطعام", amount: 1200, percentage: 17, color: "#10b981" },
      { category: "Transport", categoryAr: "المواصلات", amount: 800, percentage: 11, color: "#f59e0b" },
      { category: "Entertainment", categoryAr: "الترفيه", amount: 600, percentage: 8, color: "#06b6d4" },
      { category: "Savings", categoryAr: "المدخرات", amount: 1600, percentage: 22, color: "#8b5cf6" },
      { category: "Other", categoryAr: "أخرى", amount: 500, percentage: 7, color: "#94a3b8" },
    ],
  };

  res.json(GetDashboardSummaryResponse.parse(response));
});

router.get("/dashboard/activity", async (req, res): Promise<void> => {
  const userId = req.session.userId!;

  const activities = await db
    .select()
    .from(activitiesTable)
    .where(eq(activitiesTable.userId, userId))
    .orderBy(desc(activitiesTable.createdAt))
    .limit(20);

  const mapped = activities.map((a) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
  }));

  res.json(GetActivityFeedResponse.parse(mapped));
});

router.get("/dashboard/budget-stats", async (req, res): Promise<void> => {
  const monthly = [
    { month: "Jan", income: 7200, expenses: 5400, savings: 1800 },
    { month: "Feb", income: 7200, expenses: 5800, savings: 1400 },
    { month: "Mar", income: 7500, expenses: 5100, savings: 2400 },
    { month: "Apr", income: 7200, expenses: 4900, savings: 2300 },
    { month: "May", income: 7200, expenses: 5600, savings: 1600 },
    { month: "Jun", income: 8000, expenses: 5200, savings: 2800 },
  ];

  const categories = [
    { category: "Housing", categoryAr: "السكن", amount: 2500, percentage: 35, color: "#7c3aed" },
    { category: "Food", categoryAr: "الطعام", amount: 1200, percentage: 17, color: "#10b981" },
    { category: "Transport", categoryAr: "المواصلات", amount: 800, percentage: 11, color: "#f59e0b" },
    { category: "Entertainment", categoryAr: "الترفيه", amount: 600, percentage: 8, color: "#06b6d4" },
    { category: "Savings", categoryAr: "المدخرات", amount: 1600, percentage: 22, color: "#8b5cf6" },
    { category: "Other", categoryAr: "أخرى", amount: 500, percentage: 7, color: "#94a3b8" },
  ];

  res.json(GetBudgetStatsResponse.parse({ monthly, categories }));
});

export default router;
