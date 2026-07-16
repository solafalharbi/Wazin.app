import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  GetUserProfileResponse,
  UpdateUserProfileBody,
  UpdateUserProfileResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/user/profile", async (req, res): Promise<void> => {
  const userId = req.session.userId!;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId));

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(
    GetUserProfileResponse.parse({
      ...user,
      joinedAt: user.joinedAt.toISOString(),
    })
  );
});

router.patch("/user/profile", async (req, res): Promise<void> => {
  const userId = req.session.userId!;

  const parsed = UpdateUserProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db
    .update(usersTable)
    .set(parsed.data)
    .where(eq(usersTable.id, userId))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(
    UpdateUserProfileResponse.parse({
      ...user,
      joinedAt: user.joinedAt.toISOString(),
    })
  );
});

export default router;
