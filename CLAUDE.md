# TeamEasy: Claude Code Rules

Team messaging app. Flutter mobile app (users) + web admin. Spec: `docs/PRD.md`. Status: `docs/PROGRESS.md`.

## Who works here
- **Designer:** UI/UX, flows, interactions. Works only in presentation, design system, mocks and docs. Does not read code: explain problems in plain language, no code dumps.
- **Engineers (3):** domain, data, infra, wiring. Own `docs/ARCHITECTURE.md` and `docs/decisions/`.

## Architecture (full rules: `docs/ARCHITECTURE.md`)
- Feature-first clean architecture: `lib/features/<feature>/{presentation,domain,data}`.
- Dependency direction: presentation → domain ← data. Domain imports nothing from Flutter, data or presentation.
- Widgets never call backends, SDKs or storage directly. They use providers that expose domain interfaces.
- Business limits (300 members, 5/5/5 depth, 1h call cap, retention days, undo window) live in `AppConfig`. Never hardcode them.

## Placeholders (core rule, details: `docs/WIRING.md`)
Anything needing a backend, SDK or OS service gets all four:
1. an interface in `domain/`
2. a `Mock*` implementation in `data/mock/` (realistic latency, errors, empty states)
3. a `// WIRE:` marker (format in WIRING.md)
4. a row in the `docs/WIRING.md` registry

Never write real backend code unless asked. Never import a Mock from `presentation/`.

## Design (`docs/DESIGN.md`)
- Use only tokens and components from `lib/core/design_system`. No raw colors, sizes or text styles in screens.
- Every screen ships all states: loading, empty, error, offline, success (messaging also sending/failed).
- Follow the "avoid the generic AI look" section in DESIGN.md.

## Never
- Never hardcode secrets. Use `--dart-define` and `.env.example`.
- Never change `domain/` or real `data/` code as design work. Flag it as a side note instead.
- Never change PRD scope. Log deviations in the PRD "Open questions" section.
- Never commit keystores, certificates or `.env`.

## Commands
```
flutter pub get && flutter analyze && dart format . && flutter test
flutter run --dart-define=USE_MOCKS=true
tool/list_wires.sh        # list all open placeholders
```

## Done means
analyze + format + tests pass, `PROGRESS.md` updated, screenshots in the PR, requirement IDs in the commit message (e.g. `feat(groups): GRP-10 delete with undo`).

## Read on demand
`docs/ARCHITECTURE.md` before structural changes · `docs/DESIGN.md` before any UI · `docs/WIRING.md` before adding or replacing a placeholder · `docs/PIPELINE.md` for CI/CD · `docs/decisions/` for open decisions · `docs/KICKOFF.md` for the first-session build order
