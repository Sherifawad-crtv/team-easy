import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../data'
import { formatBytes } from '../../config/limits'
import type { BackupStatus, TransferCode } from '../../data/types'
import { Banner, BackButton, Button, Skeleton } from '../../design/ui'
import { IconBackup, IconCheck, IconClock, IconCopy, IconPhone } from '../../design/icons'
import { track } from '../../experiments/analytics'
import { settings, useCacheVersion } from '../../state/settings'
import { useAsync } from '../../state/useAsync'
import { useSubmit } from '../../state/useSubmit'
import { ErrorBanner } from '../auth/AuthFrame'
import { daysLeftLabel } from './retention'

const when = (ms: number) => new Date(ms).toLocaleString([], { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })

/** Data and storage: what gets deleted and when (DAT-02, DAT-04), and backing up or moving chats (DAT-01). */
export function DataScreen() {
  const navigate = useNavigate()
  const retention = useAsync(() => api.data.retention(), [])
  const files = useAsync(() => api.data.expiringFiles(), [])
  const backup = useAsync(() => api.data.backup(), [])
  useCacheVersion()
  const unopened = files.status === 'ready' ? files.data.filter((f) => !settings.isCached(f.messageId)) : []

  return (
    <main className="page surface fade-in">
      <header className="bar bar--back">
        <BackButton onClick={() => navigate('/account')} />
        <h1 className="bar__title">Data and storage</h1>
      </header>
      <div className="page__body stack-lg">
        <section aria-label="Automatic deletion">
          <h2 className="t-title-sm" style={{ marginBottom: 'var(--s-3)' }}>Automatic deletion</h2>
          {retention.status === 'loading' && <Skeleton height={96} radius={16} />}
          {retention.status === 'error' && <ErrorBanner error={retention.error} onRetry={retention.reload} />}
          {retention.status === 'ready' && (
            <div className="card" style={{ padding: 'var(--s-5)' }}>
              <p className="t-body-sm"><strong>Files you don't open</strong> are deleted after {retention.data.attachmentDays} days{retention.data.plan === 'business' ? ' (work account)' : ''}. Open a file once and it stays on this device.</p>
              <p className="t-body-sm" style={{ marginTop: 'var(--s-3)' }}><strong>Archived groups</strong> are deleted automatically {retention.data.archivedDays} days after they are archived. Bring one back before then to keep it.</p>
            </div>
          )}
        </section>

        <section aria-label="Files that will be deleted soon">
          <h2 className="t-title-sm" style={{ marginBottom: 'var(--s-3)' }}>Open soon, or lose them</h2>
          {files.status === 'loading' && <div aria-busy="true" aria-label="Loading files"><Skeleton height={64} radius={16} /></div>}
          {files.status === 'error' && <ErrorBanner error={files.error} onRetry={files.reload} />}
          {files.status === 'ready' && unopened.length === 0 && <p className="t-body-sm muted">Nothing is waiting to be opened.</p>}
          {files.status === 'ready' && unopened.length > 0 && (
            <ul className="card" role="list">
              {unopened.map((f) => {
                const left = daysLeftLabel(f.expiresAt)
                return (
                  <li key={f.messageId}>
                    <button type="button" className="list-row" onClick={() => navigate(`/chats/${f.conversationId}?m=${encodeURIComponent(f.messageId)}`)}>
                      <span className="people__text">
                        <span className="t-title-sm people__name">{f.name}</span>
                        <span className="t-caption muted">{f.conversationTitle} · {formatBytes(f.size)}</span>
                      </span>
                      <span className={`tag${left.urgent ? ' tag--blocked' : ''}`}><IconClock size={14} /> {left.text}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <BackupCard status={backup} />
        <TransferCard />
      </div>
    </main>
  )
}

function BackupCard({ status }: { status: ReturnType<typeof useAsync<BackupStatus>> }) {
  const run = useSubmit()
  const [done, setDone] = useState<BackupStatus | null>(null)
  const current = done ?? (status.status === 'ready' ? status.data : null)
  return (
    <section aria-label="Backup">
      <h2 className="t-title-sm" style={{ marginBottom: 'var(--s-3)' }}>Backup</h2>
      <div className="card stack" style={{ padding: 'var(--s-5)' }}>
        {status.status === 'loading' && <Skeleton height={40} radius={12} />}
        {status.status === 'error' && <ErrorBanner error={status.error} onRetry={status.reload} />}
        {run.error != null && <ErrorBanner error={run.error} />}
        {current && (
          <p className="t-body-sm row-flex" style={{ gap: 'var(--s-3)' }}>
            <IconBackup size={22} />
            <span>{current.lastBackupAt ? <>Last backup {when(current.lastBackupAt)} · {formatBytes(current.sizeBytes ?? 0)}</> : 'No backup yet.'}</span>
          </p>
        )}
        {run.busy && <p className="t-body-sm muted" role="status">Backing up your chats… keep the app open.</p>}
        {current && !run.busy && done && <p className="t-body-sm row-flex" style={{ gap: 'var(--s-2)', color: 'var(--success)' }} role="status"><IconCheck size={18} /> Backup finished</p>}
        <Button variant="secondary" loading={run.busy} disabled={!current} onClick={async () => {
          let result: BackupStatus | undefined
          if (await run.run(async () => { result = await api.data.startBackup() }) && result) { setDone(result); track('backup_completed') }
        }}>Back up now</Button>
      </div>
    </section>
  )
}

function TransferCard() {
  const [code, setCode] = useState<TransferCode | null>(null)
  const make = useSubmit()
  const [now, setNow] = useState(Date.now())
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!code) return
    const t = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [code])
  const left = code ? Math.max(0, Math.round((code.expiresAt - now) / 1000)) : 0
  const live = code && left > 0

  return (
    <section aria-label="Move to a new phone">
      <h2 className="t-title-sm" style={{ marginBottom: 'var(--s-3)' }}>Move to a new phone</h2>
      <div className="card stack" style={{ padding: 'var(--s-5)' }}>
        <p className="t-body-sm row-flex" style={{ gap: 'var(--s-3)' }}><IconPhone size={22} /><span>Get a code, then enter it in the app on your new phone to bring your chats over.</span></p>
        {make.error != null && <ErrorBanner error={make.error} />}
        {live ? (
          <>
            <p className="code" aria-label={`Your code is ${code.code.split('').join(' ')}`}>{code.code.slice(0, 3)} {code.code.slice(3)}</p>
            <p className="t-body-sm muted">Works once, for another {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}.</p>
            <Button variant="secondary" onClick={() => { void navigator.clipboard?.writeText(code.code).then(() => setCopied(true), () => undefined) }}>
              {copied ? <><IconCheck size={18} /> Copied</> : <><IconCopy size={18} /> Copy code</>}
            </Button>
          </>
        ) : (
          <>
            {code && <Banner kind="info">That code has expired. Get a new one.</Banner>}
            <Button variant="secondary" loading={make.busy} onClick={async () => {
              let c: TransferCode | undefined
              if (await make.run(async () => { c = await api.data.transferCode() }) && c) { setCode(c); setCopied(false); setNow(Date.now()); track('transfer_code_created') }
            }}>Get a code</Button>
          </>
        )}
      </div>
    </section>
  )
}
