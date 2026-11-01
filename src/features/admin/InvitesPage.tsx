import { useState } from 'react'
import { api } from '../../data'
import type { AdminInvite } from '../../data/types'
import { Banner, BottomSheet, Button, Skeleton, TextField } from '../../design/ui'
import { IconCheck, IconCopy, IconPlus } from '../../design/icons'
import { track } from '../../experiments/analytics'
import { useAsync } from '../../state/useAsync'
import { useReviewRole } from '../../state/useReviewRole'
import { useSubmit } from '../../state/useSubmit'
import { ErrorBanner } from '../auth/AuthFrame'
import { validate } from '../auth/validators'
import { PageHead } from './AdminShell'

const date = (ms: number) => new Date(ms).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })
const LABEL = { active: 'Active', used: 'Used', expired: 'Expired', revoked: 'Revoked' } as const

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false)
  return (
    <Button variant="tertiary" block={false} onClick={() => { void navigator.clipboard?.writeText(text).then(() => { setDone(true); window.setTimeout(() => setDone(false), 2000) }, () => undefined) }}>
      {done ? <><IconCheck size={16} /> Copied</> : <><IconCopy size={16} /> Copy link</>}
    </Button>
  )
}

function NewInviteSheet({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [forOne, setForOne] = useState(false)
  const [email, setEmail] = useState('')
  const [days, setDays] = useState<7 | 30>(7)
  const [touched, setTouched] = useState(false)
  const [made, setMade] = useState<AdminInvite | null>(null)
  const { busy, error, run } = useSubmit()
  const emailError = forOne ? validate.email(email) : undefined

  if (made) {
    return (
      <BottomSheet title="Invite ready" onClose={() => { onCreated(); onClose() }}>
        <div className="stack">
          <p className="t-body-sm muted">{made.email ? `Only ${made.email} can use it, once.` : 'Anyone with the link can join until it expires.'} It works until {date(made.expiresAt)}.</p>
          <div className="linkbox"><span className="linkbox__url">{made.link}</span></div>
          <CopyButton text={made.link} />
          <Button onClick={() => { onCreated(); onClose() }}>Done</Button>
        </div>
      </BottomSheet>
    )
  }
  return (
    <BottomSheet title="New invite" onClose={onClose}>
      <form className="stack" noValidate onSubmit={async (e) => {
        e.preventDefault()
        setTouched(true)
        if (emailError) return
        let inv: AdminInvite | undefined
        if (await run(async () => { inv = await api.admin.createInvite({ email: forOne ? email : undefined, days }) }) && inv) { track('admin_invite_created', { forOne, days }); setMade(inv) }
      }}>
        {error != null && <ErrorBanner error={error} />}
        <div className="seg" role="group" aria-label="Who can use it" style={{ alignSelf: 'flex-start' }}>
          <button type="button" aria-pressed={!forOne} onClick={() => setForOne(false)}>Open link</button>
          <button type="button" aria-pressed={forOne} onClick={() => setForOne(true)}>One person</button>
        </div>
        {forOne && <TextField label="Their email" type="email" value={email} onChange={setEmail} autoFocus error={touched ? emailError : undefined} />}
        <div className="seg" role="group" aria-label="How long it works" style={{ alignSelf: 'flex-start' }}>
          {([7, 30] as const).map((d) => <button key={d} type="button" aria-pressed={days === d} onClick={() => setDays(d)}>{d} days</button>)}
        </div>
        <Button type="submit" loading={busy}>Create invite</Button>
      </form>
    </BottomSheet>
  )
}

/** Organization invites (ACC-05): make them, copy them, switch them off. The invite page and sign-up use the same ones. */
export function InvitesPage() {
  const role = useReviewRole()
  const list = useAsync(() => api.admin.invites(), [role])
  const [making, setMaking] = useState(false)
  const revoke = useSubmit()
  const [target, setTarget] = useState<AdminInvite | null>(null)
  return (
    <div className="admin__page">
      <PageHead title="Invites" sub="Links that let people join your organization" action={<Button block={false} onClick={() => setMaking(true)}><IconPlus size={18} /> New invite</Button>} />
      {list.status === 'loading' && <div aria-busy="true" aria-label="Loading invites">{[0, 1, 2].map((i) => <Skeleton key={i} height={52} radius={12} />)}</div>}
      {list.status === 'error' && <ErrorBanner error={list.error} onRetry={list.reload} />}
      {list.status === 'ready' && list.data.length === 0 && <p className="t-body-sm muted" style={{ padding: 'var(--s-6) 0' }}>No invites yet. Make one and share the link.</p>}
      {list.status === 'ready' && list.data.length > 0 && (
        <div className="atable-wrap">
          <table className="atable">
            <caption className="sr-only">Invites</caption>
            <thead><tr><th scope="col">Code</th><th scope="col">For</th><th scope="col">Status</th><th scope="col">Expires</th><th scope="col">Used</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {list.data.map((i) => (
                <tr key={i.code}>
                  <th scope="row"><code>{i.code}</code></th>
                  <td>{i.email ?? 'Anyone with the link'}</td>
                  <td><span className={`tag${i.status === 'active' ? ' tag--admin' : i.status === 'revoked' || i.status === 'expired' ? ' tag--blocked' : ''}`}>{LABEL[i.status]}</span></td>
                  <td>{date(i.expiresAt)}</td>
                  <td>{i.uses}</td>
                  <td className="atable__actions">
                    {i.status === 'active' && <><CopyButton text={i.link} /><Button variant="tertiary" block={false} onClick={() => setTarget(i)}>Revoke</Button></>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {making && <NewInviteSheet onClose={() => setMaking(false)} onCreated={list.reload} />}
      {target && (
        <BottomSheet title={`Revoke ${target.code}?`} onClose={() => { revoke.reset(); setTarget(null) }}>
          <div className="stack">
            {revoke.error != null && <ErrorBanner error={revoke.error} />}
            <Banner kind="info">The link stops working right away. People who already joined stay.</Banner>
            <Button variant="destructive" loading={revoke.busy} onClick={async () => { if (await revoke.run(() => api.admin.revokeInvite(target.code))) { track('admin_invite_revoked'); setTarget(null); list.reload() } }}>Revoke invite</Button>
            <Button variant="tertiary" onClick={() => setTarget(null)}>Keep it</Button>
          </div>
        </BottomSheet>
      )}
    </div>
  )
}
