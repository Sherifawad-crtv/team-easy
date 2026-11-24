# Store compliance: App Store and Google Play

What the stores require of a messaging app like this one, where each requirement lives in the app, and what the engineers and product still have to do outside the screens. Rules change, so each section links to the store's own page. Verify them again before every submission.

**Status:** the screens and flows are built in the prototype on mock data. Legal text, real web addresses, moderation operations and the server side of every row are still to do (see `WIRING.md`, rows marked store compliance).

---

## 1. Apple App Store

Source: [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/).

| Requirement | What Apple asks | Where in the app | Still to do |
|---|---|---|---|
| **Account deletion** (5.1.1(v)) | Apps that let people create an account must let them start deleting it inside the app, and should delete the account record and its data, not just deactivate it ([guideline](https://developer.apple.com/help/app-review/guideline-reference/5-1-1-account-deletion/)). Active subscriptions should be mentioned | Account, Your account, Delete account. Asks for the password again, lists what happens, warns that add-ons are not cancelled, links to manage subscriptions | Real deletion on the server, for all copies. Decide retention and write it in the privacy policy |
| **User-generated content** (1.2) | A way to filter objectionable material from being posted, a way to report content with timely responses, the ability to block abusive users, and contact details | Report on a message (long press), on a person and on a group; Block and Unblock in contact info and in Privacy, Blocked contacts; Help, Contact us. Reports promise review within 24 hours | **Filtering is not built.** Add server-side screening (text and image checks, plus matching known harmful images) and a moderation queue with a team that answers within the promised time. Apple also names non-consensual intimate imagery, including AI-made images, as something apps must prevent and remove |
| **Privacy policy** (5.1.1(i)) | A link in the app and in the store listing | Help, Privacy Policy; sign up and the welcome screen link it; Privacy settings link it | Counsel-approved text; same address in App Store Connect |
| **Data collection and privacy labels** (5.1.1, 5.1.2) | Say what is collected and why; ask permission; honor consent | Section 5 below maps the data. Usage data and personalized ads are off until turned on in Privacy | Fill in the App Privacy answers from the map; keep them in step with the SDKs used |
| **Tracking** (App Tracking Transparency) | If the app or an ad network tracks people across other companies' apps and sites, the system prompt must be shown first | Turning on Personalized ads shows our own explanation, then the system question. Off by default | Add the tracking usage description to the app; only start tracking after a yes. If no tracking happens at all, you can drop the toggle and the prompt |
| **Subscriptions** (3.1.1, 3.1.2) | In-app purchase for digital features. Show name, length and price clearly; links to terms and privacy policy; a way to restore; subscriptions last at least 7 days ([subscriptions](https://developer.apple.com/app-store/subscriptions/)) | Plan and add-ons: the confirm step states price and period, that payment is charged to the store account, that it renews unless auto-renew is turned off at least 24 hours before the end, and where to manage it; Terms and Privacy links; Restore purchases; Manage in App Store | Real prices from the store; the same wording in App Store Connect |
| **Push notifications** (4.5.4) | Push must not be required, and promotions need the person's opt-in | Notifications: Offers are off by default, with their own switch; the system permission is asked only after our explanation | Make sure no marketing push is sent to people who did not opt in |
| **Permissions** (5.1.1(iv), purpose strings) | Ask only when needed, explain why, and the app must still work if refused | Our own sheet before each system prompt (photos, microphone, camera, notifications); Privacy, App permissions shows status and where to change it | Purpose strings for photos, microphone, camera and tracking in the app's settings |
| **Sign in with Apple** (4.8) | Required only if the app offers login with another company's account (Google, Facebook) | Not needed: sign in is email and password | If social login is ever added, add Sign in with Apple |
| **Age rating** | Answer the questionnaire; user-generated content and ads raise the rating | Minimum age 16 stated at sign up | Complete the questionnaire in App Store Connect |

## 2. Google Play

Sources: [Account deletion](https://support.google.com/googleplay/android-developer/answer/13327111), [User Generated Content](https://support.google.com/googleplay/android-developer/answer/9876937), [Data safety](https://support.google.com/googleplay/android-developer/answer/10787469).

| Requirement | What Google asks | Where in the app | Still to do |
|---|---|---|---|
| **Account deletion** | An in-app path to delete the account and its data, and a web page where people can ask for deletion without installing the app, entered in Play Console. Deactivating is not deletion. Anything kept for security, fraud or law must be disclosed | The same Delete account page, which also shows the web address | Build the web deletion page (a simple request form is enough); put its address in Play Console and in `legal.links`; answer the deletion questions in the Data safety form |
| **User-generated content** | In-app reporting and blocking, easy to find and clearly labeled, with ongoing moderation and prompt action. Direct messaging needs blocking; closed communities need reporting | Same features as in the Apple table | Same moderation work |
| **Data safety form** | Declare what is collected, shared and why, how it is protected, and whether people can delete it | Section 5 maps the data | Fill in the form from the map and keep it current |
| **Privacy policy** | Link in the listing and in the app | Help, Privacy Policy; sign up; Privacy | Same as Apple |
| **Ads** | Declare that the app contains ads; ads must be clearly labeled | Ads carry an "Ad" tag and a "Why you see this ad" sheet with Ad choices; free plan only | Declare ads in Play Console; choose an ad network that follows Google's ads policy |
| **Payments** | Digital subscriptions use Google Play Billing; show terms; easy cancel | Same Plan screen with "Manage in Google Play" | Real prices and products |
| **Permissions** | Request only what is needed and in context; notification permission is a runtime permission on recent Android | Our explanation first; App permissions page. Photos should be picked with the system photo picker so the app needs no broad media permission | Declare permissions in the manifest and in Play Console where asked |
| **Target audience and content** | Declare the audience (not children) and content rating | Minimum age 16 stated at sign up | Complete the declarations |
| **New developer accounts** | Google may require a period of closed testing before production for newer personal accounts | n/a | Check the current requirement for the account type being used |

## 3. Both stores: what the app promises people

These come from the same sources and are already built:

- **Consent first.** Usage data and personalized ads are off until the person turns them on, and can be turned off again at any time (Privacy).
- **Control.** Who sees online status, photo and job title; who can add you to groups; blocked contacts; permissions status.
- **Access and portability.** Account, Your account, Request your data. A copy is emailed within 7 days.
- **Deletion.** Inside the app and on the web, with the password asked again.
- **Honest limits on kids.** Minimum age 16 at sign up. If an account under that age is found, delete it.
- **Credits.** Open-source licenses page credits Poppins (SIL Open Font License) and the Solar icons by 480 Design (CC BY 4.0, which requires the credit).

## 4. What a report does

1. A person long-presses a message from someone else, or opens a person's or group's info, and chooses Report.
2. They pick a reason (spam, harassment or bullying, hate speech, violence or threats, sexual content, scam or fraud, something else), may add details, and may block the person in the same step.
3. They are told it is private, that the person is not told who reported, and that it is looked at within 24 hours.
4. Moderators act (remove content, warn, suspend). The server must enforce blocking: a blocked person cannot message or call, and is never told.

For App Review notes, say this in plain words and name the moderation team and their response time.

## 5. Data map (for Apple's privacy labels and Google's Data safety form)

| Data | Collected? | Why | Shared with | Optional | Person's control |
|---|---|---|---|---|---|
| Name, email, job title | Yes | Account and showing who you are to others | Other people in your chats and groups; your organization (name and title) | Job title optional | Edit profile; delete account |
| Profile photo | If added | Showing who you are | People allowed in Privacy | Yes | Privacy; remove photo; delete account |
| Password | Yes (stored as a hash) | Sign in | Nobody | No | Change password |
| Messages, photos, documents | Yes | The service | The people and groups you send to | n/a | Delete messages (private chats); delete account |
| Call history (who, when, how long) | Yes | Enforce the daily limit, show recent calls | Nobody | n/a | Delete account. Call audio and video are not recorded |
| Device and push token | Yes | Deliver notifications | Notification provider | Notifications optional | Notification settings |
| Usage analytics | Only if turned on | Improve the app | Analytics provider | Yes, off by default | Privacy, Share usage data |
| Ad data | Free plan | Show ads | Ad network | Personalization off by default | Privacy, Personalized ads; paid add-on removes ads |
| Purchases | Yes | Add-ons | Store and payments provider | Yes | Manage in the store |
| Reports and blocks | Yes | Safety | Moderators | n/a | Unblock; delete account |

## 6. Permissions

| Permission | Why | When asked | If refused |
|---|---|---|---|
| Photos | Send pictures, choose a profile photo | First time attaching a photo | Documents still work; the page explains how to turn it on |
| Microphone | Calls | First call | Calls cannot start; explained |
| Camera | Video calls | First video call | Audio calls still work |
| Notifications | Message and call alerts | When a notification switch is first turned on | The app works; alerts only appear inside it |
| Tracking (iPhone) | Personalized ads | Turning on Personalized ads | Ads stay generic |

Not used: contacts, location, background audio. Device contacts (DEV-02) and app lock with Face ID are not built; each would need its own purpose string and sheet.

## 7. Gaps to close before submission

1. **Content filtering before posting** (Apple 1.2). Not built.
2. **A moderation team and queue**, with the 24-hour promise staffed.
3. **Counsel-approved** terms, privacy policy and community guidelines (the in-app text is a draft).
4. **Real web addresses** for support, help center and deletion (`legal.links`), the deletion page built.
5. **Real deletion** across every system, and a retention statement that matches it.
6. **Consent wiring**: analytics and ad SDKs started only after consent; the tracking prompt on iPhone.
7. **Store metadata**: privacy answers, age rating, subscription text, purpose strings, ads declaration.
8. **Organization-owned data**: decide what happens to an organization's groups when its admin deletes their account (the app says the groups are not deleted).
