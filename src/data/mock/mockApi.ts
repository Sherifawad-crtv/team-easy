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
// Demo data: any email with a password of 8+ characters signs in, except the
// password "wrongpass1". Emails starting "taken@" are already registered.
// Invites: ORG-ACME valid, ORG-OLD expired, anything else invalid. A message
// containing "#fail" fails to send, so the failed state is easy to see.

import type { Api } from '../api'
import { ApiError } from '../errors'
import type {
  Account,
  ChatEvent,
  Conversation,
  IdentityKind,
  Message,
  OrgInvite,
} from '../types'
import { scenarioStore } from './scenario'
import { CONVERSATIONS, MEMBERS, ME, seedMessages } from './seed'

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
    list = conv ? seedMessages(conv) : []
    history.set(id, list)
  }
  return list
}

const emit = (e: ChatEvent) => listeners.forEach((l) => l(e))

function receive(conv: Conversation, text: string, senderName: string, senderId: string) {
  const message: Message = {
    id: `live-${nextId++}`, conversationId: conv.id, senderId, senderName,
    text, at: Date.now(), status: 'sent',
  }
  messagesFor(conv.id).push(message)
  conv.lastMessage = conv.kind === 'direct' ? text : `${senderName.split(' ')[0]}: ${text}`
  conv.lastAt = message.at
  conv.unread += 1
  emit({ type: 'message', message })
  emit({ type: 'conversation', conversation: { ...conv } })
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
        jobTitle: data.jobTitle, hasPhoto: data.hasPhoto, organization: org,
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
      return conversations.map((c) => ({ ...c })).sort((a, b) => b.lastAt - a.lastAt)
    },
    async listMessages(id) {
      await gate(350)
      if (scenarioStore.get() === 'empty') return []
      return messagesFor(id).map((m) => ({ ...m }))
    },
    async sendMessage(id, text) {
      await gate(550)
      if (text.includes('#fail')) throw new ApiError('unknown')
      const conv = conversations.find((c) => c.id === id)
      if (!conv) throw new ApiError('unknown')
      const message: Message = {
        id: `live-${nextId++}`, conversationId: id, senderId: ME.id,
        senderName: ME.name, text, at: Date.now(), status: 'sent',
      }
      messagesFor(id).push(message)
      conv.lastMessage = text
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
}
