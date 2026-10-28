import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../../data'
import { Avatar, Button, Logo } from '../../design/ui'
import { IconPeople } from '../../design/icons'
import { track } from '../../experiments/analytics'
import { useSession } from '../../state/session'
import { useAsync } from '../../state/useAsync'
import { useSubmit } from '../../state/useSubmit'
import { AuthFrame, ErrorBanner } from '../auth/AuthFrame'
import { memberLabel } from './tree'

const PENDING_KEY = 'te.pendingJoin'

/** Remembers a join link across sign-in or sign-up. */
export const pendingJoin = {
  get(): string | null {
    try { return sessionStorage.getItem(PENDING_KEY) } catch { return null }
  },
  set(token: string) {
    try { sessionStorage.setItem(PENDING_KEY, token) } catch { /* ignore */ }
  },
  clear() {
    try { sessionStorage.removeItem(PENDING_KEY) } catch { /* ignore */ }
  },
}

/** Join a group from a link (GRP-06). Works signed in or out. */
export function JoinScreen() {
  const { token = '' } = useParams()
  const navigate = useNavigate()
  const { account } = useSession()
  const code = decodeURIComponent(token)
  const info = useAsync(() => api.groups.resolveLink(code), [code])
  const join = useSubmit()

  // Signed in: the link has done its job, don't send them back here after the next sign-in.
  useEffect(() => { if (account) pendingJoin.clear() }, [account])

  const go = (path: string) => {
    pendingJoin.set(code)
    navigate(path)
  }

  return (
    <AuthFrame back={false}>
      {info.status === 'loading' && (
        <div role="status" aria-live="polite" style={{ textAlign: 'center', paddingTop: 'var(--s-9)' }}>
          <Logo size={56} />
          <p className="t-body muted" style={{ marginTop: 'var(--s-5)' }}>Checking your link…</p>
        </div>
      )}
      {info.status === 'error' && (
        <div className="stack-lg">
          <ErrorBanner error={info.error} onRetry={info.reload} />
          <Button variant="secondary" onClick={() => navigate(account ? '/groups' : '/welcome', { replace: true })}>{account ? 'Go to groups' : 'Back to start'}</Button>
        </div>
      )}
      {info.status === 'ready' && (
        <div className="stack-lg fade-in">
          <h1 className="t-headline">{info.data.alreadyMember ? "You're already in" : "You're invited to join"}</h1>
          <div className="card row-flex" style={{ padding: 'var(--s-5)', gap: 'var(--s-5)' }}>
            <Avatar name={info.data.groupName} size={64} group icon={<IconPeople size={28} />} />
            <div style={{ minWidth: 0 }}>
              <p className="t-title" style={{ overflowWrap: 'anywhere' }}>{info.data.groupName}</p>
              <p className="t-body-sm muted">{info.data.path.length ? `${info.data.path.join(' › ')} · ` : ''}{memberLabel(info.data.memberCount)}</p>
              <p className="t-body-sm muted">Invited by {info.data.invitedBy}</p>
            </div>
          </div>
          {join.error != null && <ErrorBanner error={join.error} />}
          {account ? (
            info.data.alreadyMember ? (
              <Button onClick={() => navigate(`/groups/${info.data.groupId}`)}>Open group</Button>
            ) : (
              <Button loading={join.busy} onClick={async () => {
                if (await join.run(() => api.groups.join(code))) {
                  track('group_joined')
                  pendingJoin.clear()
                  navigate(`/groups/${info.data.groupId}`, { replace: true })
                }
              }}>Join group</Button>
            )
          ) : (
            <div className="stack">
              <p className="t-body-sm muted">Sign in or create an account to join. We'll bring you back here.</p>
              <Button onClick={() => go('/sign-in')}>Sign in to join</Button>
              <Button variant="secondary" onClick={() => go('/sign-up')}>Create an account</Button>
            </div>
          )}
        </div>
      )}
    </AuthFrame>
  )
}
