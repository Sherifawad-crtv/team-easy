import { useSyncExternalStore } from 'react'
import { roleStore } from '../data/mock/role'

/** Review tool only. Real roles come from the server on each group. */
export function useReviewRole() {
  return useSyncExternalStore(roleStore.subscribe, roleStore.get)
}
