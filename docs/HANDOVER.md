# Developer handover

**Start with the build guide:** [`handover/BUILD_GUIDE.md`](handover/BUILD_GUIDE.md) describes every screen, flow, rule, motion and state in plain language with screenshots, broken into phases per part. This file is the short technical companion.

The design is final. A/B testing is finished and removed, so the app in this repo is the shape engineers build against. Everything runs on a typed mock data layer; nothing talks to a real backend.

## Final design decisions

| Area | Decision |
|---|---|
| Chat list | Search pill and round new-chat button on top, filter chips (All, Unread, Groups, Direct), announcements chat pinned, one-line previews |
| Conversation | Time and ticks inside every message; the name in the top bar opens contact info (direct, announcements) or group info (groups) |
| Groups | Nested tree opened level by level; tapping a group goes straight to its chat, group info opens from the chat's top bar |
| Motion | Apple-style springs everywhere, haptics (setting, on by default), screen slides, edge-swipe back, draggable sheets, long-press message menu, swipe rows, pull to refresh. Reduce Motion becomes a short fade |
| Theme | Light only, English only, no RTL, brand palette with Poppins, Solar icons, floating pill tab bar on phones, side rail on desktop |

Details per screen: `docs/DESIGN.md`. Motion numbers and gestures: `docs/MOTION_PLAN.md`.

## Run it

```
npm install
npm run dev
npm run lint && npm run typecheck && npm test && npm run build
tool/list_wires.sh        # every open placeholder
```

## Where things live

| Path | What |
|---|---|
| `src/data/api.ts` | The contract. Types in `src/data/types.ts` mirror the backend |
| `src/data/mock/` | The placeholders (one per contract area). `src/data/index.ts` is the one-file switch to the real implementation |
| `src/features/<area>` | Screens. They only talk to `api.ts` |
| `src/design`, `src/styles` | Components, tokens, motion (`motion.css`, `springs.ts`), gestures and haptics |
| `src/state` | Session, data-fetching (`useAsync`, `useSubmit`), calls, install, settings |
| `src/analytics.ts` | `track(event, props)`, a placeholder (`analytics.events`) |
| `src/config/limits.ts` | Business limits (some now come from the server entity, see `GroupTree.limits`) |
| `src/debug` | Review tools: fake states and spring tuning. Not product code; only loaded with `?review`, drop from production builds |

## Speed on purpose

First load is kept small: Poppins is four 8 kB WOFF2 files (Latin only), the admin console and less-used screens are separate chunks that load on demand and are fetched quietly once the app is idle (`src/App.tsx`). Keep new screens lazy unless they are a tab root. On a throttled phone connection the first screen went from 2.7 s to 2.0 s and fonts from 5.1 s to 2.1 s.

Tab roots (chat list, groups, calendar) show the last loaded data at once and refresh quietly (`useAsync` with a cache key). Keep that behaviour when wiring a real backend: use a stale-while-revalidate cache, not a spinner on every tab visit. Mock latency is about 40% of its nominal value for the same reason; the `slow` state in the review tools shows the slow case.

## What to wire

Every placeholder has a `// WIRE:` marker and a row in `docs/WIRING.md` (about 30: auth, chat, media, search, groups, roles, calendar, notifications, data, calls, ads, purchases, admin, analytics). Replace a mock with the real implementation behind the same contract and the UI should not change. In Claude Code run `/wire <wire-id>`.

## States are covered on purpose

The review tools are hidden in the product. Open the app once with `?review` in the address (for example `/chats?review`) and a small tab appears on the right edge for that browser tab. They switch the whole app between `normal`, `empty`, `error`, `slow` and `offline`, deny photo, mic and camera access, force the install steps, fail the next purchase, start incoming calls, cap calling time, send a test push and flip between admin and member. Use them to check every real case when wiring; the mock behaviours show what the UI expects from the backend for each.

## Not built, and why

- Flights (GRP-03, GRP-04): waiting on product answers (PRD open questions).
- Store fallback for purchases (GRP-07): native only.
- Read receipts and typing indicators: scope not confirmed.
- Real calls, push, payments, ads, backup: placeholders only.

## Open items for product

PRD "Open questions" lists the assumptions made (attachments, groups, phase 3, calls, monetization, admin). Please confirm or correct them before wiring.

## Needs a real-device check

iPhone haptics (switch-input trick, iOS 17.4+), Safari edge-swipe conflicts, blur performance on older phones, and the spring feel (tune in the Motion lab and send the numbers back).
