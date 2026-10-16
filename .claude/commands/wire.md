---
description: Wire a placeholder (mock) to its real implementation using the WIRING registry
argument-hint: <wire-id, e.g. chat.send-message>
---

Wire the placeholder `$ARGUMENTS`.

1. Read `docs/WIRING.md`: find the registry row for `$ARGUMENTS` and the sections "How an engineer wires a point" and "Mock behavior standards".
2. Find every marker: run `tool/list_wires.sh` or grep for `WIRE: $ARGUMENTS` in `lib/`. Read the mock, the domain interface and the binding in `core/di/`.
3. Read `docs/ARCHITECTURE.md` for layer rules and the matching entry in `docs/decisions/` for the chosen backend/SDK. If the decision is still open, stop and ask which option to use.
4. Implement the contract in `data/remote/` (or `local/`). Map backend errors to the feature's `Failure` types. Expose realtime data as `Stream`. Do not change the UI or the domain interface unless the contract is wrong; if it must change, say so first.
5. Bind it in `core/di/` for `USE_MOCKS=false`. Keep the mock for `USE_MOCKS=true` and tests.
6. Enforce every "Server must enforce" item server-side, not only in the client.
7. Add tests. Run `flutter analyze`, `dart format .`, `flutter test`.
8. Delete the `// WIRE: $ARGUMENTS` markers, set the registry status to `WIRED` in `docs/WIRING.md` and update the matching rows in `docs/PROGRESS.md`.
9. Summarize what changed, anything the designer must know, and anything left open.
