import { Router, type IRouter } from "express";
import { eq, desc, and } from "drizzle-orm";
import {
  db,
  economicEventsTable,
  eventOptionsTable,
  userDecisionsTable,
  usersTable,
  activitiesTable,
} from "@workspace/db";
import {
  GetEconomicEventsResponse,
  MakeDecisionParams,
  MakeDecisionBody,
  MakeDecisionResponse,
  GetDecisionHistoryResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const DEFAULT_USER_ID = 1;

router.get("/events", async (req, res): Promise<void> => {
  const events = await db
    .select()
    .from(economicEventsTable)
    .where(eq(economicEventsTable.isActive, true))
    .orderBy(desc(economicEventsTable.createdAt));

  const result = await Promise.all(
    events.map(async (ev) => {
      const options = await db
        .select()
        .from(eventOptionsTable)
        .where(eq(eventOptionsTable.eventId, ev.id));

      return {
        id: ev.id,
        titleEn: ev.titleEn,
        titleAr: ev.titleAr,
        descriptionEn: ev.descriptionEn,
        descriptionAr: ev.descriptionAr,
        type: ev.type,
        severity: ev.severity,
        impact: ev.impact ? parseFloat(ev.impact) : 0,
        expiresAt: ev.expiresAt ? ev.expiresAt.toISOString() : null,
        options: options.map((o) => ({
          id: o.optionKey,
          labelEn: o.labelEn,
          labelAr: o.labelAr,
          xpReward: o.xpReward,
          riskLevel: o.riskLevel,
          expectedOutcomeEn: o.expectedOutcomeEn,
          expectedOutcomeAr: o.expectedOutcomeAr,
        })),
      };
    })
  );

  res.json(GetEconomicEventsResponse.parse(result));
});

router.post("/events/:eventId/decide", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;
  const params = MakeDecisionParams.safeParse({ eventId: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = MakeDecisionBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [event] = await db
    .select()
    .from(economicEventsTable)
    .where(eq(economicEventsTable.id, params.data.eventId));

  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }

  const [option] = await db
    .select()
    .from(eventOptionsTable)
    .where(
      and(
        eq(eventOptionsTable.eventId, params.data.eventId),
        eq(eventOptionsTable.optionKey, body.data.optionId)
      )
    );

  if (!option) {
    res.status(404).json({ error: "Option not found" });
    return;
  }

  const xpEarned = option.xpReward;
  const coinsEarned = option.coinsReward;
  const budgetImpact = option.budgetEffect ? parseFloat(option.budgetEffect) : 0;

  // Record the decision
  await db.insert(userDecisionsTable).values({
    userId: DEFAULT_USER_ID,
    eventId: params.data.eventId,
    optionKey: body.data.optionId,
    xpEarned,
    coinsEarned,
    budgetImpact: budgetImpact.toString(),
    feedbackEn: option.expectedOutcomeEn,
    feedbackAr: option.expectedOutcomeAr,
  });

  // Update user XP and coins
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, DEFAULT_USER_ID));

  const newXp = (user?.xp ?? 0) + xpEarned;
  const newCoins = (user?.coins ?? 0) + coinsEarned;
  const currentLevel = user?.level ?? 1;
  const newLevel = Math.floor(newXp / 500) + 1;
  const leveledUp = newLevel > currentLevel;

  await db
    .update(usersTable)
    .set({ xp: newXp, coins: newCoins, level: newLevel })
    .where(eq(usersTable.id, DEFAULT_USER_ID));

  // Add activity
  await db.insert(activitiesTable).values({
    userId: DEFAULT_USER_ID,
    type: "decision",
    titleEn: `Decision Made: ${event.titleEn}`,
    titleAr: `قرار اتخذ: ${event.titleAr}`,
    descriptionEn: option.expectedOutcomeEn || `You chose: ${option.labelEn}`,
    descriptionAr: option.expectedOutcomeAr || `اخترت: ${option.labelAr}`,
    xpChange: xpEarned,
    coinsChange: coinsEarned,
  });

  // Mark event inactive
  await db
    .update(economicEventsTable)
    .set({ isActive: false })
    .where(eq(economicEventsTable.id, params.data.eventId));

  const response = {
    xpEarned,
    coinsEarned,
    budgetImpact,
    feedbackEn: option.expectedOutcomeEn || `Great choice! You selected: ${option.labelEn}`,
    feedbackAr: option.expectedOutcomeAr || `خيار رائع! اخترت: ${option.labelAr}`,
    newHealthScore: 78,
    leveledUp,
    newLevel: leveledUp ? newLevel : null,
  };

  res.json(MakeDecisionResponse.parse(response));
});

router.get("/events/history", async (req, res): Promise<void> => {
  const decisions = await db
    .select()
    .from(userDecisionsTable)
    .where(eq(userDecisionsTable.userId, DEFAULT_USER_ID))
    .orderBy(desc(userDecisionsTable.createdAt))
    .limit(20);

  const result = await Promise.all(
    decisions.map(async (d) => {
      const [ev] = await db
        .select()
        .from(economicEventsTable)
        .where(eq(economicEventsTable.id, d.eventId));

      const [opt] = await db
        .select()
        .from(eventOptionsTable)
        .where(
          and(
            eq(eventOptionsTable.eventId, d.eventId),
            eq(eventOptionsTable.optionKey, d.optionKey)
          )
        );

      return {
        id: d.id,
        eventTitleEn: ev?.titleEn ?? "",
        eventTitleAr: ev?.titleAr ?? "",
        chosenOptionEn: opt?.labelEn ?? "",
        chosenOptionAr: opt?.labelAr ?? "",
        xpEarned: d.xpEarned,
        budgetImpact: d.budgetImpact ? parseFloat(d.budgetImpact) : 0,
        createdAt: d.createdAt.toISOString(),
      };
    })
  );

  res.json(GetDecisionHistoryResponse.parse(result));
});

export default router;
