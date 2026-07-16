import OpenAI from "openai";

if (!process.env.OPENROUTER_API_KEY) {
  throw new Error("OPENROUTER_API_KEY is required");
}

// OpenRouter exposes an OpenAI-compatible chat completions API.
export const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

export const AI_MODEL = "google/gemini-2.5-flash";
// Cheaper model used for token-heavy routes when the primary model exceeds credit budget
export const AI_MODEL_LITE = "meta-llama/llama-3.1-8b-instruct:free";


/**
 * Extract and parse JSON from an LLM completion that is expected to return
 * pure JSON but may wrap it in markdown code fences, add commentary, or
 * include JS-style "// ..." comments inside the object.
 */
export function extractJson<T = unknown>(raw: string): T {
  let text = raw.trim();

  // Strip ```json ... ``` or ``` ... ``` code fences.
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    text = fenceMatch[1].trim();
  }

  // If there's leading/trailing prose, isolate the outermost JSON object.
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    text = text.slice(firstBrace, lastBrace + 1);
  }

  // Remove JS-style line comments the model sometimes leaves in as
  // placeholders (e.g. "// ... repeat for all 10 years").
  text = text.replace(/^\s*\/\/.*$/gm, "");

  return JSON.parse(text) as T;
}
