// Mock for reporting and blocking (required for apps with user-generated content).

import type { SafetyApi } from '../api'
import { ApiError } from '../errors'
import type { BlockedPerson, ChatEvent, Conversation, Member } from '../types'

const BLOCKED_KEY = 'te.blocked'
const REPORTS_KEY = 'te.reports'

interface Deps {
  gate: (base?: number) => Promise<void>
  conversations: Conversation[]
  members: Member[]
  emit: (e: ChatEvent) => void
}

export function createSafety(deps: Deps) {
  const read = (): BlockedPerson[] => {
    try { return JSON.parse(localStorage.getItem(BLOCKED_KEY) ?? '[]') as BlockedPerson[] } catch { return [] }
  }
  const write = (list: BlockedPerson[]) => {
    try { localStorage.setItem(BLOCKED_KEY, JSON.stringify(list)) } catch { /* lasts for this page */ }
  }
  /** Marks the direct chats of blocked people, and announces the ones that changed. */
  const apply = (announce: boolean) => {
    const ids = new Set(read().map((b) => b.id))
    for (const c of deps.conversations) {
      if (c.kind !== 'direct' || !c.memberId) continue
      const blocked = ids.has(c.memberId)
      if (Boolean(c.blocked) === blocked) continue
      c.blocked = blocked
      if (announce) deps.emit({ type: 'conversation', conversation: { ...c } })
    }
  }
  apply(false)

  const person = (id: string) => {
    const m = deps.members.find((x) => x.id === id)
    const c = deps.conversations.find((x) => x.memberId === id)
    return { id, name: m?.name ?? c?.title ?? 'Someone', jobTitle: m?.jobTitle }
  }

  const api: SafetyApi = {
    async report(input) {
      await deps.gate(500)
      let list: unknown[] = []
      try { list = JSON.parse(localStorage.getItem(REPORTS_KEY) ?? '[]') as unknown[] } catch { /* start fresh */ }
      try { localStorage.setItem(REPORTS_KEY, JSON.stringify([...list, { ...input, at: Date.now() }].slice(-50))) } catch { /* ignore */ }
      if (input.block && input.target.kind !== 'group') {
        const id = input.target.userId
        if (!read().some((b) => b.id === id)) write([...read(), { ...person(id), blockedAt: Date.now() }])
        apply(true)
      }
    },
    async block(userId) {
      await deps.gate(300)
      if (!userId) throw new ApiError('unknown')
      if (!read().some((b) => b.id === userId)) write([...read(), { ...person(userId), blockedAt: Date.now() }])
      apply(true)
    },
    async unblock(userId) {
      await deps.gate(300)
      write(read().filter((b) => b.id !== userId))
      apply(true)
    },
    async blocked() {
      await deps.gate(300)
      return read().sort((a, b) => b.blockedAt - a.blockedAt)
    },
  }
  const forget = () => {
    try { for (const k of [BLOCKED_KEY, REPORTS_KEY]) localStorage.removeItem(k) } catch { /* ignore */ }
    apply(true)
  }
  return { api, forget, isBlocked: (id: string) => read().some((b) => b.id === id) }
}
