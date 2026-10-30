// WIRE: auth.session
// Req: ACC-01..04, ACC-06 | Contract: AuthApi | Mock: mockApi.auth
// Real: email + password sign up and sign in, optional org attach via invite, persisted session
// Server must enforce: identity, unique email, password rules, invite validity
//
// WIRE: auth.account-switch
// Req: ACC-07 | Contract: AuthApi.switchIdentity | Mock: mockApi.auth
// Real: switch active identity between individual and organization; scope all data by it
// Server must enforce: data isolation between identities
//
// WIRE: auth.delete-account
// Req: ACC-08 | Contract: AuthApi.deleteAccount | Mock: mockApi.auth
// Real: delete account and associated data, end the session
// Server must enforce: full deletion
//
// WIRE: auth.org-invite
// Req: ACC-03..05 | Contract: AuthApi.resolveInvite | Mock: mockApi.auth
// Real: resolve an admin-issued invite link or code to its organization
// Server must enforce: invite validity, expiry
//
// WIRE: auth.password-reset
// Req: ACC-01 (assumed) | Contract: AuthApi.requestPasswordReset | Mock: mockApi.auth
// Real: send a reset email; same response whether or not the address exists
// Server must enforce: rate limiting, no account enumeration
//
// WIRE: chat.messages
// Req: CHT-01..04, NFR-01 | Contract: ChatApi.listConversations/listMessages/subscribe | Mock: mockApi.chat
// Real: realtime conversations and message history with paging, unread counts, delivery events
// Server must enforce: membership, read access
//
// WIRE: chat.send-message
// Req: CHT-01..04 | Contract: ChatApi.sendMessage | Mock: mockApi.chat
// Real: send, return the server-confirmed message, reject on failure so the UI can retry
// Server must enforce: sender permission, membership
//
// WIRE: chat.delete-message
// Req: CHT-05 | Contract: ChatApi.deleteMessage | Mock: mockApi.chat
// Real: sender deletes own message in private chats only
// Server must enforce: private-chat-only rule, ownership
//
// WIRE: search.members
// Req: SRC-01 | Contract: ChatApi.searchMembers | Mock: mockApi.chat
// Real: search members by name, scoped to what the user can see
// Server must enforce: result scoping to user access
//
// WIRE: media.upload
// Req: MED-01..03 | Contract: ChatApi.sendMessage (draft.file) | Mock: mockApi.chat
// Real: upload the image or document, return the stored attachment (url, size, type); enforce size and type limits
// Server must enforce: size and type limits, membership, retention (DAT-02)
//
// WIRE: search.query
// Req: SRC-02..04 | Contract: ChatApi.search | Mock: mockApi.chat
// Real: search chats, message text and document names with date, group and type filters, scoped to what the user can read
// Server must enforce: result scoping to user access
//
// WIRE: profile.edit
// Req: PRF-01 | Contract: ProfileApi.updateProfile | Mock: mockApi.profile
// Real: update name, email, job title, photo; photo upload; email change may need verification (PRD open question 14)
// Server must enforce: validation, ownership, unique email
//
// WIRE: permissions.runtime
// Req: NFR-04 | Contract: PermissionsApi | Mock: mockApi.permissions
// Real: ask the OS for the permission after the app's own rationale; report granted or denied
// Server must enforce: n/a (OS permission)
//
// WIRE: groups.crud
// Req: GRP-01, 02, 05, 08..11 | Contract: GroupApi.list/get/create/archive/remove/undoDelete/openChat | Mock: mockApi.groups
// Real: group, sub-group and sub-sub-group tree per organization with a chat each; admin-only create, archive and delete; delete is a soft delete with an undo window read from a database value; archived chats leave the chat list
// Server must enforce: admin-only writes; 5/5/5 hierarchy (assumed per parent, open question 5); unique names per parent; 300 members across a main group and its sub-groups, paid expansion beyond; per-user group limit (open question 4); undo window and permanent removal after it; visibility by membership
//
// WIRE: groups.join-link
// Req: GRP-06, GRP-07 | Contract: GroupApi.createLink/resolveLink/join | Mock: mockApi.groups
// Real: shareable join link per team; resolve shows the group and who invited; join adds the member and the parents above. GRP-07 (app-store fallback) is platform work, not in the PWA: when the app is not installed the link opens the store page and the token survives install (universal links, deferred deep link)
// Server must enforce: link validity and revocation, the caps above, whether the sender may invite (open question 7)
//
// WIRE: members.invite
// Req: ROL-01, ROL-02 | Contract: GroupApi.addMembers/candidates/createLink | Mock: mockApi.groups
// Real: admins add people directly or share a link; members share the link (assumed no approval, open question 7)
// Server must enforce: who may invite whom, approval if required, the member cap
//
// WIRE: roles.permissions
// Req: ROL-03, ROL-05, ROL-06 | Contract: GroupApi.setBlocked/leave, Group.myRole | Mock: mockApi.groups
// Real: admin and member roles only (open question 3). Block: the person stays listed but cannot post or receive new messages (assumed meaning). Leave: keep the group read-only in the list, or leave and delete it for this member only
// Server must enforce: admin-only block, blocked and departed members get no new messages and cannot send, deletion affects only the leaver
//
// WIRE: roles.title-tags
// Req: ROL-04 | Contract: GroupApi.setTitleTag, Member.titleTag, Message.senderTitle | Mock: mockApi.groups
// Real: an admin gives a person a short free-text tag shown in member lists and next to their name in group chats (assumed, open question 2)
// Server must enforce: admin-only, length limit, no permissions attached to a tag
//
// WIRE: calendar.events
// Req: CAL-01, CAL-02 | Contract: CalendarApi.calendars/events/assignees/assign | Mock: mockApi.calendar
// Real: events of the calendars a user has, by time range, recurring events expanded by the server; admins set who has each calendar (done in the web admin app in production)
// Server must enforce: visibility by assignment (admins see all, assumed), admin-only assignment
//
// WIRE: notifications.in-app-banner
// Req: NTF-01 | Contract: NotificationsApi.banners/dismissBanner/updates/update | Mock: mockApi.notifications
// Real: app-to-user notices (update logs, what's new, offers) from an admin-managed source; dismissals stored per user
// Server must enforce: audience, dismissal per user
//
// WIRE: notifications.push
// Req: NTF-02, NTF-03, NFR-03 | Contract: NotificationsApi.settings/saveSettings/mutedGroups/setGroupMuted/subscribe | Mock: mockApi.notifications
// Real: APNs/FCM registration, chat and group pushes that respect these settings and per-group mute, and a push whose tap opens a release, update or offers page (deep link). The PWA only shows pushes that arrive while it is open
// Server must enforce: send only what the settings allow, never push muted groups, delivery live at launch (NFR-03)
//
// WIRE: data.retention
// Req: DAT-02, DAT-04 | Contract: DataApi.retention/expiringFiles, Attachment.expiresAt, Group.deleteAt | Mock: mockApi.data
// Real: 6 days (standard) or 15 days (business) for unopened attachments, archived-group deletion after a database-configured period; the server job does the deleting
// Server must enforce: all deletion, plan lookup, the configured archive period
//
// WIRE: data.backup
// Req: DAT-01 | Contract: DataApi.backup/startBackup/transferCode | Mock: mockApi.data
// Real: back up chats, and a short-lived code that moves chats to a new phone (assumed meaning, open question 17)
// Server must enforce: owner-only, code expiry and single use, storage access
//
// Demo data: any email with a password of 8+ characters signs in, except the
// password "wrongpass1". Emails starting "taken@" are already registered.
// Invites: ORG-ACME valid, ORG-OLD expired, anything else invalid. A message
// containing "#fail" fails to send, so the failed state is easy to see.

