// Mock legal documents. The wording is a draft that describes what the app really does,
// so the screens can be reviewed. Replace it with the text approved by counsel (wire `legal.documents`).

import type { LegalApi } from '../api'
import { LEGAL } from '../../config/legal'
import { LIMITS } from '../../config/limits'
import type { LegalDocument, LegalKind } from '../types'

const UPDATED = Date.UTC(2026, 10, 24)
const DRAFT = 'Draft for review. This text describes what the app does and must be replaced by the version approved by your lawyer before release.'

const DOCS: Record<LegalKind, LegalDocument> = {
  terms: {
    kind: 'terms', title: 'Terms of Service', updatedAt: UPDATED, intro: DRAFT,
    sections: [
      { heading: 'Who can use the app', body: [`You must be at least ${LEGAL.minAge} years old. You can use the app on your own or as a member of an organization. If an organization invites you, it can see the groups and calendars it gives you, not your personal chats.`] },
      { heading: 'Your account', body: ['Keep your password private. You are responsible for what happens under your account. You can delete your account at any time in Settings, Your account.'] },
      { heading: 'What you may share', body: ['You own what you write and send. You allow the app to store and deliver it to the people you send it to. You must have the right to share what you send.', 'The Community guidelines list what is not allowed. We may remove content and block accounts that break them.'] },
      { heading: 'Calls, add-ons and ads', body: [`Calling time is limited to one hour per person per day. Add-ons are subscriptions billed by your app store account. They renew every month until you cancel them in your store account settings. The free plan shows ads in personal chats.`] },
      { heading: 'Ending use', body: ['You can stop using the app at any time. We can suspend or end access for people who break these terms or the Community guidelines, and we tell them why.'] },
      { heading: 'Contact', body: [`Questions about these terms: ${LEGAL.supportEmail}.`] },
    ],
  },
  privacy: {
    kind: 'privacy', title: 'Privacy Policy', updatedAt: UPDATED, intro: DRAFT,
    sections: [
      { heading: 'What we collect', body: [
        'Account details you give us: name, email, job title, photo and your password (stored only as a hash).',
        'What you send: messages, photos and documents, and the groups and calendars you belong to.',
        'Calls: who called whom, when, and for how long, to enforce the daily limit. Call audio and video are not recorded.',
        'Device details needed to deliver notifications, and basic technical information when something goes wrong.',
        'Usage data about how you use the app, only if you turn on Share usage data in Settings, Privacy.',
        'Purchase records for add-ons, held by your app store and our payments provider.',
      ] },
      { heading: 'Why we use it', body: ['To run the service: deliver messages, show your groups and calendars, make calls, send the notifications you choose, and handle purchases. To keep people safe: review reports and stop abuse. To improve the app: only with the usage data you agree to share.'] },
      { heading: 'Who sees it', body: [
        'The people and groups you message see what you send, and the profile details you allow in Settings, Privacy.',
        'Your organization sees the groups and calendars it manages and your name and job title, not your personal chats.',
        'Service providers process data for us: message delivery, calls, notifications, payments and, on the free plan, ads. They may only use it to provide their service.',
        'We do not sell your personal data.',
      ] },
      { heading: 'Ads', body: ['The free plan shows ads in personal chats. Ads are not personalized unless you turn on Personalized ads in Settings, Privacy. On iPhone we also ask for your permission to track you across other apps and websites before we do, and you can change your answer in the system settings.'] },
      { heading: 'How long we keep it', body: [
        `Photos and documents you have not opened are deleted after ${LIMITS.attachmentRetentionDays.standard} days on the standard plan (${LIMITS.attachmentRetentionDays.business} on a business plan). Archived groups are deleted after ${LIMITS.archivedRetentionDays} days.`,
        'When you delete your account we delete your profile, your chats and your files. Messages you sent in group chats stay for the group but no longer show your name or photo. We keep the few records the law requires, such as purchase records, until the law allows us to delete them.',
      ] },
      { heading: 'Your choices and rights', body: [
        'You can edit your profile, choose who sees it, block people, turn notifications on or off, and turn off usage data and personalized ads at any time.',
        `You can ask for a copy of your data in Settings, Your account. It is emailed to you within ${LEGAL.exportDays} days.`,
        'You can delete your account in Settings, Your account, or on the web without the app installed.',
        'Depending on where you live you may also have the right to object to or restrict how we use your data, and to complain to your data protection authority.',
      ] },
      { heading: 'Children', body: [`The app is not for anyone under ${LEGAL.minAge}. If we learn that someone under ${LEGAL.minAge} has an account we delete it.`] },
      { heading: 'Contact', body: [`Privacy questions: ${LEGAL.supportEmail}.`] },
    ],
  },
  guidelines: {
    kind: 'guidelines', title: 'Community guidelines', updatedAt: UPDATED,
    intro: 'These rules keep chats safe for everyone. They apply to messages, photos, documents, group names and profiles.',
    sections: [
      { heading: 'Not allowed', body: [
        'Harassment, bullying, threats or encouraging violence.',
        'Hate speech or attacks on people for who they are.',
        'Sexual content involving minors, sexual content shared without consent (including images made with AI), or unwanted sexual messages.',
        'Spam, scams, impersonation or trying to trick people into sharing money or passwords.',
        'Illegal activity, or sharing someone else\'s private information without their permission.',
      ] },
      { heading: 'Reporting and blocking', body: [
        'Press and hold a message from someone else, then choose Report. Open a person\'s info to report or block them. Open a group\'s info to report the group.',
        'Blocking stops someone messaging or calling you. They are not told.',
      ] },
      { heading: 'What we do', body: [
        `We look at every report within ${LEGAL.reportReviewHours} hours. We may remove content, warn the person, or suspend the account. Serious cases are passed to the authorities where the law requires it.`,
        'If you think we made a mistake, write to us and we will look again.',
      ] },
    ],
  },
  licenses: {
    kind: 'licenses', title: 'Open-source licenses', updatedAt: UPDATED,
    intro: 'The app is made with the work of others. Thank you.',
    sections: [
      { heading: 'Poppins typeface', body: ['Copyright the Poppins Project Authors. Licensed under the SIL Open Font License, Version 1.1.'] },
      { heading: 'Solar icons', body: ['Icons by 480 Design (Solar icon set). Licensed under Creative Commons Attribution 4.0 International (CC BY 4.0).'] },
      { heading: 'React and React Router', body: ['Copyright Meta Platforms, Inc. and its affiliates, and Remix Software Inc. Licensed under the MIT License.'] },
    ],
  },
}

interface Deps { gate: (base?: number) => Promise<void> }

export function createLegal(deps: Deps) {
  const api: LegalApi = {
    async document(kind) {
      await deps.gate(300)
      return DOCS[kind]
    },
  }
  return { api }
}
