import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { api } from '../data'
import { LIMITS } from '../config/limits'
import type { CallEndReason, CallEvent, CallMode, CallParticipant, CallSession } from '../data/types'
import { track } from '../experiments/analytics'

export interface EndedCall {
  reason: CallEndReason
  seconds: number
  title: string
  mode: CallMode
  conversationId: string
}

interface CallsValue {
  /** The call you are in or are being called for. */
  call: CallSession | null
  /** Ringing for you: answer or decline. */
  incoming: boolean
  /** The call was minimized to the bar at the top. */
  minimized: boolean
  setMinimized: (v: boolean) => void
  /** Chosen but not started yet: waiting for permission or an answer from the server. */
  preparing: { conversationId: string; mode: CallMode } | null
  begin: (conversationId: string, mode: CallMode) => void
  cancelPrepare: () => void
  /** Called by the prepare sheet once permissions are sorted. */
  start: (conversationId: string, mode: CallMode, opts?: { cameraOn?: boolean }) => Promise<unknown>
  answer: () => Promise<void>
  decline: () => Promise<void>
  hangUp: () => Promise<void>
  ended: EndedCall | null
  dismissEnded: () => void
  /** Seconds since the call went live. */
  elapsed: number
  /** Seconds of today's calling time left, counting this call. Null until known. */
  remaining: number | null
  muted: boolean
  cameraOn: boolean
  speaker: boolean
  toggleMute: () => void
  toggleCamera: () => void
  toggleSpeaker: () => void
}

const Ctx = createContext<CallsValue | null>(null)

export function useCalls(): CallsValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useCalls must be used inside CallsProvider')
  return v
}

const apply = (call: CallSession, p: CallParticipant): CallSession => ({
  ...call,
  participants: call.participants.some((x) => x.id === p.id) ? call.participants.map((x) => (x.id === p.id ? p : x)) : [...call.participants, p],
})

/** Holds the one call you can be in at a time. Lives above every screen, so a call survives navigation. */
export function CallsProvider({ children }: { children: ReactNode }) {
  const [call, setCall] = useState<CallSession | null>(null)
  const [incoming, setIncoming] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [preparing, setPreparing] = useState<{ conversationId: string; mode: CallMode } | null>(null)
  const [ended, setEnded] = useState<EndedCall | null>(null)
  const [muted, setMuted] = useState(false)
  const [cameraOn, setCameraOn] = useState(false)
  const [speaker, setSpeaker] = useState(false)
  const [now, setNow] = useState(Date.now())
  const [usedAtStart, setUsedAtStart] = useState<number | null>(null)
  const ref = useRef<CallSession | null>(null)
  ref.current = call

  const live = call?.startedAt != null && !incoming
  useEffect(() => {
    if (!live) return
    const t = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [live])

  const refreshUsage = useCallback(() => {
    void api.calls.usage().then((u) => setUsedAtStart(u.usedSeconds), () => undefined)
  }, [])

  useEffect(
    () =>
      api.calls.subscribe((e: CallEvent) => {
        if (e.type === 'incoming') {
          setCall(e.call)
          setIncoming(true)
          setMinimized(false)
          setEnded(null)
          setMuted(false)
          setCameraOn(e.call.mode === 'video')
          setSpeaker(e.call.mode === 'video')
          refreshUsage()
          track('call_incoming', { mode: e.call.mode, group: e.call.group })
          return
        }
        const cur = ref.current
        if (!cur || ('callId' in e && e.callId !== cur.id)) return
        // Several events can arrive in one go, so each update builds on the latest call.
        if (e.type === 'started') setCall((c) => (c ? { ...c, startedAt: e.startedAt } : c))
        else if (e.type === 'participant') setCall((c) => (c ? apply(c, e.participant) : c))
        else if (e.type === 'ended') {
          // A call you never picked up (missed or declined) needs no summary.
          if (!(cur.direction === 'incoming' && !cur.startedAt)) setEnded({ reason: e.reason, seconds: e.seconds, title: cur.title, mode: cur.mode, conversationId: cur.conversationId })
          setCall(null)
          setIncoming(false)
          setMinimized(false)
          track('call_ended', { reason: e.reason, seconds: e.seconds, mode: cur.mode, group: cur.group })
        }
      }),
    [refreshUsage],
  )

  const start = useCallback(async (conversationId: string, mode: CallMode, opts?: { cameraOn?: boolean }) => {
    const session = await api.calls.start(conversationId, mode)
    setPreparing(null)
    setEnded(null)
    setCall(session)
    setIncoming(false)
    setMinimized(false)
    setMuted(false)
    setCameraOn(mode === 'video' && opts?.cameraOn !== false)
    setSpeaker(mode === 'video')
    refreshUsage()
    track('call_started', { mode, group: session.group })
    return session
  }, [refreshUsage])

  const value = useMemo<CallsValue>(() => {
    const elapsed = call?.startedAt ? Math.max(0, Math.floor((now - call.startedAt) / 1000)) : 0
    const remaining = usedAtStart === null ? null : Math.max(0, LIMITS.callCapSeconds - usedAtStart - elapsed)
    return {
      call, incoming, minimized, setMinimized, preparing,
      begin: (conversationId, mode) => { if (!ref.current) { setEnded(null); setPreparing({ conversationId, mode }) } },
      cancelPrepare: () => setPreparing(null),
      start,
      answer: async () => {
        const cur = ref.current
        if (!cur) return
        const s = await api.calls.answer(cur.id)
        setCall(s)
        setIncoming(false)
        track('call_answered', { mode: s.mode, group: s.group })
      },
      decline: async () => {
        const cur = ref.current
        if (!cur) return
        await api.calls.decline(cur.id)
      },
      hangUp: async () => {
        const cur = ref.current
        if (!cur) return
        try {
          await api.calls.end(cur.id)
        } catch {
          setCall(null)
        }
      },
      ended, dismissEnded: () => setEnded(null),
      elapsed, remaining, muted, cameraOn, speaker,
      toggleMute: () => setMuted((m) => !m),
      toggleCamera: () => setCameraOn((c) => !c),
      toggleSpeaker: () => setSpeaker((s) => !s),
    }
  }, [call, incoming, minimized, preparing, start, ended, now, usedAtStart, muted, cameraOn, speaker])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
