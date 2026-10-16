# CONTRIBUTING

Team: 3 engineers and 1 product designer who builds UI directly in the codebase. This file keeps both fast and safe.

## Ownership

| Area | Owner | Reviewer |
|---|---|---|
| `core/design_system/`, `features/*/presentation/`, `features/*/data/mock/`, `docs/DESIGN.md` | Designer | An engineer |
| `features/*/domain/`, `data/remote/`, `data/local/`, `core/config`, `core/di`, `core/error`, `.github/`, `docs/ARCHITECTURE.md`, `docs/decisions/` | Engineers | Another engineer |
| `docs/PRD.md` | Product owner | Both |

Enforced by `.github/CODEOWNERS`. Turn on "Require review from Code Owners" in branch protection for `main` and `dev`.

## Branches

- `main`: stable. `dev`: daily integration.
- Designer: `design/<area>-<short-name>` (example: `design/groups-tree`).
- Engineers: `eng/<area>-<short-name>`. Wiring a placeholder: `wire/<wire-id>`.
- Small branches, merged often.

## Commits

Conventional commits with requirement IDs:

```
feat(groups): GRP-10 delete group with undo
fix(chat): CHT-05 hide delete action in group chats
docs(prd): log flights change
```

## Pull requests

- Keep them small and focused. Attach screenshots (or a short recording) for any UI change, in the relevant states.
- Designer PRs touch presentation, design system, mocks and docs only. If a design needs a new behavior, limit, or data shape, flag it in the PR as a note for engineers instead of wiring it.
- Reviews: aim to review within one working day. [Proposal for the team to confirm.]
- CI must pass: analyze, format, tests.
- Update `docs/PROGRESS.md` and, if a placeholder changed, `docs/WIRING.md`.

## Definition of done

- Analyze, format and tests pass.
- All screen states present (loading, empty, error, offline, success; messaging also sending/failed).
- Tokens and design-system components only.
- Placeholders marked with `// WIRE:` and registered.
- `PROGRESS.md` updated; requirement IDs in commit messages.

## Decisions

Big technical choices get a short record in `docs/decisions/` before they are built. Product scope changes go through the PRD change log.
