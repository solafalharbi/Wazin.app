# Threat Model

## Project Overview

Wazin (وازِن) is a bilingual (Arabic/English) AI-powered financial education platform built as an RPG-style budget simulation game. It targets young Saudi users and integrates Alinma Bank rewards. The stack is React + Vite (frontend), Express 5 (API), PostgreSQL + Drizzle ORM (database), and OpenRouter (LLM API for AI advisor, financial twin, and personality analysis). It is deployed publicly on Replit as an autoscale deployment.

**Current user model:** Single-user MVP — all data is scoped to `DEFAULT_USER_ID = 1` (Solaf). No authentication system exists.

## Assets

- **User game state** — XP, level, coins, simulation data, AI chat history. Tampering resets or corrupts the learning experience.
- **Alinma Bank reward codes** — redemption codes are generated server-side and tied to real partner offers. Prediction or theft allows unauthorized benefit extraction.
- **OpenRouter API key** (`OPENROUTER_API_KEY`) — used for all LLM calls. Exhaustion or leakage causes service disruption and financial cost to the operator.
- **Database** (`DATABASE_URL`) — contains all user data. Compromise gives full read/write access.
- **AI chat messages** — contains user financial questions and AI responses; privacy-sensitive.

## Trust Boundaries

- **Public Internet → Express API** — No authentication. Any internet user can call any API endpoint. This is the highest-risk boundary in the current deployment.
- **Express API → PostgreSQL** — All queries use Drizzle ORM with parameterized statements; no raw SQL string concatenation observed.
- **Express API → OpenRouter** — Server calls LLM API with a secret key. No rate limiting means unauthenticated callers can trigger unlimited billable calls.
- **Browser → React Frontend** — Standard SPA; no sensitive secrets in client bundle (API key is server-side only).

## Scan Anchors

- **Production entry points:** `artifacts/api-server/src/app.ts` (server setup), `artifacts/api-server/src/routes/index.ts` (route aggregator)
- **Highest-risk code areas:** `routes/ai.ts`, `routes/twin.ts`, `routes/analysis.ts`, `routes/scenarios.ts` (LLM calls), `routes/rewards.ts` (redemption code generation)
- **Public surface:** All `/api/*` routes — no auth on any of them
- **Admin/privileged surface:** None — single hardcoded user, no role system
- **Dev-only areas:** `artifacts/mockup-sandbox/` — design canvas, accessible at `/__mockup` but does not interact with the DB or API

## Threat Categories

### Spoofing / Broken Access Control

**Critical.** There is no authentication system. All API endpoints use `DEFAULT_USER_ID = 1` with no identity verification. Any public internet user can impersonate Solaf and read or write all data. The required guarantee — that only the legitimate user can access their data — is completely absent.

### Tampering

Any caller can overwrite simulation allocations, profile fields, and game state decisions via unauthenticated POST/PATCH requests. Since there is no multi-user system yet, the only tampered victim is user ID 1.

### Denial of Service

No rate limiting on any endpoints, especially the LLM endpoints that make paid API calls (`/api/ai/chat`, `/api/twin/generate`, `/api/analysis/personality/generate`). An attacker can exhaust the `OPENROUTER_API_KEY` budget. All endpoints that trigger an LLM call **MUST** have rate limiting before the app supports real users.

### Information Disclosure

AI chat history (potentially sensitive financial questions) is readable by anyone. No secrets were found in source code — `OPENROUTER_API_KEY` and `DATABASE_URL` are environment variables. CORS is `*` (wildcard), allowing any web page to read API responses in the browser.

### Elevation of Privilege

No privilege levels exist. SQL injection risk is low — Drizzle ORM with parameterized queries is used throughout. No file upload endpoints observed.

### Repudiation

No audit logging for sensitive operations (reward redemption, coin deduction). If disputes arise with Alinma Bank reward codes, there is no tamper-evident log.

## Required Guarantees (for production multi-user launch)

1. All API endpoints MUST require a valid session or JWT before processing any request.
2. LLM endpoints MUST be rate-limited (e.g., N requests per IP per minute) before public launch.
3. CORS MUST be restricted to the known frontend origin.
4. Redemption codes MUST use `crypto.randomBytes()` instead of `Math.random()`.
5. Security headers MUST be set via `helmet()` or equivalent.
