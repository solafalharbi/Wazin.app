import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const rewardsTable = pgTable("rewards", {
  id: serial("id").primaryKey(),
  titleEn: text("title_en").notNull(),
  titleAr: text("title_ar").notNull(),
  descriptionEn: text("description_en").notNull(),
  descriptionAr: text("description_ar").notNull(),
  coinsRequired: integer("coins_required").notNull().default(100),
  type: text("type").notNull().default("discount"), // cashback, discount, voucher, free_service, investment
  partnerName: text("partner_name").notNull().default("Alinma Bank"),
  partnerLogoUrl: text("partner_logo_url"),
  isAvailable: boolean("is_available").notNull().default(true),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userRewardsTable = pgTable("user_rewards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  rewardId: integer("reward_id").notNull(),
  status: text("status").notNull().default("available"), // available, redeemed, expired
  redemptionCode: text("redemption_code"),
  earnedAt: timestamp("earned_at", { withTimezone: true }).notNull().defaultNow(),
  redeemedAt: timestamp("redeemed_at", { withTimezone: true }),
});

export const insertRewardSchema = createInsertSchema(rewardsTable).omit({ id: true, createdAt: true });
export type InsertReward = z.infer<typeof insertRewardSchema>;
export type Reward = typeof rewardsTable.$inferSelect;

export const insertUserRewardSchema = createInsertSchema(userRewardsTable).omit({ id: true, earnedAt: true });
export type InsertUserReward = z.infer<typeof insertUserRewardSchema>;
export type UserReward = typeof userRewardsTable.$inferSelect;
