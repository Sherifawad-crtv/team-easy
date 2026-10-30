import { useNavigate } from 'react-router-dom'
import { api } from '../../data'
import type { CallRecord } from '../../data/types'
import { BackButton, Banner, Skeleton } from '../../design/ui'
import { IconCall, IconCallIn, IconCallMissed, IconCallOut, IconVideo } from '../../design/icons'
import { useCalls } from '../../state/calls'
import { useAsync } from '../../state/useAsync'
import { ErrorBanner } from '../auth/AuthFrame'
import { listTime } from '../chat/format'
import { directionLabel, minutes, modeLabel } from './format'

const Icon = { outgoing: IconCallOut, incoming: IconCallIn, missed: IconCallMissed } as const

/** Today's calling time against the daily cap (CLL-05), and recent calls with a way to call back. */
export function CallsScreen() {
  const navigate = useNavigate()
  const calls = useCalls()
  const usage = useAsync(() => api.calls.usage(), [calls.call?.id, calls.ended])
  const history = useAsync(() => api.calls.history(), [calls.call?.id, calls.ended])

  return (
    <main className="page surface fade-in">
      <header className="bar bar--back">
        <BackButton onClick={() => navigate('/account')} />
        <h1 className="bar__title">Calls</h1>
      </header>
      <div className="page__body stack-lg">
        <section aria-label="Calling time today">
          <div className="meter-head">
            <h2 className="t-title-sm">Today's calling time</h2>
            {usage.status === 'ready' && <span className="t-body-sm muted">{minutes(usage.data.usedSeconds)} of {minutes(usage.data.capSeconds)}</span>}
          </div>
          {usage.status === 'loading' && <Skeleton height={8} radius={999} />}
          {usage.status === 'error' && <ErrorBanner error={usage.error} onRetry={usage.reload} />}
          {usage.status === 'ready' && (
            <>
              <div className="meter" role="progressbar" aria-valuemin={0} aria-valuemax={usage.data.capSeconds} aria-valuenow={usage.data.usedSeconds} aria-label="Calling time used today">
                <span className={`meter__fill${usage.data.capSeconds - usage.data.usedSeconds <= 300 ? ' is-low' : ''}`} style={{ width: `${Math.min(100, (usage.data.usedSeconds / usage.data.capSeconds) * 100)}%` }} />
              </div>
              <p className="t-body-sm muted" style={{ marginTop: 'var(--s-3)' }}>
                {usage.data.usedSeconds >= usage.data.capSeconds ? "You've used it all. It starts again at midnight." : `${minutes(usage.data.capSeconds - usage.data.usedSeconds)} left. Audio and video share one hour a day, and it starts again at midnight.`}
              </p>
            </>
          )}
        </section>

        {usage.status === 'ready' && usage.data.usedSeconds >= usage.data.capSeconds && <Banner kind="offline" title="No calling time left today">You can still send messages and files.</Banner>}

        <section aria-label="Recent calls">
          <h2 className="t-title-sm" style={{ marginBottom: 'var(--s-3)' }}>Recent calls</h2>
          {history.status === 'loading' && <div aria-busy="true" aria-label="Loading calls">{[0, 1, 2].map((i) => <Skeleton key={i} height={64} radius={16} />)}</div>}
          {history.status === 'error' && <ErrorBanner error={history.error} onRetry={history.reload} />}
          {history.status === 'ready' && history.data.length === 0 && (
            <div className="empty"><span className="empty__icon"><IconCall size={40} /></span><h3 className="t-title">No calls yet</h3><p className="t-body-sm muted">Start one with the phone or video button at the top of a chat.</p></div>
          )}
          {history.status === 'ready' && history.data.length > 0 && (
            <ul className="card" role="list">
              {history.data.map((r: CallRecord) => {
                const D = Icon[r.direction]
                return (
                  <li key={`${r.id}-${r.startedAt}`} className="crow">
                    <span className={`crow__ic crow__ic--${r.direction}`}><D size={20} /></span>
                    <span className="people__text">
                      <span className="t-title-sm people__name">{r.title}</span>
                      <span className="t-caption muted">{directionLabel(r.direction)} · {modeLabel(r.mode, r.group)}{r.seconds ? ` · ${minutes(r.seconds)}` : ''} · {listTime(r.startedAt)}</span>
                    </span>
                    <button type="button" className="icon-btn" aria-label={`Call ${r.title} again, ${r.mode}`} disabled={Boolean(calls.call)} onClick={() => calls.begin(r.conversationId, r.mode)}>
                      {r.mode === 'video' ? <IconVideo size={22} /> : <IconCall size={22} />}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}
