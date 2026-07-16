import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";

const router: IRouter = Router();

// ── GET /auth/me ─────────────────────────────────────────────────────────────
router.get("/auth/me", async (req, res): Promise<void> => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.session.userId));

  if (!user) {
    req.session.destroy(() => {});
    res.status(401).json({ error: "User not found" });
    return;
  }

  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    level: user.level,
    xp: user.xp,
    coins: user.coins,
    language: user.language,
    theme: user.theme,
    badge: user.badge,
    avatarUrl: user.avatarUrl,
    joinedAt: user.joinedAt.toISOString(),
  });
});

// ── POST /auth/login ──────────────────────────────────────────────────────────
router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, String(email).toLowerCase()));

  if (!user || !user.passwordHash) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(String(password), user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  req.session.userId = user.id;

  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    level: user.level,
    xp: user.xp,
    coins: user.coins,
    language: user.language,
    theme: user.theme,
    badge: user.badge,
    avatarUrl: user.avatarUrl,
    joinedAt: user.joinedAt.toISOString(),
  });
});

// ── POST /auth/register ───────────────────────────────────────────────────────
router.post("/auth/register", async (req, res): Promise<void> => {
  const { username, email, password } = req.body ?? {};

  if (!username || !email || !password) {
    res.status(400).json({ error: "Name, email, and password are required" });
    return;
  }

  if (String(password).length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, String(email).toLowerCase()));

  if (existing) {
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(String(password), 12);

  const [user] = await db
    .insert(usersTable)
    .values({
      username: String(username).trim(),
      email: String(email).toLowerCase().trim(),
      passwordHash,
      xp: 0,
      level: 1,
      coins: 100, // starter coins
      language: "ar",
      theme: "dark",
    })
    .returning();

  req.session.userId = user.id;

  res.status(201).json({
    id: user.id,
    username: user.username,
    email: user.email,
    level: user.level,
    xp: user.xp,
    coins: user.coins,
    language: user.language,
    theme: user.theme,
    badge: user.badge,
    avatarUrl: user.avatarUrl,
    joinedAt: user.joinedAt.toISOString(),
  });
});

// ── POST /auth/demo ───────────────────────────────────────────────────────────
// Instantly logs in as the Solaf demo account (user id=1) without a password.
router.post("/auth/demo", async (req, res): Promise<void> => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, 1));

  if (!user) {
    res.status(404).json({ error: "Demo account not found" });
    return;
  }

  req.session.userId = user.id;

  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    level: user.level,
    xp: user.xp,
    coins: user.coins,
    language: user.language,
    theme: user.theme,
    badge: user.badge,
    avatarUrl: user.avatarUrl,
    joinedAt: user.joinedAt.toISOString(),
  });
});

// ── POST /auth/logout ─────────────────────────────────────────────────────────
router.post("/auth/logout", (req, res): void => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: "Could not log out" });
      return;
    }
    res.clearCookie("connect.sid");
    res.json({ success: true });
  });
});

export default router;
