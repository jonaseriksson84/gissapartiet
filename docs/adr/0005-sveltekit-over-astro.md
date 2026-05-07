# SvelteKit on Cloudflare Workers, not Astro

The project is a single interactive game (`/`) plus a stats dashboard (`/stats`) plus two API endpoints (`/api/event`, `/api/stats`) — i.e., one big interactive island and one SSR'd page consuming typed server load data. SvelteKit's primitives (`+page.server.ts` → typed page props, `+server.ts` for API routes, native reactivity for the game state graph) line up with that shape one-for-one.

Astro was the obvious default given the user's global CLAUDE.md mentioning Astro + Cloudflare Workers, and was seriously considered. Rejected because Astro's signature strengths — per-page mode mixing, multi-framework islands, content-first SSR — don't apply: there are only two pages, both with one rendering mode each, and the game island would contain essentially all the JS regardless. With Astro we'd still be picking a framework (or vanilla) *inside* the island, leaving Astro acting mostly as a router + build tool wrapper. SvelteKit gives a unified end-to-end mental model for the same surface.

Trade-off accepted: Svelte syntax learning tax (mild but real). Adapter: `@sveltejs/adapter-cloudflare`. Database binding: D1.
