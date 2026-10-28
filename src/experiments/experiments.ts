import { useSyncExternalStore } from 'react'

// A/B experiments. Each visitor is assigned a variant once, at random, and
// keeps it. A link such as `?v_chat_list=B` or the debug panel can force a
// variant for review; forced sessions are marked and left out of results.

export const EXPERIMENTS = {
  chat_list: {
    label: 'Chat list layout',
    A: 'Plain list, newest first',
    B: 'Filter chips and a pinned announcements card',
  },
  conversation: {
    label: 'Conversation layout',
    A: 'A time inside every message',
    B: 'Messages grouped, time on tap',
  },
} as const

export type ExperimentId = keyof typeof EXPERIMENTS
export type Variant = 'A' | 'B'
export const EXPERIMENT_IDS = Object.keys(EXPERIMENTS) as ExperimentId[]

const ASSIGN_KEY = 'te.variants'
const OVERRIDE_KEY = 'te.override'

type VariantMap = Record<ExperimentId, Variant>

function readJson<T>(storage: Storage | undefined, key: string): Partial<T> {
  try {
    const raw = storage?.getItem(key)
    return raw ? (JSON.parse(raw) as Partial<T>) : {}
  } catch {
    return {}
  }
}

function writeJson(storage: Storage | undefined, key: string, value: unknown) {
  try {
    storage?.setItem(key, JSON.stringify(value))
  } catch {
    // storage blocked: assignment lasts for this page load only
  }
}

const safe = <T>(get: () => T): T | undefined => {
  try {
    return get()
  } catch {
    return undefined
  }
}

function coin(): Variant {
  const buf = new Uint8Array(1)
  crypto.getRandomValues(buf)
  return buf[0] % 2 === 0 ? 'A' : 'B'
}

const isVariant = (v: unknown): v is Variant => v === 'A' || v === 'B'

function load() {
  const stored = readJson<VariantMap>(safe(() => localStorage), ASSIGN_KEY)
  const assigned = {} as VariantMap
  for (const id of EXPERIMENT_IDS) assigned[id] = isVariant(stored[id]) ? stored[id] : coin()
  writeJson(safe(() => localStorage), ASSIGN_KEY, assigned)

  const overrides = readJson<VariantMap>(safe(() => sessionStorage), OVERRIDE_KEY)
  const params = new URLSearchParams(typeof location === 'undefined' ? '' : location.search)
  for (const id of EXPERIMENT_IDS) {
    const q = params.get(`v_${id}`)
    if (isVariant(q)) overrides[id] = q
  }
  writeJson(safe(() => sessionStorage), OVERRIDE_KEY, overrides)
  return { assigned, overrides }
}

let state = load()
let effective = compute()
const listeners = new Set<() => void>()

function compute(): VariantMap {
  const out = {} as VariantMap
  for (const id of EXPERIMENT_IDS) out[id] = state.overrides[id] ?? state.assigned[id]
  return out
}

function notify() {
  effective = compute()
  listeners.forEach((l) => l())
}

export const variants = {
  all: (): VariantMap => effective,
  get: (id: ExperimentId): Variant => effective[id],
  isForced: (): boolean => EXPERIMENT_IDS.some((id) => state.overrides[id] !== undefined),
  setOverride(id: ExperimentId, v: Variant | null) {
    const overrides = { ...state.overrides }
    if (v) overrides[id] = v
    else delete overrides[id]
    state = { ...state, overrides }
    writeJson(safe(() => sessionStorage), OVERRIDE_KEY, overrides)
    notify()
  },
  subscribe(l: () => void) {
    listeners.add(l)
    return () => listeners.delete(l)
  },
}

export function useVariant(id: ExperimentId): Variant {
  return useSyncExternalStore(variants.subscribe, () => variants.get(id))
}

/** Test helper. */
export function resetExperiments() {
  state = load()
  notify()
}
