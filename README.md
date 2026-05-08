# Gissa partiet

Face-only quiz: guess which Riksdag party a Swedish MP belongs to, based on their portrait alone — no name, no constituency, no hints. Skamlöst inspirerad av [guesstheparty.co.uk](https://guesstheparty.co.uk). Live at [gissapartiet.se](https://gissapartiet.se).

## How it works

- Each round samples a party uniformly, then an MP from that party (stratified sampling — see [ADR-0002](docs/adr/0002-stratified-sampling.md))
- The photo appears; the player clicks one of nine answer buttons (the eight Riksdag parties + Partilös)
- A reveal overlay shows the correct answer for ~3 seconds with a countdown bar, then auto-advances — no "Nästa" button; buttons are inert during the reveal
- Score, streak, and best persist in localStorage; a recent-guesses log (thumbnail + name + correct party + ✓/✕) scrolls below the card
- Photos come live from `data.riksdagen.se`; the backend stores only opaque `mp_id` guess events in D1 — it never holds MP names or photos
- The stats page aggregates those events into per-party accuracy, a confusion matrix, and easiest/hardest MPs; see [ADR-0003](docs/adr/0003-global-stats-backend.md) for the schema rationale
- UI is built on shadcn-svelte + Tailwind; dark mode is on by default, togglable, and respects `prefers-color-scheme`
- MPs with no photo are excluded from the playable pool (unguessable)

## Stack

SvelteKit · Cloudflare Workers · D1 (SQLite) · shadcn-svelte · Tailwind

For domain language and resolved design decisions see [`CONTEXT.md`](CONTEXT.md). Architectural decisions are in [`docs/adr/`](docs/adr/).

## Local dev

```sh
npm install
npm run db:migrate:local   # apply migrations to the local D1 database (needed before /stats works)
npm run dev                # http://localhost:5173
```

Other commands:

```sh
npm test             # unit tests (Vitest)
npm run typecheck    # TypeScript + Svelte type checks
npm run build        # build for Cloudflare Workers
wrangler deploy      # deploy to production (requires Cloudflare credentials)
```

### Database migrations

Migrations live in `migrations/`. Wrangler tracks which have been applied via a `d1_migrations` table, so re-runs are safe.

| Script | What it does |
|---|---|
| `npm run db:migrate:local` | Apply pending migrations to the local `.wrangler/` D1 database used by `npm run dev` |
| `npm run db:migrate` | Apply pending migrations to the **remote** (production) D1 database |

To add a migration: create a new numbered SQL file in `migrations/` (e.g. `0002_add_column.sql`) and run `npm run db:migrate:local`.

Production migrations are a manual step. Run `npm run db:migrate` from a machine with valid Cloudflare credentials (`CLOUDFLARE_API_TOKEN` env var, or a `wrangler login` session).

## AFK agent loop

This repo uses sandcastle Ralph-loops to drain the `ready-for-agent` GitHub issue queue. Each loop iteration spins up a fresh Claude session, picks the lowest-numbered unblocked issue, works it to completion, commits, closes the issue, and exits. Configuration lives in `.sandcastle/`.

```sh
npm run sandcastle   # kick off a loop iteration (or the full queue run)
```
