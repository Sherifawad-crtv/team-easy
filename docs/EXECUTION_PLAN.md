# Execution plan

Source: `docs/PRD.md` (agreed scope from `TeamEasy_PRD_Q4S_2.pdf`, 71 requirement IDs in 15 areas). Written 2026-10-28. Status lives in `docs/PROGRESS.md`; this file is the order of work.

## Where we are

15 of 71 requirements are built as screens on mock data. None are connected to a real backend.

| Area | IDs | Built on mocks | Notes |
|---|---|---|---|
| Accounts and onboarding (ACC) | 8 | 8 | Sign up, sign in, invites, identity switch, delete. Password reset assumed |
| Chats (CHT) | 5 | 5 | List, conversation, retry, delete own in private chats, new chat |
| Search (SRC) | 4 | 1 | Members by name only |
| Non-functional (NFR) | 4 | 1 | Realtime is simulated |
| Groups and teams (GRP) | 11 | 0 | |
| Roles and permissions (ROL) | 6 | 0 | |
| Media (MED) | 5 | 0 | |
| Calls (CLL) | 5 | 0 | |
| Calendar (CAL) | 2 | 0 | |
| Notifications (NTF) | 3 | 0 | |
| Device integrations (DEV) | 4 | 0 | |
| Profile (PRF) | 1 | 0 | |
| Data and storage (DAT) | 4 | 0 | |
| Monetization (MON) | 4 | 0 | |
| Dependencies (DEP) | 5 | 0 | Accounts and vendors, not screens |

## Three tracks

1. **Design track** (designer and Claude Code): build each area as real flows on mocks, test it with people and A/B variants, record decisions in `docs/DESIGN.md`.
2. **Engineering track** (3 engineers): production architecture and replacing mocks, using the contract in `src/data/api.ts` and the registry in `docs/WIRING.md`. Starts with the client framework decision (`docs/decisions/0001-pwa-test-harness.md`).
3. **Product track** (product owner): answer the PRD open questions that gate each phase.

Size key: S = a day or two of design-track work, M = about a week, L = more than a week. Sizes are relative, not dates.

## Design track: phases

Order is by value to the daily loop, then dependencies (groups come before group calls and per-team media), with areas that need no product answers first.

### Phase 0: unblock testing (now)

| Item | Why |
|---|---|
| Decide: make the preview public, or keep it private | Testers cannot open it behind the Vercel login |
| Create the A/B Supabase project (a third project on your free plan will likely cost money) | Without it, results stay on one device |
| Create `main` and `dev` branches, point Vercel production at `main` | Right now production is the working branch |
| Engineers acknowledge the client framework decision | Engineers should not build against an unconfirmed contract |

### Phase 1: messaging core, remaining pieces (size M)

| IDs | What gets built | Needs from product | A/B ideas |
|---|---|---|---|
| MED-01, 02, 03 | Send images in direct, group and sub-group chats, image viewer | none | Attach button placement |
| MED-05, DAT-03 | Download setting (auto, Wi-Fi only, manual), cached opened media | none | n/a |
| SRC-02, 03, 04 | Search chat text and document names, filters by date, group, type | document types for filters | Results layout |
| PRF-01 | Profile edit: name, email, photo, details | which "other essential details" | n/a |
| NFR-04 | Permission prompts with rationale (photos now, others as features arrive) | none | Prompt wording |
| Chat extras | Read receipts and typing indicator, if you want them | confirm they are in scope | n/a |

Exit: a tester can send an image, find a message, and edit their profile on mocks.

### Phase 2: groups, teams and roles (size L, the biggest block)

| IDs | What gets built | Needs from product |
|---|---|---|
| GRP-01, 02, 08 | Group tree up to 5 / 5 / 5, create team manually | Q5: is 5/5/5 per parent? |
| GRP-05, GRP-11 (limits in §16) | Member counter against 300 for admins, per-user group limit, archive groups and chats | Q4: per-user group limit value |
| GRP-06, 07 | Join by link, store fallback page | none |
| GRP-09, 10 | Admin-only team delete, delete with instant undo (configurable window) | undo window value |
| ROL-01, 02 | Admin adds members or sends links, members invite non-members | Q7: who may invite whom, approval needed? |
| ROL-03, 05, 06 | Block member, leave group (keep in list, or leave and delete for me) | Q3: confirm only admin and member roles |
| ROL-04 | User title tags | Q2: who assigns, free text or fixed set, where shown |
| GRP-03, 04 | Flights (disposable group) and auto-hide | Q1, Q12: waits for the product answer, not guessed |

Exit: build the whole group tree on mocks, test navigation with A/B (tree vs flat).

### Phase 3: calendar, notifications, data settings (size M)

