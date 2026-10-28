import { describe, expect, it } from 'vitest'
import type { Group } from '../../data/types'
import { buildTree, childSlots, pathOf } from './tree'

const g = (id: string, parentId: string | null, level: 1 | 2 | 3, over: Partial<Group> = {}): Group => ({
  id, name: id, parentId, level, memberCount: 3, rootMemberCount: 3, myRole: 'admin', archived: false, left: false, unread: 0, ...over,
})
const GROUPS = [g('b', null, 1), g('a', null, 1), g('a1', 'a', 2), g('a1x', 'a1', 3), g('orphan', 'gone', 2)]

describe('group tree', () => {
  it('nests children and sorts by name', () => {
    const tree = buildTree(GROUPS)
    expect(tree.map((n) => n.group.id)).toEqual(['a', 'b', 'orphan'])
    expect(tree[0].children[0].children[0].group.id).toBe('a1x')
  })

  it('lists the path above a group', () => {
    expect(pathOf(GROUPS[3], GROUPS)).toEqual(['a', 'a1'])
    expect(pathOf(GROUPS[0], GROUPS)).toEqual([])
  })

  it('counts free slots and ignores archived groups', () => {
    const many = [g('p', null, 1), ...['1', '2', '3', '4'].map((i) => g(`c${i}`, 'p', 2)), g('old', 'p', 2, { archived: true })]
    expect(childSlots(many, many[0])).toEqual({ used: 4, max: 5, full: false, tooDeep: false })
    expect(childSlots([...many, g('c5', 'p', 2)], many[0]).full).toBe(true)
  })

  it('has no room below the third level', () => {
    expect(childSlots(GROUPS, GROUPS[3]).tooDeep).toBe(true)
  })
})