import type { Api } from '../api'
import { ApiError } from '../errors'
import type {
  Account,
  Attachment,
  ChatEvent,
  Conversation,
  IdentityKind,
  Message,
  MessageHit,
  OrgInvite,
  PermissionKind,
  PermissionStatus,
  SearchFilters,
  SearchResults,
} from '../types'
import { createCalendar } from './calendarMock'
import { createData } from './dataMock'
import { createGroups } from './groupsMock'
import { createNotifications } from './notificationsMock'
import { scenarioStore } from './scenario'
import { CONVERSATIONS, MEMBERS, ME, seedMessages, withFiles } from './seed'

const ACME = { id: 'org-acme', name: 'Acme Studio' }
const SESSION_KEY = 'te.session'

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

/** Latency plus the failures the current scenario asks for. */
async function gate(base = 450) {
  const scenario = scenarioStore.get()
  await delay(scenario === 'slow' ? 3500 : base)
  if (scenario === 'offline') throw new ApiError('network')
  if (scenario === 'error') throw new ApiError('unknown')
}

function loadSession(): Account | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as Account) : null
  } catch {
    return null
  }
}

function saveSession(account: Account | null) {
  try {
    if (account) localStorage.setItem(SESSION_KEY, JSON.stringify(account))
    else localStorage.removeItem(SESSION_KEY)
  } catch {
    // storage unavailable: the session just won't survive a reload
  }
}

