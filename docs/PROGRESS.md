# PROGRESS

Claude Code updates this file at the end of every session. One row per PRD requirement ID.

**Status key:** `TODO` not started · `UI` screens built on mocks · `WIRED` real backend connected · `DONE` wired, tested, reviewed.
**Wire ID** links to the registry in `docs/WIRING.md`.

## Foundations

| Item | Status | Notes |
|---|---|---|
| Engineer sign-off: `ARCHITECTURE.md` + state management / routing / backend decisions | TODO | See `docs/decisions/README.md` |
| Repo, lint, CI (analyze, format, test) | UI | Project scaffolded, `very_good_analysis` clean, tests pass. CI workflow not yet added. |
| Design system: tokens, theme, base components | UI | Tokens + light Material 3 theme + logo + message bubble built, awaiting designer approval. `docs/DESIGN.md` section 3 |
| Mock infrastructure: `USE_MOCKS` flag, scenario switch, fake data | UI | Flag and runtime scenario switch done; fake data comes with first feature. |
| Pipeline: web preview (Vercel) | TODO | `docs/PIPELINE.md` Phase 1 |
| Pipeline: Android (Firebase App Distribution) | TODO | Phase 2 |
| Pipeline: iOS (Codemagic → TestFlight) | TODO | Phase 3 |
| Pipeline: Shorebird (optional) | TODO | Phase 4 |

## Requirements

