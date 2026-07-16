import { type Request, type Response, type NextFunction } from "express";

const API_TOKEN = process.env.API_TOKEN;

if (!API_TOKEN) {
  throw new Error("API_TOKEN environment variable is required");
}

/**
 * Gate all /api requests behind EITHER:
 *   1. A valid `Authorization: Bearer <API_TOKEN>` header (server-to-server), OR
 *   2. An authenticated browser session (req.session.userId is set).
 *
 * Auth routes (/auth/*) and the health-check are always exempted — they
 * bootstrap the session and cannot require a token first.
 */
export function requireApiToken(req: Request, res: Response, next: NextFunction): void {
  // Always allow health-check probes.
  // Always allow auth endpoints — they're the entry point for obtaining a session.
  if (req.path === "/healthz" || req.path.startsWith("/auth/") || req.path === "/auth/demo") {
    next();
    return;
  }

  // Accept a valid API token (server-to-server calls).
  const authHeader = req.headers["authorization"] ?? "";
  const [scheme, token] = authHeader.split(" ");
  if (scheme === "Bearer" && token === API_TOKEN) {
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
