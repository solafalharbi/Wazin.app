import { Router, type IRouter } from "express";
import { eq, desc, and, gte, gt, sql } from "drizzle-orm";
import {
  db,
  usersTable,
  activitiesTable,
  simulationsTable,
  budgetAllocationsTable,
  aiScenariosTable,
} from "@workspace/db";
import {
  GetDashboardSummaryResponse,
  GetActivityFeedResponse,
  GetBudgetStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const CATEGORY_COLORS: Record<string, string> = {
  Housing: "#7c3aed",
  Food: "#10b981",
  Transport: "#f59e0b",
  Entertainment: "#06b6d4",
  Savings: "#8b5cf6",
  Education: "#ec4899",
  Health: "#ef4444",
  Other: "#94a3b8",
};

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

  // Real rank: how many users have strictly more XP
  const [{ higherCount }] = await db
    .select({ higherCount: sql<number>`count(*)::int` })
    .from(usersTable)
    .where(gt(usersTable.xp, user.xp));
  const rank = higherCount + 1;

  // Budget health from latest simulation
  const [sim] = await db
    .select()
    .from(simulationsTable)
    .where(eq(simulationsTable.userId, userId))
    .orderBy(desc(simulationsTable.createdAt))
    .limit(1);
  const budgetHealth = sim?.healthScore ?? 75;

  // Active AI scenarios count
  const [{ activeCount }] = await db
    .select({ activeCount: sql<number>`count(*)::int` })
    .from(aiScenariosTable)
    .where(and(eq(aiScenariosTable.userId, userId), eq(aiScenariosTable.isActive, true)));

  // Weekly XP gain from activities in the last 7 days
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weeklyActivities = await db
    .select({ xpChange: activitiesTable.xpChange })
    .from(activitiesTable)
    .where(and(eq(activitiesTable.userId, userId), gte(activitiesTable.createdAt, weekAgo)));
  const weeklyXpGain = weeklyActivities.reduce(
    (sum, a) => sum + (a.xpChange > 0 ? a.xpChange : 0),
    0,
  );

  // Spending breakdown from latest simulation's budget allocations
  let spendingBreakdown: Array<{
    category: string;
    categoryAr: string;
    amount: number;
    percentage: number;
    color: string;
  }> = [];

  if (sim) {
    const allocs = await db
      .select()
      .from(budgetAllocationsTable)
      .where(eq(budgetAllocationsTable.simulationId, sim.id));

    const totalBudget = parseFloat(sim.totalBudget);
    spendingBreakdown = allocs.map((a) => ({
      category: a.category,
      categoryAr: a.categoryAr,
      amount: parseFloat(a.allocated),
      percentage: totalBudget > 0 ? Math.round((parseFloat(a.allocated) / totalBudget) * 100) : 0,
      color: CATEGORY_COLORS[a.category] ?? "#94a3b8",
    }));
  }

  // Fallback breakdown if no simulation exists
  if (spendingBreakdown.length === 0) {
    spendingBreakdown = [
      { category: "Housing", categoryAr: "السكن", amount: 0, percentage: 0, color: "#7c3aed" },
      { category: "Food", categoryAr: "الطعام", amount: 0, percentage: 0, color: "#10b981" },
      { category: "Savings", categoryAr: "المدخرات", amount: 0, percentage: 0, color: "#8b5cf6" },
    ];
  }

  const xpForNextLevel = user.level * 500;

  const response = {
    user: {
      ...user,
      joinedAt: user.joinedAt.toISOString(),
    },
    budgetHealth,
    xpToNextLevel: xpForNextLevel - (user.xp % xpForNextLevel),
    activeChallenges: activeCount,
    totalRewards: 7,
    weeklyXpGain,
    rank,
    savingsRate: 22.5,
    spendingBreakdown,
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
  const userId = req.session.userId!;

  // Use real simulation data if available
  const [sim] = await db
    .select()
    .from(simulationsTable)
    .where(eq(simulationsTable.userId, userId))
    .orderBy(desc(simulationsTable.createdAt))
    .limit(1);

  const income = sim ? parseFloat(sim.totalBudget) : 0;

  // Build monthly chart using the user's actual income
  // We only have the current snapshot, so we show consistent income
  // with estimated expenses based on budget allocations
  let totalAllocated = 0;
  if (sim) {
    const allocs = await db
      .select({ allocated: budgetAllocationsTable.allocated })
      .from(budgetAllocationsTable)
      .where(eq(budgetAllocationsTable.simulationId, sim.id));
    totalAllocated = allocs.reduce((s, a) => s + parseFloat(a.allocated), 0);
  }

  const expenses = totalAllocated > 0 ? totalAllocated : income * 0.75;
  const savings = income - expenses;

  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const monthly = MONTHS.map((month) => ({
    month,
    income,
    expenses: Math.round(expenses),
    savings: Math.max(0, Math.round(savings)),
  }));

  // Category breakdown from real allocations
  let categories: Array<{
    category: string;
    categoryAr: string;
    amount: number;
    percentage: number;
    color: string;
  }> = [];

  if (sim) {
    const allocs = await db
      .select()
      .from(budgetAllocationsTable)
      .where(eq(budgetAllocationsTable.simulationId, sim.id));

    categories = allocs.map((a) => ({
      category: a.category,
      categoryAr: a.categoryAr,
      amount: parseFloat(a.allocated),
      percentage: income > 0 ? Math.round((parseFloat(a.allocated) / income) * 100) : 0,
      color: CATEGORY_COLORS[a.category] ?? "#94a3b8",
    }));
  }

  if (categories.length === 0) {
    categories = [
      { category: "Housing", categoryAr: "السكن", amount: 0, percentage: 0, color: "#7c3aed" },
      { category: "Food", categoryAr: "الطعام", amount: 0, percentage: 0, color: "#10b981" },
      { category: "Savings", categoryAr: "المدخرات", amount: 0, percentage: 0, color: "#8b5cf6" },
    ];
  }

  res.json(GetBudgetStatsResponse.parse({ monthly, categories }));
});

export default router;
