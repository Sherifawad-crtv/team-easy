import { useSyncExternalStore } from 'react'
import { scenarioStore } from '../data/mock/scenario'

export function useScenario() {
  return useSyncExternalStore(scenarioStore.subscribe, scenarioStore.get)
}
