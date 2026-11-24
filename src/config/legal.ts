// WIRE: legal.links
// Req: store compliance (App Store 5.1.1, Play User Data policy) | Contract: this file | Mock: example addresses
// Real: the real support email, help center, privacy policy, terms and account deletion web page addresses, the same ones entered in App Store Connect and Play Console
// Server must enforce: the web deletion page must work without the app installed (Play requires it)

/** Addresses and facts the stores ask for. `.example` addresses are placeholders and must be replaced before release. */
export const LEGAL = {
  /** The youngest person who may use the app. Shown at sign up. */
  minAge: 16,
  supportEmail: 'support@teameasy.example',
  helpCenterUrl: 'https://teameasy.example/help',
  /** Google Play requires a web page where a person can ask for deletion without the app. */
  deleteAccountUrl: 'https://teameasy.example/delete-account',
  /** What "Invite a friend" shares. */
  shareUrl: 'https://teameasy.example/get',
  /** How fast reports are looked at. Stated to people who report. */
  reportReviewHours: 24,
  /** How long a copy of someone's data takes to arrive by email. */
  exportDays: 7,
  version: '0.4.0',
  build: '41',
} as const

/** Where a person manages or cancels a subscription, by store. */
export const STORE_SUBSCRIPTIONS = {
  ios: 'https://apps.apple.com/account/subscriptions',
  android: 'https://play.google.com/store/account/subscriptions',
} as const
