# PROGRESS

Claude Code updates this file at the end of every session. One row per PRD requirement ID.

**Status key:** `TODO` not started · `UI` screens built on mocks · `WIRED` real backend connected · `DONE` wired, tested, reviewed.
**Wire ID** links to the registry in `docs/WIRING.md`.

## Foundations

| Item | Status | Notes |
|---|---|---|
| Engineer sign-off: client framework and architecture decisions | TODO | See `docs/decisions/README.md` and `0001-pwa-test-harness.md` |
| A/B testing: experiments, events, results page | UI | `docs/AB_TESTING.md`. Database not created yet (needs a new Supabase project) |
| Repo, lint, tests (PWA) | UI | Vite + React + TypeScript, oxlint, vitest. No CI workflow on GitHub yet; Vercel builds every push. Flutter attempt archived on `flutter-archive`. |
| Design system: tokens, theme, base components | UI | Approved. Tokens in `src/styles/tokens.css`, components in `src/design`. See `docs/DESIGN.md` |
| Mock infrastructure: typed contract, mock API, scenario switch, seed data | UI | `src/data`. Review tools in the app (bug icon) |
| Pipeline: web preview (Vercel) | UI | Vercel builds every push. Production branch is currently `claude/sharp-dijkstra-t3j0x6`; no `main` yet. Login protection is on |
| Pipeline: Android / iOS native builds | TODO | Archived with the Flutter attempt (`flutter-archive`). Not needed for the PWA |

## Requirements

| ID | Requirement | Status | Wire ID | PR | Notes |
|---|---|---|---|---|---|
| ACC-01 | Custom signup flow | UI | `auth.session` | | |
| ACC-02 | Signup path 1: individual | UI | `auth.session` | | |
| ACC-03 | Signup path 2: optionally attach to an organization | UI | `auth.session` | | |
| ACC-04 | Signup path 3: invited by an organization | UI | `auth.session` | | |
| ACC-05 | Joining an organization requires an admin-panel invite | UI | `members.invite` | | |
| ACC-06 | Org invite does not block individual use | UI | `auth.session` | | |
| ACC-07 | Account switching (org vs individual identity) | UI | `auth.account-switch` | | |
| ACC-08 | Account deletion | UI | `auth.delete-account` | | |
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
| CHT-01 | 1-to-1 chat | UI | `chat.messages`, `chat.send-message` | | |
| CHT-02 | Group chat | UI | `chat.messages`, `chat.send-message` | | |
| CHT-03 | General chat (public announcements) | UI | `chat.messages`, `chat.send-message` | | |
| CHT-04 | Sub-group chat | UI | `chat.messages`, `chat.send-message` | | |
| CHT-05 | Delete own messages, private chats only | UI | `chat.delete-message` | | |
| SRC-01 | Search members by name | UI | `search.members` | | |
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
| NFR-01 | Realtime by default | UI | `chat.messages` | | |
| NFR-02 | Load tolerance | TODO | | | PRD open question 8 (no numbers) |
| NFR-03 | Notifications live at launch | TODO | `notifications.push` | | |
| NFR-04 | Permission handling for all features | TODO | `permissions.runtime` | | |
| DEP-01 | Zeego Cloud (calls) | TODO | `calls.service` | | Already owned |
| DEP-02 | Hostinger | TODO | | | Already owned |
| DEP-03 | Apple developer account | TODO | | | New account needed |
| DEP-04 | Google account (Play Store) | TODO | | | New account needed |
| DEP-05 | Tech stack may change | TODO | | | See `docs/decisions/` |

## Session log (latest first)

- 2026-10-28: Brought back the iOS-style floating glass pill tab bar, removed the app name from the chat list, moved New chat to a round button beside search, review tools moved to a thin edge tab.
- 2026-10-28: Restyled the messaging layout like WhatsApp on the same design system: flat chat rows with ticks, wallpaper conversation with tailed bubbles and in-bubble time, WhatsApp Web style desktop. Experiment `conversation` variant A is now time inside every bubble. Fixed the desktop page scrolling when a conversation opens.
- 2026-10-28: Redesigned the design system in Material 3 Expressive (Google Chat and Meet style): tonal color roles, rounded containers on a tinted background, spring motion, docked navigation bar with pill indicator and extended New chat button on phones, navigation rail on desktop. Also fixed old Flutter service worker caching on the live site.
- 2026-10-18: Switched the test harness from Flutter to a React PWA (Flutter archived on `flutter-archive`). Rebuilt onboarding ACC-01..08 and built chat list, conversation, new chat (CHT-01..05, SRC-01) with A/B experiments `chat_list` and `conversation`, results page, review tools. Blocked on: a new Supabase project for collecting A/B results (cost), real photo upload, SRC-02 message search. Next: designer picks the next area.
- 2026-10-17: Onboarding and signup (ACC-01..08) on mocks: welcome, sign in, forgot password, sign up (photo, job title, optional invite), invite link and code, signed-in account screen with identity switch, sign out, delete. Debug scenario control on every screen. Blocked on: PRD open question 14 (password reset, email verification), real invite deep links need wiring (`auth.org-invite`). Next: designer picks the next area.
- 2026-10-16: Bootstrap (KICKOFF step 1). Flutter 3.47.7 project (android, ios, web), Riverpod + go_router provisional, `AppConfig` with PRD limits, `USE_MOCKS` switch and debug scenario switcher. Placeholder bundle id `com.teameasy.team_easy` (to confirm). Design tokens next: palette received, light theme only, no Arabic/RTL for now. Blocked: GitHub Actions to Vercel preview needs the Vercel secrets (PIPELINE Phase 1).

## Known issues and tech debt

_None yet._

## Blocked on decisions

See `docs/decisions/README.md` and the PRD "Open questions".
