import { useState } from 'react'
import { api } from '../../data'
import { LIMITS } from '../../config/limits'
import type { DeletedGroup, Group, GroupMember, LeaveMode } from '../../data/types'
import { Avatar, Banner, BackButton, Button, Skeleton } from '../../design/ui'
import { IconArchive, IconChat, IconChevronRight, IconLeave, IconLink, IconMore, IconPeople, IconPlus, IconTrash } from '../../design/icons'
import { useAsync } from '../../state/useAsync'
import { useSubmit } from '../../state/useSubmit'
import { ErrorBanner } from '../auth/AuthFrame'
import { AddMembersSheet, ArchiveSheet, CreateGroupSheet, DeleteSheet, InviteSheet, LeaveSheet, MemberSheet } from './GroupSheets'
import { LEVEL_NAME, childSlots, memberLabel, pathOf } from './tree'

type Sheet = 'create' | 'add' | 'invite' | 'leave' | 'archive' | 'delete' | null

interface Props {
  group: Group
  all: Group[]
  onBack: () => void
  onOpenGroup: (id: string) => void
  onOpenChat: (conversationId: string) => void
  /** Something changed that the list should show. */
  onChanged: () => void
  onDeleted: (d: DeletedGroup) => void
  onLeft: (mode: LeaveMode) => void
}

