# DESIGN

Owner: the product designer. This is the source of truth for how TeamEasy looks and behaves. Claude Code reads it before any UI work.

Sections marked **[TO DEFINE]** are the designer's decisions; Claude Code must not invent them. Until defined, ask.

## 1. Principles

**[TO DEFINE]** 3-5 principles for TeamEasy (for example: speed over decoration, clarity in dense chat lists, calm under heavy use). Each principle gets one line on what it means for a screen.

## 2. Where design lives in code

- Tokens: `src/styles/tokens.css` (CSS variables, light theme only). Components: `src/design/`. Layout and component styles: `src/styles/`.
- Screens and feature widgets: `src/features/<area>/`.
- Screens use tokens and design components only. No raw colors, sizes, radii or text styles.
- A new component goes into `src/design` first, then into screens.

## 3. Design language: Material 3 Expressive

Google's current design language (the one Google Chat, Meet and Gmail are moving to), dressed in our brand. Decided 2026-10-28 by the designer, replacing the earlier iOS-style floating pill nav. The Flutter attempt used the older Material 3 default look, and the first PWA build used a custom iOS-style look; neither was Material 3 Expressive.

What we adopt, and where it lives (`src/styles/tokens.css`, `components.css`, `app.css`; components in `src/design/`):

| Principle | In this app |
|---|---|
| Tonal color roles | `primary`, `primary-container`, `secondary-container`, `tertiary-container`, status containers, five surface tiers. Hierarchy comes from tone, not outlines or shadows |
| Containers on a tinted background | App background `surface-container`; lists and conversations sit in white rounded containers (28px) |
| Bigger, varied shapes | Shape scale 4 / 8 / 12 / 16 / 28 / full. Buttons are pills and morph to a squarer shape while pressed. People are circles, groups are squircles. FAB is a rounded square |
| Emphasized type | Poppins (brand font). Weight 600 for emphasis, no extra size. Scale: 32, 28, 22, 16 titles; 16, 14, 12 body |
| Spring motion | Spatial springs (move, can overshoot) and effects springs (fade, recolor, no overshoot) as CSS `linear()` curves, stiffness and damping from the Material 3 Expressive tokens. Reduced motion turns them off |
| Navigation | Phones: compact docked navigation bar (60px plus the safe area) with a pill indicator, plus an extended "New chat" button. Desktop 1024+: navigation rail with a round-square action button |
| Components | Tonal and filled buttons, outlined fields, search as a pill, filter chips with a check, tonal banners, bottom sheets with 28px corners, a morphing shape loading indicator |

Color source: brand palette primary `#1F62A3`, accent `#2BACE2`, navy text `#0D142E`, highlight `#F6F3DD`. Containers, surfaces and status colors are derived or proposed. Light theme only.

Still to decide: typeface. Material 3 Expressive uses Roboto Flex or Google Sans; we keep Poppins for brand continuity. Dynamic color and dark theme are out of scope.

Limits of this section: written from public coverage of Material 3 Expressive and its rollout in Meet and Chat. The official spec at m3.material.io was not reachable from the build environment, so exact token values are close approximations.

## 3b. Platform standard

- Touch targets 48px (iOS 44pt minimum). Large flexible app bar that condenses on scroll. Back chevron on pushed screens. Bottom sheets for actions.
- Fluid layout checked at 360 to 440px, real layout swap at 1024px: navigation rail, list and conversation in two containers.
- Only screens that exist appear in navigation.
- Home screen icon: opaque 180x180 PNG at `/apple-touch-icon.png`. After changing it, clear Safari website data before re-adding.

## 4. Components to build (checklist)

Foundations: button (primary, secondary, tertiary, destructive, loading, disabled) · text field · search field · avatar (with presence, group, fallback initials) · badge/unread count · chip/tag · title tag (ROL-04) · divider · list tile · empty state · error state with retry · skeleton loader · snackbar with undo (GRP-10) · dialog · bottom sheet · tab bar · app bar.

Messaging: chat list item · message bubble (text, image, system) with states (sending, sent, failed, deleted) · composer · image viewer · date separator · typing/presence indicator · media library grid.

