// Simulated calls (CLL-01..05). No audio or video moves anywhere: people
// "answer" on a timer, so the whole call flow can be designed and tested.
// Presence decides the outcome when you call someone: online answers,
// away declines, offline does not answer.

import { LIMITS } from '../../config/limits'
import type { CallsApi } from '../api'
import { ApiError } from '../errors'
import type { CallEndReason, CallEvent, CallMode, CallParticipant, CallRecord, CallSession, Conversation, Presence } from '../types'
import { scenarioStore } from './scenario'
import { ME } from './seed'

const USED_KEY = 'te.call.used'
const HISTORY_KEY = 'te.call.history'

interface Person { id: string; name: string; presence: Presence }

interface Deps {
  gate: (base?: number) => Promise<void>
  conversations: Conversation[]
  /** Everyone else in a group chat. */
  rosterOf: (conversationId: string) => Person[]
  /** The other person of a direct chat. */
  directPerson: (conv: Conversation) => Person
}

interface Live {
  call: CallSession
  timers: number[]
  /** Seconds used today before this call started. */
  baseUsed: number
  ring?: number
}

const me = (cameraOn: boolean): CallParticipant => ({ id: ME.id, name: ME.name, state: 'connected', isMe: true, speaking: false, muted: false, cameraOn })
const them = (p: Person, state: CallParticipant['state'], cameraOn: boolean): CallParticipant => ({ id: p.id, name: p.name, state, isMe: false, speaking: false, muted: false, cameraOn })

function readUsed(): { day: string; seconds: number } {
  const today = new Date().toDateString()
  try {
    const v = JSON.parse(localStorage.getItem(USED_KEY) ?? 'null') as { day: string; seconds: number } | null
    if (v && v.day === today) return v
  } catch {
    // fall through
  }
  return { day: today, seconds: 0 }
}
function writeUsed(seconds: number) {
  try {
    localStorage.setItem(USED_KEY, JSON.stringify({ day: new Date().toDateString(), seconds }))
  } catch {
    // lasts for this page only
  }
}
function readHistory(): CallRecord[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]') as CallRecord[]
  } catch {
    return []
  }
}
function writeHistory(list: CallRecord[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, 30)))
  } catch {
    // lasts for this page only
  }
}