| ID | Requirement | Status | Wire ID | PR | Notes |
|---|---|---|---|---|---|
| ACC-01 | Custom signup flow | TODO | `auth.session` | | |
| ACC-02 | Signup path 1: individual | TODO | `auth.session` | | |
| ACC-03 | Signup path 2: optionally attach to an organization | TODO | `auth.session` | | |
| ACC-04 | Signup path 3: invited by an organization | TODO | `auth.session` | | |
| ACC-05 | Joining an organization requires an admin-panel invite | TODO | `members.invite` | | |
| ACC-06 | Org invite does not block individual use | TODO | `auth.session` | | |
| ACC-07 | Account switching (org vs individual identity) | TODO | `auth.account-switch` | | |
| ACC-08 | Account deletion | TODO | `auth.delete-account` | | |
| GRP-01 | Groups and subgroups | TODO | `groups.crud` | | |
| GRP-02 | Hierarchy limit 5/5/5 | TODO | `groups.crud` | | PRD open question 5 |
| GRP-03 | Flights (disposable group type) | TODO | `groups.flights` | | PRD open questions 1, 12 |
| GRP-04 | Flight auto-hide | TODO | `groups.flights` | | PRD open question 1 |
| GRP-05 | Member and per-user group limits | TODO | `groups.crud`, `config.limits` | | PRD open question 4 |
| GRP-06 | Join-by-link (teams) | TODO | `groups.join-link` | | |
| GRP-07 | App-store fallback | TODO | `groups.join-link` | | |
| GRP-08 | Teams created manually | TODO | `groups.crud` | | |
| GRP-09 | Only admin can delete a team | TODO | `groups.crud` | | |
| GRP-10 | Delete group with instant undo (configurable window) | TODO | `groups.crud`, `config.limits` | | |
| GRP-11 | Archive groups or chats | TODO | `groups.crud` | | |
| ROL-01 | Admin adds members or sends join link | TODO | `members.invite` | | PRD open question 7 |
| ROL-02 | Members can invite non-members | TODO | `members.invite` | | PRD open question 7 |
| ROL-03 | Members can be blocked | TODO | `roles.permissions` | | |
| ROL-04 | User title tags | TODO | `roles.title-tags` | | PRD open question 2 |
| ROL-05 | Leave group, option 1 (keep, stop messages) | TODO | `roles.permissions` | | |
| ROL-06 | Leave group, option 2 (leave and delete for self) | TODO | `roles.permissions` | | |
| CHT-01 | 1-to-1 chat | TODO | `chat.messages`, `chat.send-message` | | |
| CHT-02 | Group chat | TODO | `chat.messages`, `chat.send-message` | | |
| CHT-03 | General chat (public announcements) | TODO | `chat.messages`, `chat.send-message` | | |
| CHT-04 | Sub-group chat | TODO | `chat.messages`, `chat.send-message` | | |
| CHT-05 | Delete own messages, private chats only | TODO | `chat.delete-message` | | |
| SRC-01 | Search members by name | TODO | `search.query` | | |
| SRC-02 | Search chats for a word | TODO | `search.query` | | |
| SRC-03 | Search document names | TODO | `search.query` | | |
| SRC-04 | Filters: date, group, document type | TODO | `search.query` | | |
| MED-01 | Images to individuals | TODO | `media.upload` | | |
| MED-02 | Images to groups | TODO | `media.upload` | | |
| MED-03 | Images to sub-groups | TODO | `media.upload` | | |
| MED-04 | Library tab (media per team) | TODO | `media.library` | | |
| MED-05 | Media download setting | TODO | `media.download-policy` | | |
| CLL-01 | 1-to-1 audio calls | TODO | `calls.service` | | |
| CLL-02 | Group and sub-group audio calls (max 5) | TODO | `calls.service` | | |
| CLL-03 | 1-to-1 video calls | TODO | `calls.service` | | |
| CLL-04 | Group and sub-group video calls (max 5) | TODO | `calls.service` | | |
| CLL-05 | Daily call cap, 1 h/user/day | TODO | `calls.service`, `config.limits` | | |
| CAL-01 | Built-in calendar | TODO | `calendar.events` | | |
| CAL-02 | Admin assigns calendar to users | TODO | `calendar.events` | | |
| NTF-01 | In-app banner (update logs, what's new) | TODO | `notifications.in-app-banner` | | |
| NTF-02 | Chat and group chat notifications | TODO | `notifications.push` | | |
| NTF-03 | Push banner opens release/update/offers page | TODO | `notifications.push` | | |
| DEV-01 | App in suggested contact means on device | TODO | `device.contacts` | | |
| DEV-02 | See people from device contacts | TODO | `device.contacts` | | |
| DEV-03 | Email icon opens native mail app | TODO | `device.share-mail` | | |
| DEV-04 | App in native share sheet | TODO | `device.share-mail` | | |
| PRF-01 | Profile editing | TODO | `profile.edit` | | |
| DAT-01 | Backups for chat transfers | TODO | `data.backup` | | |
| DAT-02 | Attachment retention (6 d / 15 d) | TODO | `data.retention` | | |
| DAT-03 | Opened media cached locally | TODO | `media.download-policy` | | |
| DAT-04 | Archived chat retention (configurable) | TODO | `data.retention` | | |
| MON-01 | Ads for free users | TODO | `monetization.ads` | | |
| MON-02 | Ads in private chats outside the organization | TODO | `monetization.ads` | | PRD open question 6 |
| MON-03 | Paid additions (members > 300, extra groups) | TODO | `monetization.purchases` | | |
| MON-04 | RevenueCat integration | TODO | `monetization.purchases` | | |
| NFR-01 | Realtime by default | TODO | `chat.messages` | | |
| NFR-02 | Load tolerance | TODO | | | PRD open question 8 (no numbers) |
| NFR-03 | Notifications live at launch | TODO | `notifications.push` | | |
| NFR-04 | Permission handling for all features | TODO | `permissions.runtime` | | |
| DEP-01 | Zeego Cloud (calls) | TODO | `calls.service` | | Already owned |
| DEP-02 | Hostinger | TODO | | | Already owned |
| DEP-03 | Apple developer account | TODO | | | New account needed |
| DEP-04 | Google account (Play Store) | TODO | | | New account needed |
| DEP-05 | Tech stack may change | TODO | | | See `docs/decisions/` |

## Session log (latest first)

- 2026-10-16: Bootstrap (KICKOFF step 1). Flutter 3.47.7 project (android, ios, web), Riverpod + go_router provisional, `AppConfig` with PRD limits, `USE_MOCKS` switch and debug scenario switcher. Placeholder bundle id `com.teameasy.team_easy` (to confirm). Design tokens next: palette received, light theme only, no Arabic/RTL for now. Blocked: GitHub Actions to Vercel preview needs the Vercel secrets (PIPELINE Phase 1).

## Known issues and tech debt

_None yet._

## Blocked on decisions

See `docs/decisions/README.md` and the PRD "Open questions".
