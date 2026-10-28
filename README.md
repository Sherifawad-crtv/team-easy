# TeamEasy

Team messaging: a mobile-first web app (PWA) for users and a web admin app for organizations. Chats, groups and sub-groups, media, audio and video calls, calendar, notifications.

This repo is the **design-in-code test harness**. It runs the real flows on a typed mock data layer so the design can be tested with real people and A/B variants while the engineers build the production architecture. The earlier Flutter attempt is kept on the `flutter-archive` branch.

- Product spec: [`docs/PRD.md`](docs/PRD.md)
- Build status: [`docs/PROGRESS.md`](docs/PROGRESS.md)
- Build spec for Claude Code: [`docs/PWA_SPEC.md`](docs/PWA_SPEC.md)
- A/B tests: [`docs/AB_TESTING.md`](docs/AB_TESTING.md)

## Run it

```bash
npm install
npm run dev          # http://localhost:5173, full UI on fake data, no backend
```

Quality gate:

```bash
npm run lint && npm run typecheck && npm test && npm run build
```

Every push is built by Vercel and gets a preview link. Review tools (bug icon, top right): switch the data between `normal`, `empty`, `error`, `slow` and `offline`, and force an A/B variant. A link such as `/chats?v_chat_list=B` forces a variant too.

## How the code is organized

```
src/design/        tokens-based components (Button, TextField, Banner, Avatar, BottomSheet...)
src/styles/        tokens.css (colors, type, spacing...), base.css, components.css, app.css
src/data/          api.ts = the contract, mock/ = the placeholder, index.ts = the one-file switch
src/features/      auth, chat, account, results, shell (screens for each area)
src/experiments/   A/B assignment, event tracking, summary
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
| `docs/AB_TESTING.md` | Experiments, events, results, database setup |
| `docs/WIRING.md` | Placeholder system and registry |
| `docs/ARCHITECTURE.md` | Production architecture notes (engineers) |
| `docs/decisions/` | Architecture decision records |
| `docs/PIPELINE.md` | Build and deploy |
| `CONTRIBUTING.md` | Branches, commits, PRs, ownership |
