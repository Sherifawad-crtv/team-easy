# TeamEasy: Product Requirements (PRD)

**Source:** `TeamEasy_PRD_Q4S_2.pdf`, latest version received 17 Oct 2026 (document header still reads Q4S · v1.0 · 22 Sep 2026).
**Surfaces:** Native mobile app · Web admin app. **Status:** Agreed scope.
Each requirement has a unique ID used in design, code, commits, PRs and QA.

## Change log

Everything below the line "Agreed scope" is the PRD as received. Anything the team adds goes only in "Open questions" and this log; it never edits agreed scope.

| Date | Change |
|---|---|
| 22 Sep 2026 | v1.0 first received. |
| 17 Oct 2026 (design side) | Open question 13 answered by the designer: sign-in is email + password; org invite is a link that opens the app (GRP-07 store fallback applies). Added open question 14. Agreed scope unchanged. |
| 17 Oct 2026 | Newer PDF received (same header). Differences from the first copy: **added** GRP-03 Flights and GRP-04 Flight auto-hide; **removed** the Moderators requirement (permission levels) from Roles; **added** ROL-04 User title tags; NTF-01 renamed "Notifications center" → "In-app banner"; admin description no longer mentions moderators. **Group and role IDs renumbered**, see mapping below. |

### ID mapping, first copy → latest

| First copy | Latest |
|---|---|
| GRP-01, GRP-02 | GRP-01, GRP-02 (unchanged) |
| (new) | GRP-03 Flights, GRP-04 Flight auto-hide |
| GRP-03 | GRP-05 |
| GRP-04 | GRP-06 |
| GRP-05 | GRP-07 |
| GRP-06 | GRP-08 |
| GRP-07 | GRP-09 |
| GRP-08 | GRP-10 |
| GRP-09 | GRP-11 |
| ROL-01 Moderators | (removed) |
| ROL-02 | ROL-01 |
| ROL-03 | ROL-02 |
| ROL-04 | ROL-03 |
| (new) | ROL-04 User title tags |
| ROL-05, ROL-06 | ROL-05, ROL-06 (unchanged) |

---

# Agreed scope

## 01 Overview

TeamEasy is a team-management and messaging app. Users run their day-to-day communication (chats, calls and media) on a native mobile app, while organizations are administered through a web app. This document defines the agreed feature scope for the build.

**Problems to solve**
- No realtime functionality
- No proper UI
- No load tolerance
- No proper notification system

**Existing advantage**
- **Zeego Cloud** for voice and video calls: global coverage without requiring a VPN

## 02 Users & platforms

| User | Description | Surface |
|---|---|---|
| Individual | Signs up on their own; no organization required | Mobile app |
| Organization member | Joins an organization through an invite issued from the admin panel; can still use the app individually | Mobile app |
| Admin | Runs the organization: invites, calendars and teams | Web app |

# Part A: Functional requirements

## 03 Accounts & onboarding
- **ACC-01** Custom signup flow
- **ACC-02** **Signup path 1**: sign up as an individual
- **ACC-03** **Signup path 2**: sign up and optionally attach to an organization
- **ACC-04** **Signup path 3**: get invited by an organization
- **ACC-05** Joining an organization requires an invite issued from the admin panel
- **ACC-06** An organization invite does not restrict the user from also using the app individually
- **ACC-07** **Account switching**: separates organization identity from individual identity
- **ACC-08** Account deletion

## 04 Groups & teams
- **GRP-01** Groups and subgroups
- **GRP-02** **Hierarchy limit**: maximum 5 groups, 5 subgroups, 5 sub-subgroups
- **GRP-03** **Flights**: a separate, disposable group type containing the relevant parties and the progress of specified tasks
- **GRP-04** **Flight auto-hide**: flights are hidden automatically after a custom-set duration
- **GRP-05** Limited members per group and limited number of groups per user (see §16)
- **GRP-06** **Join-by-link**: for teams
- **GRP-07** **App-store fallback**: if the app isn't installed, the join link sends the user to the app store to download it and join
- **GRP-08** Teams created manually
- **GRP-09** Only the admin can delete a team
- **GRP-10** **Delete group**: with an instant undo right after deletion; undo window set as a configurable value in the database
- **GRP-11** Archive groups or chats

## 05 Roles & permissions
- **ROL-01** Admin adds members directly or sends a link to join
- **ROL-02** Members can send invites to non-members
- **ROL-03** Members can be blocked
- **ROL-04** User title tags
- **ROL-05** **Leave group, option 1**: keep the group in the list but stop receiving new messages
- **ROL-06** **Leave group, option 2**: leave and delete the group for the departing member only

## 06 Chats
- **CHT-01** 1-to-1 chat
- **CHT-02** Group chat
- **CHT-03** **General chat**: for public announcements
- **CHT-04** **Sub-group chat**: groups containing part of the main group
- **CHT-05** **Message deletion**: sender can delete their own messages in private chats only, not in group chats

## 07 Search
- **SRC-01** Search for members by name
- **SRC-02** Search chats for a word
- **SRC-03** Search document names
- **SRC-04** **Filters**: date, group, document type

## 08 Media
- **MED-01** Images sent to individuals
- **MED-02** Images sent to groups
- **MED-03** Images sent to sub-groups
- **MED-04** **Library tab**: teams with the media sent in each team
- **MED-05** **Media download setting**: auto-download, download on Wi-Fi only, or download manually when opening the chat

