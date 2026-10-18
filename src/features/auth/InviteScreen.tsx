import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../../data'
import { Avatar, Button, Logo, TextField } from '../../design/ui'
import { useAsync } from '../../state/useAsync'
import { AuthFrame, ErrorBanner } from './AuthFrame'

/** Organization invite (ACC-04, ACC-05): enter a link or code, then see who invited you. */
export function InviteScreen() {
  const { token } = useParams()
  return token ? <InviteDetails token={decodeURIComponent(token)} /> : <EnterInvite />
}

function EnterInvite() {
  const navigate = useNavigate()
  const [value, setValue] = useState('')
  const [touched, setTouched] = useState(false)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    setTouched(true)
    const code = value.trim().split('/').pop()
    if (code) navigate(`/invite/${encodeURIComponent(code)}`)
  }
  return (
    <AuthFrame>
      <h1 className="t-headline">Join your organization</h1>
      <p className="t-body muted" style={{ marginTop: 'var(--s-4)' }}>
        Paste the invite link your admin sent you, or type the code.
      </p>
      <form className="stack" style={{ marginTop: 'var(--s-7)' }} onSubmit={submit} noValidate>
        <TextField label="Invite link or code" value={value} onChange={setValue} error={touched && !value.trim() ? 'Enter your invite link or code' : undefined} autoCapitalize="characters" />
        <Button type="submit">Check invite</Button>
      </form>
    </AuthFrame>
  )
}

function InviteDetails({ token }: { token: string }) {
  const navigate = useNavigate()
  const invite = useAsync(() => api.auth.resolveInvite(token), [token])

  return (
    <AuthFrame>
      {invite.status === 'loading' && (
        <div role="status" aria-live="polite" style={{ textAlign: 'center', paddingTop: 'var(--s-9)' }}>
          <Logo size={56} />
          <p className="t-body muted" style={{ marginTop: 'var(--s-5)' }}>Checking your invite…</p>
        </div>
      )}
      {invite.status === 'error' && (
        <div className="stack-lg">
          <ErrorBanner error={invite.error} onRetry={invite.reload} />
          <div className="stack">
            <Button variant="secondary" onClick={() => navigate('/invite', { replace: true })}>Enter a different code</Button>
            <Button variant="tertiary" onClick={() => navigate('/sign-up', { replace: true })}>Create an account without it</Button>
          </div>
        </div>
      )}
      {invite.status === 'ready' && (
        <div className="stack-lg fade-in">
          <h1 className="t-headline">You're invited</h1>
          <div className="card row-flex" style={{ padding: 'var(--s-5)', gap: 'var(--s-5)' }}>
            <Avatar name={invite.data.organization.name} size={64} group />
            <div>
              <p className="t-title">{invite.data.organization.name}</p>
              <p className="t-body-sm muted">Invited by {invite.data.invitedBy}</p>
            </div>
          </div>
          <p className="t-body-sm muted">You can still use Team Easy on your own. Your organization account stays separate.</p>
          <Button onClick={() => navigate(`/sign-up?invite=${encodeURIComponent(invite.data.token)}`)}>Continue to create account</Button>
        </div>
      )}
    </AuthFrame>
  )
}