/** One group: its chat, invite link, sub-groups, members and the admin tools (GRP-*, ROL-*). */
export function GroupDetail({ group, all, onBack, onOpenGroup, onOpenChat, onChanged, onDeleted, onLeft }: Props) {
  const members = useAsync(() => api.groups.members(group.id), [group.id])
  const [sheet, setSheet] = useState<Sheet>(null)
  const [memberFor, setMemberFor] = useState<GroupMember | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const chat = useSubmit()
  const admin = group.myRole === 'admin'
  const path = pathOf(group, all)
  const kids = all.filter((g) => g.parentId === group.id && !g.archived).sort((a, b) => a.name.localeCompare(b.name))
  const slots = childSlots(all, group)
  const active = !group.archived && !group.left
  const capLeft = Math.max(0, LIMITS.maxMembers - group.rootMemberCount)
  const rootName = path[0] ?? group.name

  const openChat = async () => {
    let id: string | undefined
    if (await chat.run(async () => { id = (await api.groups.openChat(group.id)).id }) && id) onOpenChat(id)
  }
  const close = () => setSheet(null)

  return (
    <main className="gdetail fade-in" aria-label={group.name}>
      <header className="gdetail__bar">
        <span className="convo__back"><BackButton onClick={onBack} label="Back to groups" /></span>
        <h2 className="gdetail__barTitle">{LEVEL_NAME[group.level]}</h2>
      </header>

      <div className="gdetail__body stack-lg">
        <section className="ghead">
          <Avatar name={group.name} size={72} group icon={<IconPeople size={32} />} />
          <h1 className="t-title ghead__name">{group.name}</h1>
          {path.length > 0 && <p className="t-body-sm muted ghead__path">{path.join(' › ')}</p>}
          <p className="t-body-sm muted">{memberLabel(group.memberCount)}</p>
          <div className="ghead__chips">
            {group.archived && <span className="chip chip--static">Archived</span>}
            {group.left && <span className="chip chip--static">You left</span>}
            {admin && <span className="chip chip--static">You're an admin</span>}
          </div>
        </section>

        {notice && <Banner kind="success">{notice}</Banner>}
        {chat.error != null && <ErrorBanner error={chat.error} onRetry={() => void openChat()} />}
        {group.left && <Banner kind="info">You left this group. You can read the chat, but you won't get new messages.</Banner>}
        {group.archived && <Banner kind="info">This group is archived. Its chat is out of your chat list.{admin ? ' Bring it back below.' : ''}</Banner>}

        <div className="stack">
          {!group.archived && <Button loading={chat.busy} onClick={() => void openChat()}><IconChat size={18} /> Open chat</Button>}
          {active && <Button variant="secondary" onClick={() => setSheet('invite')}><IconLink size={18} /> Invite with a link</Button>}
        </div>

        {admin && (
          <section aria-label="Member limit">
            <div className="meter-head">
              <h2 className="t-title-sm">Member limit</h2>
              <span className="t-body-sm muted">{group.rootMemberCount} of {LIMITS.maxMembers}</span>
            </div>
            <div className="meter" role="progressbar" aria-valuemin={0} aria-valuemax={LIMITS.maxMembers} aria-valuenow={group.rootMemberCount} aria-label="Members used">
              <span className={`meter__fill${capLeft <= 10 ? ' is-low' : ''}`} style={{ width: `${Math.min(100, (group.rootMemberCount / LIMITS.maxMembers) * 100)}%` }} />
            </div>
            <p className="t-body-sm muted" style={{ marginTop: 'var(--s-3)' }}>
              {capLeft === 0 ? 'Full. Adding more people needs a paid plan.' : `${capLeft} ${capLeft === 1 ? 'spot' : 'spots'} left.`}{' '}
              {group.level > 1 ? `Counted across ${rootName} and all its sub-groups.` : 'Counted across this group and all its sub-groups.'}
            </p>
          </section>
        )}

        {!slots.tooDeep && (
          <section aria-label="Sub-groups">
            <div className="meter-head">
              <h2 className="t-title-sm">{group.level === 1 ? 'Sub-groups' : 'Sub-sub-groups'}</h2>
              {admin && <span className="t-body-sm muted">{slots.used} of {slots.max}</span>}
            </div>
            {kids.length > 0 && (
              <div className="card" style={{ marginTop: 'var(--s-3)' }}>
                {kids.map((k) => (
                  <button key={k.id} type="button" className="list-row" onClick={() => onOpenGroup(k.id)}>
                    <Avatar name={k.name} size={40} group icon={<IconPeople size={20} />} />
                    <span className="people__text">
                      <span className="t-title-sm people__name">{k.name}</span>
                      <span className="t-caption muted">{memberLabel(k.memberCount)}</span>
                    </span>
                    <IconChevronRight size={20} />
                  </button>
                ))}
              </div>
            )}
            {kids.length === 0 && <p className="t-body-sm muted" style={{ marginTop: 'var(--s-3)' }}>{admin ? 'None yet. Split this group into smaller teams.' : 'No sub-groups you can see.'}</p>}
            {admin && active && (
              <div style={{ marginTop: 'var(--s-3)' }}>
                <Button variant="outlined" disabled={slots.full} onClick={() => setSheet('create')}><IconPlus size={18} /> Add {group.level === 1 ? 'sub-group' : 'sub-sub-group'}</Button>
                {slots.full && <p className="t-body-sm muted" style={{ marginTop: 'var(--s-3)' }}>This group has {slots.max} {group.level === 1 ? 'sub-groups' : 'sub-sub-groups'}, the most it can hold. Archive or delete one to make room.</p>}
              </div>
            )}
          </section>
        )}
        {slots.tooDeep && admin && (
          <p className="t-body-sm muted">Groups go three levels deep, so a sub-sub-group can't have groups of its own.</p>
        )}

        <section aria-label="Members">
          <div className="meter-head">
            <h2 className="t-title-sm">Members</h2>
            {admin && active && <Button variant="tertiary" block={false} onClick={() => setSheet('add')} disabled={capLeft === 0}><IconPlus size={18} /> Add people</Button>}
          </div>
          {members.status === 'loading' && (
            <div aria-busy="true" aria-label="Loading members">{[0, 1, 2, 3].map((i) => <div key={i} className="list-row"><Skeleton width={40} height={40} radius="50%" /><Skeleton width="55%" height={14} /></div>)}</div>
          )}
          {members.status === 'error' && <ErrorBanner error={members.error} onRetry={members.reload} />}
          {members.status === 'ready' && members.data.length === 0 && <p className="t-body-sm muted" style={{ padding: 'var(--s-4) 0' }}>No one is in this group yet.</p>}
          {members.status === 'ready' && members.data.length > 0 && (
            <>
              <ul className="people" role="list">
                {members.data.map((m) => (
                  <li key={m.id} className={`member${m.blocked ? ' member--blocked' : ''}`}>
                    <Avatar name={m.name} size={40} presence={m.blocked ? undefined : m.presence} />
                    <span className="people__text">
                      <span className="t-title-sm people__name">{m.name}{m.isMe && <span className="muted"> (you)</span>}</span>
                      <span className="member__meta">
                        {m.titleTag && <span className="tag">{m.titleTag}</span>}
                        {m.role === 'admin' && <span className="tag tag--admin">Admin</span>}
                        {m.blocked && <span className="tag tag--blocked">Blocked</span>}
                        {m.jobTitle && <span className="t-caption muted">{m.jobTitle}</span>}
                      </span>
                    </span>
                    {admin && active && (
                      <button type="button" className="icon-btn" aria-label={`Manage ${m.name}`} onClick={() => setMemberFor(m)}><IconMore size={20} /></button>
                    )}
                  </li>
                ))}
              </ul>
              {members.data.length < group.memberCount && (
                <p className="t-body-sm muted" style={{ marginTop: 'var(--s-3)' }}>Showing {members.data.length} of {group.memberCount} members.</p>
              )}
            </>
          )}
        </section>

        <section className="stack" aria-label="More">
          {!group.left && !group.archived && (
            <Button variant="outlined" onClick={() => setSheet('leave')}><IconLeave size={18} /> Leave group</Button>
          )}
          {admin && (
            <Button variant="outlined" onClick={() => setSheet('archive')}><IconArchive size={18} /> {group.archived ? 'Bring back from archive' : 'Archive group'}</Button>
          )}
          {admin && <Button variant="destructive" onClick={() => setSheet('delete')}><IconTrash size={18} /> Delete group</Button>}
          {!admin && <p className="t-body-sm muted">Only an admin can archive or delete a group.</p>}
        </section>
      </div>

      {sheet === 'create' && <CreateGroupSheet parent={group} onClose={close} onCreated={() => { close(); setNotice('Sub-group created'); onChanged() }} />}
      {sheet === 'add' && <AddMembersSheet group={group} onClose={close} onAdded={(n) => { close(); setNotice(`${n} ${n === 1 ? 'person' : 'people'} added`); members.reload(); onChanged() }} />}
      {sheet === 'invite' && <InviteSheet group={group} onClose={close} />}
      {sheet === 'leave' && <LeaveSheet group={group} onClose={close} onDone={(mode) => { close(); onLeft(mode) }} />}
      {sheet === 'archive' && <ArchiveSheet group={group} onClose={close} onDone={() => { close(); onChanged() }} />}
      {sheet === 'delete' && <DeleteSheet group={group} hasSubgroups={all.some((g) => g.parentId === group.id)} onClose={close} onDeleted={(d) => { close(); onDeleted(d) }} />}
      {memberFor && <MemberSheet group={group} member={memberFor} onClose={() => setMemberFor(null)} onChanged={() => { setMemberFor(null); members.reload() }} />}
    </main>
  )
}
