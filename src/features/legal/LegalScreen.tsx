import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../../data'
import type { LegalKind } from '../../data/types'
import { BackButton, Button, Skeleton } from '../../design/ui'
import { useSession } from '../../state/session'
import { useAsync } from '../../state/useAsync'
import { ErrorBanner } from '../auth/AuthFrame'

const KINDS: readonly LegalKind[] = ['terms', 'privacy', 'guidelines', 'licenses']

/** Terms, privacy policy, community guidelines and licenses. Readable signed out, because people agree to them before they have an account. */
export function LegalScreen() {
  const { kind = '' } = useParams()
  const navigate = useNavigate()
  const { account } = useSession()
  const valid = (KINDS as readonly string[]).includes(kind)
  const doc = useAsync(() => (valid ? api.legal.document(kind as LegalKind) : Promise.reject(new Error('unknown'))), [kind])
  const back = () => (window.history.length > 1 ? navigate(-1) : navigate(account ? '/account/help' : '/welcome'))

  return (
    <main className="page surface fade-in">
      <header className="bar bar--back">
        <BackButton onClick={back} />
        <h1 className="bar__title">{doc.status === 'ready' ? doc.data.title : 'Legal'}</h1>
      </header>
      <div className="page__body stack-lg">
        {doc.status === 'loading' && <div aria-busy="true" aria-label="Loading"><Skeleton height={200} radius={16} /></div>}
        {doc.status === 'error' && (valid
          ? <ErrorBanner error={doc.error} onRetry={doc.reload} />
          : <div className="empty"><h2 className="t-title">That page doesn't exist</h2><Button block={false} onClick={back}>Go back</Button></div>)}
        {doc.status === 'ready' && (
          <article className="legal">
            <p className="t-caption muted">Updated {new Date(doc.data.updatedAt).toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            {doc.data.intro && <p className="t-body-sm" style={{ marginTop: 'var(--s-3)' }}>{doc.data.intro}</p>}
            {doc.data.sections.map((s) => (
              <section key={s.heading} className="legal__section">
                <h2 className="t-title-sm">{s.heading}</h2>
                {s.body.map((p) => <p key={p} className="t-body-sm">{p}</p>)}
              </section>
            ))}
          </article>
        )}
      </div>
    </main>
  )
}
