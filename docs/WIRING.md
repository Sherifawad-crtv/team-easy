# WIRING: placeholders and how to replace them

> **PWA harness:** the contract is `src/data/api.ts`, the placeholder is `src/data/mock/`, and the one-file switch is `src/data/index.ts`. Where this file says `domain/`, `data/mock`, `data/remote` and `core/di`, read those. The Flutter version of these rules is on the `flutter-archive` branch.

The designer builds every screen against **placeholders** (mocks) so the full UI can be previewed without a backend. Engineers replace each placeholder with the real implementation. The UI should not change when they do.

**For engineers and their AI:** find open points with `tool/list_wires.sh`, or in the registry below. In Claude Code run `/wire <wire-id>`.

## The rule

Every dependency on something outside the UI (backend, realtime, push, calls, payments, ads, OS services, device data) is split into:

| Part | Location | Owner |
|---|---|---|
| Contract: abstract interface + plain Dart entities | `features/<f>/domain/` | Engineers (designer may draft, engineers approve) |
| Placeholder: `Mock<Name>` implementing the contract | `features/<f>/data/mock/` | Designer / Claude Code |
| Real implementation | `features/<f>/data/remote/` (or `local/`) | Engineers |
| Switch | `core/di/` (providers; `USE_MOCKS` flag) | Engineers |

The UI only sees the interface through a provider. Swapping mock for real is a change in `core/di/` plus the new implementation file. Zero UI edits.

## Marker format

Put this block at the top of **every Mock class** and at **its binding in `core/di/`**. The `WIRE:` tag is greppable.

```dart
// WIRE: chat.send-message
// Req: CHT-02 | Contract: ChatRepository.sendMessage | Mock: MockChatRepository
// Real: POST message, return server-confirmed Message, emit it on messagesStream, map errors to ChatFailure
// Server must enforce: sender permission, membership
```

Rules:
- ID format: `<area>.<kebab-name>`, lowercase. Every ID appears in the registry below inside backticks.
- `Real:` says what the real implementation must do in one or two lines (inputs, outputs, errors, streams).
- `Server must enforce:` lists rules the mock simulates only for demo purposes. Real enforcement belongs on the server, never only in the client.
- When a placeholder is replaced, the engineer deletes the marker, keeps the mock for tests and previews, and sets the registry status to `WIRED`.

## Mock behavior standards

Mocks exist so the designer can see every state. They must:
- Return realistic data: varied names, long text, long names, missing avatars, emoji, Arabic and English if localization is confirmed.
- Simulate latency (300-900 ms) and use deterministic seeds so screenshots are repeatable.
- Support scenarios via the debug scenario switch: `normal`, `empty`, `error`, `slow`, `offline`.
- Emit fake realtime events on streams (incoming messages, presence, call state changes).
- Respect the same limits as the product through `AppConfig` (300 members, 5/5/5, 5 call participants, 1h/day) for demo purposes.
- Never contain secrets, real endpoints or real user data.

## Registry

Status: `PLANNED` (contract not yet built) · `MOCKED` (UI runs on mock) · `WIRED` (real implementation live) · `DONE` (wired, tested, reviewed).
Claude Code keeps this table up to date whenever it adds or changes a placeholder.

