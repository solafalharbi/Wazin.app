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
app.use(cors());
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