| IDs | What gets built | Needs from product |
|---|---|---|
| CAL-01, 02 | Built-in calendar (views, event detail), calendar assigned by the admin | What a calendar contains: events, reminders, personal vs shared |
| NTF-01 | In-app banner (update logs, what's new) | Content source |
| NTF-02, 03 | Notification settings, push banner tap opens a release or offers page | Which events notify, grouping and mute |
| DAT-02, 04 | Retention notices in the UI (6 / 15 day unopened attachments, archived chat deletion) | Archived retention period value |
| DAT-01 | Settings entry for backing up and transferring chats | What "chat transfer" means to users |

### Phase 4: calls (size M for the UI, much more to make real)

| IDs | What gets built | Needs from product |
|---|---|---|
| CLL-01 to 04 | Call entry points, incoming call, in-call screen for audio and video, up to 5 people, group and sub-group calls | Q11: exact vendor and SDK name for "Zeego Cloud" |
| CLL-05 | Daily 1-hour cap: usage meter, cap reached state | Behavior when the cap hits mid-call |

The PWA can only show these screens with simulated calls. Real audio and video, native call UI and background ringing are engineering work on the native app.

### Phase 5: monetization (size S to M)

| IDs | What gets built | Needs from product |
|---|---|---|
| MON-01, 02 | Ad slots for free users | Q6: where ads appear, in which chats |
| MON-03, 04 | Upgrade flow past 300 members, extra groups and sub-groups, purchase screens | Pricing and plan structure, RevenueCat product names |

### Phase 6: admin web app (size L, not started)

The PRD's admin surface: issue invites (ACC-05, ROL-01), assign calendars (CAL-02), manage teams (GRP-08, 09), member counter (GRP-05). Needs the admin stack decision (open decision 4) before any build. May share this codebase.

## Engineering track (not testable in the PWA)

| Work | PRD IDs | Notes |
|---|---|---|
| Client framework and architecture decision | all | Open decisions 0 to 4 in `docs/decisions/` |
| Backend: auth, realtime chat, search, storage | ACC, CHT, SRC, MED, NFR-01 | Replace mocks wire by wire (`tool/list_wires.sh`) |
| Load targets and testing | NFR-02 | Q8: needs concurrent users, messages per second, launch scale |
| Push infrastructure live at launch | NFR-03, NTF-02, 03 | Native work on iOS and Android |
| Calls SDK integration and native call UI | CLL-01 to 05, DEP-01 | Cap and participant limits enforced on the server |
| Purchases | MON-03, 04 | RevenueCat |
| Device integrations | DEV-01 to 04 | Native only: contacts, share sheet, mail app |
| Data jobs | DAT-01, 02, 04 | Backups, retention deletion |
| Store accounts and vendors | DEP-02, 03, 04 | Hostinger, Apple Developer, Google account |

## Questions that gate the plan

| Question | Blocks | If unanswered I will assume (flagged) |
|---|---|---|
| Q5 5/5/5 per parent or total per level | Phase 2 tree | Per parent |
| Q4 per-user group limit | Phase 2 limits | No limit shown |
| Q3 only admin and member roles | Phase 2 roles | Yes, only those two |
| Q7 who may invite whom | Phase 2 invites | Admin invites directly; members share a link that the admin approves |
| Q2 title tags | Phase 2 | Free text, set by admin, shown in member lists |
| Q1, Q12 flights and limits | Phase 2 flights | Not built until answered |
| Q6 ad placement | Phase 5 | Not built until answered |
| Q11 vendor name | Phase 4 | Keep "Zeego Cloud" in docs only |
| Q8 load numbers | Engineering | n/a |
| Q10 report abuse | Store review | Add a simple report action in Phase 2 if you agree |
| Q9 Arabic and RTL | All UI | **Answered: no Arabic for now** |
| Q14 email verification, password reset | Onboarding | Password reset built, verification not |

## Risks

- **Mocks can mislead.** A flow that tests well on fake data may behave differently with real latency and rules. Keep the contract honest and re-test after wiring.
- **A/B on small groups.** With a handful of testers, results are hints, not winners.
- **PWA is not native.** Push, real calls, background behavior and device integrations cannot be judged here.
- **Scope creep from the harness.** Every feature shown must map to a PRD ID; anything else goes to Open questions.
- **Free-plan limits** on Supabase and Vercel may need upgrading as testing grows.

## Do next

1. Decide on the public preview and the Supabase project (Phase 0).
2. Answer Q5, Q4, Q3, Q7, Q2 so Phase 2 can start without assumptions, or approve the assumed defaults above.
3. Confirm the Phase 1 scope (including whether read receipts and typing indicators are in).
