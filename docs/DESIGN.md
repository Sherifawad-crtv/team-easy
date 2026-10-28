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

## 3. Design language: WhatsApp layout on our design system

Decided 2026-10-28 by the designer. The layout and behavior of a messaging app people already know (WhatsApp), built from our own tokens and components (Material 3 Expressive tonal colors, shapes and spring motion, brand palette, Poppins, T logo). Brand blue stands where WhatsApp uses green, so it reads as ours. Light theme only.

| Area | What we do |
|---|---|
| Chat list | Flat, full-width rows with no cards or dividers. 56px circle avatars (groups are circles too), name, one-line preview, time at the right (brand blue when unread), unread count badge. Delivery ticks before the preview when my message was last. Sub-group rows show "in <parent>" |
| Top of the chat list | No app name. One row: search as a pill and a round new-chat button. Filter chips as pills below it (variant B) |
| Phone navigation | The iOS-style floating glass pill with the tabs, centered and set low, close to the bottom edge; lists scroll under it. No floating action button. Only screens that exist are listed |
| Desktop (1024+) | Like WhatsApp Web: narrow rail, chat list column (same search and new-chat row), conversation filling the rest. Hairlines, no floating containers |
| Conversation | Patterned wallpaper in a brand tint. White header with avatar, name and status. Day pills in capitals |
| Bubbles | Incoming white, outgoing light brand blue. Small tail on the first bubble of a run. Time and double-tick inside the bubble, bottom right. Group sender names in a color per person. A failed message shows a red outline and "Not sent. Tap to retry" |
| Composer | White pill field over the wallpaper and a round send button |
| Motion | Spring curves from Material 3 Expressive, off for reduced motion. Buttons squarer while pressed |

What is deliberately not here: voice and video call buttons, camera, attachments, emoji, voice notes, status/updates and communities tabs. Those features are not built, and we do not draw stubs.

Tokens: `src/styles/tokens.css`. Color: primary `#1F62A3`, accent `#2BACE2`, navy text `#0D142E`, highlight `#F6F3DD`; container, surface, wallpaper and status colors are derived or proposed. Typeface: Poppins.

Limits: written from familiarity with WhatsApp's public UI. Exact WhatsApp pixel values are not copied and are not a goal.

## 3b. Platform standard

- Touch targets 48px (iOS 44pt minimum). Large flexible app bar that condenses on scroll. Back chevron on pushed screens. Bottom sheets for actions.
- Fluid layout checked at 360 to 440px, real layout swap at 1024px: navigation rail, list and conversation in two containers.
- Only screens that exist appear in navigation.
- Icons: only the Solar icon set (480 Design, CC BY 4.0, `@solar-icons/react`, Linear style). Every icon is exported from `src/design/icons.tsx` under an `Icon…` name; to change one, change it there. Do not draw icons by hand. Credit: icons by 480 Design (Solar), CC BY 4.0.
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
| Account switching (ACC-07) | Placeholder on the signed-in screen: "Chat as" with Myself / organization name. Final placement is open. | Placeholder |
| Group tree and navigation (GRP-01, 02, 05, 08) | A **Groups** tab. A/B `group_nav`: A is a nested tree you open level by level, B is one flat list with the path under each name and a find field. Both: unread badges, an Archived section, "You're in 8 of 12 groups" line. A group page shows its chat button, invite link, sub-groups, members and, for admins, the member limit meter (counted across the main group and its sub-groups). A parent that is full disables Add and says why. Admins create groups and sub-groups; the round plus button creates a main group. **Assumed:** 5/5/5 is per parent, archived groups do not count toward it, per-user limit 12, only admins create groups. | Built on mocks, testing |
| Delete with undo (GRP-09, 10, 11) | Admin only. A confirm sheet says what goes with it, then a bar at the bottom reads "deleted" with Undo and a countdown for the undo window (8 seconds assumed, a database value in production). Archive is separate, reversible, and sends the group and its sub-groups to Archived. | Built on mocks, awaiting review |
| Leave group options (ROL-05, 06) | Sheet with two choices: leave and keep it in my list (read only, composer replaced by a note, no new messages) or leave and delete it for me. | Built on mocks, awaiting review |
| Invites, blocking and title tags (ROL-01..04) | Admins add people from a searchable checklist (stops at the member cap with a clear message) or share a link; members can share the link too. A join link opens a page showing the group, its path and who invited; signed-out people sign in or sign up and return to it. Admins block or unblock from the member menu (blocked people stay listed with a Blocked tag). Title tags are short free text set by an admin, shown in member lists and next to the sender's name in group chats. **Assumed:** no approval for member invites, block means cannot post or receive, tags carry no permissions. | Built on mocks, awaiting review |
| Chat list and conversation (CHT-01..05) | Two A/B experiments (see `docs/AB_TESTING.md`). **Chat list** A: plain list, newest first. B: filter chips (All, Unread, Groups, Direct) and a pinned announcements card. **Conversation** A: time and ticks inside every bubble. B: consecutive messages with squarer joins, time on tap. Both: day separators, sent and received bubbles, sending and failed states with retry, delete own message in private chats only (long-press or right-click), new chat by searching members. **Assumed:** the announcements chat allows posting; search from the list covers chats, message text and document names (SRC-02..04). | Built on mocks, testing |
| Attachments (MED-01..03) | Attach button opens a sheet: choose, then preview with optional caption, then send. Images show as thumbnails (caption-less ones fill the bubble); documents show as a row with icon, name, size and Open. Tap an image for the full-screen viewer. Files over the size limit are refused with a plain message. Failed sends keep the file and offer retry. **Assumed:** 25 MB limit, documents allowed. | Built on mocks, awaiting review |
| Download setting (MED-05, DAT-03) | Account: Always / Wi-Fi only (default) / Never. On mobile data with Wi-Fi only, received files show a tap-to-download tile with size; opened files stay cached on the device. Expired files show a short note. The review tools can switch connection type. | Built on mocks, awaiting review |
| Search (SRC-02..04) | One search field on the chat list. Results grouped: Chats, Messages, Documents, with matched words highlighted. Filter chips: date (any, today, week, month), chat, type (all, images, documents). Tapping a message opens the chat and highlights it. | Built on mocks, awaiting review |
| Profile edit (PRF-01) | Account, Edit profile: name, email, job title, photo (choose or remove). Save is disabled until something changes; success banner; email already in use shows an inline error. **Assumed:** job title is the only extra detail. | Built on mocks, awaiting review |
| Permission prompts (NFR-04) | Before the system asks, an own sheet explains why photos are needed. Allow continues to the system request; Not now returns. If denied, the same place shows how to turn it on in settings. Review tools can simulate Ask first / Denied. | Built on mocks, awaiting review |
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
