import { Router, type IRouter } from "express";
import { randomBytes } from "crypto";
import { eq, desc, and } from "drizzle-orm";
import { db, rewardsTable, userRewardsTable, usersTable } from "@workspace/db";
import {
  GetRewardsResponse,
  GetUserRewardsResponse,
  RedeemRewardParams,
  RedeemRewardResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatReward(r: typeof rewardsTable.$inferSelect) {
  return {
    id: r.id,
    titleEn: r.titleEn,
    titleAr: r.titleAr,
    descriptionEn: r.descriptionEn,
    descriptionAr: r.descriptionAr,
    coinsRequired: r.coinsRequired,
    type: r.type,
    partnerName: r.partnerName,
    partnerLogoUrl: r.partnerLogoUrl ?? null,
    isAvailable: r.isAvailable,
    expiresAt: r.expiresAt ? r.expiresAt.toISOString() : null,
  };
}

router.get("/rewards", async (req, res): Promise<void> => {
  const rewards = await db
    .select()
    .from(rewardsTable)
    .where(eq(rewardsTable.isAvailable, true))
    .orderBy(rewardsTable.coinsRequired);

  res.json(GetRewardsResponse.parse(rewards.map(formatReward)));
});

router.get("/rewards/my", async (req, res): Promise<void> => {
  const userId = req.session.userId!;

  const userRewards = await db
    .select()
    .from(userRewardsTable)
    .where(eq(userRewardsTable.userId, userId))
    .orderBy(desc(userRewardsTable.earnedAt));

  const result = await Promise.all(
    userRewards.map(async (ur) => {
      const [reward] = await db
        .select()
        .from(rewardsTable)
        .where(eq(rewardsTable.id, ur.rewardId));

      return {
        id: ur.id,
        reward: formatReward(reward!),
        status: ur.status,
        earnedAt: ur.earnedAt.toISOString(),
        redeemedAt: ur.redeemedAt ? ur.redeemedAt.toISOString() : null,
      };
    })
  );

  res.json(GetUserRewardsResponse.parse(result));
});

router.post("/rewards/:rewardId/redeem", async (req, res): Promise<void> => {
  const userId = req.session.userId!;

  const rawId = Array.isArray(req.params.rewardId) ? req.params.rewardId[0] : req.params.rewardId;
  const params = RedeemRewardParams.safeParse({ rewardId: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [reward] = await db
    .select()
    .from(rewardsTable)
    .where(eq(rewardsTable.id, params.data.rewardId));

  if (!reward) {
    res.status(404).json({ error: "Reward not found" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId));

  if (!user || user.coins < reward.coinsRequired) {
    res.json(
      RedeemRewardResponse.parse({
        success: false,
        redemptionCode: null,
        messageEn: "Not enough coins to redeem this reward.",
        messageAr: "ليس لديك نقاط كافية لاستبدال هذه المكافأة.",
      })
    );
    return;
  }

  await db
    .update(usersTable)
    .set({ coins: user.coins - reward.coinsRequired })
    .where(eq(usersTable.id, userId));

  const redemptionCode = `ALINMA-${randomBytes(4).toString("hex").toUpperCase()}`;

  const [existingUserReward] = await db
    .select()
    .from(userRewardsTable)
    .where(
      and(
        eq(userRewardsTable.userId, userId),
        eq(userRewardsTable.rewardId, params.data.rewardId)
      )
    )
    .limit(1);

  if (existingUserReward) {
    await db
      .update(userRewardsTable)
      .set({ status: "redeemed", redeemedAt: new Date(), redemptionCode })
      .where(eq(userRewardsTable.id, existingUserReward.id));
  } else {
    await db.insert(userRewardsTable).values({
      userId,
      rewardId: params.data.rewardId,
      status: "redeemed",
      redemptionCode,
      redeemedAt: new Date(),
    });
  }

  res.json(
    RedeemRewardResponse.parse({
      success: true,
      redemptionCode,
      messageEn: `Reward redeemed successfully! Use code ${redemptionCode} at Alinma Bank.`,
      messageAr: `تم استبدال المكافأة بنجاح! استخدم الرمز ${redemptionCode} في بنك الإنماء.`,
    })
  );
});

export default router;
