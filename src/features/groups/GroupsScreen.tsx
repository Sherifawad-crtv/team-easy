import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { api } from '../../data'
import { LIMITS } from '../../config/limits'
import type { DeletedGroup, Group, LeaveMode } from '../../data/types'
import { Avatar, Badge, Button, Skeleton, Snackbar } from '../../design/ui'
import { IconChevronDown, IconChevronRight, IconPeople, IconPlus } from '../../design/icons'
import { PullToRefresh } from '../../design/PullToRefresh'
import { useEdgeSwipeBack } from '../../design/swipe'
import { useFlip } from '../../design/useFlip'
import { track } from '../../analytics'
import { useKept } from '../../state/useKept'
import { useMedia } from '../../state/useMedia'
import { useAsync } from '../../state/useAsync'
import { useReviewRole } from '../../state/useReviewRole'
import { useSubmit } from '../../state/useSubmit'
import { ErrorBanner } from '../auth/AuthFrame'
import { groupTiming } from '../chat/timing'
import { daysLeftLabel } from '../data/retention'
import { UpgradeSheet } from '../plan/UpgradeSheet'
import { GroupDetail } from './GroupDetail'
import { CreateGroupSheet } from './GroupSheets'
import { LEVEL_NAME, buildTree, childSlots, memberLabel, type TreeNode } from './tree'

interface RowProps {
  group: Group
  active: boolean
  depth?: number
  sub?: string
  toggle?: { open: boolean; onToggle: () => void }
  busy?: boolean
  leaving?: boolean
  onOpen: (id: string) => void
}

