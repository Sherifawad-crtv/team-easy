// Mock for in-app banners, update log, notification settings and pushes (NTF-01..03).

import type { NotificationsApi } from '../api'
import { ApiError } from '../errors'
import type { Conversation, NotificationSettings, PushNotification, UpdateItem } from '../types'
import { scenarioStore } from './scenario'

const HOUR = 3_600_000
const DAY = 24 * HOUR
const SETTINGS_KEY = 'te.notif.settings'
const MUTED_KEY = 'te.notif.muted'
const DISMISSED_KEY = 'te.notif.dismissed'

const UPDATES = (): UpdateItem[] => [
  {
    id: 'u-offer', kind: 'offer', at: Date.now() - 3 * HOUR, title: 'More room for your team',
    summary: 'Add people beyond 300 and extra sub-groups with a team plan.',
    body: ['Groups are capped at 300 members on the free plan.', 'A team plan lifts the cap and adds more main groups and sub-groups.', 'Admins can see the plan options in the web app.']
  },
  {
    id: 'u-release', kind: 'release', at: Date.now() - 2 * DAY, title: 'Version 0.4 is here',
    summary: 'Groups, a shared calendar and notification settings.',
    body: ['Groups: build teams with sub-groups up to three levels deep, invite people with a link, and undo a delete.', 'Calendar: see the events of the calendars your admin assigned to you.', 'Notifications: choose what pings you, and mute single groups.', 'Files you have not opened are now marked when they are about to be deleted.']
  },
  {
    id: 'u-update', kind: 'update', at: Date.now() - 9 * DAY, title: 'Send photos and documents',
    summary: 'Share files in any chat, and search them by name.',
    body: ['Tap the paperclip to send a photo or a document, with a caption.', 'Search finds message text and document names, with filters for date, chat and type.', 'Pick when downloads happen under Account, Media downloads.'],
  },
]

const defaults: NotificationSettings = { messages: true, groups: true, updates: true, offers: false }

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}
function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // lasts for this page only
  }
}

export function createNotifications(deps: { gate: (base?: number) => Promise<void> }) {
  const updates = UPDATES()
  const listeners = new Set<(p: PushNotification) => void>()
  let next = 1

  const settings = () => ({ ...defaults, ...readJson<Partial<NotificationSettings>>(SETTINGS_KEY, {}) })
  const muted = () => new Set(readJson<string[]>(MUTED_KEY, []))
  const dismissed = () => new Set(readJson<string[]>(DISMISSED_KEY, []))

  const emit = (p: Omit<PushNotification, 'id' | 'at'>) => {
    const push: PushNotification = { ...p, id: `push-${next++}`, at: Date.now() }
    listeners.forEach((l) => l(push))
  }

  const api: NotificationsApi = {
    async banners() {
      await deps.gate(300)
      if (scenarioStore.get() === 'empty') return []
      const done = dismissed()
      const s = settings()
      return updates.filter((u) => !done.has(u.id) && (u.kind === 'offer' ? s.offers : s.updates)).map((u) => ({ ...u })).slice(0, 1)
    },
    async dismissBanner(id) {
      writeJson(DISMISSED_KEY, [...dismissed(), id])
    },
    async updates() {
      await deps.gate(350)
      if (scenarioStore.get() === 'empty') return []
      return updates.map((u) => ({ ...u }))
    },
    async update(id) {
      await deps.gate(300)
      const u = updates.find((x) => x.id === id)
      if (!u) throw new ApiError('unknown')
      return { ...u }
    },
    async settings() {
      await deps.gate(250)
      return settings()
    },
    async saveSettings(patch) {
      await deps.gate(300)
      const merged = { ...settings(), ...patch }
      writeJson(SETTINGS_KEY, merged)
      return merged
    },
    async mutedGroups() {
      await deps.gate(200)
      return [...muted()]
    },
    async setGroupMuted(groupId, value) {
      const set = muted()
      if (value) set.add(groupId)
      else set.delete(groupId)
      writeJson(MUTED_KEY, [...set])
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }

  return {
    api,
    /** An incoming chat message becomes a push when the settings allow it. */
    notifyMessage(conv: Conversation, from: string, text: string, messageId: string) {
      const s = settings()
      const group = conv.kind !== 'direct'
      if (group ? !s.groups : !s.messages) return
      if (conv.groupId && muted().has(conv.groupId)) return
      emit({ title: group ? `${conv.title}` : conv.title, body: group ? `${from.split(' ')[0]}: ${text}` : text, target: { type: 'chat', conversationId: conv.id, messageId } })
    },
    /** Review tool: pretend the server sent a push about a release or an offer. */
    sendTest(kind: 'release' | 'offer') {
      const u = updates.find((x) => x.kind === kind)!
      emit({ title: u.title, body: u.summary, target: { type: 'update', updateId: u.id } })
    },
    reset() {
      writeJson(DISMISSED_KEY, [])
    },
  }
}