| Wire ID | Req | Contract (interface) | What the real implementation must do | Server must enforce | Status |
|---|---|---|---|---|---|
| `auth.session` | ACC-01..04, ACC-06 | `AuthRepository` | Sign up (individual, with optional org attach, via invite) and sign in/out with email + password, session persistence | Identity, unique email, password rules, invite validity | MOCKED |
| `auth.account-switch` | ACC-07 | `AuthRepository.switchIdentity` | Switch between individual and organization identity; scope all data by active identity | Data isolation between identities | MOCKED |
| `auth.delete-account` | ACC-08 | `AuthRepository.deleteAccount` | Delete account and associated data per policy | Full deletion | MOCKED |
| `auth.org-invite` | ACC-03..05 | `AuthRepository.resolveInvite` | Resolve an admin-issued invite link or code to its organization; reject invalid or expired | Invite validity, expiry, single organization attach | MOCKED |
| `auth.password-reset` | ACC-01 (assumed) | `AuthRepository.requestPasswordReset` | Send a reset email; same response whether or not the address exists | Rate limiting, no account enumeration | MOCKED |
| `device.photo-picker` | ACC-01, PRF-01 | not in the PWA yet | Native photo/camera access. The PWA uses the browser file chooser behind the app's own permission prompt | n/a (client only) | PLANNED |
| `profile.edit` | PRF-01 | `ProfileRepository` | Read/update name, email, photo, details; photo upload | Validation, ownership | MOCKED |
| `groups.crud` | GRP-01, 02, 05, 08..11 | `GroupRepository` | Create/read/update groups, subgroups, teams; hierarchy 5/5/5; delete with undo window; archive | Hierarchy depth, member caps, admin-only team deletion | MOCKED |
| `groups.flights` | GRP-03, 04 | `FlightRepository` | Disposable group type with the relevant parties and progress of specified tasks; auto-hide after a custom-set duration (see PRD open questions) | Auto-hide timing, visibility | PLANNED |
| `groups.join-link` | GRP-06, 07 | `InviteLinkService` | Create/resolve join links; deep link opens app or store fallback | Link validity and expiry | MOCKED |
| `roles.permissions` | ROL-03, 05, 06 | `RoleRepository` | Block member, leave group (keep-in-list vs delete for the departing member only) | All permission checks | MOCKED |
| `roles.title-tags` | ROL-04 | `TitleTagRepository` | Assign and display user title tags (rules need confirming, see PRD open questions) | Who may assign | MOCKED |
| `members.invite` | ACC-05, ROL-01, ROL-02 | `MemberRepository` | Admin adds or links members; members invite non-members; org invites from admin panel | Who may invite | MOCKED |
| `chat.messages` | CHT-01..04, NFR-01 | `ChatApi.listConversations/listMessages/subscribe` | Realtime message streams for 1-to-1, group, general, sub-group; history paging | Membership, read access | MOCKED |
| `chat.send-message` | CHT-01..04 | `ChatApi.sendMessage` | Send, return server-confirmed message, reject on failure so the UI can retry | Sender permission | MOCKED |
| `chat.delete-message` | CHT-05 | `ChatApi.deleteMessage` | Sender deletes own message in private chats only | Private-chat-only rule | MOCKED |
| `search.members` | SRC-01 | `ChatApi.searchMembers` | Search members by name, scoped to what the user can see | Result scoping to user access | MOCKED |
| `search.query` | SRC-02..04 | `SearchRepository` | Search members, chat text, document names; filters by date, group, type | Result scoping to user access | MOCKED |
| `media.upload` | MED-01..03 | `MediaRepository.upload` | Upload images to individuals, groups, sub-groups | Size/type limits, access | MOCKED |
| `media.library` | MED-04 | `MediaRepository.library` | Per-team media listing | Access | PLANNED |
| `media.download-policy` | MED-05, DAT-03 | `MediaDownloadPolicy` | Auto / Wi-Fi only / manual download; local cache of opened media | n/a (client) | MOCKED |
| `calls.service` | CLL-01..05 | `CallService` | Zeego Cloud audio/video: 1-to-1 and group (max 5), call state stream, native call UI | 5-participant cap, 1h/day cap | PLANNED |
| `calendar.events` | CAL-01, CAL-02 | `CalendarRepository` | Built-in calendar; admin assigns calendars to users | Assignment rights | MOCKED |
| `notifications.push` | NTF-02, NTF-03, NFR-03 | `PushService` | APNs/FCM registration, chat/group pushes, banner deep link | Delivery rules | MOCKED |
| `notifications.in-app-banner` | NTF-01 | `InAppBannerRepository` | App-to-user in-app notifications: update logs, what's new | n/a | MOCKED |
| `device.contacts` | DEV-01, DEV-02 | `DeviceContactsService` | Read device contacts with permission; suggested contact entry | n/a (OS permission) | PLANNED |
| `device.share-mail` | DEV-03, DEV-04 | `DeviceActionsService` | Open native mail app, appear in native share sheet | n/a | PLANNED |
| `permissions.runtime` | NFR-04 | `PermissionService` | Request/check OS permissions per feature with rationale | n/a | MOCKED |
| `data.backup` | DAT-01 | `BackupService` | Backups for chat transfers | Storage, access | MOCKED |
| `data.retention` | DAT-02, DAT-04 | server job + `RetentionConfig` | Delete unopened attachments after 6d (standard) / 15d (business); delete archived chats after configured period | All deletion (server job) | MOCKED |
| `monetization.ads` | MON-01, MON-02 | `AdService` | Serve ads to free users per placement rules | Eligibility | PLANNED |
| `monetization.purchases` | MON-03, MON-04 | `PurchaseService` | RevenueCat: subscriptions and purchases for members beyond 300, extra groups and sub-groups | Entitlements | PLANNED |
| `config.limits` | Part B §16 | `AppConfigRepository` | Limits, quotas, undo window, retention values served from config/DB, not hardcoded | Source of truth | PLANNED |

## How an engineer (or their AI) wires a point

1. Read the registry row, the marker in the mock, and the interface in `domain/`.
2. Implement the interface in `data/remote/` (or `local/`). Map backend errors to the feature's `Failure` types. Expose realtime data as `Stream`.
3. Bind it in `core/di/` so `USE_MOCKS=false` uses the real one. Keep the mock bound for `USE_MOCKS=true` and for tests.
4. Enforce every item under "Server must enforce" server-side.
5. Add tests (repository against the contract, plus one widget test with the real binding if feasible).
6. Delete the `// WIRE:` marker, set status to `WIRED` here and in `docs/PROGRESS.md`.
7. If the contract itself must change, change it, update the mock to match, and tell the designer. UI changes caused by contract changes are a separate PR.

## How the designer's Claude adds a placeholder

1. Draft the interface in `domain/` using plain Dart entities (no backend types).
2. Build `Mock<Name>` in `data/mock/` meeting the standards above. Add the marker.
3. Bind it in `core/di/` behind `USE_MOCKS`.
4. Add or update the registry row and set `MOCKED`.
5. Run `tool/list_wires.sh` and confirm the new ID shows as registered.
