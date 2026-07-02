import { pgTable, text, serial, integer, numeric, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const economicEventsTable = pgTable("economic_events", {
  id: serial("id").primaryKey(),
  titleEn: text("title_en").notNull(),
  titleAr: text("title_ar").notNull(),
  descriptionEn: text("description_en").notNull(),
  descriptionAr: text("description_ar").notNull(),
  type: text("type").notNull(), // market_crash, bonus, expense, investment, emergency, opportunity
  severity: text("severity").notNull().default("medium"), // low, medium, high, critical
  impact: numeric("impact", { precision: 12, scale: 2 }).notNull().default("0"),
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const eventOptionsTable = pgTable("event_options", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  optionKey: text("option_key").notNull(), // a, b, c
  labelEn: text("label_en").notNull(),
  labelAr: text("label_ar").notNull(),
  xpReward: integer("xp_reward").notNull().default(10),
  riskLevel: text("risk_level").notNull().default("moderate"), // safe, moderate, risky
  expectedOutcomeEn: text("expected_outcome_en").notNull().default(""),
  expectedOutcomeAr: text("expected_outcome_ar").notNull().default(""),
  coinsReward: integer("coins_reward").notNull().default(0),
  budgetEffect: numeric("budget_effect", { precision: 12, scale: 2 }).notNull().default("0"),
});

export const userDecisionsTable = pgTable("user_decisions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  eventId: integer("event_id").notNull(),
  optionKey: text("option_key").notNull(),
  xpEarned: integer("xp_earned").notNull().default(0),
  coinsEarned: integer("coins_earned").notNull().default(0),
  budgetImpact: numeric("budget_impact", { precision: 12, scale: 2 }).notNull().default("0"),
  feedbackEn: text("feedback_en").notNull().default(""),
  feedbackAr: text("feedback_ar").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertEconomicEventSchema = createInsertSchema(economicEventsTable).omit({ id: true, createdAt: true });
export type InsertEconomicEvent = z.infer<typeof insertEconomicEventSchema>;
export type EconomicEvent = typeof economicEventsTable.$inferSelect;

export const insertUserDecisionSchema = createInsertSchema(userDecisionsTable).omit({ id: true, createdAt: true });
export type InsertUserDecision = z.infer<typeof insertUserDecisionSchema>;
export type UserDecision = typeof userDecisionsTable.$inferSelect;
