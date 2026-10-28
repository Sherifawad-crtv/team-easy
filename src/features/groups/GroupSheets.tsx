import { useEffect, useState, type FormEvent } from 'react'
import { api } from '../../data'
import { LIMITS } from '../../config/limits'
import type { DeletedGroup, Group, GroupMember, LeaveMode } from '../../data/types'
import { Avatar, Banner, BottomSheet, Button, Skeleton, TextField } from '../../design/ui'
import { IconCheck, IconCopy, IconSearch } from '../../design/icons'
import { track } from '../../experiments/analytics'
import { useAsync } from '../../state/useAsync'
import { useSubmit } from '../../state/useSubmit'
import { ErrorBanner } from '../auth/AuthFrame'
import { LEVEL_NAME } from './tree'

/* ---------- New group or sub-group (GRP-01, 02, 08) ---------- */

export function CreateGroupSheet({ parent, onClose, onCreated }: { parent: Group | null; onClose: () => void; onCreated: (g: Group) => void }) {
  const [name, setName] = useState('')
  const [touched, setTouched] = useState(false)
  const { busy, error, run } = useSubmit()
  const level = ((parent?.level ?? 0) + 1) as 1 | 2 | 3
  const clean = name.trim()
  const problem = !clean ? 'Give it a name' : undefined

  const submit = async (e?: FormEvent) => {
    e?.preventDefault()
    setTouched(true)
    if (problem) return
    let created: Group | undefined
    const ok = await run(async () => {
      created = await api.groups.create({ name: clean, parentId: parent?.id ?? null })
    })
    if (ok && created) {
      track('group_created', { level })
      onCreated(created)
    }
  }

  return (
    <BottomSheet title={`New ${LEVEL_NAME[level].toLowerCase()}`} onClose={onClose}>
      <form className="stack" onSubmit={submit} noValidate>
        {parent && <p className="t-body-sm muted">Inside <strong>{parent.name}</strong>. It gets its own chat.</p>}
        {!parent && <p className="t-body-sm muted">A new main group with its own chat. You'll be its first member.</p>}
        {error != null && <ErrorBanner error={error} />}
        <TextField label="Name" value={name} onChange={setName} maxLength={LIMITS.groupNameMax} autoFocus
          hint={`${clean.length} of ${LIMITS.groupNameMax}`} error={touched ? problem : undefined} />
        <Button type="submit" loading={busy}>Create {LEVEL_NAME[level].toLowerCase()}</Button>
      </form>
    </BottomSheet>
  )
}

/* ---------- Add people (ROL-01) ---------- */

export function AddMembersSheet({ group, onClose, onAdded }: { group: Group; onClose: () => void; onAdded: (n: number) => void }) {
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [picked, setPicked] = useState<string[]>([])
  const { busy, error, run } = useSubmit()
  const room = Math.max(0, LIMITS.maxMembers - group.rootMemberCount)

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query), 200)
    return () => window.clearTimeout(t)
  }, [query])

  const people = useAsync(() => api.groups.candidates(group.id, debounced), [group.id, debounced])
  const over = picked.length > room

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  const add = async () => {
    if (await run(() => api.groups.addMembers(group.id, picked))) {
      track('members_added', { count: picked.length })
      onAdded(picked.length)
    }
  }

  return (
    <BottomSheet title="Add people" onClose={onClose}>
      <p className="t-body-sm muted" style={{ marginBottom: 'var(--s-4)' }}>
        {room === 0 ? 'This group is full.' : `Room for ${room} more ${room === 1 ? 'person' : 'people'} (limit ${LIMITS.maxMembers}).`}
      </p>
      <div className="search" style={{ margin: '0 0 var(--s-4)' }}>
        <IconSearch size={20} />
        <input type="search" placeholder="Search people by name" aria-label="Search people by name" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      {error != null && <div style={{ marginBottom: 'var(--s-4)' }}><ErrorBanner error={error} /></div>}
      {over && <div style={{ marginBottom: 'var(--s-4)' }}><Banner kind="error" title="That's more than fits">Pick {room} or fewer. Adding people past {LIMITS.maxMembers} needs a paid plan.</Banner></div>}
      {people.status === 'loading' && <div aria-busy="true">{[0, 1, 2].map((i) => <div key={i} className="list-row"><Skeleton width={40} height={40} radius="50%" /><Skeleton width="50%" height={14} /></div>)}</div>}
      {people.status === 'error' && <ErrorBanner error={people.error} onRetry={people.reload} />}
      {people.status === 'ready' && people.data.length === 0 && (
        <p className="t-body-sm muted" style={{ padding: 'var(--s-5) 0', textAlign: 'center' }}>{debounced ? `No one matches “${debounced}”` : 'Everyone is already in this group'}</p>
      )}
      {people.status === 'ready' && (
        <ul className="people" role="list">
          {people.data.map((p) => {
            const on = picked.includes(p.id)
            return (
              <li key={p.id}>
                <button type="button" className="list-row" role="checkbox" aria-checked={on} onClick={() => toggle(p.id)}>
                  <Avatar name={p.name} size={40} presence={p.presence} />
                  <span className="people__text">
                    <span className="t-title-sm people__name">{p.name}</span>
                    {(p.titleTag || p.jobTitle) && <span className="t-caption muted">{p.titleTag ?? p.jobTitle}</span>}
                  </span>
                  <span className={`check${on ? ' is-on' : ''}`} aria-hidden="true">{on && <IconCheck size={16} />}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
      <div style={{ marginTop: 'var(--s-5)' }}>
        <Button loading={busy} disabled={picked.length === 0 || over} onClick={() => void add()}>
          {picked.length ? `Add ${picked.length} ${picked.length === 1 ? 'person' : 'people'}` : 'Add people'}
        </Button>
      </div>
    </BottomSheet>
  )
}

/* ---------- Invite link (GRP-06, ROL-01, ROL-02) ---------- */

export function InviteSheet({ group, onClose }: { group: Group; onClose: () => void }) {
  const link = useAsync(() => api.groups.createLink(group.id), [group.id])
  const [copied, setCopied] = useState(false)
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      track('invite_link_copied', { role: group.myRole })
    } catch {
      setCopied(false)
    }
  }

  return (
    <BottomSheet title="Invite to this group" onClose={onClose}>
      <div className="stack">
        <p className="t-body-sm muted">Anyone with this link can join <strong>{group.name}</strong>. {group.myRole === 'member' ? 'You can share it with people who are not in the app yet.' : 'Members can share it too.'}</p>
        {link.status === 'loading' && <Skeleton height={52} radius={16} />}
        {link.status === 'error' && <ErrorBanner error={link.error} onRetry={link.reload} />}
        {link.status === 'ready' && (
          <>
            <div className="linkbox" aria-label="Invite link"><span className="linkbox__url">{link.data.url}</span></div>
            <Button onClick={() => void copy(link.data.url)}>
              {copied ? <><IconCheck size={18} /> Link copied</> : <><IconCopy size={18} /> Copy link</>}
            </Button>
            {canShare && (
              <Button variant="secondary" onClick={() => void navigator.share({ title: group.name, url: link.data.url }).catch(() => undefined)}>Share…</Button>
            )}
          </>
        )}
      </div>
    </BottomSheet>
  )
}

/* ---------- One member: title tag and block (ROL-03, ROL-04) ---------- */

export function MemberSheet({ group, member, onClose, onChanged }: { group: Group; member: GroupMember; onClose: () => void; onChanged: () => void }) {
  const [tag, setTag] = useState(member.titleTag ?? '')
  const tagAction = useSubmit()
  const blockAction = useSubmit()
  const [confirmBlock, setConfirmBlock] = useState(false)
  const dirty = tag.trim() !== (member.titleTag ?? '')

  const saveTag = async (e?: FormEvent) => {
    e?.preventDefault()
    if (await tagAction.run(() => api.groups.setTitleTag(member.id, tag))) {
      track('title_tag_set', { cleared: !tag.trim() })
      onChanged()
    }
  }
  const toggleBlock = async () => {
    if (await blockAction.run(() => api.groups.setBlocked(group.id, member.id, !member.blocked))) {
      track(member.blocked ? 'member_unblocked' : 'member_blocked')
      onChanged()
    }
  }

  return (
    <BottomSheet title={member.name} onClose={onClose}>
      <div className="stack-lg">
        <form className="stack" onSubmit={saveTag} noValidate>
          {tagAction.error != null && <ErrorBanner error={tagAction.error} />}
          <TextField label="Title tag" value={tag} onChange={setTag} maxLength={LIMITS.titleTagMax}
            hint={`Shown next to their name in chats and member lists. ${tag.trim().length} of ${LIMITS.titleTagMax}`} />
          <Button type="submit" loading={tagAction.busy} disabled={!dirty}>{tag.trim() || !member.titleTag ? 'Save tag' : 'Remove tag'}</Button>
        </form>

        {!member.isMe && (
          <div className="stack">
            {blockAction.error != null && <ErrorBanner error={blockAction.error} />}
            {member.blocked ? (
              <Button variant="secondary" loading={blockAction.busy} onClick={() => void toggleBlock()}>Unblock {member.name.split(' ')[0]}</Button>
            ) : confirmBlock ? (
              <>
                <Banner kind="info">{member.name.split(' ')[0]} stays in the list, but can't send messages or get new ones in this group. You can unblock them any time.</Banner>
                <Button variant="destructive" loading={blockAction.busy} onClick={() => void toggleBlock()}>Block {member.name.split(' ')[0]}</Button>
                <Button variant="tertiary" onClick={() => setConfirmBlock(false)}>Cancel</Button>
              </>
            ) : (
              <Button variant="outlined" onClick={() => setConfirmBlock(true)}>Block…</Button>
            )}
          </div>
        )}
      </div>
    </BottomSheet>
  )
}

/* ---------- Leave (ROL-05, ROL-06) ---------- */

const LEAVE: { id: LeaveMode; title: string; sub: string }[] = [
  { id: 'keep', title: 'Leave and keep it in my list', sub: 'You stop getting new messages. You can still read what was sent.' },
  { id: 'delete', title: 'Leave and delete it for me', sub: "It disappears from your list. Everyone else keeps it." },
]

export function LeaveSheet({ group, onClose, onDone }: { group: Group; onClose: () => void; onDone: (mode: LeaveMode) => void }) {
  const [mode, setMode] = useState<LeaveMode>('keep')
  const { busy, error, run } = useSubmit()
  return (
    <BottomSheet title={`Leave ${group.name}?`} onClose={onClose}>
      <div className="stack">
        {error != null && <ErrorBanner error={error} />}
        <div className="card" role="radiogroup" aria-label="What happens when you leave">
          {LEAVE.map((c) => (
            <button key={c.id} type="button" className="radio-row" role="radio" aria-checked={mode === c.id} onClick={() => setMode(c.id)}>
              <span className="radio-dot" />
              <span>
                <span className="t-title-sm" style={{ display: 'block' }}>{c.title}</span>
                <span className="t-body-sm muted">{c.sub}</span>
              </span>
            </button>
          ))}
        </div>
        <Button variant="destructive" loading={busy} onClick={async () => { if (await run(() => api.groups.leave(group.id, mode))) { track('group_left', { mode }); onDone(mode) } }}>Leave group</Button>
        <Button variant="tertiary" onClick={onClose}>Stay</Button>
      </div>
    </BottomSheet>
  )
}

/* ---------- Archive and delete (GRP-09, 10, 11) ---------- */

export function ArchiveSheet({ group, onClose, onDone }: { group: Group; onClose: () => void; onDone: () => void }) {
  const { busy, error, run } = useSubmit()
  const un = group.archived
  return (
    <BottomSheet title={un ? `Bring back ${group.name}?` : `Archive ${group.name}?`} onClose={onClose}>
      <div className="stack">
        {error != null && <ErrorBanner error={error} />}
        <p className="t-body-sm muted">
          {un ? 'It returns to the group list with its sub-groups, and its chat comes back.' : "It moves to Archived with its sub-groups. Its chat leaves the chat list. Nothing is deleted, and you can bring it back."}
        </p>
        <Button loading={busy} onClick={async () => { if (await run(() => api.groups.archive(group.id, !un))) { track(un ? 'group_unarchived' : 'group_archived'); onDone() } }}>{un ? 'Bring back' : 'Archive'}</Button>
        <Button variant="tertiary" onClick={onClose}>Cancel</Button>
      </div>
    </BottomSheet>
  )
}

export function DeleteSheet({ group, hasSubgroups, onClose, onDeleted }: { group: Group; hasSubgroups: boolean; onClose: () => void; onDeleted: (d: DeletedGroup) => void }) {
  const { busy, error, run } = useSubmit()
  return (
    <BottomSheet title={`Delete ${group.name}?`} onClose={onClose}>
      <div className="stack">
        {error != null && <ErrorBanner error={error} />}
        <Banner kind="error">
          {hasSubgroups ? 'Its sub-groups and all their chats are deleted too. ' : 'Its chat and files are deleted. '}
          You can undo for {LIMITS.undoWindowSeconds} seconds right after.
        </Banner>
        <Button variant="destructive" loading={busy} onClick={async () => {
          let deleted: DeletedGroup | undefined
          if (await run(async () => { deleted = await api.groups.remove(group.id) }) && deleted) { track('group_deleted'); onDeleted(deleted) }
        }}>Delete group</Button>
        <Button variant="tertiary" onClick={onClose}>Keep it</Button>
      </div>
    </BottomSheet>
  )
}
