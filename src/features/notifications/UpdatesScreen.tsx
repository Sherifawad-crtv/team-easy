import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../../data'
import type { UpdateItem } from '../../data/types'
import { BackButton, Skeleton } from '../../design/ui'
import { IconBell, IconChevronRight } from '../../design/icons'
import { useAsync } from '../../state/useAsync'
import { ErrorBanner } from '../auth/AuthFrame'

const KIND = { release: 'New version', update: "What's new", offer: 'Offer' } as const
const date = (ms: number) => new Date(ms).toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' })

/** The log of releases, updates and offers (NTF-01), or one of them (NTF-03). */
export function UpdatesScreen() {
  const { id } = useParams()
  return id ? <UpdateDetail id={id} /> : <UpdateLog />
}

function UpdateLog() {
  const navigate = useNavigate()
  const log = useAsync(() => api.notifications.updates(), [])
  return (
    <main className="page surface fade-in">
      <header className="bar bar--back">
        <BackButton onClick={() => navigate('/account')} />
        <h1 className="bar__title">What's new</h1>
      </header>
      <div className="page__body stack">
        {log.status === 'loading' && <div aria-busy="true" aria-label="Loading updates">{[0, 1, 2].map((i) => <Skeleton key={i} height={84} radius={16} />)}</div>}
        {log.status === 'error' && <ErrorBanner error={log.error} onRetry={log.reload} />}
        {log.status === 'ready' && log.data.length === 0 && (
          <div className="empty"><span className="empty__icon"><IconBell size={40} /></span><h2 className="t-title">Nothing new yet</h2><p className="t-body-sm muted">Releases, updates and offers will be listed here.</p></div>
        )}
        {log.status === 'ready' && log.data.map((u) => (
          <button key={u.id} type="button" className="card ulog" onClick={() => navigate(`/updates/${u.id}`)}>
            <span className="people__text">
              <span className="ubanner__kind">{KIND[u.kind]} · {date(u.at)}</span>
              <span className="t-title-sm people__name">{u.title}</span>
              <span className="t-body-sm muted">{u.summary}</span>
            </span>
            <IconChevronRight size={20} />
          </button>
        ))}
      </div>
    </main>
  )
}

function UpdateDetail({ id }: { id: string }) {
  const navigate = useNavigate()
  const item = useAsync<UpdateItem>(() => api.notifications.update(id), [id])
  return (
    <main className="page surface fade-in">
      <header className="bar bar--back">
        <BackButton onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/updates'))} />
        <h1 className="bar__title">{item.status === 'ready' ? KIND[item.data.kind] : "What's new"}</h1>
      </header>
      <div className="page__body stack-lg">
        {item.status === 'loading' && <div aria-busy="true"><Skeleton height={32} radius={8} /><div style={{ height: 12 }} /><Skeleton height={120} radius={16} /></div>}
        {item.status === 'error' && <ErrorBanner error={item.error} onRetry={item.reload} />}
        {item.status === 'ready' && (
          <article className="stack">
            <p className="t-caption muted">{date(item.data.at)}</p>
            <h2 className="t-headline">{item.data.title}</h2>
            <p className="t-body muted">{item.data.summary}</p>
            {item.data.body.map((p) => <p key={p} className="t-body">{p}</p>)}
          </article>
        )}
      </div>
    </main>
  )
}