function resolveInviteToken(linkOrCode: string): OrgInvite {
  const token = linkOrCode.trim().split('/').pop()?.toUpperCase() ?? ''
  if (token === 'ORG-OLD') throw new ApiError('invite_expired')
  if (token !== 'ORG-ACME') throw new ApiError('invite_invalid')
  return { token: 'ORG-ACME', organization: ACME, invitedBy: 'Omar Al-Fayed' }
}

let current: Account | null = loadSession()

// Chat state lives in memory for the demo.
const conversations: Conversation[] = CONVERSATIONS.map((c) => ({ ...c }))
const history = new Map<string, Message[]>()
const listeners = new Set<(e: ChatEvent) => void>()
let nextId = 1
let ticker: ReturnType<typeof setInterval> | undefined

const messagesFor = (id: string): Message[] => {
  let list = history.get(id)
  if (!list) {
    const conv = conversations.find((c) => c.id === id)
    list = conv ? withFiles(id, seedMessages(conv)) : []
    history.set(id, list)
  }
  return list
}

const emit = (e: ChatEvent) => listeners.forEach((l) => l(e))

const groupsMock = createGroups({ conversations, history, emit, gate })
const calendarMock = createCalendar({ gate })
const notificationsMock = createNotifications({ gate })
const dataApi = createData({ gate, identity: () => current?.activeIdentity ?? 'individual', conversations, messagesFor })

function receive(conv: Conversation, text: string, senderName: string, senderId: string) {
  if (conv.left || groupsMock.muted(conv.id, senderId)) return
  const message: Message = {
    id: `live-${nextId++}`, conversationId: conv.id, senderId, senderName,
    senderTitle: conv.kind === 'direct' ? undefined : groupsMock.titleFor(senderId),
    text, at: Date.now(), status: 'sent',
  }
  messagesFor(conv.id).push(message)
  conv.lastMessage = conv.kind === 'direct' ? text : `${senderName.split(' ')[0]}: ${text}`
  conv.lastAt = message.at
  conv.unread += 1
  emit({ type: 'message', message })
  emit({ type: 'conversation', conversation: { ...conv } })
  notificationsMock.notifyMessage(conv, senderName, text, message.id)
}

const INCOMING = ['Quick question when you have a minute', 'Just pushed the update 🚀', 'Can you look at this?', 'Thanks, that works!', 'Heads up: meeting moved to 4pm']

function startTicker() {
  if (ticker) return
  ticker = setInterval(() => {
    if (scenarioStore.get() === 'offline' || conversations.length === 0) return
    const conv = conversations[Math.floor(Math.random() * conversations.length)]
    const from = MEMBERS[Math.floor(Math.random() * MEMBERS.length)]
    const text = INCOMING[Math.floor(Math.random() * INCOMING.length)]
    receive(conv, text, conv.kind === 'direct' ? conv.title : from.name, conv.kind === 'direct' ? `u-${conv.id}` : from.id)
  }, 25_000)
}

function toAttachment(file: File): Attachment {
  const isImage = file.type.startsWith('image/')
  return {
    kind: isImage ? 'image' : 'document',
    name: file.name,
    size: file.size,
    mime: file.type || 'application/octet-stream',
    url: URL.createObjectURL(file),
  }
}

const DAY_MS = 86_400_000
const WINDOW: Record<string, number> = { today: 1, week: 7, month: 30 }

