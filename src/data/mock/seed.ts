import type { Attachment, Conversation, Member, Message } from '../types'

// Seed data is part of the design: long names, emoji, links, big unread
// counts, a 300-member announcement channel and a nested sub-group.

export const ME = { id: 'me', name: 'Layla Haddad' }

const MIN = 60_000
const HOUR = 60 * MIN

export const MEMBERS: Member[] = [
  { id: 'u-omar', name: 'Omar Al-Fayed', jobTitle: 'Engineering lead', presence: 'online' },
  { id: 'u-amelia', name: 'Amelia Kowalczyk-Fernandez', jobTitle: 'Head of customer success', presence: 'away' },
  { id: 'u-priya', name: 'Priya Raman', jobTitle: 'Product manager', presence: 'online' },
  { id: 'u-jonas', name: 'Jonas Lindqvist', jobTitle: 'Motion designer', presence: 'offline' },
  { id: 'u-noor', name: 'Noor', presence: 'online' },
  { id: 'u-tomas', name: 'Tomás Fernández de la Vega', jobTitle: 'Finance', presence: 'offline' },
  { id: 'u-yuki', name: 'Yuki Tanaka', jobTitle: 'iOS developer', presence: 'away' },
  { id: 'u-sam', name: 'Sam Okafor', jobTitle: 'QA', presence: 'online' },
  { id: 'u-maya', name: 'Maya Chen 🌱', jobTitle: 'Operations', presence: 'offline' },
  { id: 'u-ivan', name: 'Ivan Petrov', jobTitle: 'Backend developer', presence: 'online' },
  { id: 'u-leila', name: 'Leila Haddad-Moreau', jobTitle: 'Legal', presence: 'offline' },
  { id: 'u-daniel', name: 'Daniel Brooks', presence: 'away' },
  { id: 'u-fatima', name: 'Fatima Zahra', jobTitle: 'Support', presence: 'online' },
  { id: 'u-marco', name: 'Marco Rossi', jobTitle: 'Sales', presence: 'offline' },
]

// minutes ago for the last activity, per conversation
const ago = (mins: number) => Date.now() - mins * MIN

export const CONVERSATIONS: Conversation[] = [
  {
    id: 'c-general', kind: 'general', title: 'Acme Studio · Announcements', memberCount: 300,
    lastMessage: 'Office closed Friday for the company offsite. Details in the thread.',
    lastSender: 'Omar', lastAt: ago(14), unread: 214,
  },
  {
    id: 'c-omar', kind: 'direct', title: 'Omar Al-Fayed', presence: 'online',
    lastMessage: 'Can you send the latest build?', lastAt: ago(3), unread: 2,
  },
  {
    id: 'c-product', kind: 'group', title: 'Product Team', memberCount: 24,
    lastMessage: 'Priya: Roadmap review moved to 3pm 👍', lastSender: 'Priya', lastAt: ago(32), unread: 7,
  },
  {
    id: 'c-design-mobile', kind: 'subgroup', title: 'Mobile design', parent: 'Product Team', memberCount: 6,
    lastMessage: 'Jonas: Uploaded the onboarding motion test', lastSender: 'Jonas', lastAt: ago(75), unread: 0,
  },
  {
    id: 'c-amelia', kind: 'direct', title: 'Amelia Kowalczyk-Fernandez', presence: 'away',
    lastMessage: 'Thanks! I will share the customer interview notes tomorrow morning before the sync.',
    lastAt: ago(190), unread: 0,
  },
  {
    id: 'c-launch', kind: 'group',
    title: 'Q4 Launch Working Group: cross-functional coordination and release planning',
    memberCount: 41, lastMessage: 'Sam: QA sign-off is blocked on the push notification test',
    lastSender: 'Sam', lastAt: ago(260), unread: 128,
  },
  {
    id: 'c-priya', kind: 'direct', title: 'Priya Raman', presence: 'online',
    lastMessage: 'https://acme.example/specs/groups-v2', lastAt: ago(420), unread: 0,
  },
  {
    id: 'c-support', kind: 'group', title: 'Support rota', memberCount: 12,
    lastMessage: 'Fatima: I can take the Saturday shift', lastSender: 'Fatima', lastAt: ago(60 * 26), unread: 0,
  },
  {
    id: 'c-yuki', kind: 'direct', title: 'Yuki Tanaka', presence: 'away',
    lastMessage: 'Build 214 is on TestFlight', lastAt: ago(60 * 30), unread: 1,
  },
  {
    id: 'c-finance', kind: 'subgroup', title: 'Finance close', parent: 'Operations', memberCount: 5,
    lastMessage: 'Tomás: Reconciliation done for September', lastSender: 'Tomás', lastAt: ago(60 * 50), unread: 0,
  },
  {
    id: 'c-noor', kind: 'direct', title: 'Noor', presence: 'online',
    lastMessage: '🎉', lastAt: ago(60 * 52), unread: 0,
  },
  {
    id: 'c-sam', kind: 'direct', title: 'Sam Okafor', presence: 'online',
    lastMessage: 'Thanks Sam, sending the invite flow notes now', lastSender: 'You', lastAt: ago(60 * 80), unread: 0,
  },
]

