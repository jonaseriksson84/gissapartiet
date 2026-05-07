# Global stats with a thin backend

The site has a UK-style global stats page (per-party accuracy, public confusion matrix, easiest/hardest MPs, misidentification patterns) aggregated across all players. This requires a small backend — without it the stats page can only show per-player history, which is a much weaker product.

The backend stores only **anonymous guess events**: `(mp_id, guessed_party_id, was_correct, timestamp)`. No user identifiers, no IP retention, no fingerprinting. Rate-limiting is simple per-session-token throttling, sufficient for v1 anti-cheat. The stats page degrades gracefully on sparse data: no "Loading…" placeholders that don't terminate; empty cells render as blank states that look intentional rather than broken.

Stack will follow the project's Cloudflare-Workers preference (CLAUDE.md). Database choice (D1 vs KV vs DO storage) deferred to implementation.
