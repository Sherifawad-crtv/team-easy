# PIPELINE: build and deploy

> **Current setup (PWA):** Claude Code pushes to GitHub, Vercel builds and deploys. Every push to a branch gets a preview link; the production branch gets the main URL. Vercel is connected to this repo and runs `npm run build` (output `dist/`). Vercel project settings: framework Vite, no custom build, install or output overrides (defaults). No secrets are needed for the mock build. For A/B results add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel project settings (see `docs/AB_TESTING.md`).
>
> Install to a phone: open the site in Safari or Chrome, then Share, Add to Home Screen. After changing the icon, clear Safari website data before re-adding.
>
> The rest of this file describes the **archived Flutter pipeline** (web, Android, iOS, Shorebird). The matching code is on the `flutter-archive` branch, including `codemagic.yaml`. Kept for reference if a native build is commissioned.

---

# PIPELINE: build and test distribution (Claude Code brief)

> Tell Claude Code: "Read docs/PIPELINE.md and set up the pipeline phase by phase. Stop and ask me only at the steps marked **[MANUAL]**."
> Track pipeline status in the Foundations table of `docs/PROGRESS.md`.

**TeamEasy note:** all preview builds run with `--dart-define=USE_MOCKS=true`, so the web preview shows the full UI on fake data (see `docs/WIRING.md`). Real realtime chat, calls (Zeego Cloud) and push only work on real devices once the engineers wire them, so Android/iOS test builds are where those get verified. The admin web app may be a separate stack (open decision in `docs/decisions/`), which would need its own preview deploy.

## Context

- The owner is a UI/UX designer who does NOT read or write code. Explain every problem and decision in plain language. No code dumps in explanations.
- Goal: the same "push and test" ease as the Expo flow (Claude Code → GitHub → Vercel/Expo), but for Flutter.
- Do not change the app's scope, design, or stack without flagging it first as a side note.

## The Pipeline (target state)

```
Claude Code → GitHub (push to main)
                 ├─► GitHub Actions: build Flutter web → Vercel  (shareable preview link)
                 ├─► Codemagic / GitHub Actions: build Android → Firebase App Distribution (tester install link)
                 └─► Codemagic: build iOS → TestFlight (iPhone testing)
Shorebird (optional): push small fixes to installed test builds without a new build
```

| Goal | Tool | Speed | Needs |
|---|---|---|---|
| Quick design/flow review | Flutter Web on Vercel | ~3-5 min | Vercel account |
| Real Android phone | Firebase App Distribution | ~5-15 min | Firebase project |
| Real iPhone | Codemagic → TestFlight | ~10-20 min | Apple Developer ($99/yr) |
| Instant fixes on installed builds | Shorebird | ~1-2 min | Shorebird account |

## Phase 0: Project Setup

1. Confirm Flutter is installed (`flutter doctor`). If not, **[MANUAL]**: tell the owner exactly what to install and wait.
2. Make sure the project builds locally: `flutter pub get`, `flutter analyze`, `flutter test`.
3. Create a `.gitignore` suitable for Flutter. Never commit keystores, `.env` files, `google-services.json` secrets, or Apple certificates.
4. Push to a GitHub repo. Use branches: `main` = stable, `dev` = daily work (previews on every push).
5. If the app uses Supabase: keep keys in environment variables (`--dart-define`), never hardcoded.

## Phase 1: Web Preview on Vercel (do this first)

Vercel does not ship with Flutter, so the build happens in GitHub Actions and the finished files are deployed to Vercel.

1. Create `.github/workflows/web-preview.yml`:
   - Trigger: push to `main` and `dev`, plus pull requests.
   - Steps: checkout → set up Flutter (stable channel, cached) → `flutter pub get` → `flutter build web --release` → deploy the `build/web` folder to Vercel with the Vercel CLI.
   - Use `main` → production URL, other branches → preview URL.
