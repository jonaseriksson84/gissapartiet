# shadcn-svelte for UI primitives

All UI primitives where a shadcn-svelte component exists are sourced from `shadcn-svelte` rather than rolled by hand: Button, Card, Tooltip, Badge, Table, Skeleton, Switch, Separator, etc. Bespoke styling (party-coloured answer buttons, photo card with reveal overlay and timer bar) sits *on top of* these primitives — composing them, not replacing them.

The reasoning is fit + leverage: we've already chosen Tailwind, and shadcn-svelte is Tailwind-native, copy-paste (so we own the components and there's no hidden runtime), and built on `bits-ui` for accessibility (focus-trap, dismissal, ARIA). Rolling Tooltip/Switch/Table from scratch would burn time on solved problems. The "use as much shadcn as possible" stance also keeps the component layer stylistically consistent for free.

Trade-off accepted: shadcn-svelte initialisation step in the scaffold (`pnpm dlx shadcn-svelte init`) and a `lib/components/ui/` directory of generated components owned by us. Dark mode comes along for free via shadcn's CSS-variable theming + Tailwind's `dark:` variant.
