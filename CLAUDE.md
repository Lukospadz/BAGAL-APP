# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Start Vite dev server
pnpm build            # tsc -b then vite build
pnpm typecheck        # Type-check without emitting
pnpm preview          # Preview production build
```

There are no configured test or lint commands.

## Environment

Copy `.env.local.example` to `.env.local` and fill in the Supabase project URL and anon key:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Database migrations live in `supabase/migrations/` and must be applied via the Supabase dashboard or CLI.

## Architecture

**BAGAL-APP** is a golf tournament management and leaderboard app with a cosmetics/currency system ("Bagal Bucks"). Stack: React 19 + TypeScript + Vite, Supabase (PostgreSQL + Auth), TanStack React Query v5, React Router v7, Tailwind CSS, React Hook Form + Zod.

### Routing and access control

`src/App.tsx` defines all routes. Public pages (leaderboard, players, tournaments) use `PublicLayout`. Admin pages are nested under `/admin` behind `AdminRoute`. Player-specific pages use `PlayerRoute`. Both guard components live in `src/components/auth/` and read role from `AuthContext`.

### Auth and session

`src/context/AuthContext.tsx` wraps Supabase Auth (email OTP). On session change it fetches the `profiles` row to get the user's `role` (`admin` | `player`) and associated `player_id`. This profile object is the single source of truth for role checks throughout the app.

### Data fetching pattern

All server state goes through TanStack React Query. Custom hooks in `src/hooks/` (e.g. `usePlayers`, `useTournaments`, `useScores`) wrap Supabase queries and expose both data and mutation functions. Mutations call `queryClient.invalidateQueries` on success. Query keys follow `['entity']` / `['entity', id]` / `['entity', parentId]` conventions. Default `staleTime` is 2 minutes.

### Scoring

Tournament standings are **computed on-demand, never stored**. `src/lib/scoring.ts` contains pure functions that derive positions from scores and award points based on per-tournament 1st/2nd/3rd place values. Do not add a standings table to the DB.

### Shop and cosmetics

`src/lib/shop.ts` is the source of truth for available titles and frames (type `ShopItem[]`). Tiers are `common | rare | epic | legendary`. Purchases are recorded in the `player_items` table. When adding new shop items, add them to this file only — no DB changes needed.

### Database schema highlights

Key tables: `players` (core data + `bag` JSONB + `bucks` balance), `profiles` (auth bridge, stores `role`), `seasons`, `tournaments` (format: `stroke | match | scramble`), `scores`, `casual_rounds`, `personal_rounds`, `bucks_transactions`, `player_items`, `favourite_courses`. Types mirror the schema exactly in `src/types/db.ts` — keep these in sync when adding columns.

### Styling

Tailwind config in `tailwind.config.ts` defines a golf-themed palette (forest greens, gold, coral, sky blues) and custom fonts (Space Grotesk body, Fraunces display). Use the custom palette tokens rather than generic Tailwind color classes.

### Path alias

`@/` resolves to `src/` (configured in `vite.config.ts` and `tsconfig.json`). Use it for all internal imports.
