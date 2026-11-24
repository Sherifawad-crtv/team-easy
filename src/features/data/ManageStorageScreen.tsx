import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../data'
import { formatBytes } from '../../config/limits'
import type { StorageUsage } from '../../data/types'
import { Banner, BackButton, BottomSheet, Button, Skeleton } from '../../design/ui'
import { IconDatabase } from '../../design/icons'
import { haptic } from '../../design/haptics'
import { track } from '../../analytics'
import { useAsync } from '../../state/useAsync'
import { useSubmit } from '../../state/useSubmit'
import { ErrorBanner } from '../auth/AuthFrame'

/** Manage storage: what the device holds, chat by chat, and a way to free it (DAT-03). */
export function ManageStorageScreen() {
  const navigate = useNavigate()
  const usage = useAsync(() => api.data.storage(), [])
  const [clearing, setClearing] = useState<StorageUsage['chats'][number] | null>(null)
  const clear = useSubmit()
  const share = (n: number, total: number) => (total ? Math.max(2, Math.round((n / total) * 100)) : 0)

  return (
    <main className="page surface fade-in">
      <header className="bar bar--back">
        <BackButton onClick={() => navigate('/account/data')} />
        <h1 className="bar__title">Manage storage</h1>
      </header>
      <div className="page__body stack-lg">
        {usage.status === 'loading' && <div aria-busy="true" aria-label="Loading storage"><Skeleton height={140} radius={28} /></div>}
        {usage.status === 'error' && <ErrorBanner error={usage.error} onRetry={usage.reload} />}

        {usage.status === 'ready' && usage.data.total === 0 && (
          <div className="empty">
            <span className="empty__icon"><IconDatabase size={40} /></span>
            <h2 className="t-title">Nothing stored</h2>
            <p className="t-body-sm muted">Photos and documents you open or download are kept here so you can see them again without downloading.</p>
          </div>
        )}

        {usage.status === 'ready' && usage.data.total > 0 && (
          <>
            <section className="card plan" aria-label="Total">
              <p className="ubanner__kind">On this device</p>
              <p className="t-headline">{formatBytes(usage.data.total)}</p>
              <div className="meter" role="img" aria-label={`Photos ${formatBytes(usage.data.photos)}, documents ${formatBytes(usage.data.documents)}`}>
                <span className="meter__fill" style={{ width: `${share(usage.data.photos, usage.data.total)}%` }} />
              </div>
              <ul className="plan__limits" role="list">
                <li><span>Photos</span><strong>{formatBytes(usage.data.photos)}</strong></li>
                <li><span>Documents</span><strong>{formatBytes(usage.data.documents)}</strong></li>
              </ul>
            </section>

            <section aria-label="Chats">
              <h2 className="sgroup__title" style={{ marginBottom: 'var(--s-3)' }}>Chats</h2>
              <ul className="card" role="list">
                {usage.data.chats.map((c) => (
                  <li key={c.conversationId}>
                    <button type="button" className="srow" onClick={() => setClearing(c)}>
                      <span className="srow__text">
                        <span className="srow__title">{c.title}</span>
                        <span className="srow__sub">{formatBytes(c.bytes)}</span>
                      </span>
                      <span className="srow__value">Free up</span>
                    </button>
                  </li>
                ))}
              </ul>
              <p className="sgroup__footer" style={{ marginTop: 'var(--s-3)' }}>Freeing up removes photos and documents from this device only. They stay in the chat and download again if you open them.</p>
            </section>
          </>
        )}
      </div>

      {clearing && (
        <BottomSheet title={`Free up ${formatBytes(clearing.bytes)}?`} onClose={() => { clear.reset(); setClearing(null) }}>
          <div className="stack">
            {clear.error != null && <ErrorBanner error={clear.error} />}
            <Banner kind="info">Photos and documents from {clearing.title} are removed from this device. Messages stay.</Banner>
            <Button variant="destructive" loading={clear.busy} onClick={async () => {
              if (await clear.run(() => api.data.clearChatMedia(clearing.conversationId))) {
                haptic('success')
                track('storage_cleared')
                setClearing(null)
                usage.reload()
              }
            }}>Free up space</Button>
            <Button variant="tertiary" onClick={() => setClearing(null)}>Keep them</Button>
          </div>
        </BottomSheet>
      )}
    </main>
  )
}
