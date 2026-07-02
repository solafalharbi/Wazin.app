import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { GetLeaderboardResponse } from "@workspace/api-zod";

const router: IRouter = Router();
const DEFAULT_USER_ID = 1;

const LEADERBOARD_SEED = [
  { rank: 1, userId: 101, username: "juju", xp: 4820, level: 10, badge: "Elite Saver", weeklyXpGain: 380 },
  { rank: 2, userId: 102, username: "Nama", xp: 4210, level: 9, badge: "Budget Master", weeklyXpGain: 295 },
  { rank: 3, userId: 103, username: "Leen", xp: 3650, level: 8, badge: "Smart Investor", weeklyXpGain: 310 },
  { rank: 5, userId: 105, username: "Ahmed", xp: 2890, level: 7, badge: "Rising Star", weeklyXpGain: 180 },
  { rank: 6, userId: 106, username: "Reem", xp: 2540, level: 6, badge: "Thrifty Hero", weeklyXpGain: 150 },
  { rank: 7, userId: 107, username: "Khalid", xp: 2100, level: 5, badge: "Finance Rookie", weeklyXpGain: 120 },
];

router.get("/leaderboard", async (req, res): Promise<void> => {
  let currentUser = null;
  try {
    const rows = await db.select().from(usersTable).where(eq(usersTable.id, DEFAULT_USER_ID)).limit(1);
    currentUser = rows[0] ?? null;
  } catch {
    // ignore
  }

  const solafEntry = {
    rank: 4,
    userId: DEFAULT_USER_ID,
    username: "Solaf",
    xp: currentUser?.xp ?? 3120,
    level: currentUser?.level ?? 7,
    avatarUrl: currentUser?.avatarUrl ?? null,
    badge: "Financial Warrior",
    isCurrentUser: true,
    weeklyXpGain: 240,
  };

  const seedEntries = LEADERBOARD_SEED.map((s) => ({
    rank: s.rank,
    userId: s.userId,
    username: s.username,
    xp: s.xp,
    level: s.level,
    avatarUrl: null,
    badge: s.badge,
    isCurrentUser: false,
    weeklyXpGain: s.weeklyXpGain,
  }));

  const all = [...seedEntries.slice(0, 3), solafEntry, ...seedEntries.slice(3)];
  const sorted = all.sort((a, b) => a.rank - b.rank);

  res.json(
    GetLeaderboardResponse.parse({
      entries: sorted,
      userRank: 4,
      updatedAt: new Date().toISOString(),
    })
  );
});

export default router;
