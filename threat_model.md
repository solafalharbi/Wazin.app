# Threat Model

## Project Overview

Wazin (وازِن) is a bilingual (Arabic/English) AI-powered financial education platform built as an RPG-style budget simulation game. It targets young Saudi users and integrates Alinma Bank rewards. The stack is React + Vite (frontend), Express 5 (API), PostgreSQL + Drizzle ORM (database), and OpenRouter (LLM API for AI advisor, financial twin, and personality analysis). It is deployed publicly on Replit as an autoscale deployment at `https://wazin.site`.

**Current user model:** Multi-user with email/password registration. A single demo account (user ID 1, Solaf) exists for the MVP. A `POST /auth/demo` endpoint allows PIN-gated login as user 1 — however the PIN is hardcoded in the public JS bundle.

## Assets

- **User accounts and sessions** — email, bcrypt-hashed passwords, session cookies. Compromise allows impersonation and access to all game and financial data.
- **User game state** — XP, level, coins, simulation data, AI chat history. Tampering resets or corrupts the learning experience.
- **Alinma Bank reward codes** — generated server-side with `crypto.randomBytes`; tied to real partner offers. Theft allows unauthorized benefit extraction.
- **OpenRouter API key** (`OPENROUTER_API_KEY`) — used for all LLM calls. Exhaustion or leakage causes service disruption and financial cost to the operator.
- **Database** (`DATABASE_URL`) — contains all user data. Compromise gives full read/write access.
- **AI chat messages** — contains user financial questions and AI responses; privacy-sensitive.

## Trust Boundaries

- **Public Internet → Express API** — The API requires a valid session cookie on all `/api/*` routes except `/auth/login`, `/auth/register`, `/auth/me`, and `/healthz`. The former `API_TOKEN` bearer auth has been removed.
- **Express API → PostgreSQL** — All queries use Drizzle ORM with parameterized statements; no raw SQL string concatenation observed.
- **Express API → OpenRouter** — Server calls LLM API with a secret key stored in environment variables. LLM endpoints are rate-limited per IP.
- **Browser → React Frontend** — Standard SPA; no secrets are embedded in the client bundle (API token removal confirmed).
- **Authenticated User → Demo Account** — `POST /auth/demo` requires a PIN, but that PIN is hardcoded in the public JS bundle (`Login.tsx: const DEV_CODE = "6767"`). Open registration means any internet user can obtain a session and then exploit the public PIN to take over user 1.

## Scan Anchors

- **Production entry points:** `artifacts/api-server/src/app.ts` (server setup), `artifacts/api-server/src/routes/index.ts` (route aggregator)
- **Highest-risk code areas:** `routes/auth.ts` (session creation, demo login PIN), `routes/ai.ts`, `routes/twin.ts`, `routes/analysis.ts`, `routes/scenarios.ts` (LLM calls), `routes/rewards.ts` (redemption — race condition), `lib/auth.ts` (session check), `lib/session.ts` (cookie config)
- **Public surface (no session required):** `POST /auth/login`, `POST /auth/register`, `GET /auth/me`, `GET /api/healthz`
- **Effectively public surface via open registration:** `POST /auth/demo` (PIN is in the JS bundle)
- **Authenticated surface:** All other `/api/*` routes — guarded by `requireSession`
- **Dev-only areas:** `artifacts/mockup-sandbox/` — design canvas at `/__mockup`, no DB/API access

## Threat Categories

### Spoofing / Broken Access Control

**HIGH (demo login PIN exposure).** `POST /auth/demo` is supposed to be gated behind a secret developer PIN. However, the PIN (`"6767"`) is hardcoded in `artifacts/wazin/src/pages/Login.tsx` as `const DEV_CODE = "6767"` and compiled into the public JS bundle. The server also falls back to `"6767"` if the `DEVELOPER_PIN` environment variable is not set. Any registered user can read the PIN from the bundle and call `/api/auth/demo` to obtain a session as user 1. There is no rate limiting on this endpoint.

**Resolved: API token exposure.** The `VITE_API_TOKEN` bearer credential has been removed from the frontend bundle and from `.replit`. Session-cookie-only authentication is now in effect.

**Resolved: Unauthenticated demo login.** `POST /auth/demo` is no longer accessible without a session (not in `PUBLIC_PATHS`), but open registration trivially provides a session.

### Tampering

**MEDIUM (reward redemption race condition).** The `POST /rewards/:rewardId/redeem` handler reads the user's coin balance, checks sufficiency, deducts coins, and inserts a reward record — all outside a database transaction. Concurrent requests can both pass the balance check before either deduction commits, allowing double-spend of coins for real Alinma Bank partner rewards.

All user data mutations are correctly scoped to `req.session.userId`; no cross-user IDOR is present in current routes.

### Denial of Service

Login (`/auth/login`) and registration (`/auth/register`) are now rate-limited (10/15 min and 5/hr respectively). LLM endpoints are rate-limited. `/auth/demo` has no rate limit.

### Information Disclosure

AI chat history is accessible only to the authenticated session owner (scoped by `req.session.userId`). Helmet is in use. CORS is restricted to Replit domains (plus localhost). No secrets found in source code or env files visible to the client. Session cookies use `httpOnly: true` but are missing `secure: true`.

### Elevation of Privilege

No privilege levels beyond authenticated/unauthenticated. SQL injection risk is low — Drizzle ORM with parameterized queries is used throughout. Reward redemption codes use `crypto.randomBytes` (secure). The `/auth/demo` PIN exposure allows privilege escalation to user 1 for any registered user.

### Repudiation

No audit logging for sensitive operations (reward redemption, coin deduction). If disputes arise with Alinma Bank reward codes, there is no tamper-evident log.

## Required Guarantees (for production multi-user launch)

1. **MUST** remove `const DEV_CODE = "6767"` from `Login.tsx` — no server secrets in client code.
2. **MUST** remove the `"6767"` hardcoded fallback from `auth.ts`; the endpoint must fail closed if `DEVELOPER_PIN` is unset.
3. **MUST** either remove `/auth/demo` from production or require an out-of-band secret never transmitted to the browser.
4. **MUST** add rate limiting to `POST /api/auth/demo`.
5. **MUST** wrap the reward redemption sequence in a database transaction (or use an atomic conditional UPDATE).
6. **SHOULD** add `secure: true` to the session cookie (conditioned on `NODE_ENV === "production"`).
