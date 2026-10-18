# 0001: Design test harness is a React PWA; Flutter attempt archived

- **Status:** Proposed by the designer, needs engineer acknowledgement
- **Date:** 2026-10-18
- **Deciders:** Designer (proposed). Engineers to confirm.

## Context

The designer needs real flows and A/B variants testable by real people now, while the engineers decide the production architecture (open decisions 1 to 4). A Flutter project was built first (onboarding, design system, Codemagic and Vercel pipelines). Testing it needed Xcode or Apple accounts for iPhones, and a Flutter build on every web preview.

## Decision

Build the test harness as a mobile-first React + TypeScript PWA on a typed mock data layer, deployed by Vercel on every push. Keep the Flutter work on the `flutter-archive` branch. The harness is for design validation. It is not the production client.

## Options considered

| Option | Pros | Cons |
|---|---|---|
| React PWA (chosen) | Opens on any phone by link, installs to the home screen, 2-minute deploys, no Apple account | Not native: no real push, call UI or background handling |
| Flutter (archived) | One codebase for iOS, Android and web, closer to a native build | iPhone testing needs Apple Developer account and TestFlight, slower preview, heavier toolchain for a designer |
| Expo / React Native | Native feel with a web target | Another toolchain to set up before any testing |

## Consequences

- The typed contract in `src/data/api.ts` and the PRD are what engineers should build against, whatever client they pick.
- Open decisions 1 (state management) and 2 (routing) are no longer Flutter-specific. Decision 4 (admin web) could share this codebase.
- Native-only requirements (push NTF-02/03, call UI CLL-*, device integrations DEV-*) cannot be verified in the PWA and stay PLANNED.
