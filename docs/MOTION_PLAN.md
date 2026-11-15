# Motion and micro-interaction plan (Apple HIG direction)

Status: **M1 and M2 built inside the A/B test `motion_style`** (variant B = this plan, variant A = the old feel). M3 to M6 not started. Mobile only. Written 2026-11-02.

## How this was researched, and what is uncertain

- Apple's Human Interface Guidelines pages for Motion, Playing haptics and Gestures are rendered by script, so the page text could not be fetched. The points below come from what those pages are known to say, checked against secondary write-ups of Apple's WWDC18 talk "Designing Fluid Interfaces". Before anything ships as "per the HIG", the designer should read the three pages once:
  - https://developer.apple.com/design/human-interface-guidelines/motion
  - https://developer.apple.com/design/human-interface-guidelines/playing-haptics
  - https://developer.apple.com/design/human-interface-guidelines/gestures
- A summary of the WWDC talk: https://medium.com/@nathangitter/building-fluid-interfaces-ios-swift-9732bb934bf5 (could not be opened from this session, only seen in search results).
- This is a web app (PWA). It cannot do everything a native iPhone app can. Limits are listed at the end.

## What Apple asks for, in plain words

| Principle | What it means for us |
|---|---|
| **Motion has a purpose** | It shows where something came from, what changed, or that an action worked. No decoration. |
| **Respond at once** | Something happens in the same frame as the touch (a press state), before any animation starts. |
| **Follow the finger** | While dragging, the thing is attached to the finger one to one. It only animates after release. |
| **Interruptible and redirectable** | You can grab a moving sheet or screen and take it back. Nothing locks you out until an animation ends. |
| **Springs, not timers** | Movement is defined by how bouncy and how quick it is, and carries the speed of your release into the animation. Most things do not bounce at all. |
| **Rubber-band at the edges** | Past the end of a list or a sheet's limit, it resists and springs back. Never a hard stop. |
| **Restraint** | One clear motion per event. Celebrate rarely. Fast things stay fast. |
| **Reduce Motion** | When the setting is on, big movement turns into a quick fade. Never remove feedback, just make it still. |
| **Haptics confirm, never carry** | A tap on the phone that matches a visual change, always the same kind for the same event, never for every touch. Always paired with something you can see. |
| **Standard gestures keep their meaning** | Swipe from the left edge goes back. Swipe on a row gives actions. Long press opens a menu. Every gesture also has a visible button. |

## Where the app is now (audit)

- **Springs:** Material 3 Expressive spring tokens (`--spring-*`), already generated as real spring curves, with durations that go to zero under Reduce Motion. Good base, wrong feel: its fast spatial spring overshoots on almost everything.
- **Screens:** no push or pop transition. A new screen just fades in from 6 px below.
- **Tabs, sheets:** sheets slide up on a timer and can only be closed by Escape or a tap outside. No drag, no detents.
- **Gestures:** none. No swipe back, no swipe on rows, no pull to refresh. Long press exists only on own messages.
- **Press feedback:** a few buttons squash on press. Rows and cards have none.
- **Haptics:** none.
- **Micro-interactions that exist:** switch thumb stretch, call buttons morph, ringing pulse, message highlight pulse, snackbar countdown, skeleton shimmer.

## Motion language we will use

Three springs, named the way Apple's designers talk about them. Values are the starting point and get tuned on a real phone.

| Name | Used for | Feel |
|---|---|---|
| **Smooth** (no bounce) | Screens, sheets, list changes, fades, most things | Settles quickly, no overshoot |
| **Snappy** (a hint of bounce) | Taps, toggles, tab changes, buttons | Quick and alive |
| **Bouncy** | Rare moments: answering a call, purchase done, backup finished | Playful, used sparingly |

Rules that go with them: only move `transform` and `opacity`; every gesture hands its release speed to the spring; every animation can be interrupted; Reduce Motion swaps movement for a short fade.

## Phases

### Phase M1: foundations (small)
- Replace the spring tokens with the three above, keeping the names so nothing else breaks.
- Press states everywhere you can tap: instant dim or small scale, with no 300 ms tap delay.
- A single haptics helper with five named events (selection tick, light tap, success, warning, error), a "Haptics" switch in Account and a hard stop when Reduce Motion is on. Used first on tabs, switches, send, delete, call answer and end.
- Reduce Motion pass: every slide becomes a fade; bounce is removed.
- **Decision to make:** replace the current feel, or add it as an A/B test (`motion_style`: current springs vs Apple-style). The tokens are CSS variables, so the test costs very little.

### Phase M2: screen navigation (medium)
- Push and pop transitions between list and detail (chats, groups, settings): the new screen slides in from the right while the old one moves back a third of the way and dims.
- Swipe from the left edge to go back, following the finger, committing on distance or speed, cancelling by letting go, interruptible. The list stays mounted underneath so it can be revealed.
- Tab changes: a short cross-fade, no sliding.
- Large titles on Chats, Groups, Calendar and Account that shrink into the bar as you scroll.