// Small seeded PRNG so screenshots and tests are repeatable.
function rng(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const LINES = [
  'Morning! Did the invite flow go out yet?',
  'Yes, just pushed it to the preview.',
  'Can you check the long-name case? It wraps on small phones.',
  'On it 👀',
  'Looks good on 360px, tightening the spacing a bit.',
  'Quick one: do group admins see the member counter?',
  'They do, it shows how much room is left before 300.',
  'Perfect. Sharing the doc: https://acme.example/specs/groups-v2',
  'Can we move the review to after lunch?',
  'Works for me.',
  'Reminder: attachments you have not opened are deleted after 6 days.',
  'Noted, thanks!',
  'I will send the notes tomorrow.',
  'That is a great catch, filing it now.',
  'Shipping the fix in the next build 🚀',
]

/** Builds a repeatable message history that ends at the conversation's last activity. */
export function seedMessages(c: Conversation): Message[] {
  const rand = rng([...c.id].reduce((n, ch) => n + ch.charCodeAt(0), 0))
  const others =
    c.kind === 'direct'
      ? [{ id: `u-${c.id}`, name: c.title }]
      : MEMBERS.slice(0, 5).map((m) => ({ id: m.id, name: m.name }))
  const count = 26
  const out: Message[] = []
  let t = c.lastAt
  let sender: { id: string; name: string } = ME
  let lastLine = -1
  for (let i = count - 1; i >= 0; i--) {
    const isLast = i === count - 1
    // People often send several messages in a row, which makes grouping visible.
    if (isLast || rand() > 0.55) {
      const mine = isLast ? c.lastSender === 'You' : rand() < 0.45
      sender = mine ? ME : others[Math.floor(rand() * others.length)]
    }
    let line = Math.floor(rand() * LINES.length)
    if (line === lastLine) line = (line + 1) % LINES.length
    lastLine = line
    const text = isLast && c.lastMessage ? c.lastMessage.replace(/^[A-Za-zÀ-ÿ]+: /, '') : LINES[line]
    out.unshift({
      id: `${c.id}-m${i}`,
      conversationId: c.id,
      senderId: sender.id,
      senderName: sender.name,
      text,
      at: Math.round(t),
      status: 'sent',
    })
    t -= rand() < 0.12 ? (6 + rand() * 14) * HOUR : (0.5 + rand() * 5) * MIN
  }
  return out
}

/** A deterministic placeholder picture, so image messages look real without any files. */
export function mockImage(seed: string, w = 720, h = 480): string {
  let n = 0
  for (const ch of seed) n = (n * 33 + ch.charCodeAt(0)) >>> 0
  const palette = [
    ['#1f62a3', '#51c2e6'], ['#3e88c8', '#d3e4f7'], ['#2bace2', '#f6f3dd'], ['#0d142e', '#3e88c8'], ['#51c2e6', '#1f62a3'],
  ]
  const [a, b] = palette[n % palette.length]
  const cx = 120 + (n % 380)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>` +
    `<rect width="${w}" height="${h}" fill="url(#g)"/>` +
    `<circle cx="${cx}" cy="${120 + (n % 90)}" r="${60 + (n % 40)}" fill="#fff" fill-opacity=".35"/>` +
    `<rect x="${40 + (n % 60)}" y="${h - 190}" width="${w - 140}" height="120" rx="24" fill="#fff" fill-opacity=".22"/>` +
    `<rect x="${80 + (n % 50)}" y="${h - 150}" width="${(w - 260) * 0.6}" height="18" rx="9" fill="#fff" fill-opacity=".6"/>` +
    `<rect x="${80 + (n % 50)}" y="${h - 118}" width="${(w - 260) * 0.4}" height="14" rx="7" fill="#fff" fill-opacity=".4"/></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

const DOC_MIME: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  zip: 'application/zip',
}

const image = (name: string, size: number, expired = false): Attachment => ({
  kind: 'image', name, size, mime: 'image/svg+xml', url: expired ? undefined : mockImage(name), expired,
})
const doc = (name: string, size: number): Attachment => ({
  kind: 'document', name, size, mime: DOC_MIME[name.split('.').pop() ?? 'pdf'] ?? 'application/octet-stream',
})

/** Which seeded messages carry files: [conversation, index from the end, attachment, caption]. */
const FILES: [string, number, Attachment, string][] = [
  ['c-product', 9, image('group-tree-mockups.png', 1_480_000), 'Mockups for the group tree'],
  ['c-product', 6, doc('Q4-roadmap.pdf', 1_240_000), ''],
  ['c-omar', 10, image('build-214-screenshot.png', 860_000), ''],
  ['c-omar', 5, doc('build-notes.docx', 94_000), 'Release notes draft'],
  ['c-design-mobile', 8, image('onboarding-motion-test.png', 2_100_000), ''],
  ['c-design-mobile', 5, doc('motion-spec.pdf', 3_400_000), ''],
  ['c-design-mobile', 12, image('old-render.png', 4_800_000, true), ''],
  ['c-launch', 7, doc('Release-checklist.xlsx', 212_000), ''],
  ['c-launch', 4, doc('qa-signoff.pdf', 540_000), 'QA sign-off for review'],
  ['c-amelia', 6, doc('customer-interview-notes.pdf', 780_000), ''],
  ['c-priya', 5, doc('groups-v2-spec.pdf', 1_900_000), 'The spec we talked about'],
  ['c-general', 8, image('offsite-venue.jpg', 1_100_000), 'Venue for Friday'],
  ['c-general', 3, doc('offsite-schedule.pdf', 330_000), ''],
]

/** Adds the demo files to a seeded history. Files come from other people, except where noted. */
export function withFiles(conversationId: string, list: Message[]): Message[] {
  const conv = CONVERSATIONS.find((c) => c.id === conversationId)
  if (!conv) return list
  FILES.forEach(([id, fromEnd, attachment, caption], n) => {
    if (id !== conversationId) return
    const i = list.length - 1 - fromEnd
    if (i < 0 || i >= list.length) return
    const mine = MINE.has(attachment.name)
    const other = conv.kind === 'direct' ? { id: `u-${conv.id}`, name: conv.title } : MEMBERS[n % 5]
    const who = mine ? ME : other
    list[i] = { ...list[i], senderId: who.id, senderName: who.name, attachment, text: caption }
  })
  return list
}

/** A couple of files that I sent myself, so both sides show. */
const MINE = new Set(['build-notes.docx', 'qa-signoff.pdf'])
