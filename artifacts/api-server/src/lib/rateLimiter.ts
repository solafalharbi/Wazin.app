import rateLimit from "express-rate-limit";

/**
 * Login endpoint: 10 attempts per 15 minutes per IP.
 * Limits brute-force credential attacks without blocking normal users
 * (a legitimate user rarely needs more than 2–3 attempts per session).
 */
export const authLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    error: "Too many login attempts. Please wait 15 minutes before trying again.",
  },
});

/**
 * Registration endpoint: 5 registrations per hour per IP.
 * Limits registration spam / fake-account flooding.
 */
export const authRegisterLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    error: "Too many registration attempts. Please wait before creating another account.",
  },
});

/**
 * Demo/developer login endpoint: 5 attempts per 15 minutes per IP.
 * Even though the endpoint is gated by a secret PIN, this prevents
 * brute-forcing a short numeric PIN if the PIN ever becomes known.
 */
export const authDemoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    error: "Too many developer login attempts. Please wait 15 minutes before trying again.",
  },
});

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