### Phase M3: sheets and overlays (medium)
- Drag a sheet down to close, with the dimmed background following it, a rubber band when dragged up, and release speed deciding open or closed.
- Two heights (half and full) for the long sheets: new chat, add people, offers.
- Image viewer like Photos: drag down to close with the background fading, double tap to zoom, pinch to zoom.
- Call screen: drag down to minimize into the green bar, and the bar grows back when tapped.

### Phase M4: lists and messages (medium to large)
- Swipe actions on chat rows. Proposed: Mute and Mark as unread (single-chat archive is not built, so it is left out).
- Long press on a message opens a menu that lifts the bubble with a blur behind it (copy; delete for your own message in private chats).
- Pull to refresh with a rubber band on the chat list and calendar.
- New and removed rows animate (height collapses, neighbours slide), including the delete-with-undo of groups.
- Sending: your bubble rises from the composer into place; sent ticks change with a small pop; received messages slide in softly; the unread badge counts with a pop.

### Phase M5: small touches (medium)
- Segmented controls with a sliding highlight; tab bar icon bounce on select; checkboxes that draw their tick.
- Error shake on a wrong field; success marks that draw themselves for purchase, backup and profile saved.
- Skeletons that cross-fade into real content.
- Smooth composer growth; call controls that spring; the answer button with the one allowed bouncy moment.

### Phase M6: tune and test (small)
- Tune every spring on a real iPhone with the installed home-screen app.
- A durations table in `docs/DESIGN.md` so the next screen reuses the same motion.
- Automated checks that Reduce Motion removes movement, and that gestures have a visible button alternative.
- If the A/B test was chosen, read the first results.

Suggested order: M1, M2, M3, M4, M5, M6. M1 and M2 change how the whole app feels, so they come first.

## Limits of a web app

- **Haptics:** iPhone Safari does not allow the vibration API. The only known way is a trick with a hidden switch control that Safari 17.4 and later answers with a tap; it is not an official feature and needs real-device testing. Android phones allow simple vibration. Haptics are a bonus here, never the only feedback.
- **System gestures:** the browser's own back swipe can fight ours on the left edge. When installed to the home screen it is cleaner. This needs a real-phone check in M2.
- **Frame rate:** blur behind a lifted message or sheet is the costly part. It gets a plain-dim fallback on slower phones.
- **Large titles and rubber-banding** are our own code, so they will be close to native but not identical.

## Questions for the designer

1. Replace the current motion feel, or run it as an A/B test against the new one?
2. Haptics: try the iPhone trick, knowing it may stop working with a system update?
3. Chat row swipe actions: are Mute and Mark as unread the right two?
4. Should the Calls and admin screens get the same treatment, or only the main app flows?

## M1 as built

- Experiment `motion_style` (A: current springs, B: Apple-style). Open `?v_motion_style=B` or use the review tools to force one.
- B springs live in `src/styles/motion-ios.css`: Smooth (response 0.32, damping 1, about 410 ms), Snappy (response 0.26, damping 0.85, about 310 ms), Bouncy (response 0.5, damping 0.6, about 760 ms, not used on any screen yet). They replace the old spring variables, so every existing animation takes the new feel.
- B press feedback: rows highlight instantly, buttons shrink to 95% and dim, release springs back.
- Both variants: no tap delay on controls, and Reduce Motion now turns slides and grows into a 140 ms fade.
- Haptics (B only, with a Haptics switch in Account, off under Reduce Motion): tabs, switches, filter chips (selection); send, hang up (light); purchase, backup, answering a call (success); deleting a message or group (warning); failed send or payment (error). The unofficial iPhone trick is in, so it needs a real-phone check.

## M2 as built (variant B only)

- **List and detail** (chats, groups): on a phone the conversation or group page slides in from the right over the list. The list moves back by 28% and dims. Going back reverses it, and the page stays on screen until it has finished sliding out. The tab bar slides down and away while a conversation is open, and returns on the way out.
- **Swipe back:** start a touch within 28 px of the left edge and drag right. The page follows the finger one to one, the list moves and brightens with it. Letting go past a third of the width, or with a quick flick, goes back. Otherwise it springs open again. A thin invisible strip at the edge stops the browser from starting to scroll instead. Touch and pen only, never a mouse.
- **Other screens** (Account and each page under it, What's new, sign-in): the browser's own view transition slides the new page in and the old one back a little; Back reverses it. The tab bar stays still. Browsers without view transitions change the page at once, as before.
- **Tabs:** a quick cross-fade, no sliding.
- **Large titles:** pages with a title (Account, Calendar, Calls, Groups and so on) keep it large at the top, then it shrinks, the bar turns frosted and a hairline appears once you scroll.
- **Reduce Motion:** every slide becomes a 140 ms fade.
- **Not done yet:** the release speed of a swipe is used to decide go or stay, but the spring after release starts from rest rather than from your finger's speed. Chats has no large title, because the design starts with the search field.
- **Check on a real iPhone:** Safari and the home-screen app have their own left-edge back swipe, which may compete with ours. If it does, the first thing to try is moving our start strip a few pixels in.
