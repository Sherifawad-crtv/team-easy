# Decisions (ADRs)

One short record per big technical choice. Engineers own this folder. Write the record **before** building on the choice. Template: `0000-template.md`.

## Open decisions (need engineer sign-off before screens are built)

| # | Decision | Proposed default | Status |
|---|---|---|---|
| 0 | Test harness and client framework | Web PWA for design testing (see `0001-pwa-test-harness.md`). Production client open | PROPOSED |
| 1 | State management | Riverpod (Flutter proposal, now client-dependent) | OPEN |
| 2 | Routing | go_router (Flutter proposal) (deep links, join links, push taps) | OPEN |
| 3 | Backend and realtime transport for chat and presence | None proposed | OPEN |
| 4 | Admin web app stack | Separate web stack proposed, Flutter web also possible. Affects preview pipeline and code sharing | OPEN |
| 5 | Push and call handling (APNs/FCM, native call UI, background behavior) | None proposed | OPEN |
| 6 | Zeego Cloud integration approach (client SDK, token service) | None proposed | OPEN |
| 7 | Chat storage, local cache and retention model | None proposed | OPEN |
| 8 | Model/immutability approach (`freezed` or equivalent) | `freezed` | OPEN |
| 9 | Load targets for NFR-02 (concurrent users, messages/sec) | Numbers needed from product owner | OPEN |

## Records

_None yet. Add `0001-<short-title>.md`, `0002-...` as decisions are made, and update the table above._