export function createCalls(deps: Deps) {
  const listeners = new Set<(e: CallEvent) => void>()
  let live: Live | null = null
  let nextId = 1
  const emit = (e: CallEvent) => listeners.forEach((l) => l(e))
  const clone = (c: CallSession): CallSession => ({ ...c, participants: c.participants.map((p) => ({ ...p })) })

  const elapsed = () => (live?.call.startedAt ? Math.floor((Date.now() - live.call.startedAt) / 1000) : 0)
  const usedNow = () => (live ? live.baseUsed + elapsed() : readUsed().seconds)

  function later(ms: number, fn: () => void) {
    if (!live) return
    live.timers.push(window.setTimeout(fn, ms))
  }

  function setParticipant(id: string, patch: Partial<CallParticipant>) {
    if (!live) return
    const p = live.call.participants.find((x) => x.id === id)
    if (!p) return
    Object.assign(p, patch)
    emit({ type: 'participant', callId: live.call.id, participant: { ...p } })
  }

  function goLive() {
    if (!live || live.call.startedAt) return
    live.call.startedAt = Date.now()
    emit({ type: 'started', callId: live.call.id, startedAt: live.call.startedAt })
    // Who is talking changes every couple of seconds; the daily cap is watched every second.
    const tick = window.setInterval(() => {
      if (!live) return
      if (usedNow() >= LIMITS.callCapSeconds) {
        finish('cap_reached')
        return
      }
      const talking = live.call.participants.filter((p) => p.state === 'connected' && !p.isMe && !p.muted)
      for (const p of live.call.participants) if (p.speaking && !talking.includes(p)) setParticipant(p.id, { speaking: false })
      const next = talking[Math.floor(Math.random() * talking.length)]
      for (const p of talking) if (p.speaking && p !== next) setParticipant(p.id, { speaking: false })
      if (next && Math.random() < 0.7) setParticipant(next.id, { speaking: !next.speaking })
    }, 1800)
    live.timers.push(tick)
  }

  function record(direction: CallRecord['direction'], seconds: number, call: CallSession): CallRecord {
    const rec: CallRecord = {
      id: call.id, conversationId: call.conversationId, title: call.title, mode: call.mode, group: call.group,
      direction, startedAt: call.startedAt ?? Date.now(), seconds,
    }
    writeHistory([rec, ...readHistory()])
    return rec
  }

  function finish(reason: CallEndReason): CallRecord | null {
    if (!live) return null
    const l = live
    live = null
    l.timers.forEach((t) => { window.clearTimeout(t); window.clearInterval(t) })
    if (l.ring) window.clearTimeout(l.ring)
    const seconds = l.call.startedAt ? Math.floor((Date.now() - l.call.startedAt) / 1000) : 0
    if (seconds > 0) writeUsed(Math.min(LIMITS.callCapSeconds, l.baseUsed + seconds))
    const missed = reason === 'no_answer' || reason === 'declined'
    const rec = record(missed ? 'missed' : l.call.direction, seconds, l.call)
    emit({ type: 'ended', callId: l.call.id, reason, seconds })
    return rec
  }

  /** Someone you rang answers, declines or does not pick up. */
  function plan(call: CallSession, people: Person[], group: boolean) {
    const video = call.mode === 'video'
    let delay = 1800
    let anyone = false
    people.forEach((p) => {
      if (p.presence === 'online') {
        anyone = true
        later(delay, () => { setParticipant(p.id, { state: 'connected', cameraOn: video }); goLive() })
        delay += 2200
      } else if (p.presence === 'away') {
        later(2600 + delay / 2, () => {
          setParticipant(p.id, { state: 'declined' })
          if (!group) finish('declined')
        })
      } else {
        later(group ? 9000 : 8000, () => {
          setParticipant(p.id, { state: 'no_answer' })
          if (!group) finish('no_answer')
        })
      }
    })
    // A group call nobody joins ends by itself.
    if (group) {
      later(14000, () => {
        if (live && !live.call.startedAt) finish('no_answer')
      })
    } else if (!anyone && people.length === 0) {
      later(500, () => finish('failed'))
    }
  }

  const api: CallsApi = {
    async usage() {
      await deps.gate(250)
      const next = new Date()
      next.setHours(24, 0, 0, 0)
      return { usedSeconds: Math.min(LIMITS.callCapSeconds, usedNow()), capSeconds: LIMITS.callCapSeconds, resetsAt: next.getTime() }
    },
    async start(conversationId, mode: CallMode) {
      await deps.gate(450)
      if (live) throw new ApiError('call_active')
      const conv = deps.conversations.find((c) => c.id === conversationId)
      if (!conv || conv.kind === 'general' || conv.left) throw new ApiError('call_unavailable')
      if (readUsed().seconds >= LIMITS.callCapSeconds) throw new ApiError('call_cap_reached')
      const group = conv.kind !== 'direct'
      const video = mode === 'video'
      const people = group
        ? deps.rosterOf(conv.id).sort((a, b) => Number(b.presence === 'online') - Number(a.presence === 'online')).slice(0, LIMITS.maxCallParticipants - 1)
        : [deps.directPerson(conv)]
      const call: CallSession = {
        id: `call-${nextId++}`, conversationId: conv.id, title: conv.title, mode, group, direction: 'outgoing',
        participants: [me(video), ...people.map((p) => them(p, 'ringing', false))], startedAt: null,
      }
      live = { call, timers: [], baseUsed: readUsed().seconds }
      plan(call, people, group)
      return clone(call)
    },
    async answer(callId) {
      await deps.gate(300)
      if (!live || live.call.id !== callId) throw new ApiError('call_unavailable')
      if (live.ring) window.clearTimeout(live.ring)
      const me = live.call.participants.find((p) => p.isMe)!
      me.state = 'connected'
      me.cameraOn = live.call.mode === 'video'
      live.call.direction = 'incoming'
      goLive()
      // The people already on the call are connected; for a group a couple more join.
      return clone(live.call)
    },
    async decline(callId) {
      await deps.gate(150)
      if (!live || live.call.id !== callId) return
      finish('declined')
    },
    async end(callId) {
      await deps.gate(200)
      if (!live || live.call.id !== callId) {
        const last = readHistory()[0]
        if (last && last.id === callId) return last
        throw new ApiError('call_unavailable')
      }
      return finish('ended')!
    },
    async history() {
      await deps.gate(350)
      if (scenarioStore.get() === 'empty') return []
      return readHistory()
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }

  return {
    api,
    /** Review tool: someone calls you. A group call arrives with others already on it. */
    simulateIncoming(kind: 'direct' | 'group', mode: CallMode) {
      if (live) return
      const conv = deps.conversations.find((c) => c.id === (kind === 'group' ? 'c-product' : 'c-omar'))
      if (!conv) return
      const group = kind === 'group'
      const video = mode === 'video'
      const caller: Person = group ? deps.rosterOf(conv.id).find((p) => p.presence === 'online') ?? deps.rosterOf(conv.id)[0] : deps.directPerson(conv)
      const others = group ? deps.rosterOf(conv.id).filter((p) => p.id !== caller.id && p.presence === 'online').slice(0, 2) : []
      const call: CallSession = {
        id: `call-${nextId++}`, conversationId: conv.id, title: conv.title, mode, group, direction: 'incoming',
        participants: [{ ...me(video), state: 'ringing' }, them(caller, 'connected', video), ...others.map((p) => them(p, 'connected', video))],
        startedAt: null,
      }
      live = { call, timers: [], baseUsed: readUsed().seconds }
      live.ring = window.setTimeout(() => finish('no_answer'), 30_000)
      emit({ type: 'incoming', call: clone(call) })
    },
    /** Review tool: leave only this many seconds of today's calling time. */
    setRemaining(seconds: number | null) {
      const used = seconds === null ? 0 : Math.max(0, LIMITS.callCapSeconds - seconds)
      writeUsed(used)
      // During a call the total so far includes the time already spent in it.
      if (live) live.baseUsed = Math.max(0, used - elapsed())
    },
    reset() {
      writeUsed(0)
      writeHistory([])
    },
  }
}
