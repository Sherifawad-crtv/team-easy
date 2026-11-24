import { useNavigate } from 'react-router-dom'
import { api } from '../../data'
import { Avatar, BackButton, Button, Skeleton } from '../../design/ui'
import { IconBlock } from '../../design/icons'
import { track } from '../../analytics'
import { useAsync } from '../../state/useAsync'
import { useSubmit } from '../../state/useSubmit'
import { ErrorBanner } from '../auth/AuthFrame'

/** The people you blocked. They can't message or call you, and they aren't told. */
export function BlockedScreen() {
  const navigate = useNavigate()
  const list = useAsync(() => api.safety.blocked(), [])
  const unblock = useSubmit()

  return (
    <main className="page surface fade-in">
      <header className="bar bar--back">
        <BackButton onClick={() => navigate('/account/privacy')} />
        <h1 className="bar__title">Blocked contacts</h1>
      </header>
      <div className="page__body stack-lg">
        {list.status === 'loading' && <div aria-busy="true" aria-label="Loading blocked contacts"><Skeleton height={64} radius={16} /></div>}
        {list.status === 'error' && <ErrorBanner error={list.error} onRetry={list.reload} />}
        {unblock.error != null && <ErrorBanner error={unblock.error} />}

        {list.status === 'ready' && list.data.length === 0 && (
          <div className="empty">
            <span className="empty__icon"><IconBlock size={40} /></span>
            <h2 className="t-title">No blocked contacts</h2>
            <p className="t-body-sm muted">People you block can't message or call you, and they aren't told. Block someone from their info in a chat.</p>
          </div>
        )}

        {list.status === 'ready' && list.data.length > 0 && (
          <>
            <ul className="card" role="list">
              {list.data.map((p) => (
                <li key={p.id} className="setting-row">
                  <span className="row-flex" style={{ gap: 'var(--s-4)', minWidth: 0 }}>
                    <Avatar name={p.name} size={44} />
                    <span style={{ minWidth: 0 }}>
                      <span className="t-title-sm" style={{ display: 'block', overflowWrap: 'anywhere' }}>{p.name}</span>
                      {p.jobTitle && <span className="t-body-sm muted">{p.jobTitle}</span>}
                    </span>
                  </span>
                  <Button variant="secondary" block={false} loading={unblock.busy} onClick={async () => {
                    if (await unblock.run(() => api.safety.unblock(p.id))) { track('person_unblocked'); list.reload() }
                  }}>Unblock</Button>
                </li>
              ))}
            </ul>
            <p className="t-caption muted">Blocked people can't message or call you. They aren't told that you blocked them.</p>
          </>
        )}
      </div>
    </main>
  )
}
