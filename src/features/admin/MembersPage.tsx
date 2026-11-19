import { useEffect, useState, type FormEvent } from 'react'
import { api } from '../../data'
import type { AdminMember } from '../../data/types'
import { Banner, BottomSheet, Button, Skeleton, TextField } from '../../design/ui'
import { IconPlus, IconSearch } from '../../design/icons'
import { track } from '../../analytics'
import { useAsync } from '../../state/useAsync'
import { useReviewRole } from '../../state/useReviewRole'
import { useSubmit } from '../../state/useSubmit'
import { ErrorBanner } from '../auth/AuthFrame'
import { validate } from '../auth/validators'
import { LIMITS } from '../../config/limits'
import { PageHead } from './AdminShell'

function AddMemberSheet({ onClose, onAdded }: { onClose: () => void; onAdded: (m: AdminMember) => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [job, setJob] = useState('')
  const [touched, setTouched] = useState(false)
  const { busy, error, run } = useSubmit()
  const errors = { name: validate.name(name), email: validate.email(email) }
  const submit = async (e?: FormEvent) => {
    e?.preventDefault()
    setTouched(true)
    if (errors.name || errors.email) return
    let added: AdminMember | undefined
    if (await run(async () => { added = await api.admin.addMember({ name, email, jobTitle: job }) }) && added) { track('admin_member_added'); onAdded(added) }
  }
  return (
    <BottomSheet title="Add a member" onClose={onClose}>
      <form className="stack" onSubmit={submit} noValidate>
        <p className="t-body-sm muted">They get an email to finish signing up and join the organization.</p>
        {error != null && <ErrorBanner error={error} />}
        <TextField label="Full name" value={name} onChange={setName} autoFocus autoComplete="off" error={touched ? errors.name : undefined} />
        <TextField label="Work email" type="email" value={email} onChange={setEmail} autoComplete="off" error={touched ? errors.email : undefined} />
        <TextField label="Job title (optional)" value={job} onChange={setJob} autoComplete="off" />
        <Button type="submit" loading={busy}>Add member</Button>
      </form>
    </BottomSheet>
  )
}

function TagSheet({ member, onClose, onSaved }: { member: AdminMember; onClose: () => void; onSaved: () => void }) {
  const [tag, setTag] = useState(member.titleTag ?? '')
  const { busy, error, run } = useSubmit()
  return (
    <BottomSheet title={`Title tag for ${member.name}`} onClose={onClose}>
      <form className="stack" onSubmit={async (e) => { e.preventDefault(); if (await run(() => api.groups.setTitleTag(member.id, tag))) onSaved() }}>
        {error != null && <ErrorBanner error={error} />}
        <TextField label="Title tag" value={tag} onChange={setTag} maxLength={LIMITS.titleTagMax} autoFocus hint={`Shown next to their name in chats and member lists. ${tag.trim().length} of ${LIMITS.titleTagMax}`} />
        <Button type="submit" loading={busy} disabled={tag.trim() === (member.titleTag ?? '')}>Save</Button>
      </form>
    </BottomSheet>
  )
}

function RemoveSheet({ member, onClose, onRemoved }: { member: AdminMember; onClose: () => void; onRemoved: () => void }) {
  const { busy, error, run } = useSubmit()
  return (
    <BottomSheet title={`Remove ${member.name}?`} onClose={onClose}>
      <div className="stack">
        {error != null && <ErrorBanner error={error} />}
        <Banner kind="error">They leave every group and calendar of the organization and lose access to its chats. Their personal account stays.</Banner>
        <Button variant="destructive" loading={busy} onClick={async () => { if (await run(() => api.admin.removeMember(member.id))) { track('admin_member_removed'); onRemoved() } }}>Remove from organization</Button>
        <Button variant="tertiary" onClick={onClose}>Keep them</Button>
      </div>
    </BottomSheet>
  )
}

/** Everyone in the organization (ROL-01): add, give a title tag, remove. */
export function MembersPage() {
  const role = useReviewRole()
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [dialog, setDialog] = useState<'add' | null>(null)
  const [tagFor, setTagFor] = useState<AdminMember | null>(null)
  const [removeFor, setRemoveFor] = useState<AdminMember | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query), 200)
    return () => window.clearTimeout(t)
  }, [query])
  const list = useAsync(() => api.admin.members(debounced), [debounced, role])

  return (
    <div className="admin__page">
      <PageHead title="Members" sub="People in your organization" action={<Button block={false} onClick={() => setDialog('add')}><IconPlus size={18} /> Add member</Button>} />
      {notice && <Banner kind="success">{notice}</Banner>}
      <div className="search admin__search">
        <IconSearch size={20} />
        <input type="search" placeholder="Search by name or email" aria-label="Search members" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      {list.status === 'loading' && <div aria-busy="true" aria-label="Loading members">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} height={52} radius={12} />)}</div>}
      {list.status === 'error' && <ErrorBanner error={list.error} onRetry={list.reload} />}
      {list.status === 'ready' && list.data.length === 0 && <p className="t-body-sm muted" style={{ padding: 'var(--s-6) 0' }}>{debounced ? `No one matches “${debounced}”.` : 'No members yet. Add one, or send an invite.'}</p>}
      {list.status === 'ready' && list.data.length > 0 && (
        <div className="atable-wrap">
          <table className="atable">
            <caption className="sr-only">Members</caption>
            <thead><tr><th scope="col">Name</th><th scope="col">Email</th><th scope="col">Title</th><th scope="col">Groups</th><th scope="col">Status</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {list.data.map((m) => (
                <tr key={m.id}>
                  <th scope="row"><span className="atable__name">{m.name}{m.isMe && <span className="muted"> (you)</span>}</span>{m.jobTitle && <span className="t-caption muted">{m.jobTitle}</span>}</th>
                  <td>{m.email}</td>
                  <td>{m.titleTag ? <span className="tag">{m.titleTag}</span> : <span className="muted">None</span>}</td>
                  <td>{m.groups}</td>
                  <td><span className={`tag${m.status === 'pending' ? ' tag--pending' : ''}`}>{m.status === 'pending' ? 'Not signed in' : 'Active'}</span></td>
                  <td className="atable__actions">
                    <Button variant="tertiary" block={false} onClick={() => setTagFor(m)}>Title tag</Button>
                    {!m.isMe && <Button variant="tertiary" block={false} onClick={() => setRemoveFor(m)}>Remove</Button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {dialog === 'add' && <AddMemberSheet onClose={() => setDialog(null)} onAdded={(m) => { setDialog(null); setNotice(`${m.name} was added. We emailed ${m.email}.`); list.reload() }} />}
      {tagFor && <TagSheet member={tagFor} onClose={() => setTagFor(null)} onSaved={() => { setTagFor(null); list.reload() }} />}
      {removeFor && <RemoveSheet member={removeFor} onClose={() => setRemoveFor(null)} onRemoved={() => { setNotice(`${removeFor.name} was removed.`); setRemoveFor(null); list.reload() }} />}
    </div>
  )
}