## 09 Audio & video calls
- **CLL-01** 1-to-1 audio calls
- **CLL-02** Group and sub-group audio calls, up to 5 people
- **CLL-03** 1-to-1 video calls
- **CLL-04** Group and sub-group video calls, up to 5 people
- **CLL-05** **Daily call cap**: 1 hour of calling per user per day, shared across audio and video

## 10 Calendar
- **CAL-01** **Built-in calendar**: a calendar built into the TeamEasy app
- **CAL-02** Admin assigns a calendar to users

## 11 Notifications
- **NTF-01** **In-app banner**: app-to-user notifications (update logs, what's new)
- **NTF-02** Chat and group chat notifications
- **NTF-03** **Push banner**: tapping it opens the new release, public update or offers page

## 12 Device integrations
- **DEV-01** App icon shown in the suggested means of contact on the device contacts page
- **DEV-02** See people from device contacts
- **DEV-03** Tapping an email icon redirects to the native mail app
- **DEV-04** App appears in the native share bottom sheet

## 13 Profile
- **PRF-01** **Profile editing**: name, email, photo and other essential details

## 14 Data & storage
- **DAT-01** Backups for chat transfers
- **DAT-02** **Attachment retention**: unopened attachments are deleted after 6 days for standard users and 15 days for business users
- **DAT-03** Opened images and videos are cached locally
- **DAT-04** **Archived chat retention**: archived chats are deleted automatically after a period set as a configurable value in the database

## 15 Monetization
- **MON-01** Ads shown to free users
- **MON-02** Ads appear in private chats only for groups outside the organization
- **MON-03** **Paid additions**: members beyond the 300 cap, and additional sub-groups and main groups
- **MON-04** **RevenueCat integration**: for in-app purchases and subscriptions

# Part B: Constraints & non-functional

## 16 Limits & quotas

| Limit | Value | Notes |
|---|---|---|
| Members per main group | 300 (free tier) | Counted across the main group and all of its sub-groups combined |
| Remaining-member counter | Visible to admin | Admin sees how much headroom is left against the cap |
| Adding members past the cap | Paid | Paid expansion of the 300-member cap |
| Group hierarchy | 5 / 5 / 5 | Groups, sub-groups, sub-sub-groups |
| Call duration | 1 hour / day | Total per user per day, across audio and video |
| Call participants | 5 people | Group and sub-group audio and video calls |

## 17 Non-functional requirements
- **NFR-01** **Realtime**: by default across the app
- **NFR-02** **Load tolerance**: the app must hold up under load
- **NFR-03** **Notifications at launch**: notification infrastructure must be live the moment the app is released
- **NFR-04** **Permissions**: proper permission handling for all app features

## 18 Dependencies & setup
- **DEP-01** **Zeego Cloud**: voice and video calls, already owned
- **DEP-02** **Hostinger**: already owned
- **DEP-03** **Apple developer account**: new account, required for App Store distribution
- **DEP-04** **Google account**: new account, required for Play Store distribution
- **DEP-05** **Tech stack**: may change later depending on what the app requires

---

# Open questions (not part of agreed scope)

Raised by the design/tooling side. None of these change the PRD. Each needs an answer from the product owner or engineers. Record answers here and in the change log.

| # | Question | Affects |
|---|---|---|
| 1 | **Flights (GRP-03/04):** who creates them, who can see them, what "progress of specified tasks" means (a task list? status per party?), and who sets the auto-hide duration (creator, admin, global)? Tasks are not a feature elsewhere in the PRD. | GRP-03, GRP-04 |
| 2 | **User title tags (ROL-04):** who assigns them, are they free text or a fixed set, where do they appear (profile, chat, member lists)? Do they carry permissions? | ROL-04 |
| 3 | **Moderators were removed.** Confirm there are no permission levels beyond admin and member. This changes the permissions model. | ROL-*, NFR-04 |
| 4 | **GRP-05:** "limited number of groups per user (see §16)" but §16 has no per-user group limit value. | GRP-05, §16 |
| 5 | **GRP-02:** is 5/5/5 per parent (5 groups, each with up to 5 sub-groups, each with up to 5 sub-sub-groups) or 5 total at each level? | GRP-01, GRP-02 |
| 6 | **MON-02:** wording is hard to read. Where exactly do ads appear (which chats, which users)? | MON-01, MON-02 |
| 7 | **ROL-01 vs ROL-02:** admin invites and member invites overlap with ACC-05. Confirm who can invite whom and whether member invites need approval. | ACC-05, ROL-01, ROL-02 |
| 8 | **NFR-02:** no numbers. Needed: concurrent users, messages per second, launch scale. | NFR-02 |
| 9 | **Languages / RTL:** is Arabic (RTL) a target? Affects the design system from day one. | All UI |
| 10 | **Moderation / report abuse:** not in scope, but app stores usually expect it for user-generated content. | Store review |
| 11 | **Vendor name:** PRD writes "Zeego Cloud". Confirm the exact vendor/product name and SDK. | DEP-01, CLL-* |
| 12 | **Flights vs groups in limits:** do flights count toward the 300-member cap and the 5/5/5 hierarchy? | GRP-03, GRP-05, §16 |
| 13 | **Sign-in method and verification:** the PRD defines three signup paths but not how users authenticate. **Answered by the designer: email + password.** Whether verification is required is still open (see 14). | ACC-01..04 |
| 14 | **Email + password side effects:** password reset and email verification are not in the PRD but are needed with email + password sign-in. Password reset is built as an assumed flow (`auth.password-reset`); email verification is not built. Confirm both, plus password rules (assumed: 8+ characters, a letter and a number). | ACC-01..04 |
