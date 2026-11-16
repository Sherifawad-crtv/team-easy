import { useSyncExternalStore } from 'react'
import { EXPERIMENTS, EXPERIMENT_IDS, type ExperimentId } from '../experiments/experiments'

// The designer's decision on each experiment, kept on this device, so the final
// choice can be read out in one go.

export type Pick = 'A' | 'B' | 'unsure'
export interface Verdict { pick: Pick; note: string; at: number }
export type Verdicts = Partial<Record<ExperimentId, Verdict>>

const KEY = 'te.verdicts'
const listeners = new Set<() => void>()
let snapshot: Verdicts = read()

function read(): Verdicts {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Verdicts
  } catch {
    return {}
  }
}
function commit(next: Verdicts) {
  snapshot = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // lasts for this page only
  }
  listeners.forEach((l) => l())
}

export const verdicts = {
  get: (): Verdicts => snapshot,
  set(id: ExperimentId, pick: Pick, note?: string) {
    commit({ ...snapshot, [id]: { pick, note: note ?? snapshot[id]?.note ?? '', at: Date.now() } })
  },
  setNote(id: ExperimentId, note: string) {
    const v = snapshot[id]
    commit({ ...snapshot, [id]: { pick: v?.pick ?? 'unsure', note, at: Date.now() } })
  },
  clear() {
    commit({})
  },
  subscribe(l: () => void) {
    listeners.add(l)
    return () => listeners.delete(l)
  },
  /** Test helper: forget what is in memory and read storage again. */
  reload() {
    snapshot = read()
    listeners.forEach((l) => l())
  },
}

export const useVerdicts = () => useSyncExternalStore(verdicts.subscribe, verdicts.get)

const LABEL = { A: 'A', B: 'B', unsure: 'Not sure yet' } as const

/** The text the designer sends back: one line per experiment, with the option that was picked and why. */
export function summaryText(v: Verdicts, info: Record<ExperimentId, { a: string; b: string }>): string {
  const lines = EXPERIMENT_IDS.map((id) => {
    const x = v[id]
    const pick = x ? LABEL[x.pick] : 'Not decided'
    const what = x?.pick === 'A' ? ` (${info[id].a})` : x?.pick === 'B' ? ` (${info[id].b})` : ''
    return `${EXPERIMENTS[id].label}: ${pick}${what}${x?.note ? `. Note: ${x.note}` : ''}`
  })
  return `A/B decisions\n${lines.join('\n')}`
}

export const decidedCount = (v: Verdicts) => EXPERIMENT_IDS.filter((id) => v[id] && v[id]!.pick !== 'unsure').length
