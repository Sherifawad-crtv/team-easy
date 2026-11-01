import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../data'
import { LIMITS } from '../../config/limits'
import type { DeletedGroup, Group } from '../../data/types'
import { Banner, Button, Skeleton, Snackbar } from '../../design/ui'
import { IconPlus } from '../../design/icons'
import { useAsync } from '../../state/useAsync'
import { useReviewRole } from '../../state/useReviewRole'
import { useSubmit } from '../../state/useSubmit'
import { ErrorBanner } from '../auth/AuthFrame'
import { daysLeftLabel } from '../data/retention'
import { ArchiveSheet, CreateGroupSheet, DeleteSheet } from '../groups/GroupSheets'
import { LEVEL_NAME, buildTree, childSlots, type TreeNode } from '../groups/tree'
import { UpgradeSheet } from '../plan/UpgradeSheet'
import { PageHead } from './AdminShell'

type Dialog = { kind: 'create'; parent: Group | null } | { kind: 'archive' | 'delete'; group: Group } | { kind: 'upgrade' } | null

function flatten(nodes: TreeNode[], depth = 0): { group: Group; depth: number; kids: number }[] {
  return nodes.flatMap((n) => [{ group: n.group, depth, kids: n.children.length }, ...flatten(n.children, depth + 1)])
}

/** Teams (GRP-05, 08, 09, 11): every group with its member counter, and create, archive, delete with undo. */
export function TeamsPage() {
  const role = useReviewRole()
  const navigate = useNavigate()
  const list = useAsync(() => api.groups.list(), [role])
  const [dialog, setDialog] = useState<Dialog>(null)
  const [undo, setUndo] = useState<DeletedGroup | null>(null)
  const undoAction = useSubmit()
  const data = list.status === 'ready' ? list.data : null
  const rows = useMemo(() => (data ? flatten(buildTree(data.groups)) : []), [data])
  const mains = data ? childSlots(data.groups, null, data.limits) : null
  const close = () => setDialog(null)

  return (
    <div className="admin__page">
      <PageHead title="Teams" sub="Groups, sub-groups and who is in them"
        action={<Button block={false} disabled={!data || mains?.full} onClick={() => setDialog({ kind: 'create', parent: null })}><IconPlus size={18} /> New main group</Button>} />
      {mains && (
        <p className="t-body-sm muted">
          {mains.used} of {mains.max} main groups.{mains.full && <> That's the most allowed. <button type="button" className="linklike" onClick={() => setDialog({ kind: 'upgrade' })}>Get more main groups</button></>}
        </p>
      )}
      {list.status === 'loading' && !data && <div aria-busy="true" aria-label="Loading teams">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} height={52} radius={12} />)}</div>}
      {list.status === 'error' && <ErrorBanner error={list.error} onRetry={list.reload} />}
      {data && rows.length === 0 && <Banner kind="info" title="No teams yet">Create a main group, then split it into sub-groups.</Banner>}
      {data && rows.length > 0 && (
        <div className="atable-wrap">
          <table className="atable">
            <caption className="sr-only">Teams</caption>
            <thead><tr><th scope="col">Team</th><th scope="col">Level</th><th scope="col">Members</th><th scope="col">Status</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {rows.map(({ group: g, depth }) => {
                const slots = childSlots(data.groups, g, data.limits)
                return (
                  <tr key={g.id} className={g.archived ? 'is-archived' : ''}>
                    <th scope="row"><span className="atable__name" style={{ paddingLeft: depth * 20 }}>{g.name}</span></th>
                    <td>{LEVEL_NAME[g.level]}</td>
                    <td>
                      {g.level === 1 ? (
                        <span className="atable__cap">
                          <span className="meter" role="progressbar" aria-valuemin={0} aria-valuemax={data.limits.memberCap} aria-valuenow={g.rootMemberCount} aria-label={`${g.name} members`}>
                            <span className={`meter__fill${data.limits.memberCap - g.rootMemberCount <= 20 ? ' is-low' : ''}`} style={{ width: `${Math.min(100, (g.rootMemberCount / data.limits.memberCap) * 100)}%` }} />
                          </span>
                          <span>{g.rootMemberCount} of {data.limits.memberCap}</span>
                        </span>
                      ) : g.memberCount}
                    </td>
                    <td>{g.archived ? <span className="tag tag--pending">Archived{g.deleteAt ? ` · deleted in ${daysLeftLabel(g.deleteAt).text.replace(' left', '')}` : ''}</span> : <span className="tag">Active</span>}</td>
                    <td className="atable__actions">
                      <Button variant="tertiary" block={false} onClick={() => navigate(`/groups/${g.id}`)}>Open</Button>
                      {!g.archived && !slots.tooDeep && <Button variant="tertiary" block={false} disabled={slots.full} onClick={() => setDialog({ kind: 'create', parent: g })}>Add {g.level === 1 ? 'sub-group' : 'sub-sub-group'}</Button>}
                      <Button variant="tertiary" block={false} onClick={() => setDialog({ kind: 'archive', group: g })}>{g.archived ? 'Bring back' : 'Archive'}</Button>
                      <Button variant="tertiary" block={false} onClick={() => setDialog({ kind: 'delete', group: g })}>Delete</Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {dialog?.kind === 'create' && <CreateGroupSheet parent={dialog.parent} onClose={close} onCreated={() => { close(); list.reload() }} />}
      {dialog?.kind === 'archive' && <ArchiveSheet group={dialog.group} onClose={close} onDone={() => { close(); list.reload() }} />}
      {dialog?.kind === 'delete' && data && <DeleteSheet group={dialog.group} hasSubgroups={data.groups.some((g) => g.parentId === dialog.group.id)} onClose={close} onDeleted={(d) => { close(); setUndo(d); list.reload() }} />}
      {dialog?.kind === 'upgrade' && <UpgradeSheet focus="main_groups_3" onClose={close} onChanged={list.reload} />}
      {undo && (
        <Snackbar message={`“${undo.name}” deleted`} actionLabel={undoAction.busy ? 'Undoing…' : 'Undo'} durationMs={LIMITS.undoWindowSeconds * 1000} onDone={() => setUndo(null)}
          onAction={async () => { const token = undo.undoToken; if (await undoAction.run(() => api.groups.undoDelete(token))) { setUndo(null); list.reload() } }} />
      )}
    </div>
  )
}
