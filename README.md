# Gissa partiet

A Swedish face-recognition game: guess which Riksdag party a member of parliament belongs to, based on their photo. Modelled on [guesstheparty.co.uk](https://guesstheparty.co.uk).

**Stack**: SvelteKit · Cloudflare Workers · D1 (SQLite) · Tailwind · shadcn-svelte

## Getting started

```sh
npm install
npm run db:migrate:local   # apply migrations to the local D1 database
npm run dev
```

Then open `http://localhost:5173`.

## Database

Migrations live in `migrations/`. They are applied using Cloudflare's official D1 migration tooling, which tracks applied migrations in a `d1_migrations` table so re-runs are safe.

| Script | What it does |
|---|---|
| `npm run db:migrate:local` | Apply pending migrations to the local `.wrangler/` D1 database used by `npm run dev` |
| `npm run db:migrate` | Apply pending migrations to the **remote** (production) D1 database |

### First-time setup

After cloning, run `npm run db:migrate:local` once before `npm run dev`. Without this, `/stats` and `POST /api/event` will 500 with `no such table: events`.

### Adding a migration

Create a new numbered SQL file in `migrations/` (e.g. `0002_add_column.sql`) and run `npm run db:migrate:local`. Wrangler records which migrations have been applied and skips already-applied ones.

### Production migrations

Run `npm run db:migrate` from a machine with valid Cloudflare credentials (the `CLOUDFLARE_API_TOKEN` environment variable, or a `wrangler login` session). This is a manual step; automated deployment-time migration is tracked in a follow-up issue.

## Developing

```sh
npm run dev          # start the dev server (http://localhost:5173)
npm test             # run unit tests (Vitest)
npm run typecheck    # TypeScript + Svelte type checks
```

## Building

```sh
npm run build        # build for Cloudflare Workers
```

The app uses `@sveltejs/adapter-cloudflare`. Deploy with `wrangler deploy` after building.
