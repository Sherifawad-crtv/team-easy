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

Implemented in `lib/core/design_system/` (`te_theme.dart`, `tokens/`). Light theme only. Status: **PROPOSED, awaiting designer approval.** Live style guide: the app home screen (`design_preview_screen.dart`).

| Group | Contents | Status |
|---|---|---|
| Color | Brand `#3E88C8`, action `#1F62A3` (AA on white), accent `#2BACE2` / `#51C2E6`, text `#0D142E`, highlight `#F6F3DD`; surface/border tints derived from the palette; status colors (success, warning, error) proposed outside the palette | Proposed |
| Light / dark | Light only (decided) | Decided |
| Typography | Poppins (bundled). Display 40/32/28, headline 26/22/20, title 18/16/14, body 16/14/12, label 14/12/11 | Proposed |
| Spacing | 4-pt scale: 2, 4, 8, 12, 16, 20, 24, 32, 48. Screen gutter 16 | Proposed |
| Radius | 8 / 12 / 20 / full | Proposed |
| Elevation | none / low / mid / high, soft navy shadows | Proposed |
| Motion | 120 / 200 / 320 ms, ease-out cubic, zero when reduce-motion is on | Proposed |
| Iconography | Material icons for now | **[TO DEFINE]** |

Brand notes: the T logo is brighter (cyan to azure gradient) than the palette blues. Buttons and links use the darker `action` blue so white text passes contrast; `brand` is for large shapes only.

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
