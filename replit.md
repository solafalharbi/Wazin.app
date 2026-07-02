# Wazin وازِن

An AI-powered educational platform for young Arabs — a bilingual RPG-style budget simulation game with a smart AI financial advisor, Alinma Bank rewards integration, and a live leaderboard. Current user: **Solaf** (صلف).

## Run & Operate

- `pnpm --filter @workspace/wazin run dev` — run the frontend (auto-started via workflow)
- `pnpm --filter @workspace/api-server run dev` — run the API server (auto-started via workflow)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, Framer Motion, Recharts, wouter, next-themes
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (zod/v4), drizzle-zod
- API codegen: Orval (from OpenAPI spec)
- Fonts: Cairo (Arabic), Inter (English)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/wazin/src/` — React frontend
  - `contexts/LanguageContext.tsx` — bilingual AR/EN + RTL toggle
  - `contexts/ThemeContext.tsx` — light/dark mode
  - `components/Layout.tsx`, `components/Sidebar.tsx` — app shell
  - `pages/Dashboard.tsx` — main dashboard with AI insight, budget health, activity
  - `pages/Simulation.tsx` — RPG budget simulator with sliders
  - `pages/Events.tsx` — economic events/challenges
  - `pages/AIAdvisor.tsx` — chat interface with AI
  - `pages/Rewards.tsx` — Alinma Bank rewards catalog
  - `pages/Leaderboard.tsx` — ranked leaderboard (juju, Nama, Leen, Solaf #4, Ahmed)
  - `pages/Profile.tsx` — profile, language + theme toggles
- `artifacts/api-server/src/routes/` — Express route handlers
- `lib/db/src/schema/` — Drizzle ORM schema (users, simulations, events, chat, rewards, activities)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth)

## Architecture decisions

- Single-user app for now (user ID 1 = Solaf) — no auth needed for MVP
- All text strings have both `En` and `Ar` variants in DB and API responses
- Leaderboard merges real DB user with static seed data for competitors
- AI advisor uses curated response pool (no LLM API key required for MVP)
- Language toggle switches font family (Cairo ↔ Inter) and document direction (RTL ↔ LTR)

## Product

- Dashboard with XP progress, budget health score (0–100), AI insight, spending chart, activity feed
- RPG budget simulator: allocate income across 8 categories with live health recalculation
- Economic events: market crash, bonus, emergency, investment opportunity — each with 3 decision options
- AI financial advisor: bilingual chat with personalized tips
- Rewards hub: 7 Alinma Bank exclusive offers redeemable with coins
- Leaderboard: juju (#1), Nama (#2), Leen (#3), Solaf (#4), Ahmed (#5)+

## User preferences

- Language: Arabic (ar) default, English (en) switchable from sidebar and profile
- Theme: Dark mode default, light mode switchable
- No emojis in navigation

## Gotchas

- After any `lib/*` schema change, run `pnpm run typecheck:libs` before checking artifact packages
- Leaderboard route combines real DB user (Solaf) with static seed entries — update `LEADERBOARD_SEED` in `leaderboard.ts` to add more users
- Budget allocation updates scoped by both `simulationId` AND `category` to prevent cross-simulation data corruption
- Reward redemption upserts user_rewards (insert if not exists, update if exists)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
