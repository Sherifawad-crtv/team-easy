# ARCHITECTURE

> **Status: PROPOSED DEFAULTS. NEEDS ENGINEER SIGN-OFF before the first screen is built.**
> Engineers own this file. Items marked **[DECIDE]** are open decisions tracked in `docs/decisions/`.

## 1. Goals

- Production-grade code the engineers can build on without a rewrite.
- The designer can build and preview every screen without a backend (see `docs/WIRING.md`).
- Clear ownership: presentation (designer) vs domain/data (engineers).

## 2. Stack defaults

| Concern | Default | Status |
|---|---|---|
| Framework | Flutter (stable), Dart null-safe | Proposed |
| State management | Riverpod | **[DECIDE]** |
| Routing | go_router (deep links, join links, push taps) | **[DECIDE]** |
| Data pattern | Repository pattern, interfaces in domain | Proposed |
| Backend and realtime transport | Not chosen | **[DECIDE]** |
| Admin web app | Not chosen (Flutter web vs separate web stack) | **[DECIDE]** |
| Calls | Zeego Cloud SDK behind `CallService` | Fixed by PRD (DEP-01) |
| Purchases | RevenueCat behind `PurchaseService` | Fixed by PRD (MON-04) |
| Lint | `very_good_analysis` (strict) | Proposed |
| Models | Immutable entities (`freezed` or equivalent) | **[DECIDE]** |

## 3. Folder structure

```
lib/
  main.dart
  app/                    # app shell, router, bootstrap
  core/
    config/               # AppConfig: limits, quotas, retention, undo window, flags
    design_system/        # tokens, theme, shared widgets   (designer-owned)
    di/                   # providers; USE_MOCKS switch      (engineer-owned)
    error/                # Failure types, Result
    utils/
  features/
    auth/  profile/  groups/  roles/  chat/  search/  media/
    calls/  calendar/  notifications/  device_integrations/  monetization/
      presentation/       # screens, widgets, controllers    (designer-owned)
      domain/             # entities, repository interfaces, use cases (engineer-owned)
      data/
        mock/             # Mock* placeholders               (designer-built)
        remote/           # real implementations             (engineer-built)
        local/            # cache, local storage
test/
tool/
docs/
```

PRD areas map to feature modules: Accounts & onboarding → `auth`, Groups & teams → `groups`, Roles & permissions → `roles`, Chats → `chat`, Search → `search`, Media → `media`, Calls → `calls`, Calendar → `calendar`, Notifications → `notifications`, Device integrations → `device_integrations`, Profile → `profile`, Monetization → `monetization`. Data & storage (DAT) spans `chat`, `media` and server jobs.

## 4. Layer rules

- Dependency direction: `presentation → domain ← data`.
- `domain/` is pure Dart: no Flutter imports, no backend SDK types, no data-layer imports.
- `data/` implements domain interfaces and maps backend models to domain entities. Backend types never leave `data/`.
- `presentation/` talks only to providers exposing domain interfaces/use cases. No direct SDK, HTTP, storage or platform-channel calls.
- Features do not import each other's `data/` or `presentation/`. Shared contracts go through `domain/` or `core/`.
- Lints and a CI import check enforce this (proposed: `import_lint` or custom analyzer rule).

## 5. Configuration, never hardcoded

All business values live in `AppConfig` (read from config/DB, with local defaults for mocks):

- 300 members per main group (counted across the group and all sub-groups)
- Hierarchy 5 / 5 / 5
- Call duration 1 hour/day per user, call participants 5
- Attachment retention 6 days (standard) / 15 days (business)
- Archived chat retention period
- Delete-group undo window (PRD: configurable value in the database)

## 6. Realtime

- NFR-01 says realtime by default. Repositories expose live data as `Stream<T>` (messages, presence, call state, notification counts).
- Mocks emit fake events on the same streams so the UI is built against the real shape.
- Transport and reconnect/backoff strategy: **[DECIDE]**, see decisions index.

## 7. Errors

- Each feature defines typed `Failure`s in `domain/`. Repositories return a `Result` or throw only domain failures.
- Every screen handles: loading, empty, error (with retry), offline, success. Messaging adds sending and failed.

## 8. Dependency injection and mocks

- Providers live in `core/di/`. A compile-time flag `--dart-define=USE_MOCKS=true` binds mocks; `false` binds real implementations.
- The web preview and the designer's work always run with `USE_MOCKS=true`.
- Mocks stay in the codebase after wiring: they back tests and previews.

## 9. Account switching (ACC-07)

Organization identity and individual identity are separate scopes. All repositories take the active identity from the auth layer; no repository caches data across identities. Cache keys include identity ID.

## 10. Testing

- Domain: unit tests.
- Data: contract tests that run against both the mock and the real implementation where possible.
- Presentation: widget tests for key states; golden tests for design-system components (optional, **[DECIDE]**).
- CI blocks merge on analyze, format and test failures.

## 11. Conventions

- File names `snake_case.dart`; one public class per file where practical.
- Commits reference requirement IDs: `feat(chat): CHT-05 delete own message in private chats`.
- No secrets in code. `--dart-define` plus `.env.example`.

## 12. Adding a feature (checklist)

1. Create `features/<name>/{presentation,domain,data/{mock,remote,local}}`.
2. Define entities and repository interfaces in `domain/`.
3. Build `Mock*` in `data/mock/`, register in `core/di/`, add a WIRE marker and registry row.
4. Build screens in `presentation/` with all states, using design-system components only.
5. Update `docs/PROGRESS.md`.

## 13. Known flags for the engineers

- NFR-02 (load tolerance) has no numbers in the PRD. Concurrency and throughput targets are needed before backend design.
- Admin web: its stack affects the preview pipeline and code sharing.
- Push and calls need native work on iOS and Android (call UI, background handling).
