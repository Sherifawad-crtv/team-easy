# TeamEasy: Claude Code Rules

Team messaging app. Mobile-first PWA (users) + web admin. Spec: `docs/PRD.md`. Status: `docs/PROGRESS.md`. Build spec: `docs/PWA_SPEC.md`.

This repo is the design-in-code test harness: real flows on a typed mock data layer, A/B tested, while engineers build the production architecture. The Flutter attempt lives on the `flutter-archive` branch.

## Who works here
- **Designer:** UI/UX, flows, interactions. Works in `src/design`, `src/styles`, `src/features`, `src/data/mock` and docs. Does not read code: explain problems in plain language, no code dumps.
- **Engineers (3):** the real backend, production architecture, wiring. Own `docs/ARCHITECTURE.md` and `docs/decisions/`.

## Architecture
- Screens in `src/features/<area>` talk only to `src/data/api.ts` (through `src/data/index.ts`). Never import from `src/data/mock/` in a screen.
- Types in `src/data/types.ts` mirror the backend contract. Money and anything computed is computed by the backend, never in the UI.
- One data-fetching pattern: `useAsync` for loading, `useSubmit` for actions. Every screen gets loading, error with retry, and offline for free.
- Business limits (300 members, 5/5/5 depth, 1h call cap, retention days, undo window) go in one config file when first needed. Never hardcode them in screens.

## Placeholders (core rule, details: `docs/WIRING.md`)
Anything needing a backend, SDK or OS service gets all four:
1. a method in the contract (`src/data/api.ts`)
2. a mock implementation in `src/data/mock/` (realistic latency, errors, empty states)
3. a `// WIRE:` marker (format in WIRING.md)
4. a row in the `docs/WIRING.md` registry

Never write real backend code unless asked.

## Design (`docs/DESIGN.md`)
- Use only tokens (`src/styles/tokens.css`) and components (`src/design`). No raw colors, sizes or text styles in screens.
- Every screen ships all states: loading, empty, error, offline, success (messaging also sending/failed).
- Follow the native-feel standard and the "avoid the generic AI look" section in DESIGN.md.
- Never build placeholder or stub screens or features. Give context for future work instead.

## A/B tests (`docs/AB_TESTING.md`)
Variants live behind `useVariant(id)`. A new experiment needs: an entry in `EXPERIMENTS`, a metric, a row in `docs/AB_TESTING.md`, and a test.

## Never
- Never hardcode secrets. Only `VITE_*` public values go in the browser; see `.env.example`.
- Never change the real backend or the Supabase projects Nimble and Bizqwik. The A/B project is separate.
- Never change PRD scope. Log deviations in the PRD "Open questions" section.
- Never commit `.env` files, keystores or certificates.

## Commands
```
npm install
npm run dev
npm run lint && npm run typecheck && npm test && npm run build
tool/list_wires.sh        # list all open placeholders
```

## Done means
lint, typecheck, tests and build pass, `PROGRESS.md` updated, screenshots in the PR, requirement IDs in the commit message (e.g. `feat(chat): CHT-05 delete own message in private chats`).

## Read on demand
`docs/DESIGN.md` before any UI · `docs/WIRING.md` before adding or replacing a placeholder · `docs/AB_TESTING.md` before touching experiments · `docs/PIPELINE.md` for deploys · `docs/ARCHITECTURE.md` and `docs/decisions/` for engineer decisions
