import session from "express-session";
import { type RequestHandler } from "express";

// ── Session type augmentation ───────────────────────────────────────────────
declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required");
}

export const sessionMiddleware = session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
});

// Paths (relative to /api mount) that are accessible without a session.
const PUBLIC_PATHS = new Set(["/healthz", "/auth/login", "/auth/register", "/auth/me", "/auth/demo"]);

/**
 * Middleware that enforces an authenticated session on all /api routes
 * except those in PUBLIC_PATHS.
 */
export const requireSession: RequestHandler = (req, res, next) => {
  if (PUBLIC_PATHS.has(req.path)) return next();
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
};
