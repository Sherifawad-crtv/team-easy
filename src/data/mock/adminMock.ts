// Mock for the admin console: people, invites and the overview. Teams and
// calendars are managed through their own mocks.

import type { AdminApi } from '../api'
import { ApiError } from '../errors'
import type { AdminInvite, AdminMember, Group, InviteStatus, Member } from '../types'
import { roleStore } from './role'
import { scenarioStore } from './scenario'
import { MEMBERS, ME } from './seed'

const DAY = 86_400_000
const KEY = 'te.invites'

const base = (): AdminInvite[] => [
  { code: 'ORG-ACME', link: '', createdAt: Date.now() - 12 * DAY, expiresAt: Date.now() + 18 * DAY, uses: 4, status: 'active' },
  { code: 'ORG-OLD', link: '', email: 'tomas@acme.example', createdAt: Date.now() - 40 * DAY, expiresAt: Date.now() - 10 * DAY, uses: 0, status: 'expired' },
]

const origin = () => (typeof location === 'undefined' ? '' : location.origin)
const linkFor = (code: string) => `${origin()}/invite/${code}`

function load(): AdminInvite[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as AdminInvite[]
  } catch {
    // fall through
  }
  return base()
}

const emailOf = (name: string) => `${name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z\s-]/g, '').trim().split(/\s+/).slice(0, 2).join('.')}@acme.example`

interface Deps {
  gate: (base?: number) => Promise<void>
  /** Main groups with their member counts, and how many groups a person is in. */
  groups: () => Group[]
  groupsOf: (personId: string) => number
  forget: (personId: string) => void
  titleOf: (personId: string) => string | undefined
  activeCalendars: () => number
  limits: () => import('../types').GroupLimits
  org: { id: string; name: string }
}

export function createAdmin(deps: Deps) {
  let invites = load()
  const added = new Map<string, { email: string; titleTag?: string }>()
  const pending = new Set<string>()
  let nextId = 1

  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(invites))
    } catch {
      // lasts for this page only
    }
  }
  const status = (i: AdminInvite): InviteStatus => (i.status === 'revoked' || i.status === 'used' ? i.status : i.expiresAt < Date.now() ? 'expired' : 'active')
  const view = (i: AdminInvite): AdminInvite => ({ ...i, link: linkFor(i.code), status: status(i) })
  const needAdmin = () => {
    if (roleStore.get() !== 'admin') throw new ApiError('not_allowed')
  }

  const toMember = (m: Member): AdminMember => ({
    id: m.id, name: m.name, email: added.get(m.id)?.email ?? emailOf(m.name), jobTitle: m.jobTitle, titleTag: deps.titleOf(m.id),
    groups: deps.groupsOf(m.id), status: pending.has(m.id) ? 'pending' : 'active', isMe: false,
  })

  const api: AdminApi = {
    async overview() {
      await deps.gate(450)
      needAdmin()
      const limits = deps.limits()
      const mains = deps.groups().filter((g) => g.level === 1 && !g.archived)
      return {
        organization: deps.org, members: MEMBERS.length + 1 - pending.size, pendingMembers: pending.size,
        mainGroups: mains.length, activeInvites: invites.filter((i) => status(i) === 'active').length,
        calendars: deps.activeCalendars(), limits,
        nearCap: mains.filter((g) => g.rootMemberCount >= limits.memberCap - 20).map((g) => ({ id: g.id, name: g.name, members: g.rootMemberCount, cap: limits.memberCap })),
      }
    },
    async members(query) {
      await deps.gate(350)
      needAdmin()
      if (scenarioStore.get() === 'empty') return []
      const q = query.trim().toLowerCase()
      const me: AdminMember = { id: ME.id, name: ME.name, email: 'layla@acme.example', jobTitle: 'Product designer', groups: deps.groupsOf(ME.id), status: 'active', isMe: true }
      return [me, ...MEMBERS.map(toMember)].filter((m) => !q || `${m.name} ${m.email}`.toLowerCase().includes(q))
    },
    async addMember(data) {
      await deps.gate(600)
      needAdmin()
      const email = data.email.trim().toLowerCase()
      if (email.startsWith('taken@') || [...added.values()].some((a) => a.email === email) || MEMBERS.some((m) => emailOf(m.name) === email)) throw new ApiError('member_exists')
      const m: Member = { id: `u-new-${nextId++}`, name: data.name.trim(), jobTitle: data.jobTitle?.trim() || undefined, presence: 'offline' }
      MEMBERS.push(m)
      added.set(m.id, { email })
      pending.add(m.id)
      return toMember(m)
    },
    async removeMember(id) {
      await deps.gate(500)
      needAdmin()
      const i = MEMBERS.findIndex((m) => m.id === id)
      if (i < 0) throw new ApiError('unknown')
      MEMBERS.splice(i, 1)
      pending.delete(id)
      added.delete(id)
      deps.forget(id)
    },
    async invites() {
      await deps.gate(350)
      needAdmin()
      if (scenarioStore.get() === 'empty') return []
      return invites.map(view).sort((a, b) => b.createdAt - a.createdAt)
    },
    async createInvite({ email, days }) {
      await deps.gate(500)
      needAdmin()
      const code = `ORG-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
      const inv: AdminInvite = { code, link: '', email: email?.trim() || undefined, createdAt: Date.now(), expiresAt: Date.now() + days * DAY, uses: 0, status: 'active' }
      invites = [inv, ...invites]
      save()
      return view(inv)
    },
    async revokeInvite(code) {
      await deps.gate(400)
      needAdmin()
      const inv = invites.find((i) => i.code === code)
      if (!inv) throw new ApiError('unknown')
      inv.status = 'revoked'
      save()
    },
  }

  return {
    api,
    /** What the invite page needs for a code or link (ACC-04, ACC-05). */
    resolve(linkOrCode: string) {
      const token = linkOrCode.trim().split('/').pop()?.toUpperCase() ?? ''
      const inv = invites.find((i) => i.code === token)
      if (!inv || status(inv) === 'revoked' || status(inv) === 'used') throw new ApiError('invite_invalid')
      if (status(inv) === 'expired') throw new ApiError('invite_expired')
      return inv.code
    },
    /** Someone signed up with it. One-person invites are used up. */
    use(code: string) {
      const inv = invites.find((i) => i.code === code.toUpperCase())
      if (!inv) return
      inv.uses += 1
      if (inv.email) inv.status = 'used'
      save()
    },
    reset() {
      invites = base()
      save()
    },
  }
}
