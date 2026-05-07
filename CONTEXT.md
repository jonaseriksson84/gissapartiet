# Gissa partiet — Domain language

A Swedish-language clone of [guesstheparty.co.uk](https://guesstheparty.co.uk) for Swedish national politics.

## Architecture (high-level)

- **Frontend** fetches MP list and photos directly from `data.riksdagen.se`. No backend mirror of Riksdag data; the source is hit live (with browser-level caching).
- **Backend** is a thin events store: receives anonymous guess events from the frontend, stores them, serves aggregations to the stats page. Doesn't know MP names/photos — only opaque `mp_id`s. The frontend joins backend counts with Riksdag MP details at render time.
- **Stack**: SvelteKit on Cloudflare Workers via `@sveltejs/adapter-cloudflare`; D1 (SQLite) for the events table; SvelteKit `+server.ts` for `/api/event` and `/api/stats`; Tailwind for styling; `shadcn-svelte` for as many UI primitives as possible — Button, Card, Tooltip, Badge, Table, Skeleton, Switch (dark-mode toggle), Separator, and any others where a primitive applies. Bespoke styling sits on top of shadcn primitives, not next to them. See [ADR-0005](docs/adr/0005-sveltekit-over-astro.md) for SvelteKit over Astro and [ADR-0006](docs/adr/0006-shadcn-svelte.md) for shadcn-svelte adoption.
- **Domain**: `gissapartiet.se` (already owned).
- **Package versions**: install everything at `@latest`. Don't pin to older "stable" versions when newer ones exist.
- **Dark mode**: required from v1. Toggle + `prefers-color-scheme` respected. Tailwind's `dark:` variant + shadcn-svelte's CSS-variables theming carries this for free.

## Resolved defaults

- **MPs with no photo**: excluded from the playable pool. The game is photo recognition; no photo = unguessable.
- **Stats page**: match the UK section-for-section (per-party accuracy, confusion matrix, easiest/hardest MPs per party with `n ≥ 15` floor, misidentification patterns) once data accrues.
- **Reset button**: clears everything stored in the player's browser (score, streak, best, recent-guesses log, any per-player local stats). Does *not* touch the global events DB — those are append-only and anonymous, so there's nothing for the player to revoke.
- **Party-colour collisions**: kept as-is. Each button's primary disambiguator is its symbol, not its colour; brand colours stay as backgrounds.
- **Logo sourcing**: Wikimedia Commons / Wikipedia SVGs for the eight party symbols; Lucide `user-x` (or similar) for Partilös. Per-party licence handled at implementation time; same posture as ADR-0004 (use + attribute; swap if pushed back on).
- **Recent-guesses log**: every guess made in the player's session, oldest at the bottom of the list. Scrollable; reset clears it. Persisted in localStorage. (Differs from UK's truncated view.)
- **Photo card**: portrait aspect, dark bottom-up gradient overlay reserved for the reveal text.
- **Loading state**: "Laddar ledamöter…" → "N ledamöter inlästa" once fetched.
- **Footer attribution**: "Foto: Sveriges riksdag · Källa: data.riksdagen.se".

## Glossary

### Game
A face-recognition game: the player is shown a photo of a Swedish Riksdagsledamot and must pick which of the eight Riksdag parties they belong to. Pure visual — no name, no constituency, no biography is shown. Score / streak / best is tracked.

### Riksdagsledamot
A current member of the Swedish parliament. The game's population is **live** — sourced from `data.riksdagen.se` at request time, so the dataset reflects whoever is currently a sitting MP.

Edge-case rules (decided 2026-05-07):
- **Politiska vildar** (broke from party, kept seat): included; right answer = current affiliation per riksdagen.se, typically `Partilös`.
- **Ersättare** (replacement currently serving for an MP on leave): included if Riksdagens API exposes them as tjänstgörande. To verify against `data.riksdagen.se` schema before implementation.
- **Talmannen** (Speaker, currently Andreas Norlén): included with their party (M). Even though the role is conventionally neutral, they retain party affiliation in the data.

### Partilös
A non-party — meaningful only for politiska vildar who haven't joined another party. Treated as a real answer in the game with its own button alongside the eight party buttons. See [ADR-0001](docs/adr/0001-partilos-button.md).

### Round
A single guess: the player is shown one MP photo, picks one of nine answer buttons (eight parties + Partilös), and the round resolves in three beats:

1. **Click** = the player's guess for the photo currently shown
2. **Reveal** (~1.5s dwell):
   - The photo gains a dark bottom-up gradient overlay; white text appears lower-left with the MP's name and correct party
   - All nine buttons go translucent/desaturated; the **correct** button gets a green ✓ badge top-right; the **player's wrong choice** (if any) gets a red ✕ badge top-right
   - A thin horizontal bar at the bottom of the card depletes from full width to zero over the dwell — visual countdown to auto-advance
   - Score / streak / best update; a Recent guesses entry is added with thumbnail + name + "party · du gissade X" + ✓/✕
3. **Auto-advance**: photo transitions to the next candidate, no reveal visible

The dwell is a forced timer — buttons are inert during reveal, advance is automatic, no "Nästa" button. Matches UK behaviour exactly. Sampling: each round samples a party uniformly first, then an MP from that party — see [ADR-0002](docs/adr/0002-stratified-sampling.md).

### Answer button
Nine buttons in a single row. Each shows the party's **graphical symbol** (logo) on the party's branded colour, with the full party name appearing as a hover tooltip. Partilös uses a generic icon (Lucide `user-x` or similar) on a neutral colour. Logos are sourced from Wikipedia SVGs; party-specific licence concerns will be handled per-party at implementation time.

### Game session
Endless play — open the page, keep guessing for as long as you want. There's no daily challenge, no shared deck, no Wordle-style streak-share. Score, streak, and best persist across sessions in the player's local browser only.

### Stats
A separate page showing **global** aggregated metrics across all players: per-party accuracy, confusion matrix, easiest/hardest MPs per party, misidentification patterns. Modelled on the UK site's stats page. Backed by anonymous event ingestion — see [ADR-0003](docs/adr/0003-global-stats-backend.md).

### Bild (MP photo)
The portrait shown each round. Sourced from Riksdagen's image archive (`data.riksdagen.se/filarkiv/bilder/ledamot/...`). Attribution "Foto: Sveriges riksdag" must appear on every page that displays photos. See [ADR-0004](docs/adr/0004-riksdag-photos.md).

### Parti
One of the eight parties currently represented in Riksdagen:
- S — Socialdemokraterna
- M — Moderaterna
- SD — Sverigedemokraterna
- V — Vänsterpartiet
- C — Centerpartiet
- KD — Kristdemokraterna
- MP — Miljöpartiet
- L — Liberalerna

These are the eight buttons the player picks from. Equivalent to the UK game's five-party set, but harder (random baseline 12.5% vs 20%).
