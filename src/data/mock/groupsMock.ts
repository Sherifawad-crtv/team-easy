// Mock for groups, roles, invites and title tags. Lives next to mockApi and
// shares its chat state, so a new group shows up in the chat list.

import type { GroupApi } from '../api'
import { LIMITS } from '../../config/limits'
import { ApiError } from '../errors'
import type {
  ChatEvent,
  Conversation,
  Group,
  GroupLevel,
  GroupLinkInfo,
  GroupMember,
  Member,
  Message,
} from '../types'
import { roleStore } from './role'
import { scenarioStore } from './scenario'
import { MEMBERS, ME } from './seed'

interface Row {
  id: string
  name: string
  parentId: string | null
  /** Member count as shown. For a main group it covers all of its sub-groups. */
  count: number
  /** People we can list by name. Often fewer than `count`. */
  roster: string[]
  convId?: string
  archived?: boolean
  /** When it was archived, for the automatic deletion date (DAT-04). */
  archivedAt?: number
  /** The user left but kept the group in the list. */
  left?: boolean
  /** The user left and deleted it for themselves. */
  hidden?: boolean
  deletedAt?: number
  /** Only shown to admins until the user joins. */
  joined: boolean
}

const people = (...ids: string[]) => ids

const seed = (): Row[] => [
  { id: 'g-product', name: 'Product Team', parentId: null, count: 24, convId: 'c-product', joined: true,
    roster: people('u-priya', 'u-jonas', 'u-noor', 'u-yuki', 'u-sam', 'u-amelia', 'u-maya', 'u-omar', ME.id) },
  { id: 'g-mobile', name: 'Mobile design', parentId: 'g-product', count: 6, convId: 'c-design-mobile', joined: true,
    roster: people('u-jonas', 'u-priya', 'u-noor', 'u-yuki', 'u-amelia', ME.id) },
  { id: 'g-motion', name: 'Motion', parentId: 'g-mobile', count: 3, joined: false, roster: people('u-jonas', 'u-noor') },
  { id: 'g-dsys', name: 'Design systems', parentId: 'g-mobile', count: 4, joined: true, roster: people('u-priya', 'u-noor', ME.id) },
  { id: 'g-research', name: 'Research', parentId: 'g-product', count: 8, joined: false, roster: people('u-amelia', 'u-priya', 'u-fatima') },
  { id: 'g-growth', name: 'Growth', parentId: 'g-product', count: 9, joined: false, roster: people('u-marco', 'u-daniel') },
  { id: 'g-guild', name: 'Design guild', parentId: 'g-product', count: 11, joined: false, roster: people('u-jonas', 'u-noor', 'u-priya') },
  { id: 'g-eng', name: 'Engineering', parentId: null, count: 46, joined: true,
    roster: people('u-omar', 'u-ivan', 'u-yuki', 'u-sam', 'u-daniel', ME.id) },
  { id: 'g-backend', name: 'Backend', parentId: 'g-eng', count: 12, joined: false, roster: people('u-ivan', 'u-omar') },
  { id: 'g-ios', name: 'iOS', parentId: 'g-eng', count: 7, joined: false, roster: people('u-yuki') },
  { id: 'g-android', name: 'Android', parentId: 'g-eng', count: 7, joined: false, roster: people('u-daniel') },
  { id: 'g-qa', name: 'QA', parentId: 'g-eng', count: 5, joined: false, roster: people('u-sam') },
  { id: 'g-platform', name: 'Platform', parentId: 'g-eng', count: 6, joined: false, roster: people('u-ivan') },
  { id: 'g-api', name: 'API', parentId: 'g-backend', count: 5, joined: false, roster: people('u-ivan') },
  { id: 'g-launch', name: 'Q4 Launch Working Group: cross-functional coordination and release planning', parentId: null, count: 296,
    convId: 'c-launch', joined: true, roster: people('u-sam', 'u-priya', 'u-omar', 'u-amelia', 'u-marco', ME.id) },
  { id: 'g-support', name: 'Support rota', parentId: null, count: 12, convId: 'c-support', joined: true,
    roster: people('u-fatima', 'u-marco', 'u-amelia', ME.id) },
  { id: 'g-ops', name: 'Operations', parentId: null, count: 19, joined: true, roster: people('u-maya', 'u-tomas', 'u-leila', ME.id) },
  { id: 'g-finance', name: 'Finance close', parentId: 'g-ops', count: 5, convId: 'c-finance', joined: true,
    roster: people('u-tomas', 'u-maya', ME.id) },
  { id: 'g-offsite', name: '2025 Offsite', parentId: null, count: 22, archived: true, archivedAt: Date.now() - 20 * 86_400_000, joined: true, roster: people('u-maya', 'u-tomas', ME.id) },
]