function search(query: string, filters: SearchFilters): SearchResults {
  const q = query.trim().toLowerCase()
  const since = filters.date === 'any' ? 0 : Date.now() - WINDOW[filters.date] * DAY_MS
  const chats =
    filters.type === 'all' && !filters.conversationId && filters.date === 'any'
      ? conversations.filter((c) => c.title.toLowerCase().includes(q)).sort((a, b) => b.lastAt - a.lastAt).slice(0, 5)
      : []
  const messages: MessageHit[] = []
  const documents: MessageHit[] = []
  for (const conv of conversations) {
    if (filters.conversationId && conv.id !== filters.conversationId) continue
    for (const m of messagesFor(conv.id)) {
      if (m.at < since) continue
      const a = m.attachment
      if (a) {
        const hit = a.name.toLowerCase().includes(q) || m.text.toLowerCase().includes(q)
        if (!hit) continue
        if (a.kind === 'document' && filters.type !== 'images') documents.push({ message: m, conversation: conv })
        else if (a.kind === 'image' && filters.type !== 'documents') messages.push({ message: m, conversation: conv })
        continue
      }
      if (filters.type === 'all' && m.text.toLowerCase().includes(q)) messages.push({ message: m, conversation: conv })
    }
  }
  const newest = (x: MessageHit, y: MessageHit) => y.message.at - x.message.at
  return {
    chats: chats.map((c) => ({ ...c })),
    messages: messages.sort(newest).slice(0, 40),
    documents: documents.sort(newest).slice(0, 40),
  }
}

const PERM_KEY = 'te.perm.'

/** Review tool: pretend the OS answer is "denied" (or forget it with null). */
export function simulatePermission(kind: PermissionKind, status: PermissionStatus | null) {
  try {
    if (status) localStorage.setItem(PERM_KEY + kind, status)
    else localStorage.removeItem(PERM_KEY + kind)
  } catch {
    // ignore
  }
}

/** Review tool: pretend the server sent a push about a release or an offer. */
export const simulatePush = (kind: 'release' | 'offer') => notificationsMock.sendTest(kind)

