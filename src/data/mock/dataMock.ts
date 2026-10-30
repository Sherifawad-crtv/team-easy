// Mock for retention notices and backups (DAT-01, DAT-02, DAT-04).

import type { DataApi } from '../api'
import { LIMITS } from '../../config/limits'
import type { ExpiringFile, IdentityKind, Message, Conversation } from '../types'
import { scenarioStore } from './scenario'
import { ME } from './seed'

const BACKUP_KEY = 'te.backup'

interface Deps {
  gate: (base?: number) => Promise<void>
  identity: () => IdentityKind
  conversations: Conversation[]
  messagesFor: (conversationId: string) => Message[]
}

export function createData(deps: Deps) {
  const readBackup = (): { at: number | null; size: number | null } => {
    try {
      return JSON.parse(localStorage.getItem(BACKUP_KEY) ?? 'null') ?? { at: null, size: null }
    } catch {
      return { at: null, size: null }
    }
  }

  const api: DataApi = {
    async retention() {
      await deps.gate(250)
      const business = deps.identity() === 'organization'
      return {
        plan: business ? 'business' : 'standard',
        attachmentDays: LIMITS.attachmentRetentionDays[business ? 'business' : 'standard'],
        archivedDays: LIMITS.archivedRetentionDays,
      }
    },
    async expiringFiles() {
      await deps.gate(400)
      if (scenarioStore.get() === 'empty') return []
      const out: ExpiringFile[] = []
      for (const c of deps.conversations) {
        for (const m of deps.messagesFor(c.id)) {
          const a = m.attachment
          if (!a || a.expired || !a.expiresAt || m.senderId === ME.id) continue
          out.push({ conversationId: c.id, conversationTitle: c.title, messageId: m.id, name: a.name, kind: a.kind, size: a.size, expiresAt: a.expiresAt })
        }
      }
      return out.sort((a, b) => a.expiresAt - b.expiresAt)
    },
    async backup() {
      await deps.gate(300)
      const b = readBackup()
      return { lastBackupAt: b.at, sizeBytes: b.size }
    },
    async startBackup() {
      await deps.gate(2600)
      const size = 38_400_000 + Math.floor(Math.random() * 4_000_000)
      const at = Date.now()
      try {
        localStorage.setItem(BACKUP_KEY, JSON.stringify({ at, size }))
      } catch {
        // lasts for this page only
      }
      return { lastBackupAt: at, sizeBytes: size }
    },
    async transferCode() {
      await deps.gate(600)
      const code = String(Math.floor(100_000 + Math.random() * 900_000))
      return { code, expiresAt: Date.now() + LIMITS.transferCodeMinutes * 60_000 }
    },
  }
  return api
}
