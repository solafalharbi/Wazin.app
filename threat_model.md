# Threat Model

## Project Overview

Wazin (وازِن) is a bilingual (Arabic/English) AI-powered financial education platform built as an RPG-style budget simulation game. It targets young Saudi users and integrates Alinma Bank rewards. The stack is React + Vite (frontend), Express 5 (API), PostgreSQL + Drizzle ORM (database), and OpenRouter (LLM API for AI advisor, financial twin, and personality analysis). It is deployed publicly on Replit as an autoscale deployment at `https://wazin.site`.

**Current user model:** Multi-user with email/password registration. A single demo account (user ID 1, Solaf) exists for the MVP. A `POST /auth/demo` endpoint allows passwordless login as user 1.

## Assets

- **User accounts and sessions** — email, bcrypt-hashed passwords, session cookies. Compromise allows impersonation and access to all game and financial data.
- **User game state** — XP, level, coins, simulation data, AI chat history. Tampering resets or corrupts the learning experience.
- **Alinma Bank reward codes** — generated server-side with `crypto.randomBytes`; tied to real partner offers. Theft allows unauthorized benefit extraction.
- **OpenRouter API key** (`OPENROUTER_API_KEY`) — used for all LLM calls. Exhaustion or leakage causes service disruption and financial cost to the operator.
- **Database** (`DATABASE_URL`) — contains all user data. Compromise gives full read/write access.
- **API authentication token** (`API_TOKEN`) — bearer token used by the frontend to authenticate API calls. Currently hardcoded in `.replit` and embedded in the public JS bundle — effectively public.
- **AI chat messages** — contains user financial questions and AI responses; privacy-sensitive.

## Trust Boundaries

- **Public Internet → Express API** — The API now requires either a valid Bearer token (`API_TOKEN`) or a valid session cookie on all `/api/*` routes (except public auth paths). However, `API_TOKEN` is publicly exposed in the frontend bundle, so this boundary is effectively unenforced for anyone who can read JS source.
- **Express API → PostgreSQL** — All queries use Drizzle ORM with parameterized statements; no raw SQL string concatenation observed.
- **Express API → OpenRouter** — Server calls LLM API with a secret key stored in environment variables. LLM endpoints are rate-limited per IP.
- **Browser → React Frontend** — Standard SPA; `VITE_API_TOKEN` is embedded in the client bundle at build time, making it publicly visible.
- **Authenticated User → Demo Account** — `POST /auth/demo` grants any internet user a session as user ID 1 with no credentials.

## Scan Anchors

- **Production entry points:** `artifacts/api-server/src/app.ts` (server setup), `artifacts/api-server/src/routes/index.ts` (route aggregator)
- **Highest-risk code areas:** `routes/auth.ts` (session creation, demo login), `routes/ai.ts`, `routes/twin.ts`, `routes/analysis.ts`, `routes/scenarios.ts` (LLM calls), `routes/rewards.ts` (redemption code generation), `lib/auth.ts` (Bearer token check)
- **Public surface (no auth):** `POST /auth/login`, `POST /auth/register`, `POST /auth/demo`, `GET /auth/me`, `GET /api/healthz`
- **Authenticated surface:** All other `/api/*` routes — guarded by `requireApiToken` + `requireSession`
- **Effective public surface:** All `/api/*` routes — because `API_TOKEN` is embedded in the public JS bundle
- **Dev-only areas:** `artifacts/mockup-sandbox/` — design canvas at `/__mockup`, no DB/API access

## Threat Categories

### Spoofing / Broken Access Control

**Critical (API token exposure).** The `API_TOKEN` bearer credential is committed to `.replit` in plaintext and embedded in the frontend JS bundle via `VITE_API_TOKEN`. Any visitor to the site can extract this token and use it to authenticate directly to the API, bypassing the session system entirely. The token must be rotated and removed from client-side code.

**High (demo login).** `POST /auth/demo` creates an authenticated session as user ID 1 with zero credentials. Any internet user can take over the demo account, read its financial chat history, modify game state, and redeem rewards.

### Tampering

Any caller who can authenticate (trivially via the public `API_TOKEN`) can overwrite simulation allocations, profile fields, and game state for any user (currently only user 1).

### Denial of Service

LLM endpoints are rate-limited (5 req/15 min for generation, 30 req/15 min for chat). However, `/auth/login` and `/auth/register` have no rate limiting, enabling brute-force and registration spam. The `API_TOKEN` bypass means rate limits on LLM endpoints only slow down — not stop — abuse.

### Information Disclosure

AI chat history (potentially sensitive financial questions and advice) is readable by anyone who authenticates via the public `API_TOKEN` or the demo login. Helmet is in use. CORS is now restricted to Replit domains. No secrets found in source code beyond `API_TOKEN` in `.replit`.

### Elevation of Privilege

No privilege levels beyond authenticated/unauthenticated. SQL injection risk is low — Drizzle ORM with parameterized queries is used throughout. Reward redemption codes use `crypto.randomBytes` (secure).

### Repudiation

No audit logging for sensitive operations (reward redemption, coin deduction). If disputes arise with Alinma Bank reward codes, there is no tamper-evident log.

## Required Guarantees (for production multi-user launch)

1. **MUST** rotate `API_TOKEN` immediately; the current value is public.
2. **MUST** remove `VITE_API_TOKEN` from the frontend; the browser should authenticate only via session cookies.
3. **MUST** store `API_TOKEN` exclusively in Replit Secrets, never in `.replit`.
4. **MUST** remove or properly gate `POST /auth/demo` (read-only demo user or admin-only access).
5. **MUST** apply rate limiting to `POST /auth/login` and `POST /auth/register`.
6. All API endpoints that access user data MUST require a valid, non-public session token.
