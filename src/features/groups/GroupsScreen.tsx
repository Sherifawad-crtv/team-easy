import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../../data'
import { LIMITS } from '../../config/limits'
import type { DeletedGroup, Group, LeaveMode } from '../../data/types'
import { Avatar, Badge, Button, Skeleton, Snackbar } from '../../design/ui'
import { IconChevronDown, IconChevronRight, IconPeople, IconPlus, IconSearch } from '../../design/icons'
import { track, trackExposure } from '../../experiments/analytics'
import { useVariant } from '../../experiments/experiments'
import { useAsync } from '../../state/useAsync'
import { useReviewRole } from '../../state/useReviewRole'
import { useSubmit } from '../../state/useSubmit'
import { ErrorBanner } from '../auth/AuthFrame'
import { groupTiming } from '../chat/timing'
import { GroupDetail } from './GroupDetail'
import { CreateGroupSheet } from './GroupSheets'
import { LEVEL_NAME, buildTree, childSlots, memberLabel, pathOf, type TreeNode } from './tree'

interface RowProps {
  group: Group
  active: boolean
  depth?: number
  sub?: string
  toggle?: { open: boolean; onToggle: () => void }
  onOpen: (id: string) => void
}

function GroupRow({ group, active, depth = 0, sub, toggle, onOpen }: RowProps) {
  return (
    <div className={`grow${active ? ' grow--active' : ''}`} style={{ ['--depth' as string]: depth }}>
      {depth > 0 && <span className="grow__rail" aria-hidden="true" />}
      {toggle ? (
        <button type="button" className="grow__toggle" aria-expanded={toggle.open} aria-label={`${toggle.open ? 'Collapse' : 'Expand'} ${group.name}`} onClick={toggle.onToggle}>
          {toggle.open ? <IconChevronDown size={20} /> : <IconChevronRight size={20} />}
        </button>
      ) : <span className="grow__toggle grow__toggle--none" aria-hidden="true" />}
      <button type="button" className="grow__main" onClick={() => onOpen(group.id)} aria-current={active ? 'page' : undefined}>
        <Avatar name={group.name} size={depth > 0 ? 40 : 48} group icon={<IconPeople size={depth > 0 ? 20 : 24} />} />
        <span className="grow__text">
          <span className="grow__name">{group.name}</span>
          <span className="grow__sub">{sub ?? memberLabel(group.memberCount)}</span>
        </span>
        {group.left && <span className="tag">Left</span>}
        <Badge count={group.unread} />
      </button>
    </div>
  )
}

function TreeList({ nodes, activeId, open, setOpen, onOpen, depth = 0 }: {
  nodes: TreeNode[]; activeId?: string; open: Set<string>; setOpen: (next: Set<string>) => void; onOpen: (id: string) => void; depth?: number
}) {
  return (
    <>
      {nodes.map((n) => {
        const isOpen = open.has(n.group.id)
        const has = n.children.length > 0
        const flip = () => {
          const next = new Set(open)
          if (isOpen) next.delete(n.group.id)
          else next.add(n.group.id)
          setOpen(next)
        }
        return (
          <div key={n.group.id}>
            <GroupRow group={n.group} active={n.group.id === activeId} depth={depth}
              sub={has ? `${memberLabel(n.group.memberCount)} · ${n.children.length} ${n.children.length === 1 ? 'sub-group' : 'sub-groups'}` : undefined}
              toggle={has ? { open: isOpen, onToggle: flip } : undefined} onOpen={onOpen} />
            {has && isOpen && <TreeList nodes={n.children} activeId={activeId} open={open} setOpen={setOpen} onOpen={onOpen} depth={depth + 1} />}
          </div>
        )
      })}
    </>
  )
}

