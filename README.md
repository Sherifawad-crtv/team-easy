# TeamEasy

Team messaging app: native mobile app for users (Flutter) and a web admin app for organizations. Chats, groups and sub-groups, media, audio/video calls (Zeego Cloud), calendar, notifications.

- Product spec: [`docs/PRD.md`](docs/PRD.md)
- Build status: [`docs/PROGRESS.md`](docs/PROGRESS.md)

## Run it

```bash
flutter pub get
flutter run --dart-define=USE_MOCKS=true      # full UI on fake data, no backend needed
```

`USE_MOCKS=true` is how the designer builds and previews everything. Real backends are connected by replacing placeholders (see Wiring).

Quality gate (also enforced by CI):

```bash
flutter analyze && dart format . && flutter test
```

Environment variables: copy `.env.example`, never commit real values. Use `--dart-define` for build-time values.

## How the code is organized

Feature-first clean architecture. Details in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

```
lib/features/<feature>/{presentation, domain, data/{mock, remote, local}}
lib/core/{config, design_system, di, error, utils}
```

Dependency direction: `presentation → domain ← data`.

## Wiring placeholders to real services

Every backend/SDK/OS dependency is built as an interface plus a mock. Engineers replace the mock with the real implementation, with no UI changes.

```bash
tool/list_wires.sh          # list open placeholders
```

In Claude Code: `/wire <wire-id>`. Full guide: [`docs/WIRING.md`](docs/WIRING.md).

## Docs index

| File | What it is |
|---|---|
| `CLAUDE.md` / `AGENTS.md` | Rules for AI agents working in this repo |
| `docs/PRD.md` | Requirements with IDs, change log, open questions |
| `docs/PROGRESS.md` | Status per requirement ID |
| `docs/ARCHITECTURE.md` | Layers, folders, rules, open technical decisions |
| `docs/WIRING.md` | Placeholder system and registry |
| `docs/DESIGN.md` | Design system, components, states, UX decisions |
| `docs/decisions/` | Architecture decision records |
| `docs/PIPELINE.md` | CI/CD and test distribution (web, Android, iOS) |
| `docs/KICKOFF.md` | Build order: bootstrap, design system, then screens in any PRD area |
| `CONTRIBUTING.md` | Branches, commits, PRs, ownership |

## Setup note

After unzipping, run `chmod +x tool/list_wires.sh`.