Groups: group tree item with nesting up to three levels (GRP-02) · member list item with role/tag · member counter vs cap (admin, §16) · join-link share sheet · flight card (GRP-03/04, once defined).

Calls: incoming call screen · in-call screen (audio, video, up to 5 participants) · daily-cap reached state (CLL-05).

Other: permission rationale prompt (NFR-04) · ad slot (MON-01/02) · in-app banner (NTF-01) · calendar views (CAL-01) · account switcher (ACC-07) · download-setting selector (MED-05).

## 5. Screen state matrix

Every screen ships these states. A screen is not done until all apply:

`loading` · `empty` · `error` (with retry) · `offline` · `success` · plus for messaging `sending` · `failed`.

Mocks provide each state through the debug scenario switch (`normal`, `empty`, `error`, `slow`, `offline`).

## 6. Flows and UX patterns

Flows are specified per area in `docs/PRD.md` (IDs). Record design decisions per flow here as they are made.

| Area | Decisions | Status |
|---|---|---|
| Onboarding and signup (ACC-01..04) | Welcome screen with three paths: Create account, Sign in, "I have an organization invite". Sign-in is email + password with Forgot password. Signup asks name, email, password, optional photo, optional job title, and an optional invite code (collapsed behind "I have an organization invite"). Invite link `/invite/<token>` shows the organization and who invited the user, then continues to signup with the organization attached. Invalid, expired and offline invites each have their own state. **Assumed:** password rules (8+, letter and number), job title is optional and feeds the title tag (ROL-04), a signed-in user opening an invite link is sent home, existing users cannot accept an invite yet. | Built on mocks, awaiting review |
| Account switching (ACC-07) | Placeholder on the signed-in screen: "Using Team Easy as" with Myself / organization name. Final placement is open. | Placeholder |
| Group tree and navigation (GRP-01, 02) | **[TO DEFINE]** | |
| Delete with undo (GRP-10) | **[TO DEFINE]** | |
| Leave group options (ROL-05, 06) | **[TO DEFINE]** | |
| Chat list and conversation (CHT-01..05) | Two A/B experiments (see `docs/AB_TESTING.md`). **Chat list** A: plain list, newest first, two-line preview. B: filter chips (All, Unread, Groups, Direct) and a pinned announcements card, one-line preview. **Conversation** A: a time under every message. B: consecutive messages grouped, time on tap. Both: day separators, sent and received bubbles, sending and failed states with retry, delete own message in private chats only (long-press or right-click), new chat by searching members. **Assumed:** the announcements chat allows posting; search covers chat names and last message only (SRC-02 message search not built). | Built on mocks, testing |
| Permission prompts (NFR-04) | **[TO DEFINE]** | |
| Ads placement (MON-02) | **[TO DEFINE]** | |

## 7. Accessibility and platform

- Touch targets at least 44×44 pt (iOS) / 48×48 dp (Android).
- Text contrast meets WCAG AA. Support dynamic type and bold text.
- Every interactive element has a semantic label.
- Respect reduce-motion.
- **Localization / RTL:** English only for now (Arabic not a target yet). Still prefer directional widgets (`start`/`end`, `EdgeInsetsDirectional`) so RTL stays cheap later.

## 8. Avoid the generic AI look

Claude Code defaults to a recognizable template look. Do not:
- Use default Material blue, purple gradients, or glassmorphism unless the tokens say so.
- Center everything, stack identical rounded cards, or add decorative icons to every row.
- Use placeholder-looking copy ("Lorem ipsum", "Welcome back!").
- Add motion that does not explain something.

Do:
- Use tokens strictly and let density follow the content (chat is dense; settings are calm).
- Write real, specific microcopy.
- Design the hard states (empty, failed, offline) as carefully as the happy path.

## 9. Mock data quality

Mock data is part of the design. Use varied names and lengths, very long names and messages, missing avatars, emoji, links, large groups (300 members), deep hierarchy (5/5/5), unread counts in the hundreds, and (if confirmed) Arabic and English mixed.
