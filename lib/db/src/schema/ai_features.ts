import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const aiScenariosTable = pgTable("ai_scenarios", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  titleEn: text("title_en").notNull(),
  titleAr: text("title_ar").notNull(),
  descriptionEn: text("description_en").notNull(),
  descriptionAr: text("description_ar").notNull(),
  type: text("type").notNull(), // market_crash, bonus, expense, investment, emergency, opportunity
  severity: text("severity").notNull().default("medium"),
  impactAmount: text("impact_amount").notNull().default("0"),
  optionsJson: text("options_json").notNull(), // JSON array of options
  isActive: boolean("is_active").notNull().default(true),
  responded: boolean("responded").notNull().default(false),
  chosenOptionId: text("chosen_option_id"),
  feedbackEn: text("feedback_en"),
  feedbackAr: text("feedback_ar"),
  xpEarned: integer("xp_earned").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const personalityAnalysesTable = pgTable("personality_analyses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  personalityTypeEn: text("personality_type_en").notNull(),
  personalityTypeAr: text("personality_type_ar").notNull(),
  descriptionEn: text("description_en").notNull(),
  descriptionAr: text("description_ar").notNull(),
  strengthsJson: text("strengths_json").notNull(), // JSON array {en, ar}
  improvementsJson: text("improvements_json").notNull(), // JSON array {en, ar}
  traitsJson: text("traits_json").notNull(), // JSON array {nameEn, nameAr, score}
  overallScore: integer("overall_score").notNull().default(70),
  badgeEn: text("badge_en").notNull().default(""),
  badgeAr: text("badge_ar").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const financialTwinsTable = pgTable("financial_twins", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  summaryEn: text("summary_en").notNull(),
  summaryAr: text("summary_ar").notNull(),
  currentMonthlyIncome: text("current_monthly_income").notNull().default("7200"),
  currentSavingsRate: text("current_savings_rate").notNull().default("22"),
  projectionJson: text("projection_json").notNull(), // yearly projections array
  risksJson: text("risks_json").notNull(), // identified risks array
  goalsJson: text("goals_json").notNull(), // suggested goals array
  scenariosJson: text("scenarios_json").notNull(), // optimistic/base/pessimistic
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAiScenarioSchema = createInsertSchema(aiScenariosTable).omit({ id: true, createdAt: true });
export type InsertAiScenario = z.infer<typeof insertAiScenarioSchema>;
export type AiScenario = typeof aiScenariosTable.$inferSelect;

export const insertPersonalityAnalysisSchema = createInsertSchema(personalityAnalysesTable).omit({ id: true, createdAt: true });
export type InsertPersonalityAnalysis = z.infer<typeof insertPersonalityAnalysisSchema>;
export type PersonalityAnalysis = typeof personalityAnalysesTable.$inferSelect;

export const insertFinancialTwinSchema = createInsertSchema(financialTwinsTable).omit({ id: true, createdAt: true });
export type InsertFinancialTwin = z.infer<typeof insertFinancialTwinSchema>;
export type FinancialTwin = typeof financialTwinsTable.$inferSelect;
