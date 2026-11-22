# TeamEasy

Team messaging: a mobile-first web app (PWA) for users and a web admin app for organizations. Chats, groups and sub-groups, media, audio and video calls, calendar, notifications.

This repo is the **design-in-code test harness**. It runs the real flows on a typed mock data layer so the final design is in place and testable while the engineers build the production architecture. The design is final (A/B tests are done and removed); see [`docs/HANDOVER.md`](docs/HANDOVER.md). The earlier Flutter attempt is kept on the `flutter-archive` branch.

- Product spec: [`docs/PRD.md`](docs/PRD.md)
- Build status: [`docs/PROGRESS.md`](docs/PROGRESS.md)
- Build spec for Claude Code: [`docs/PWA_SPEC.md`](docs/PWA_SPEC.md)
- Developer handover: [`docs/HANDOVER.md`](docs/HANDOVER.md)
- Build guide for engineers (flows, behavior, motion, design, phases, with screenshots): [`docs/handover/BUILD_GUIDE.md`](docs/handover/BUILD_GUIDE.md)

## Run it

```bash
npm install
npm run dev          # http://localhost:5173, full UI on fake data, no backend
```

Quality gate:

```bash
npm run lint && npm run typecheck && npm test && npm run build
```

Every push is built by Vercel and gets a preview link. Review tools (bug icon, top right): switch the data between `normal`, `empty`, `error`, `slow` and `offline`, flip permissions, calls, plan and role, and tune the springs.

## How the code is organized

```
src/design/        tokens-based components (Button, TextField, Banner, Avatar, BottomSheet...)
src/styles/        tokens.css (colors, type, spacing...), base.css, components.css, app.css
src/data/          api.ts = the contract, mock/ = the placeholder, index.ts = the one-file switch
src/features/      auth, chat, groups, calendar, calls, plan, admin, account, shell (screens for each area)
src/analytics.ts   track(): product events (placeholder)
src/debug/         review tools: fake states, spring tuning (not part of the product)
src/state/         session, one shared data-fetching hook, submit hook
```

Screens only talk to `src/data/api.ts`. Going live means returning a real implementation from `src/data/index.ts`. See [`docs/WIRING.md`](docs/WIRING.md).

```bash
tool/list_wires.sh   # list open placeholders
```

In Claude Code: `/wire <wire-id>`.

## Docs index

| File | What it is |
|---|---|
| `CLAUDE.md` / `AGENTS.md` | Rules for AI agents working in this repo |
| `docs/PRD.md` | Requirements with IDs, change log, open questions |
| `docs/PROGRESS.md` | Status per requirement ID |
| `docs/EXECUTION_PLAN.md` | Order of work by phase, what each needs, who does what |
| `docs/PWA_SPEC.md` | Kickoff and rules, persona and function spec, UI spec, mock-data contract |
| `docs/DESIGN.md` | Design system, components, states, UX decisions |
| `docs/HANDOVER.md` | What is built, how it is structured, what engineers wire next |
| `docs/WIRING.md` | Placeholder system and registry |
| `docs/ARCHITECTURE.md` | Production architecture notes (engineers) |
| `docs/decisions/` | Architecture decision records |
| `docs/PIPELINE.md` | Build and deploy |
| `CONTRIBUTING.md` | Branches, commits, PRs, ownership |