/** Groups: a tree or a flat list (A/B), with the selected group beside it on desktop. */
export function GroupsScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const role = useReviewRole()
  const variant = useVariant('group_nav')
  const list = useAsync(() => api.groups.list(), [role])
  const [creating, setCreating] = useState(false)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<Set<string>>(new Set())
  const [showArchived, setShowArchived] = useState(false)
  const [undo, setUndo] = useState<DeletedGroup | null>(null)
  const undoAction = useSubmit()
  const { reload } = list

  useEffect(() => {
    if (list.status === 'ready') {
      groupTiming.shown()
      trackExposure('group_nav')
    }
  }, [list.status])

  // Keep showing the last list while a reload runs, so open screens and notices stay put.
  const snapshot = useRef(list.status === 'ready' ? list.data : null)
  if (list.status === 'ready') snapshot.current = list.data
  const known = list.status === 'ready' ? list.data : snapshot.current
  const settled = known !== null
  const groups = useMemo(() => known?.groups ?? [], [known])
  const current = id ? groups.find((g) => g.id === id) : undefined
  const admin = groups.length ? groups.some((g) => g.myRole === 'admin') : role === 'admin'

  // Make sure the open group is visible in the tree.
  useEffect(() => {
    if (!current) return
    const parents = new Set<string>()
    for (let p = current.parentId; p; p = groups.find((g) => g.id === p)?.parentId ?? null) parents.add(p)
    if (parents.size) setOpen((prev) => new Set([...prev, ...parents]))
  }, [current, groups])

  const openGroup = useCallback(
    (gid: string) => {
      const g = groups.find((x) => x.id === gid)
      track('group_opened', { level: g?.level, ...groupTiming.opened() })
      navigate(`/groups/${gid}`)
    },
    [groups, navigate],
  )

  const activeGroups = groups.filter((g) => !g.archived)
  const archived = groups.filter((g) => g.archived)
  const tree = useMemo(() => buildTree(activeGroups), [activeGroups])
  const q = query.trim().toLowerCase()
  const flat = activeGroups.filter((g) => !q || g.name.toLowerCase().includes(q)).sort((a, b) => b.unread - a.unread || a.name.localeCompare(b.name))
  const rootSlots = childSlots(groups, null)

  const onDeleted = (d: DeletedGroup) => {
    setUndo(d)
    navigate('/groups')
    reload()
  }
  const doUndo = async () => {
    if (!undo) return
    const token = undo.undoToken
    if (await undoAction.run(() => api.groups.undoDelete(token))) {
      track('group_delete_undone')
      setUndo(null)
      reload()
    }
  }
  const onLeft = (mode: LeaveMode) => {
    if (mode === 'delete') navigate('/groups')
    reload()
  }

  return (
    <div className="chats" data-open={id ? 'true' : 'false'}>
      <section className="chats__list" aria-label="Groups">
        <header className="bar">
          <h1 className="bar__title">Groups</h1>
          {admin && (
            <button type="button" className="newchat" aria-label="New group" onClick={() => setCreating(true)}><IconPlus size={22} /></button>
          )}
        </header>
        <div className="chats__scroll">
          {known && (
            <p className="t-body-sm muted gcount">
              You're in {known.myGroupCount} of {LIMITS.maxGroupsPerUser} groups you can join.
            </p>
          )}

          {variant === 'B' && settled && groups.length > 0 && (
            <div className="search gsearch">
              <IconSearch size={20} />
              <input type="search" placeholder="Find a group" aria-label="Find a group" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
          )}

          {list.status === 'loading' && !settled && (
            <div aria-busy="true" aria-label="Loading groups">
              {[0, 1, 2, 3, 4].map((i) => <div key={i} className="list-row"><Skeleton width={48} height={48} radius="50%" /><Skeleton width="60%" height={14} /></div>)}
            </div>
          )}
          {list.status === 'error' && <div style={{ padding: 'var(--s-5)' }}><ErrorBanner error={list.error} onRetry={list.reload} /></div>}

          {settled && groups.length === 0 && (
            <div className="empty">
              <span className="empty__icon"><IconPeople size={40} /></span>
              <h2 className="t-title">{admin ? 'No groups yet' : "You're not in a group yet"}</h2>
              <p className="t-body-sm muted">{admin ? 'Create a group for a team, then split it into sub-groups.' : 'Ask an admin to add you, or open a group invite link.'}</p>
              {admin && <Button block={false} onClick={() => setCreating(true)}>Create a group</Button>}
            </div>
          )}

          {settled && groups.length > 0 && (
            <>
              <div role="tree" aria-label="Groups">
                {variant === 'A' ? (
                  <TreeList nodes={tree} activeId={id} open={open} setOpen={setOpen} onOpen={openGroup} />
                ) : (
                  flat.map((g) => {
                    const path = pathOf(g, groups)
                    return <GroupRow key={g.id} group={g} active={g.id === id} sub={path.length ? `${path.join(' › ')} · ${LEVEL_NAME[g.level]}` : `${LEVEL_NAME[g.level]} · ${memberLabel(g.memberCount)}`} onOpen={openGroup} />
                  })
                )}
              </div>
              {variant === 'B' && flat.length === 0 && <p className="t-body-sm muted" style={{ padding: 'var(--s-5)', textAlign: 'center' }}>No group matches “{query}”</p>}

              {archived.length > 0 && (
                <div className="garchived">
                  <button type="button" className="garchived__head" aria-expanded={showArchived} onClick={() => setShowArchived((s) => !s)}>
                    {showArchived ? <IconChevronDown size={18} /> : <IconChevronRight size={18} />} Archived ({archived.length})
                  </button>
                  {showArchived && archived.map((g) => <GroupRow key={g.id} group={g} active={g.id === id} sub={`${LEVEL_NAME[g.level]} · archived`} onOpen={openGroup} />)}
                </div>
              )}
              {admin && rootSlots.full && (
                <p className="t-body-sm muted" style={{ padding: 'var(--s-4) var(--s-5)' }}>You have {rootSlots.max} main groups, the most allowed. Archive one to make room.</p>
              )}
            </>
          )}
        </div>
      </section>

      <section className="chats__pane" aria-label="Group">
        {current ? (
          <GroupDetail key={current.id} group={current} all={groups} onBack={() => navigate('/groups')} onOpenGroup={openGroup}
            onOpenChat={(cid) => navigate(`/chats/${cid}`)} onChanged={reload} onDeleted={onDeleted} onLeft={onLeft} />
        ) : id && settled ? (
          <div className="empty"><h2 className="t-title">That group isn't available</h2><p className="t-body-sm muted">It may have been deleted, or you may not have access.</p></div>
        ) : id ? (
          <div className="empty" aria-busy="true"><p className="t-body-sm muted">Loading…</p></div>
        ) : (
          <div className="empty empty--pane">
            <span className="empty__icon"><IconPeople size={40} /></span>
            <h2 className="t-title">Pick a group</h2>
            <p className="t-body-sm muted">Choose a group on the left to see its members and sub-groups.</p>
          </div>
        )}
      </section>

      {creating && <CreateGroupSheet parent={null} onClose={() => setCreating(false)} onCreated={(g) => { setCreating(false); reload(); navigate(`/groups/${g.id}`) }} />}
      {undo && (
        <Snackbar message={`“${undo.name}” deleted`} actionLabel={undoAction.busy ? 'Undoing…' : 'Undo'} onAction={() => void doUndo()}
          durationMs={LIMITS.undoWindowSeconds * 1000} onDone={() => setUndo(null)} />
      )}
      {undoAction.error != null && undo && <div className="gerror"><ErrorBanner error={undoAction.error} /></div>}
    </div>
  )
}
