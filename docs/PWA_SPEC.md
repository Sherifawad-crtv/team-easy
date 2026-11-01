# PWA build spec (one file for Claude Code)

Four parts: A. kickoff and rules, B. persona and function spec, C. UI and HIG spec, D. mock-data contract. Pipeline step: Claude Code builds the locked design (blueprint step 3), frontend first on a typed mock layer. Supabase (step 4) is only used for A/B events for now.

## A. Kickoff and rules

- Stack: React, TypeScript, Vite, React Router, plain CSS tokens. Ask before adding any heavy dependency.
- One shared data-fetching pattern (`useAsync`, `useSubmit`). Production-ready, typed, no dead code.
- Never build placeholder or stub screens or features. Only screens that work appear in the nav.
- Never change a stated spec unilaterally; flag deviations as a side note and in the PRD open questions.
- Money and anything computed is computed by the backend, never in the UI.
- Do not re-ask answered questions. Decisions so far: email + password sign-in, org invite by link or code, signup asks name, optional photo and job title, light theme only, English only, A/B on chat list and conversation, results in a separate Supabase project.
- One repo, one deploy, one URL. Pushes to the production branch go to production, other branches get previews.

## B. Persona and function spec

| Persona | Surface | Needs now |
|---|---|---|
| Individual | Mobile PWA | Sign up alone, chat 1-to-1 and in groups |
| Organization member | Mobile PWA | Join by invite link or code, switch between personal and organization identity |
| Admin | Web (prototype at `/admin` in this codebase) | Invites, members, teams, calendars. The production admin stack is still an engineer decision |

Flows built: welcome, sign up (3 paths), sign in, forgot password, invite link and code, chat list, conversation (send, retry failed, delete own message in private chats only), new chat by member search, account (identity switch, sign out, delete), A/B results.
Requirement IDs: ACC-01..08, CHT-01..05, SRC-01, NFR-01 (simulated realtime). See `docs/PROGRESS.md`.

## C. UI and HIG spec

Defined in `docs/DESIGN.md` sections 3 and 3b: tokens and components (Material 3 Expressive on our palette), the WhatsApp-style messaging layout, platform standard, states. Every screen: loading skeleton, empty, error with retry, offline, success; messaging adds sending and failed.

## D. Mock-data contract

`src/data/api.ts` (`AuthApi`, `ChatApi`) and `src/data/types.ts` are the contract. `src/data/mock/mockApi.ts` implements it with 450 ms latency, the five scenarios (`normal`, `empty`, `error`, `slow`, `offline`), seeded long names, emoji, links, 300-member and 214-unread conversations, a nested sub-group, and simulated incoming messages every 25 s. Demo credentials and invite codes are listed at the top of that file.
Going live: return a real implementation from `src/data/index.ts`. No screen changes.

## Adding the app to the home screen

The app is installable (manifest, icons, standalone display). How people add it depends on the browser, so the app works that out and shows the right steps (`src/state/install.ts`, `src/features/install/`):

| Browser | What happens |
|---|---|
| Chrome or Edge on Android | The browser's own install prompt, started from our button |
| Safari on iPhone | No prompt exists, so a three-step picture teaches Share, Add to Home Screen, Add, with a pointer to the Share button |
| Chrome, Edge or Firefox on iPhone | The same steps, mentioning the ⋯ menu and Safari as a fallback |
| A browser inside another app (Instagram, Facebook and so on) | Cannot install. We say to open the link in a browser and offer to copy it |
| Already on the home screen | Nothing is shown |

Where it appears: a dismissible card under the notice on the chat list (phones only, back after a week), and Account, Add to home screen. The review tools can show the steps for each browser. Limits: the iPhone steps cannot be automated, and the wording of Apple's Share menu changes between iOS versions.