function GroupRow({ group, active, depth = 0, sub, toggle, busy, leaving, onOpen }: RowProps) {
  return (
    <div className={`grow${active ? ' grow--active' : ''}${leaving ? ' is-leaving' : ''}`} data-flip-id={group.id} style={{ ['--depth' as string]: depth }}>
      {depth > 0 && <span className="grow__rail" aria-hidden="true" />}
      {toggle ? (
        <button type="button" className="grow__toggle" aria-expanded={toggle.open} aria-label={`${toggle.open ? 'Collapse' : 'Expand'} ${group.name}`} onClick={toggle.onToggle}>
          {toggle.open ? <IconChevronDown size={20} /> : <IconChevronRight size={20} />}
        </button>
      ) : <span className="grow__toggle grow__toggle--none" aria-hidden="true" />}
      <button type="button" className="grow__main" onClick={() => onOpen(group.id)} aria-current={active ? 'page' : undefined} aria-busy={busy || undefined} style={busy ? { opacity: 0.6 } : undefined}>
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

function TreeList({ nodes, activeId, open, setOpen, onOpen, opening, leaving, depth = 0 }: {
  nodes: TreeNode[]; activeId?: string; open: Set<string>; setOpen: (next: Set<string>) => void; onOpen: (id: string) => void; opening: string | null; leaving: string | null; depth?: number
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
              toggle={has ? { open: isOpen, onToggle: flip } : undefined} busy={opening === n.group.id} leaving={leaving === n.group.id} onOpen={onOpen} />
            {has && isOpen && <TreeList nodes={n.children} activeId={activeId} open={open} setOpen={setOpen} onOpen={onOpen} opening={opening} leaving={leaving} depth={depth + 1} />}
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
  const location = useLocation()
  // Opened from the top bar of a chat (like WhatsApp): going back returns to that chat.
  const fromChat = (location.state as { from?: string } | null)?.from === 'chat'
  const [opening, setOpening] = useState<string | null>(null)
  const [leavingId, setLeavingId] = useState<string | null>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const treeRef = useRef<HTMLDivElement>(null)
  const [openError, setOpenError] = useState<unknown>(null)
  const role = useReviewRole()
  const phone = useMedia('(max-width: 1023.98px)')
  const slides = phone
  const root = useRef<HTMLDivElement>(null)
  const shownId = useKept(id, slides ? 480 : 0)
  const list = useAsync(() => api.groups.list(), [role])
  const [creating, setCreating] = useState(false)
  const [open, setOpen] = useState<Set<string>>(new Set())
  const [showArchived, setShowArchived] = useState(false)
  const [undo, setUndo] = useState<DeletedGroup | null>(null)
  const undoAction = useSubmit()
  const { reload } = list

  useEffect(() => {
    if (list.status === 'ready') {
      groupTiming.shown()
    }
  }, [list.status])

  // Keep showing the last list while a reload runs, so open screens and notices stay put.
  const snapshot = useRef(list.status === 'ready' ? list.data : null)
  if (list.status === 'ready') snapshot.current = list.data
  const known = list.status === 'ready' ? list.data : snapshot.current
  const settled = known !== null
  const groups = useMemo(() => known?.groups ?? [], [known])
  const current = shownId ? groups.find((g) => g.id === shownId) : undefined
  const admin = groups.length ? groups.some((g) => g.myRole === 'admin') : role === 'admin'

  // Make sure the open group is visible in the tree.
  useEffect(() => {
    if (!current) return
    const parents = new Set<string>()
    for (let p = current.parentId; p; p = groups.find((g) => g.id === p)?.parentId ?? null) parents.add(p)
    if (parents.size) setOpen((prev) => new Set([...prev, ...parents]))
  }, [current, groups])

  const back = () => (fromChat ? navigate(-1) : navigate('/groups'))
  useEdgeSwipeBack(root, slides && Boolean(id), back)

  const openGroup = useCallback(
    (gid: string) => {
      const g = groups.find((x) => x.id === gid)
      track('group_opened', { level: g?.level, ...groupTiming.opened() })
      // Tapping a group goes straight to its chat. Group info is opened from the chat's top bar.
      // An archived group has no chat in the list, so it opens its info.
      if (g?.archived) {
        navigate(`/groups/${gid}`)
        return
      }
      setOpenError(null)
      setOpening(gid)
      api.groups.openChat(gid).then(
        (c) => { setOpening(null); navigate(`/chats/${c.id}`) },
        (e: unknown) => { setOpening(null); setOpenError(e) },
      )
    },
    [groups, navigate],
  )

  const activeGroups = groups.filter((g) => !g.archived)
  const archived = groups.filter((g) => g.archived)
  const tree = useMemo(() => buildTree(activeGroups), [activeGroups])
  useFlip(treeRef, `${[...open].join()}|${groups.map((g) => g.id).join()}`)
  const rootSlots = known ? childSlots(groups, null, known.limits) : { used: 0, max: 0, full: false, tooDeep: false }
  const [upgrading, setUpgrading] = useState(false)

  const onDeleted = (d: DeletedGroup) => {
    setUndo(d)
    navigate('/groups')
    // The row folds away first, then the list updates.
    setLeavingId(d.undoToken.split('@')[0])
    window.setTimeout(() => { reload(); setLeavingId(null) }, 300)
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
    <div className="chats" data-open={id ? 'true' : 'false'} ref={root}>
      <section className="chats__list" aria-label="Groups">
        <header className="bar">
          <h1 className="bar__title">Groups</h1>
          {admin && (
            <button type="button" className="newchat" aria-label="New group" onClick={() => setCreating(true)}><IconPlus size={22} /></button>
          )}
        </header>
        <div className="chats__scroll" ref={scroller} onScroll={(e) => { const p = e.currentTarget.parentElement; if (p) p.dataset.scrolled = e.currentTarget.scrollTop > 4 ? 'true' : 'false' }}>
          {known && (
            <p className="t-body-sm muted gcount">
              You're in {known.myGroupCount} of {known.limits.groupsPerUser} groups you can join.
            </p>
          )}

          {openError != null && <div style={{ padding: '0 var(--s-5) var(--s-3)' }}><ErrorBanner error={openError} /></div>}

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
            <PullToRefresh onRefresh={list.refresh} scroller={scroller}>
              <div role="tree" aria-label="Groups" ref={treeRef}>
                <TreeList nodes={tree} activeId={id} open={open} setOpen={setOpen} onOpen={openGroup} opening={opening} leaving={leavingId} />
              </div>

              {archived.length > 0 && (
                <div className="garchived">
                  <button type="button" className="garchived__head" aria-expanded={showArchived} onClick={() => setShowArchived((s) => !s)}>
                    {showArchived ? <IconChevronDown size={18} /> : <IconChevronRight size={18} />} Archived ({archived.length})
                  </button>
                  {showArchived && archived.map((g) => <GroupRow key={g.id} group={g} active={g.id === id} sub={g.deleteAt ? `Archived · deleted in ${daysLeftLabel(g.deleteAt).text.replace(' left', '')}` : `${LEVEL_NAME[g.level]} · archived`} onOpen={openGroup} />)}
                </div>
              )}
              {admin && rootSlots.full && (
                <div style={{ padding: 'var(--s-4) var(--s-5)' }}>
                  <p className="t-body-sm muted">You have {rootSlots.max} main groups, the most allowed. Archive one to make room, or add more.</p>
                  <div style={{ marginTop: 'var(--s-3)' }}><Button variant="secondary" onClick={() => setUpgrading(true)}>Get more main groups</Button></div>
                </div>
              )}
            </PullToRefresh>
          )}
        </div>
      </section>

      {slides && id && <div className="chats__edge" aria-hidden="true" />}
      <section className="chats__pane" aria-label="Group">
        {current ? (
          <GroupDetail key={current.id} group={current} all={groups} limits={known!.limits} onBack={back} onOpenGroup={openGroup}
            onOpenChat={(cid) => (fromChat ? navigate(-1) : navigate(`/chats/${cid}`))} onChanged={reload} onDeleted={onDeleted} onLeft={onLeft} />
        ) : shownId && settled ? (
          <div className="empty"><h2 className="t-title">That group isn't available</h2><p className="t-body-sm muted">It may have been deleted, or you may not have access.</p></div>
        ) : shownId ? (
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
      {upgrading && <UpgradeSheet focus="main_groups_3" onClose={() => setUpgrading(false)} onChanged={reload} />}
      {undo && (
        <Snackbar message={`“${undo.name}” deleted`} actionLabel={undoAction.busy ? 'Undoing…' : 'Undo'} onAction={() => void doUndo()}
          durationMs={LIMITS.undoWindowSeconds * 1000} onDone={() => setUndo(null)} />
      )}
      {undoAction.error != null && undo && <div className="gerror"><ErrorBanner error={undoAction.error} /></div>}
    </div>
  )
}
