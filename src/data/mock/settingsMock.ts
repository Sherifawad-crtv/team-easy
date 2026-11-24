// Mock for privacy settings, password change and data export requests.

import type { SettingsApi } from '../api'
import { LEGAL } from '../../config/legal'
import { ApiError } from '../errors'
import type { DataExport, PrivacySettings } from '../types'

const PRIVACY_KEY = 'te.privacy'
const EXPORT_KEY = 'te.export'
const DAY = 24 * 60 * 60 * 1000

const DEFAULTS: PrivacySettings = { onlineStatus: 'everyone', profilePhoto: 'everyone', jobTitle: 'everyone', addToGroups: 'everyone' }

interface Deps {
  gate: (base?: number) => Promise<void>
  email: () => string
}

export function createSettings(deps: Deps) {
  const read = (): PrivacySettings => {
    try {
      return { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(PRIVACY_KEY) ?? '{}') as Partial<PrivacySettings>) }
    } catch {
      return { ...DEFAULTS }
    }
  }
  const api: SettingsApi = {
    async privacy() {
      await deps.gate(250)
      return read()
    },
    async savePrivacy(patch) {
      await deps.gate(300)
      const next = { ...read(), ...patch }
      try { localStorage.setItem(PRIVACY_KEY, JSON.stringify(next)) } catch { /* lasts for this page */ }
      return next
    },
    async changePassword(current) {
      await deps.gate(500)
      // Same rule as sign in: this one password is "wrong" in the mock.
      if (current === 'wrongpass1') throw new ApiError('invalid_credentials')
    },
    async exportStatus() {
      await deps.gate(250)
      try { return JSON.parse(localStorage.getItem(EXPORT_KEY) ?? 'null') as DataExport | null } catch { return null }
    },
    async requestExport() {
      await deps.gate(600)
      const now = Date.now()
      const request: DataExport = { requestedAt: now, readyBy: now + LEGAL.exportDays * DAY, email: deps.email() }
      try { localStorage.setItem(EXPORT_KEY, JSON.stringify(request)) } catch { /* lasts for this page */ }
      return request
    },
  }
  /** Account deleted: forget everything this account held. */
  const forget = () => {
    try { for (const k of [PRIVACY_KEY, EXPORT_KEY]) localStorage.removeItem(k) } catch { /* ignore */ }
  }
  return { api, forget }
}
