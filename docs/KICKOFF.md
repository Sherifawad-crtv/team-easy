# KICKOFF: first session and how screens get built

Read `CLAUDE.md` first. This file is the build order: bootstrap the project, set up a minimal design system with the designer, then build screens **in whatever PRD area the designer chooses, in any order**. Onboarding and signup are the likely first area, but nothing here limits the work to it.

## Ground rules

- The designer does not read code. Explain progress and problems in plain language, no code dumps.
- Do not invent design decisions (brand, colors, type, flows). Propose options and wait for approval.
- Do not invent product decisions. Anything the PRD doesn't say goes to the designer as a question (see "PRD gaps by area").
- No real backend code. Everything external is an interface plus a `Mock*` with a `// WIRE:` marker (`docs/WIRING.md`).
- `docs/ARCHITECTURE.md` defaults are **proposed, pending engineer sign-off**. Build on them provisionally (Riverpod, go_router, repository pattern) and keep state-management specifics inside `presentation/` so they are cheap to change. Do not make irreversible choices on the open decisions in `docs/decisions/`.
- Commit in small steps with requirement IDs. Update `docs/PROGRESS.md` at the end of every session.

## Step 1: Bootstrap the project (once)

1. Environment: if `flutter` is available, use it. If not, install the Flutter SDK yourself (stable channel) in the environment you are running in, then run `flutter doctor`. Ask the designer only if the install is blocked (network, permissions), and say exactly what blocked it. Run `flutter analyze` and `flutter test` yourself. Never leave checks for the designer.
2. Create the Flutter project with the folder structure from `docs/ARCHITECTURE.md` (`app/`, `core/{config,design_system,di,error,utils}`, `features/<feature>/{presentation,domain,data/{mock,remote,local}}`). Create feature folders only when a screen in that area is started.
3. Add strict lint (`very_good_analysis`) and make `flutter analyze` pass clean.
4. Add `AppConfig` in `core/config` with the PRD limits as values (300 members, 5/5/5, 1 h/day, 5 call participants, retention days, undo window). No screen reads a hardcoded limit.
5. Add the `USE_MOCKS` switch in `core/di` (default `true` for now) and a **debug scenario switch** that lets the designer toggle `normal`, `empty`, `error`, `slow`, `offline` at runtime on mock data.
6. Add `.gitignore`. Never commit secrets.
7. Run `flutter analyze`, `dart format .`, `flutter test`. Commit.

## Step 1b: GitHub and a live preview link (right after bootstrap)

The designer's normal flow is code, GitHub, then a shareable link on every push. Set that up before any screen work:

1. Ask the designer for the GitHub repo (name, owner, private) or create it if the tools allow. Push the project. Branches: `main` stable, `dev` daily work.
2. Follow `docs/PIPELINE.md` Phase 0 and Phase 1: GitHub Actions builds the Flutter web app with `--dart-define=USE_MOCKS=true` and deploys it to Vercel. `dev` pushes give a preview URL, `main` gives production.
3. The manual parts (Vercel project, GitHub secrets) are marked **[MANUAL]** in the pipeline file. Walk the designer through them click by click, then verify the workflow went green and the link opens.
4. From now on, every push to `dev` produces a link the designer can open. Share the link after each screen.

## Step 2: Minimal design system (once, then it grows)

1. Ask the designer for the brand direction: references, existing brand colors and fonts if any, light/dark decision, and whether Arabic/RTL is a target (PRD open question 9). If they attach references, read them.
2. Propose a minimal token set (color roles, type scale, spacing, radius, elevation, motion) and show it on a quick preview screen. Wait for approval. Do not continue on guessed tokens.
3. Once approved: implement tokens as a `ThemeExtension` in `core/design_system`, record them in `docs/DESIGN.md` section 3, and replace the **[TO DEFINE]** entries.
4. Build components as screens need them (checklist in `docs/DESIGN.md` section 4). A new component goes into the design system first, then into the screen.

## Step 3: Build screens (repeat for any area, in the order the designer picks)

Per screen or flow, loop through this:

1. **Scope:** name the PRD requirement IDs involved. If the designer describes something not in the PRD, flag it as a side note, don't silently add it.
2. **Ask:** check "PRD gaps by area" and the PRD open questions. Ask the designer, in one short grouped question, about anything the PRD leaves open. Record answers in `docs/DESIGN.md` section 6 and as a PRD change-log note.
3. **Contract:** in `features/<f>/domain/` define the interface and plain entities the screen needs, nothing more. If it needs data from another feature, use that feature's `domain/` interface, never its `data/` or `presentation/`.
4. **Mock:** in `features/<f>/data/mock/` build the `Mock*` with realistic data, latency and failure cases, supporting every scenario in the debug switch. Add the `// WIRE:` marker and set the registry row to `MOCKED` (add a row if the dependency isn't in `docs/WIRING.md`). Bind in `core/di`.
5. **Screens:** build in `features/<f>/presentation/` with design-system components only. Every screen ships all states: loading, empty, error with retry, offline, success (messaging also sending/failed). Handle forms properly: validation, disabled/loading submit, keyboard, focus order.
6. **Show:** push to `dev` and share the web preview link (or `flutter run --dart-define=USE_MOCKS=true` locally) and iterate with the designer screen by screen.
7. **Close:** update `docs/DESIGN.md` (new components, decisions), `docs/PROGRESS.md` (requirement rows to `UI`), `docs/WIRING.md`; run `tool/list_wires.sh`; commit with IDs. Summarize in plain language what exists, what is mocked, and what the engineers will need to wire.

## PRD gaps by area (ask before building)

| Area | The PRD doesn't say |
|---|---|
| Onboarding and signup (ACC) | Sign-in method (email, phone/OTP, social), verification, how an org invite is received and used, what "optionally attach to an organization" looks like, required fields at signup vs profile, welcome screens. See PRD open question 13. |
| Groups & teams (GRP) | What a flight is and who creates/sees/hides it (open question 1), whether 5/5/5 is per parent (5), per-user group limit (4), whether flights count toward limits (12). |
| Roles (ROL) | Title tags: who assigns, free text or fixed, where shown (2). Moderators were removed: confirm (3). Who may invite whom (7). |
| Chat, search, media | Message types beyond text/images, read receipts and typing indicators, search result layout, document types for search filters. |
| Calls | Call entry points, incoming-call behavior when the app is closed, what happens when the daily cap is hit mid-call. |
| Calendar | What a calendar contains (events, reminders, shared vs personal), views, what "assigned by admin" means for the user. |
| Notifications | What goes in the in-app banner vs push, grouping and mute controls. |
| Monetization | Exact ad placements (6), upgrade/paywall flow for members beyond 300. |
| Profile, device, data | Profile fields beyond name/email/photo, settings screen contents, how backup/transfer (DAT-01) appears to users. |

If an answer isn't known yet, build to the most likely option behind a clearly named component, mark it in `docs/DESIGN.md` as "assumed", and tell the designer.

## Device testing (when the designer asks)

Web preview is already live from Step 1b. When the designer wants real phones, continue `docs/PIPELINE.md`: Phase 2 (Android via Firebase), Phase 3 (iOS via Codemagic and TestFlight), Phase 4 (Shorebird, optional).

## Done for a session

- Project builds; analyze, format and tests pass.
- New screens exist with all states, on mocks, using only design-system components.
- `PROGRESS.md`, `WIRING.md` registry, `DESIGN.md` and the PRD change log are up to date.
- A short plain-language summary for the designer, with open questions for the engineers.
