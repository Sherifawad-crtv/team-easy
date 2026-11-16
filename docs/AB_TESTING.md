# A/B testing

Four experiments run on the chat list, the conversation, group navigation and motion style. Each visitor is assigned a variant once, at random (50/50), and keeps it. Assignment is stored in the browser.

## Experiments

| Id | Screen | A | B | What we expect |
|---|---|---|---|---|
| `chat_list` | Chat list | Plain list, newest first | Filter chips (All, Unread, Groups, Direct) and a pinned announcements card | B gets people to their first chat faster when unread counts are high |
| `conversation` | Conversation | Time and ticks inside every bubble | Consecutive messages with squarer joins, time shown on tap | B feels calmer and more messages are sent per visitor |
| `group_nav` | Groups | Nested tree you open level by level | One flat list with the path under each name and a find field | B gets people to a group faster; A may feel more orderly for big organizations |
| `motion_style` | Whole app | Current springs (Material style) | Apple-style springs (Smooth, Snappy, Bouncy), instant press feedback and haptics (`docs/MOTION_PLAN.md`) | B feels more native and more responsive; watch time to first chat and messages per visitor, and read the feedback of testers |

Metrics per variant: visitors, chats opened per visitor, messages sent per visitor, average time from the list appearing to the first chat opened. For `group_nav` the metric is groups opened per visitor and time to the first group opened.

## Events

`exposure` (first time a visitor sees an experiment in a session), `chat_opened` (with `ms_since_list` and `first`), `group_opened` (with `level`, `ms_since_list` and `first`), `message_sent`, `message_failed`, `message_retried`, `message_deleted`, `new_chat_started`, `group_created`, `group_deleted`, `group_delete_undone`, `group_archived`, `group_left`, `group_joined`, `members_added`, `invite_link_copied`, `member_blocked`, `title_tag_set`, `signup_started`, `signup_completed`, `sign_in_completed`. Every event carries the visitor's variants for all experiments.

No names, emails or message text are ever sent.

## Reviewing a variant without polluting results

- Open a link with `?v_chat_list=B`, `?v_conversation=A`, `?v_group_nav=B` or `?v_motion_style=B`, or use the review tools (bug icon, top right).
- Sessions that force a variant are marked and left out of the results, in the app and in the database.

## Where results go

- **Without a database:** events stay on the device. The results page (`/results`) shows only what that device did.
- **With Supabase:** set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (Vercel project settings, or `.env.local` locally). Run `supabase/migrations/20261018000000_ab_events.sql` in a **new** project. The public key can only add events and read aggregates; raw rows cannot be read through the API.

Do not reuse the Nimble or Bizqwik projects.

## Reading results

Open `/results` (Account tab on phones, sidebar on desktop). With fewer than about 100 visitors per variant, treat differences as hints. Do not call a winner early.

## Adding an experiment

1. Add it to `EXPERIMENTS` in `src/experiments/experiments.ts`.
2. Use `useVariant('<id>')` in the screen and call `trackExposure('<id>')` once the screen is ready.
3. Add the id to `ab_summary()` and to `summarize()` if it needs a new metric, and update this file.
4. Add a test.

## Review panel (comparing A and B)

- A small pill at the top of every screen shows the experiment for that screen with an **A | B** switch. Flipping it keeps you on the same screen. Tap the name to move to the next experiment, the bug icon to open the full panel, × to hide it (it comes back from the edge tab).
- The full panel has three tabs:
  - **Compare**: one card per experiment with A/B, a plain description of each, things to try, "Open <screen>", and your choice (Prefer A / Prefer B / Not sure) with an optional note. Presets: All A, All B, Back to random. At the bottom, "Copy my choices" gives the text to send back.
  - **States**: data state, connection, permissions, install steps, purchases, calls, push, admin/member.
  - **Motion**: spring tuning lab.
- Choices are saved on the device (`te.verdicts`) and logged as a `verdict_set` event. Forcing a variant leaves the session out of the results.
