import rateLimit from "express-rate-limit";

/**
 * Tight limit for expensive LLM generation endpoints
 * (financial twin, personality analysis, scenario generation).
 * Each call costs up to 8 192 tokens — 5 per IP per 15 min is generous enough
 * for normal use while blocking trivial exhaustion loops.
 */
export const llmGenerateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    error: "Too many AI generation requests. Please wait a few minutes before trying again.",
  },
});

/**
 * Looser limit for the chat and insight endpoints, which are called more
 * frequently during normal interactive use.
 */
export const llmChatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    error: "Too many AI chat requests. Please wait a few minutes before trying again.",
  },
});