export interface GroupDeps {
  conversations: Conversation[]
  history: Map<string, Message[]>
  emit: (e: ChatEvent) => void
  gate: (base?: number) => Promise<void>
}

export function createGroups(deps: GroupDeps) {
  const { conversations, history, emit, gate } = deps
  let rows = seed()
  let nextGroup = 1
  const blocked = new Set<string>() // `${groupId}:${memberId}`
  const titles = new Map<string, string>([
    ['u-omar', 'Lead'], ['u-priya', 'Product owner'], ['u-sam', 'QA lead'],
  ])
  /** Chats of archived groups stay out of the chat list. */
  const hiddenConvs = new Set<string>(['c-g-offsite'])
  const stashedConvs = new Map<string, Conversation>()
  const links = new Map<string, string>() // token -> group id

  for (const r of rows) {
    const c = conversations.find((x) => x.id === r.convId)
    if (c) c.groupId = r.id
  }

  const byId = (id: string) => {
    const row = rows.find((r) => r.id === id && !r.deletedAt)
    if (!row) throw new ApiError('unknown')
    return row
  }
  const levelOf = (row: Row): GroupLevel => (row.parentId ? (byId(row.parentId).parentId ? 3 : 2) : 1)
  const rootOf = (row: Row): Row => (row.parentId ? rootOf(byId(row.parentId)) : row)
  const chainOf = (row: Row): Row[] => (row.parentId ? [...chainOf(byId(row.parentId)), row] : [row])
  const childrenOf = (id: string | null) => rows.filter((r) => r.parentId === id && !r.deletedAt && !r.archived)
  const convIdOf = (row: Row) => row.convId ?? `c-${row.id}`
  const isAdmin = () => roleStore.get() === 'admin'
  const mine = (r: Row) => r.joined && !r.hidden

  const visible = (r: Row) => !r.deletedAt && !r.hidden && (isAdmin() || mine(r))
  const myCount = () => rows.filter((r) => !r.deletedAt && !r.archived && mine(r) && !r.left).length

  function toGroup(r: Row): Group {
    const conv = conversations.find((c) => c.id === convIdOf(r))
    return {
      id: r.id, name: r.name, parentId: r.parentId, level: levelOf(r),
      memberCount: r.count, rootMemberCount: rootOf(r).count,
      myRole: roleStore.get(), archived: Boolean(r.archived),
      deleteAt: r.archived && r.archivedAt ? r.archivedAt + LIMITS.archivedRetentionDays * 86_400_000 : undefined, left: Boolean(r.left),
      unread: conv?.unread ?? 0,
    }
  }

  function ensureConv(r: Row): Conversation {
    const id = convIdOf(r)
    let conv = conversations.find((c) => c.id === id)
    if (!conv) {
      conv = {
        id, kind: r.parentId ? 'subgroup' : 'group', title: r.name,
        parent: r.parentId ? byId(r.parentId).name : undefined,
        memberCount: r.count, lastMessage: '', lastAt: Date.now(), unread: 0,
      }
      conversations.push(conv)
      history.set(id, [])
    }
    conv.groupId = r.id
    if (r.left) conv.left = true
    return conv
  }

  function requireAdmin() {
    if (!isAdmin()) throw new ApiError('not_allowed')
  }

  function addToChain(r: Row, personId: string) {
    for (const row of chainOf(r)) {
      if (!row.roster.includes(personId)) {
        row.roster.push(personId)
        if (row.id === r.id || row.parentId === null) row.count += 1
      }
      if (personId === ME.id) row.joined = true
    }
  }

  function descendants(id: string): Row[] {
    return rows.filter((r) => r.parentId === id).flatMap((c) => [c, ...descendants(c.id)])
  }

  function linkInfo(token: string): GroupLinkInfo {
    const gid = links.get(token) ?? (token.startsWith('G-') ? token.slice(2) : '')
    const r = rows.find((x) => x.id === gid && !x.deletedAt && !x.archived)
    if (!r) throw new ApiError('link_invalid')
    return {
      token, groupId: r.id, groupName: r.name,
      path: chainOf(r).slice(0, -1).map((x) => x.name),
      memberCount: r.count, invitedBy: 'Omar Al-Fayed', alreadyMember: mine(r) && !r.left,
    }
  }

  const api: GroupApi = {
    async list() {
      await gate()
      if (scenarioStore.get() === 'empty') return { groups: [], myGroupCount: 0 }
      return { groups: rows.filter(visible).map(toGroup), myGroupCount: myCount() }
    },
    async get(id) {
      await gate(300)
      return toGroup(byId(id))
    },
    async create({ name, parentId }) {
      await gate(500)
      requireAdmin()
      const clean = name.trim()
      const parent = parentId ? byId(parentId) : null
      const level = (parent ? levelOf(parent) + 1 : 1) as number
      if (level > 3) throw new ApiError('limit_depth')
      const siblings = rows.filter((r) => r.parentId === parentId && !r.deletedAt)
      if (siblings.some((r) => r.name.toLowerCase() === clean.toLowerCase())) throw new ApiError('name_taken')
      if (childrenOf(parentId).length >= LIMITS.maxChildren[level as GroupLevel]) throw new ApiError('limit_children')
      if (myCount() >= LIMITS.maxGroupsPerUser) throw new ApiError('limit_user_groups')
      const row: Row = { id: `g-new-${nextGroup++}`, name: clean, parentId, count: 1, roster: [ME.id], joined: true }
      rows.push(row)
      const conv = ensureConv(row)
      emit({ type: 'conversation', conversation: { ...conv } })
      return toGroup(row)
    },
    async archive(id, archived) {
      await gate(400)
      requireAdmin()
      const row = byId(id)
      if (!archived && childrenOf(row.parentId).length >= LIMITS.maxChildren[levelOf(row)]) {
        throw new ApiError('limit_children')
      }
      for (const r of [row, ...descendants(id)]) {
        r.archived = archived
        r.archivedAt = archived ? Date.now() : undefined
        if (archived) hiddenConvs.add(convIdOf(r))
        else hiddenConvs.delete(convIdOf(r))
      }
      return toGroup(row)
    },
    async remove(id) {
      await gate(400)
      requireAdmin()
      const row = byId(id)
      const stamp = Date.now()
      for (const r of [row, ...descendants(id)]) {
        r.deletedAt = stamp
        const i = conversations.findIndex((c) => c.id === convIdOf(r))
        if (i >= 0) stashedConvs.set(r.id, conversations.splice(i, 1)[0])
      }
      return { undoToken: `${id}@${stamp}`, name: row.name }
    },
    async undoDelete(token) {
      await gate(250)
      const [id, stampText] = token.split('@')
      const stamp = Number(stampText)
      const row = rows.find((r) => r.id === id)
      if (!row || row.deletedAt !== stamp) throw new ApiError('unknown')
      if (Date.now() - stamp > (LIMITS.undoWindowSeconds + 2) * 1000) throw new ApiError('undo_expired')
      for (const r of [row, ...descendants(id)]) {
        if (r.deletedAt !== stamp) continue
        r.deletedAt = undefined
        const conv = stashedConvs.get(r.id)
        if (conv) {
          conversations.push(conv)
          stashedConvs.delete(r.id)
        }
      }
      return toGroup(row)
    },
    async openChat(id) {
      await gate(300)
      return { ...ensureConv(byId(id)) }
    },
    async members(id) {
      await gate(350)
      const row = byId(id)
      return row.roster.map((pid): GroupMember => {
        const m = MEMBERS.find((x) => x.id === pid)
        const isMe = pid === ME.id
        return {
          id: pid, name: isMe ? ME.name : (m?.name ?? pid), jobTitle: isMe ? 'Product designer' : m?.jobTitle,
          titleTag: titles.get(pid), role: isMe ? roleStore.get() : pid === 'u-omar' ? 'admin' : 'member',
          blocked: blocked.has(`${id}:${pid}`), presence: m?.presence ?? 'online', isMe,
        }
      }).sort((a, b) => Number(b.isMe) - Number(a.isMe) || a.name.localeCompare(b.name))
    },
    async candidates(id, query) {
      await gate(250)
      const row = byId(id)
      const q = query.trim().toLowerCase()
      return MEMBERS.filter((m) => !row.roster.includes(m.id) && (!q || m.name.toLowerCase().includes(q)))
        .slice(0, 20).map((m): Member => ({ ...m, titleTag: titles.get(m.id) }))
    },
    async addMembers(id, memberIds) {
      await gate(500)
      requireAdmin()
      const row = byId(id)
      const fresh = memberIds.filter((m) => !row.roster.includes(m))
      if (rootOf(row).count + fresh.length > LIMITS.maxMembers) throw new ApiError('limit_members')
      for (const m of fresh) addToChain(row, m)
    },
    async setBlocked(id, memberId, value) {
      await gate(300)
      requireAdmin()
      byId(id)
      if (value) blocked.add(`${id}:${memberId}`)
      else blocked.delete(`${id}:${memberId}`)
    },
    async setTitleTag(memberId, tag) {
      await gate(300)
      requireAdmin()
      const clean = tag.trim().slice(0, LIMITS.titleTagMax)
      if (clean) titles.set(memberId, clean)
      else titles.delete(memberId)
    },
    async leave(id, mode) {
      await gate(400)
      const row = byId(id)
      const conv = ensureConv(row)
      row.count = Math.max(0, row.count - 1)
      if (mode === 'keep') {
        row.left = true
        conv.left = true
        emit({ type: 'conversation', conversation: { ...conv } })
        return
      }
      row.hidden = true
      row.joined = false
      row.roster = row.roster.filter((p) => p !== ME.id)
      const i = conversations.findIndex((c) => c.id === conv.id)
      if (i >= 0) conversations.splice(i, 1)
    },
    async createLink(id) {
      await gate(300)
      const row = byId(id)
      const token = `G-${row.id}`
      links.set(token, row.id)
      return { token, url: `${typeof location === 'undefined' ? '' : location.origin}/join/${token}` }
    },
    async resolveLink(token) {
      await gate()
      return linkInfo(token)
    },
    async join(token) {
      await gate(500)
      const info = linkInfo(token)
      const row = byId(info.groupId)
      if (mine(row) && !row.left) return toGroup(row)
      if (myCount() >= LIMITS.maxGroupsPerUser) throw new ApiError('limit_user_groups')
      if (rootOf(row).count + 1 > LIMITS.maxMembers) throw new ApiError('limit_members')
      row.left = false
      row.hidden = false
      const conv = conversations.find((c) => c.id === convIdOf(row))
      if (conv) conv.left = false
      addToChain(row, ME.id)
      emit({ type: 'conversation', conversation: { ...ensureConv(row) } })
      return toGroup(row)
    },
  }

  return {
    api,
    hiddenConvs,
    titleFor: (memberId: string) => titles.get(memberId),
    /** True when messages from this person should not reach the chat (ROL-03, ROL-05). */
    muted(convId: string, memberId: string) {
      const row = rows.find((r) => convIdOf(r) === convId)
      if (!row) return false
      return Boolean(row.left) || blocked.has(`${row.id}:${memberId}`)
    },
    /** The people of a group chat other than the user, with presence (used for calls). */
    rosterOf(convId: string) {
      const row = rows.find((r) => convIdOf(r) === convId)
      if (!row) return []
      return row.roster.filter((p) => p !== ME.id && !blocked.has(`${row.id}:${p}`)).map((p) => {
        const m = MEMBERS.find((x) => x.id === p)
        return { id: p, name: m?.name ?? p, presence: m?.presence ?? ('online' as const) }
      })
    },
    reset() {
      rows = seed()
      blocked.clear()
      hiddenConvs.clear()
      hiddenConvs.add('c-g-offsite')
      stashedConvs.clear()
      links.clear()
    },
  }
}
