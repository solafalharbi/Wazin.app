import { type Request, type Response, type NextFunction } from "express";

const API_TOKEN = process.env.API_TOKEN;

if (!API_TOKEN) {
  throw new Error("API_TOKEN environment variable is required");
}

/**
 * Require a valid `Authorization: Bearer <API_TOKEN>` header on every request.
 * Health-check is exempted so Replit's deployment probes continue to work.
 */
export function requireApiToken(req: Request, res: Response, next: NextFunction): void {
  // Always allow health-check so deployment probes are unaffected.
  if (req.path === "/healthz") {
    next();
    return;
  }

  const authHeader = req.headers["authorization"] ?? "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme === "Bearer" && token === API_TOKEN) {
    next();
    return;
  }

  res.status(401).json({ error: "Unauthorized" });
}
