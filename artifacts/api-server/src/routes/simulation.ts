import { Router, type IRouter } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db, simulationsTable, budgetAllocationsTable } from "@workspace/db";
import {
  GetSimulationStateResponse,
  StartSimulationBody,
  StartSimulationResponse,
  AllocateBudgetBody,
  AllocateBudgetResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const DEFAULT_USER_ID = 1;

const DEFAULT_ALLOCATIONS = [
  { category: "Housing", categoryAr: "السكن", allocated: "2500", spent: "2500", limit: "2800", icon: "home" },
  { category: "Food", categoryAr: "الطعام", allocated: "1200", spent: "980", limit: "1400", icon: "utensils" },
  { category: "Transport", categoryAr: "المواصلات", allocated: "800", spent: "620", limit: "900", icon: "car" },
  { category: "Entertainment", categoryAr: "الترفيه", allocated: "600", spent: "350", limit: "700", icon: "gamepad-2" },
  { category: "Savings", categoryAr: "المدخرات", allocated: "1600", spent: "1600", limit: "2000", icon: "piggy-bank" },
  { category: "Health", categoryAr: "الصحة", allocated: "400", spent: "200", limit: "500", icon: "heart-pulse" },
  { category: "Education", categoryAr: "التعليم", allocated: "300", spent: "300", limit: "400", icon: "book-open" },
  { category: "Other", categoryAr: "أخرى", allocated: "500", spent: "350", limit: "600", icon: "more-horizontal" },
];

function formatAllocation(alloc: typeof DEFAULT_ALLOCATIONS[0] & { id?: number; simulationId?: number }) {
  return {
    category: alloc.category,
    categoryAr: alloc.categoryAr,
    allocated: parseFloat(alloc.allocated),
    spent: parseFloat(alloc.spent),
    limit: parseFloat(alloc.limit),
    icon: alloc.icon,
  };
}

router.get("/simulation/state", async (req, res): Promise<void> => {
  const [sim] = await db
    .select()
    .from(simulationsTable)
    .where(eq(simulationsTable.userId, DEFAULT_USER_ID))
    .orderBy(desc(simulationsTable.createdAt))
    .limit(1);

  if (!sim) {
    res.status(404).json({ error: "No active simulation. Start one first." });
    return;
  }

  const allocations = await db
    .select()
    .from(budgetAllocationsTable)
    .where(eq(budgetAllocationsTable.simulationId, sim.id));

  const response = {
    id: sim.id,
    month: sim.month,
    year: sim.year,
    totalBudget: parseFloat(sim.totalBudget),
    allocations: allocations.map(formatAllocation),
    healthScore: sim.healthScore,
    xpEarned: sim.xpEarned,
    status: sim.status,
    pendingEvents: 2,
  };

  res.json(GetSimulationStateResponse.parse(response));
});

router.post("/simulation/start", async (req, res): Promise<void> => {
  const parsed = StartSimulationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const now = new Date();
  const [sim] = await db
    .insert(simulationsTable)
    .values({
      userId: DEFAULT_USER_ID,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      totalBudget: parsed.data.monthlyIncome.toString(),
      difficulty: parsed.data.difficulty ?? "medium",
      status: "active",
      healthScore: 75,
      xpEarned: 0,
    })
    .returning();

  const income = parsed.data.monthlyIncome;
  const allocRows = DEFAULT_ALLOCATIONS.map((a) => {
    const ratio = parseFloat(a.allocated) / 7900;
    const newAllocated = Math.round(income * ratio);
    return {
      simulationId: sim.id,
      category: a.category,
      categoryAr: a.categoryAr,
      allocated: (newAllocated).toString(),
      spent: "0",
      limit: (Math.round(newAllocated * 1.15)).toString(),
      icon: a.icon,
    };
  });

  await db.insert(budgetAllocationsTable).values(allocRows);

  const allocations = await db
    .select()
    .from(budgetAllocationsTable)
    .where(eq(budgetAllocationsTable.simulationId, sim.id));

  const response = {
    id: sim.id,
    month: sim.month,
    year: sim.year,
    totalBudget: parseFloat(sim.totalBudget),
    allocations: allocations.map(formatAllocation),
    healthScore: sim.healthScore,
    xpEarned: sim.xpEarned,
    status: sim.status,
    pendingEvents: 0,
  };

  res.json(StartSimulationResponse.parse(response));
});

router.post("/simulation/allocate", async (req, res): Promise<void> => {
  const parsed = AllocateBudgetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [sim] = await db
    .select()
    .from(simulationsTable)
    .where(eq(simulationsTable.userId, DEFAULT_USER_ID))
    .orderBy(desc(simulationsTable.createdAt))
    .limit(1);

  if (!sim) {
    res.status(404).json({ error: "No active simulation" });
    return;
  }

  for (const alloc of parsed.data.allocations) {
    await db
      .update(budgetAllocationsTable)
      .set({ allocated: alloc.amount.toString() })
      .where(
        and(
          eq(budgetAllocationsTable.simulationId, sim.id),
          eq(budgetAllocationsTable.category, alloc.category)
        )
      );
  }

  const allocations = await db
    .select()
    .from(budgetAllocationsTable)
    .where(eq(budgetAllocationsTable.simulationId, sim.id));

  const totalAllocated = allocations.reduce((s, a) => s + parseFloat(a.allocated), 0);
  const totalBudget = parseFloat(sim.totalBudget);
  const newHealth = Math.min(100, Math.round(75 + ((totalBudget - totalAllocated) / totalBudget) * 25));

  const [updated] = await db
    .update(simulationsTable)
    .set({ healthScore: newHealth })
    .where(eq(simulationsTable.id, sim.id))
    .returning();

  const response = {
    id: updated.id,
    month: updated.month,
    year: updated.year,
    totalBudget: parseFloat(updated.totalBudget),
    allocations: allocations.map(formatAllocation),
    healthScore: updated.healthScore,
    xpEarned: updated.xpEarned,
    status: updated.status,
    pendingEvents: 2,
  };

  res.json(AllocateBudgetResponse.parse(response));
});

export default router;
