import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { GetLeaderboardResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/leaderboard", async (req, res): Promise<void> => {
  const userId = req.session.userId!;

  // Fetch all real users sorted by XP descending
  const allUsers = await db
    .select({
      id: usersTable.id,
      username: usersTable.username,
      xp: usersTable.xp,
      level: usersTable.level,
      avatarUrl: usersTable.avatarUrl,
      badge: usersTable.badge,
    })
    .from(usersTable)
    .orderBy(desc(usersTable.xp));

  const entries = allUsers.map((user, index) => ({
    rank: index + 1,
    userId: user.id,
    username: user.username,
    xp: user.xp,
    level: user.level,
    avatarUrl: user.avatarUrl ?? null,
    badge: user.badge ?? null,
    isCurrentUser: user.id === userId,
    weeklyXpGain: undefined,
  }));

  const userRank = entries.find((e) => e.isCurrentUser)?.rank ?? entries.length;

  res.json(
    GetLeaderboardResponse.parse({
      entries,
      userRank,
      updatedAt: new Date().toISOString(),
    })
  );
});

export default router;
