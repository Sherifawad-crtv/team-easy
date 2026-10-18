import { variants } from './experiments'
import { summarize, type SummaryRow, type TrackedEvent } from './summary'
import type { ExperimentId } from './experiments'

// Event tracking for A/B tests. Events are always kept on this device (so
// the results page works with no backend) and are also sent to Supabase when
// VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set. The anon key is
// public by design; the database only allows inserts and aggregate reads.

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, '')
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
const LOG_KEY = 'te.events'
const VISITOR_KEY = 'te.visitor'
const MAX_LOCAL = 500

export const remoteEnabled = Boolean(SUPABASE_URL && SUPABASE_KEY)

const uuid = () =>
  typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`

function stored(storage: Storage | undefined, key: string): string {
  try {
    let v = storage?.getItem(key)
    if (!v) {
      v = uuid()
      storage?.setItem(key, v)
    }
    return v
  } catch {
    return uuid()
  }
}

const safe = <T>(get: () => T): T | undefined => {
  try {
    return get()
  } catch {
    return undefined
  }
}

const visitorId = stored(safe(() => localStorage), VISITOR_KEY)
const sessionId = stored(safe(() => sessionStorage), 'te.session-id')
const exposed = new Set<string>()

export function localEvents(): TrackedEvent[] {
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY) ?? '[]') as TrackedEvent[]
  } catch {
    return []
  }
}

function keepLocal(e: TrackedEvent) {
  try {
    const next = [...localEvents(), e].slice(-MAX_LOCAL)
    localStorage.setItem(LOG_KEY, JSON.stringify(next))
  } catch {
    // ignore
  }
}

export function clearLocalEvents() {
  try {
    localStorage.removeItem(LOG_KEY)
  } catch {
    // ignore
  }
}

export function track(event: string, props: Record<string, unknown> = {}) {
  const e: TrackedEvent = {
    id: uuid(),
    at: Date.now(),
    visitor_id: visitorId,
    session_id: sessionId,
    event,
    variants: { ...variants.all() },
    props,
    forced: variants.isForced(),
  }
  keepLocal(e)
  if (remoteEnabled && !e.forced) {
    void fetch(`${SUPABASE_URL}/rest/v1/ab_events`, {
      method: 'POST',
      keepalive: true,
      headers: {
        apikey: SUPABASE_KEY!,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        visitor_id: e.visitor_id,
        session_id: e.session_id,
        event: e.event,
        variants: e.variants,
        props: e.props,
      }),
    }).catch(() => {
      // analytics must never break the app
    })
  }
}

/** Records that this visitor saw an experiment, once per session. */
export function trackExposure(id: ExperimentId) {
  const key = `${id}:${variants.get(id)}`
  if (exposed.has(key)) return
  exposed.add(key)
  track('exposure', { experiment: id })
}

interface RemoteRow {
  experiment: ExperimentId
  variant: 'A' | 'B'
  visitors: number
  opens: number
  messages: number
  avg_ms_to_first_open: number | null
}

export async function loadSummary(): Promise<{ rows: SummaryRow[]; source: 'supabase' | 'this-device' }> {
  if (remoteEnabled) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/ab_summary`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY!,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
    })
    if (!res.ok) throw new Error(`summary ${res.status}`)
    const data = (await res.json()) as RemoteRow[]
    return {
      source: 'supabase',
      rows: data.map((r) => ({
        experiment: r.experiment,
        variant: r.variant,
        visitors: Number(r.visitors),
        opens: Number(r.opens),
        messages: Number(r.messages),
        avgMsToFirstOpen: r.avg_ms_to_first_open === null ? null : Number(r.avg_ms_to_first_open),
      })),
    }
  }
  return { source: 'this-device', rows: summarize(localEvents()) }
}
