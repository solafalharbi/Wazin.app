import { type Request, type Response, type NextFunction } from "express";

/**
 * Gate all /api requests behind an authenticated browser session.
 * Bearer-token auth has been intentionally removed — the only client is the
 * browser frontend, which authenticates via session cookie.
 *
 * Auth routes (/auth/*) and the health-check are always exempted — they
 * bootstrap the session and cannot require authentication first.
 */
export function requireApiToken(req: Request, res: Response, next: NextFunction): void {
  // Always allow health-check probes.
  // Always allow auth endpoints — they're the entry point for obtaining a session.
  if (req.path === "/healthz" || req.path.startsWith("/auth/") || req.path === "/auth/demo") {
    next();
    return;
  }

  // Accept a valid browser session (logged-in users).
  if (req.session?.userId) {
    next();
    return;
  }

  res.status(401).json({ error: "Unauthorized" });
}
