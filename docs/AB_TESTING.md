# A/B testing

Two experiments run on the chat list and the conversation. Each visitor is assigned a variant once, at random (50/50), and keeps it. Assignment is stored in the browser.

## Experiments

| Id | Screen | A | B | What we expect |
|---|---|---|---|---|
| `chat_list` | Chat list | Plain list, newest first | Filter chips (All, Unread, Groups, Direct) and a pinned announcements card | B gets people to their first chat faster when unread counts are high |
| `conversation` | Conversation | Time and ticks inside every bubble | Consecutive messages with squarer joins, time shown on tap | B feels calmer and more messages are sent per visitor |

Metrics per variant: visitors, chats opened per visitor, messages sent per visitor, average time from the list appearing to the first chat opened.

## Events

`exposure` (first time a visitor sees an experiment in a session), `chat_opened` (with `ms_since_list` and `first`), `message_sent`, `message_failed`, `message_retried`, `message_deleted`, `new_chat_started`, `signup_started`, `signup_completed`, `sign_in_completed`. Every event carries the visitor's variants for all experiments.

No names, emails or message text are ever sent.

## Reviewing a variant without polluting results

- Open a link with `?v_chat_list=B` or `?v_conversation=A`, or use the review tools (bug icon, top right).
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