2. Add `vercel.json` in the project so page refreshes don't 404 (single-page app rewrite: send all routes to `/index.html`).
3. **[MANUAL]** Owner creates a Vercel project (empty/static) and gives Claude Code instructions to add these GitHub repo secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`. Walk the owner through where to find each one, click by click.
4. Push a test commit. Confirm the workflow goes green and the link opens.
5. Post the preview URL in the final summary.

Limits to tell the owner: web preview does not test camera, push notifications, haptics, or true native gestures.

## Phase 2: Android Testing via Firebase App Distribution

1. **[MANUAL]** Owner creates a Firebase project and adds an Android app (package name must match the Flutter app ID). Claude Code explains each click.
2. Generate an Android upload keystore. Store it safely and tell the owner to back it up. **Never commit it.** Convert it to base64 and store it as a GitHub secret.
3. Create `.github/workflows/android-test.yml`:
   - Trigger: push to `dev` (and manual run button).
   - Steps: checkout → set up Java + Flutter → restore keystore from secrets → `flutter build apk --release` (use APK for testers, simpler than AAB) → upload to Firebase App Distribution.
4. **[MANUAL]** Owner creates a Firebase service account / token and adds it as a GitHub secret. Owner creates a tester group in Firebase and adds tester emails.
5. Push a test commit. Confirm testers get the email/link and the app installs.

## Phase 3: iPhone Testing via Codemagic → TestFlight

iOS can only be built on Apple hardware, so use Codemagic (built for Flutter, free monthly build minutes).

1. **[MANUAL]** Owner enrolls in the Apple Developer Program ($99/yr) and creates the app in App Store Connect with the bundle ID matching the Flutter app.
2. **[MANUAL]** Owner connects the GitHub repo to Codemagic and creates an App Store Connect API key (Claude Code explains each step).
3. Create `codemagic.yaml` in the repo root:
   - Trigger: push to `main` (or a `release` branch) to avoid burning free minutes on every commit.
   - Steps: `flutter pub get` → automatic iOS code signing → `flutter build ipa --release` → publish to TestFlight.
4. Push. First build is usually the slowest and most likely to fail on signing. If it fails, read the Codemagic log, explain the cause in plain language, fix it, and retry.
5. **[MANUAL]** Owner adds testers in TestFlight (internal testers get builds immediately, no Apple review).

## Phase 4 (Optional): Shorebird for Instant Fixes

1. **[MANUAL]** Owner creates a Shorebird account.
2. Run `shorebird init` in the project. Update release builds to be created with `shorebird release`.
3. After that, small Dart-code fixes ship with `shorebird patch` and reach installed test builds without a new build or re-install.
4. Explain the limit: patches only cover Dart code. Native changes (new plugins, permissions, assets in native folders) still need a full new build.

## Working Rules for Claude Code

- **Order of work:** Phase 0 → 1 → 2 → 3 → 4. Don't start the next phase until the current one is verified working.
- **Verify before presenting:** run `flutter analyze` and `flutter test` before every push. Check that each pipeline ran green before telling the owner it works.
- **Secrets:** never print secrets or tokens in chat. Tell the owner the name of the secret to add and where.
- **Plain language:** when a build fails, say what broke, why, and what you did. One short paragraph, no code.
- **Don't burn build minutes:** don't trigger iOS builds for small changes. Use the web preview or Android for fast iteration.
- **Flag, don't change:** if something deviates from this plan (a package incompatible with web, a plugin that needs a native setup), flag it as a side note and wait for a decision.
- **Keep status in `docs/PROGRESS.md`:** what's done, what's waiting on the owner, and every preview/tester link.

## Daily Flow Once Set Up

1. Work on `dev` with Claude Code.
2. Push → web preview link is ready in a few minutes (design review).
3. Same push → Android build lands on tester phones via Firebase.
4. When ready for iPhone: merge to `main` → Codemagic ships to TestFlight.
5. Small fixes after that: `shorebird patch`.

## Final Deliverable From Claude Code

When done, report in plain language:
- Which phases are working (with links)
- What's still waiting on the owner
- Rough build times observed
- Any risks or limits noticed