export const mockApi: Api = {
  auth: {
    async restoreSession() {
      await delay(350)
      return current
    },
    async signUp(data) {
      await gate()
      if (data.email.toLowerCase().startsWith('taken@')) throw new ApiError('email_taken')
      const org = data.inviteToken ? resolveInviteToken(data.inviteToken).organization : undefined
      current = {
        id: `user-${data.email}`, name: data.name, email: data.email,
        jobTitle: data.jobTitle, hasPhoto: data.hasPhoto, photoUrl: data.photoUrl, organization: org,
        activeIdentity: org ? 'organization' : 'individual',
      }
      saveSession(current)
      return current
    },
    async signIn(email, password) {
      await gate()
      if (password === 'wrongpass1') throw new ApiError('invalid_credentials')
      current = {
        id: `user-${email}`, name: ME.name, email, jobTitle: 'Product designer',
        organization: ACME, activeIdentity: 'individual',
      }
      saveSession(current)
      return current
    },
    async signOut() {
      await delay(250)
      current = null
      saveSession(null)
    },
    async requestPasswordReset() {
      await gate()
    },
    async resolveInvite(linkOrCode) {
      await gate()
      return resolveInviteToken(linkOrCode)
    },
    async switchIdentity(kind: IdentityKind) {
      await gate(300)
      if (!current) throw new ApiError('unknown')
      current = { ...current, activeIdentity: kind }
      saveSession(current)
      return current
    },
    async deleteAccount() {
      await gate()
      current = null
      saveSession(null)
    },
  },

  chat: {
    async listConversations() {
      await gate()
      if (scenarioStore.get() === 'empty') return []
      return conversations.filter((c) => !groupsMock.hiddenConvs.has(c.id)).map((c) => ({ ...c })).sort((a, b) => b.lastAt - a.lastAt)
    },
    async listMessages(id) {
      await gate(350)
      if (scenarioStore.get() === 'empty') return []
      return messagesFor(id).map((m) => ({ ...m, senderTitle: m.senderId === ME.id || conversations.find((c) => c.id === id)?.kind === 'direct' ? undefined : groupsMock.titleFor(m.senderId) }))
    },
    async sendMessage(id, draft) {
      await gate(550)
      const text = draft.text.trim()
      if (text.includes('#fail')) throw new ApiError('unknown')
      const conv = conversations.find((c) => c.id === id)
      if (!conv) throw new ApiError('unknown')
      if (conv.left) throw new ApiError('not_allowed')
      const attachment = draft.file ? toAttachment(draft.file) : undefined
      const message: Message = {
        id: `live-${nextId++}`, conversationId: id, senderId: ME.id,
        senderName: ME.name, text, attachment, at: Date.now(), status: 'sent',
      }
      messagesFor(id).push(message)
      conv.lastMessage = text || (attachment?.kind === 'image' ? '📷 Photo' : `📄 ${attachment?.name ?? ''}`)
      conv.lastSender = 'You'
      conv.lastAt = message.at
      emit({ type: 'conversation', conversation: { ...conv } })
      if (conv.kind === 'direct') {
        setTimeout(() => {
          const reply = ['Got it 👍', 'On it.', 'Thanks! Give me five minutes.'][nextId % 3]
          if (conv.id !== 'c-noor') receive(conv, reply, conv.title, `u-${conv.id}`)
        }, 1800)
      }
      return message
    },
    async deleteMessage(id, messageId) {
      await gate(300)
      const conv = conversations.find((c) => c.id === id)
      if (!conv || conv.kind !== 'direct') throw new ApiError('unknown')
      const list = messagesFor(id)
      const i = list.findIndex((m) => m.id === messageId && m.senderId === ME.id)
      if (i < 0) throw new ApiError('unknown')
      list.splice(i, 1)
    },
    async markRead(id) {
      const conv = conversations.find((c) => c.id === id)
      if (!conv || conv.unread === 0) return
      conv.unread = 0
      emit({ type: 'conversation', conversation: { ...conv } })
    },
    async searchMembers(query) {
      await gate(250)
      if (scenarioStore.get() === 'empty') return []
      const q = query.trim().toLowerCase()
      const list = q ? MEMBERS.filter((m) => m.name.toLowerCase().includes(q)) : MEMBERS.slice(0, 8)
      return list.slice(0, 20).map((m) => ({ ...m }))
    },
    async search(query, filters) {
      await gate(300)
      if (scenarioStore.get() === 'empty') return { chats: [], messages: [], documents: [] }
      return search(query, filters)
    },
    async openDirect(memberId) {
      await gate(300)
      const member = MEMBERS.find((m) => m.id === memberId)
      if (!member) throw new ApiError('unknown')
      let conv = conversations.find((c) => c.kind === 'direct' && c.title === member.name)
      if (!conv) {
        conv = {
          id: `c-${member.id}`, kind: 'direct', title: member.name, presence: member.presence,
          lastMessage: '', lastAt: Date.now(), unread: 0,
        }
        conversations.push(conv)
        history.set(conv.id, [])
        emit({ type: 'conversation', conversation: { ...conv } })
      }
      return { ...conv }
    },
    subscribe(listener) {
      listeners.add(listener)
      startTicker()
      return () => {
        listeners.delete(listener)
        if (listeners.size === 0 && ticker) {
          clearInterval(ticker)
          ticker = undefined
        }
      }
    },
  },

  profile: {
    async updateProfile(patch) {
      await gate(500)
      if (!current) throw new ApiError('unknown')
      if (patch.email && patch.email.toLowerCase().startsWith('taken@')) throw new ApiError('email_taken')
      const { photoUrl, ...rest } = patch
      current = {
        ...current,
        ...rest,
        ...(photoUrl === undefined ? {} : { photoUrl: photoUrl ?? undefined, hasPhoto: photoUrl !== null }),
      }
      saveSession(current)
      return current
    },
  },

  groups: groupsMock.api,
  calendar: calendarMock.api,
  notifications: notificationsMock.api,
  data: dataApi,

  permissions: {
    async status(kind: PermissionKind): Promise<PermissionStatus> {
      try {
        return (localStorage.getItem(PERM_KEY + kind) as PermissionStatus | null) ?? 'unknown'
      } catch {
        return 'unknown'
      }
    },
    async request(kind: PermissionKind): Promise<PermissionStatus> {
      await delay(250)
      // The mock grants the permission unless a reviewer set it to denied.
      try {
        if (localStorage.getItem(PERM_KEY + kind) === 'denied') return 'denied'
        localStorage.setItem(PERM_KEY + kind, 'granted')
      } catch {
        // storage blocked: the answer lasts for this page only
      }
      return 'granted'
    },
    async reset(kind: PermissionKind) {
      try {
        localStorage.removeItem(PERM_KEY + kind)
      } catch {
        // ignore
      }
    },
  },
}
