# DESIGN

Owner: the product designer. This is the source of truth for how TeamEasy looks and behaves. Claude Code reads it before any UI work.

Sections marked **[TO DEFINE]** are the designer's decisions; Claude Code must not invent them. Until defined, ask.

## 1. Principles

**[TO DEFINE]** 3-5 principles for TeamEasy (for example: speed over decoration, clarity in dense chat lists, calm under heavy use). Each principle gets one line on what it means for a screen.

## 2. Where design lives in code

- Tokens, theme and shared widgets: `lib/core/design_system/`.
- Screens and feature widgets: `lib/features/<feature>/presentation/`.
- Screens use design-system components and tokens only. No raw colors, sizes, radii or text styles.
- A new component goes into the design system first, then into screens.

## 3. Tokens

All tokens are Dart (`ThemeExtension`). Names are semantic (`surfaceDefault`, `textSecondary`), not raw values (`grey200`).

| Group | Contents | Status |
|---|---|---|
| Color | Brand, surface, text, border, status (success/warning/error/info), message bubble (sent/received), presence | **[TO DEFINE]** |
| Light / dark | Both themes from the start? | **[TO DEFINE]** |
| Typography | Font family, scale (display, title, body, label, caption), weights | **[TO DEFINE]** |
| Spacing | Scale (4-pt base proposed) | **[TO DEFINE]** |
| Radius | Small / medium / large / full | **[TO DEFINE]** |
| Elevation | Levels for cards, sheets, dialogs | **[TO DEFINE]** |
| Motion | Durations, curves, when to animate | **[TO DEFINE]** |
| Iconography | Icon set and sizes | **[TO DEFINE]** |

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
| Onboarding and signup (ACC-01..04) | **[TO DEFINE]** | |
| Account switching (ACC-07) | **[TO DEFINE]** | |
| Group tree and navigation (GRP-01, 02) | **[TO DEFINE]** | |
| Delete with undo (GRP-10) | **[TO DEFINE]** | |
| Leave group options (ROL-05, 06) | **[TO DEFINE]** | |
| Chat list and conversation | **[TO DEFINE]** | |
| Permission prompts (NFR-04) | **[TO DEFINE]** | |
| Ads placement (MON-02) | **[TO DEFINE]** | |

## 7. Accessibility and platform

- Touch targets at least 44×44 pt (iOS) / 48×48 dp (Android).
- Text contrast meets WCAG AA. Support dynamic type and bold text.
- Every interactive element has a semantic label.
- Respect reduce-motion.
- **Localization / RTL:** **[TO DEFINE]**. If Arabic is a target, build with directional widgets (`start`/`end`, `EdgeInsetsDirectional`) from day one.

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
