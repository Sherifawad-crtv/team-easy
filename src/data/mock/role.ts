// Review tool: view the app as an admin or as a regular member.

import type { Role } from '../types'

const KEY = 'te.role'
const listeners = new Set<() => void>()

function read(): Role {
  try {
    return localStorage.getItem(KEY) === 'member' ? 'member' : 'admin'
  } catch {
    return 'admin'
  }
}

let current: Role = read()

export const roleStore = {
  get: (): Role => current,
  set(next: Role) {
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
