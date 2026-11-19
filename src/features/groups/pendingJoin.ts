const PENDING_KEY = 'te.pendingJoin'

/** Remembers a join link across sign-in or sign-up. */
export const pendingJoin = {
  get(): string | null {
    try { return sessionStorage.getItem(PENDING_KEY) } catch { return null }
  },
  set(token: string) {
    try { sessionStorage.setItem(PENDING_KEY, token) } catch { /* ignore */ }
  },
  clear() {
    try { sessionStorage.removeItem(PENDING_KEY) } catch { /* ignore */ }
  },
}
