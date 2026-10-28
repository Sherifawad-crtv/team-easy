import { LIMITS } from '../../config/limits'
import type { Group } from '../../data/types'

export interface TreeNode {
  group: Group
  children: TreeNode[]
}

const byName = (a: Group, b: Group) => a.name.localeCompare(b.name)

/** Builds the nested tree. A group whose parent isn't visible is shown at the top. */
export function buildTree(groups: Group[]): TreeNode[] {
  const ids = new Set(groups.map((g) => g.id))
  const kids = new Map<string | null, Group[]>()
  for (const g of groups) {
    const key = g.parentId && ids.has(g.parentId) ? g.parentId : null
    kids.set(key, [...(kids.get(key) ?? []), g])
  }
  const grow = (parent: string | null): TreeNode[] =>
    (kids.get(parent) ?? []).sort(byName).map((group) => ({ group, children: grow(group.id) }))
  return grow(null)
}

/** Names of the groups above this one, outermost first. */
export function pathOf(group: Group, groups: Group[]): string[] {
  const byId = new Map(groups.map((g) => [g.id, g]))
  const path: string[] = []
  for (let p = group.parentId ? byId.get(group.parentId) : undefined; p; p = p.parentId ? byId.get(p.parentId) : undefined) {
    path.unshift(p.name)
  }
  return path
}

export const LEVEL_NAME = { 1: 'Group', 2: 'Sub-group', 3: 'Sub-sub-group' } as const

/** How full a parent is. `parent` null means the top level. Archived groups don't count. */
export function childSlots(groups: Group[], parent: Group | null) {
  const level = ((parent?.level ?? 0) + 1) as 1 | 2 | 3 | 4
  if (level === 4) return { used: 0, max: 0, full: true, tooDeep: true }
  const used = groups.filter((g) => g.parentId === (parent?.id ?? null) && !g.archived).length
  const max = LIMITS.maxChildren[level]
  return { used, max, full: used >= max, tooDeep: false }
}

export function memberLabel(n: number): string {
  return n === 1 ? '1 member' : `${n} members`
}
