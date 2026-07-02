import { pgTable, text, serial, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const simulationsTable = pgTable("simulations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  totalBudget: numeric("total_budget", { precision: 12, scale: 2 }).notNull(),
  healthScore: integer("health_score").notNull().default(75),
  xpEarned: integer("xp_earned").notNull().default(0),
  status: text("status").notNull().default("active"),
  difficulty: text("difficulty").notNull().default("medium"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const budgetAllocationsTable = pgTable("budget_allocations", {
  id: serial("id").primaryKey(),
  simulationId: integer("simulation_id").notNull(),
  category: text("category").notNull(),
  categoryAr: text("category_ar").notNull(),
  allocated: numeric("allocated", { precision: 12, scale: 2 }).notNull().default("0"),
  spent: numeric("spent", { precision: 12, scale: 2 }).notNull().default("0"),
  limit: numeric("limit", { precision: 12, scale: 2 }).notNull(),
  icon: text("icon").notNull().default("wallet"),
});

export const insertSimulationSchema = createInsertSchema(simulationsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSimulation = z.infer<typeof insertSimulationSchema>;
export type Simulation = typeof simulationsTable.$inferSelect;

export const insertBudgetAllocationSchema = createInsertSchema(budgetAllocationsTable).omit({ id: true });
export type InsertBudgetAllocation = z.infer<typeof insertBudgetAllocationSchema>;
export type BudgetAllocation = typeof budgetAllocationsTable.$inferSelect;
