import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { GetLeaderboardResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const LEADERBOARD_SEED = [
  { rank: 1, userId: 101, username: "juju", xp: 4820, level: 10, badge: "Elite Saver", weeklyXpGain: 380 },
  { rank: 2, userId: 102, username: "Nama", xp: 4210, level: 9, badge: "Budget Master", weeklyXpGain: 295 },
  { rank: 3, userId: 103, username: "Leen", xp: 3650, level: 8, badge: "Smart Investor", weeklyXpGain: 310 },
  { rank: 5, userId: 105, username: "Ahmed", xp: 2890, level: 7, badge: "Rising Star", weeklyXpGain: 180 },
  { rank: 6, userId: 106, username: "Reem", xp: 2540, level: 6, badge: "Thrifty Hero", weeklyXpGain: 150 },
  { rank: 7, userId: 107, username: "Khalid", xp: 2100, level: 5, badge: "Finance Rookie", weeklyXpGain: 120 },
];

router.get("/leaderboard", async (req, res): Promise<void> => {
  const userId = req.session.userId!;

  let currentUser = null;
  try {
    const rows = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    currentUser = rows[0] ?? null;
  } catch {
    // ignore
  }

  // Determine the current user's rank based on their XP vs seeded players
  const userXp = currentUser?.xp ?? 0;
  const higherRanked = LEADERBOARD_SEED.filter((s) => s.xp > userXp);
  const userRank = higherRanked.length + 1;

  const userEntry = {
    rank: userRank,
    userId,
    username: currentUser?.username ?? "You",
    xp: userXp,
    level: currentUser?.level ?? 1,
    avatarUrl: currentUser?.avatarUrl ?? null,
    badge: currentUser?.badge ?? "Newcomer",
    isCurrentUser: true,
    weeklyXpGain: 0,
  };

  // Adjust seed ranks to account for the current user's position
  const seedEntries = LEADERBOARD_SEED.map((s) => ({
    rank: s.xp > userXp ? s.rank : s.rank + 1,
    userId: s.userId,
    username: s.username,
    xp: s.xp,
    level: s.level,
    avatarUrl: null,
    badge: s.badge,
    isCurrentUser: false,
    weeklyXpGain: s.weeklyXpGain,
  }));

  const all = [...seedEntries, userEntry].sort((a, b) => a.rank - b.rank);

  res.json(
    GetLeaderboardResponse.parse({
      entries: all,
      userRank,
      updatedAt: new Date().toISOString(),
    })
  );
});

export default router;
