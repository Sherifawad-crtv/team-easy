import { useState } from 'react'
import { Banner, Button, Skeleton } from '../../design/ui'
import { EXPERIMENTS, EXPERIMENT_IDS, type ExperimentId } from '../../experiments/experiments'
import { OPEN_EVENT } from '../../experiments/summary'
import { clearLocalEvents, loadSummary } from '../../experiments/analytics'
import type { SummaryRow } from '../../experiments/summary'
import { useAsync } from '../../state/useAsync'
import { ErrorBanner } from '../auth/AuthFrame'

const seconds = (ms: number | null) => (ms === null ? 'n/a' : `${(ms / 1000).toFixed(1)} s`)
const per = (n: number, v: number) => (v ? (n / v).toFixed(1) : 'n/a')

function Card({ row }: { row: SummaryRow }) {
  const groups = OPEN_EVENT[row.experiment as ExperimentId] === 'group_opened'
  const noun = groups ? 'group' : 'chat'
  return (
    <div className="card result">
      <p className="t-title result__variant">Variant {row.variant}</p>
      <dl>
        <div><dt>Visitors</dt><dd>{row.visitors}</dd></div>
        <div><dt>{groups ? 'Groups' : 'Chats'} opened per visitor</dt><dd>{per(row.opens, row.visitors)}</dd></div>
        {!groups && <div><dt>Messages sent per visitor</dt><dd>{per(row.messages, row.visitors)}</dd></div>}
        <div><dt>Time to first {noun}</dt><dd>{seconds(row.avgMsToFirstOpen)}</dd></div>
      </dl>
    </div>
  )
}

/** Reads the A/B results. Aggregates only; never shows individual visitors. */
export function ResultsScreen() {
  const data = useAsync(loadSummary, [])
  const [cleared, setCleared] = useState(0)
  return (
    <main className="page surface fade-in" key={cleared}>
      <header className="bar"><h1 className="bar__title">A/B results</h1></header>
      <div className="page__body stack-lg">
        {data.status === 'loading' && <Skeleton height={160} radius={20} />}
        {data.status === 'error' && <ErrorBanner error={data.error} onRetry={data.reload} />}
        {data.status === 'ready' && (
          <>
            <Banner kind="info" title={data.data.source === 'supabase' ? 'Live results from everyone' : 'Results from this device only'}>
              {data.data.source === 'supabase'
                ? 'Sessions that forced a variant for review are left out.'
                : 'Connect the database to collect results from all testers. Until then this only counts what you did on this device.'}
            </Banner>
            {EXPERIMENT_IDS.map((id) => (
              <section key={id} className="stack">
                <div>
                  <h2 className="t-title">{EXPERIMENTS[id].label}</h2>
                  <p className="t-body-sm muted">A: {EXPERIMENTS[id].A}. B: {EXPERIMENTS[id].B}.</p>
                </div>
                <div className="results">
                  {data.data.rows.filter((r) => r.experiment === id).map((r) => <Card key={r.variant} row={r} />)}
                </div>
              </section>
            ))}
            <p className="t-body-sm muted">With fewer than about 100 visitors per variant, treat differences as hints, not winners.</p>
            {data.data.source === 'this-device' && (
              <Button variant="tertiary" block={false} onClick={() => { clearLocalEvents(); setCleared((n) => n + 1) }}>Clear this device's data</Button>
            )}
          </>
        )}
      </div>
    </main>
  )
}
