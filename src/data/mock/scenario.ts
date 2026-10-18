// Runtime switch that lets a designer flip the mock data between states.

export const SCENARIOS = ['normal', 'empty', 'error', 'slow', 'offline'] as const
export type Scenario = (typeof SCENARIOS)[number]

const KEY = 'te.scenario'
const listeners = new Set<() => void>()

function read(): Scenario {
  try {
    const v = localStorage.getItem(KEY)
    if (v && (SCENARIOS as readonly string[]).includes(v)) return v as Scenario
  } catch {
    // storage can be blocked (private mode); fall through
  }
  return 'normal'
}

let current: Scenario = read()

export const scenarioStore = {
  get: (): Scenario => current,
  set(next: Scenario) {
    current = next
    try {
      localStorage.setItem(KEY, next)
    } catch {
      // ignore
    }
    listeners.forEach((l) => l())
  },
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
}
