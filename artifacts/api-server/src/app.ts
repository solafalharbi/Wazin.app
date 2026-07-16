import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { llmGenerateLimiter, llmChatLimiter } from "./lib/rateLimiter";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
// Build an explicit allowlist from the Replit-injected REPLIT_DOMAINS variable
// (comma-separated; covers both the dev proxy domain and any deployed domain).
// Localhost variants are included so curl / local tooling still works in dev.
const replitDomains = (process.env.REPLIT_DOMAINS ?? "")
  .split(",")
  .map((d) => d.trim())
  .filter(Boolean)
  .map((d) => `https://${d}`);

const allowedOrigins = new Set([
  ...replitDomains,
  "http://localhost",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:8080",
]);

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests with no Origin header (e.g. server-to-server, curl).
      if (!origin) return cb(null, true);
      if (allowedOrigins.has(origin)) return cb(null, true);
      // Reject: browser will block the response; no ACAO header is sent.
      cb(null, false);
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate-limit all LLM-backed endpoints before the main router.
// Generation endpoints (expensive — up to 8 192 tokens each): 5 req / 15 min per IP.
app.use("/api/twin/generate", llmGenerateLimiter);
app.use("/api/analysis/personality/generate", llmGenerateLimiter);
app.use("/api/scenarios/generate", llmGenerateLimiter);
// Scenario respond also triggers an OpenAI call for personalised feedback.
// Applied as a path prefix so it covers /api/scenarios/:id/respond.
app.use("/api/scenarios/:scenarioId/respond", llmGenerateLimiter);
// Chat / insight (interactive, lighter): 30 req / 15 min per IP.
app.use("/api/ai/chat", llmChatLimiter);
app.use("/api/ai/insight", llmChatLimiter);

app.use("/api", router);

export default app;
