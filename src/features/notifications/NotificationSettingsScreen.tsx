import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../data'
import type { NotificationSettings } from '../../data/types'
import { Banner, BackButton, BottomSheet, Button, Skeleton, Switch } from '../../design/ui'
import { IconBell } from '../../design/icons'
import { track } from '../../experiments/analytics'
import { useAsync } from '../../state/useAsync'
import { useSubmit } from '../../state/useSubmit'
import { ErrorBanner } from '../auth/AuthFrame'
import { usePermission } from '../media/usePermission'

const ROWS: { key: keyof NotificationSettings; title: string; sub: string }[] = [
  { key: 'messages', title: 'Direct messages', sub: 'A banner when someone writes to you' },
  { key: 'groups', title: 'Group chats', sub: 'A banner for messages in groups and sub-groups' },
  { key: 'updates', title: 'Updates and new versions', sub: "What's new in the app" },
  { key: 'offers', title: 'Offers', sub: 'Plans and extras for your team' },
]

/** NTF-02: what pings you. Asks the system for permission with our own explanation first (NFR-04). */
export function NotificationSettingsScreen() {
  const navigate = useNavigate()
  const settings = useAsync(() => api.notifications.settings(), [])
  const groups = useAsync(async () => {
    const [muted, tree] = await Promise.all([api.notifications.mutedGroups(), api.groups.list()])
    return tree.groups.filter((g) => muted.includes(g.id))
  }, [])
  const perm = usePermission('notifications')
  const [asking, setAsking] = useState(false)
  const [denied, setDenied] = useState(false)
  const save = useSubmit()
  const [local, setLocal] = useState<NotificationSettings | null>(null)
  const current = local ?? (settings.status === 'ready' ? settings.data : null)

  const set = (key: keyof NotificationSettings, value: boolean) => {
    if (!current) return
    const next = { ...current, [key]: value }
    setLocal(next)
    track('notification_setting', { key, value })
    void save.run(() => api.notifications.saveSettings({ [key]: value })).then((ok) => { if (!ok) setLocal(current) })
    if (value && perm.status !== 'granted') setAsking(true)
  }

  const allow = async () => {
    const s = await perm.request()
    track('permission_answered', { kind: 'notifications', result: s })
    if (s === 'granted') { setAsking(false); setDenied(false) } else setDenied(true)
  }

  return (
    <main className="page surface fade-in">
      <header className="bar bar--back">
        <BackButton onClick={() => navigate('/account')} />
        <h1 className="bar__title">Notifications</h1>
      </header>
      <div className="page__body stack-lg">
        {settings.status === 'loading' && <div aria-busy="true" aria-label="Loading settings"><Skeleton height={220} radius={28} /></div>}
        {settings.status === 'error' && <ErrorBanner error={settings.error} onRetry={settings.reload} />}
        {save.error != null && <ErrorBanner error={save.error} />}

        {current && (
          <>
            {perm.status === 'denied' ? (
              <Banner kind="offline" title="Notifications are off on this device">Turn them on in your device settings to get banners when the app is closed.</Banner>
            ) : perm.status !== 'granted' ? (
              <Banner kind="info" title="Allow banners on this device" actionLabel="Turn on" onAction={() => setAsking(true)}>The system needs your OK before we can show banners.</Banner>
            ) : null}

            <div className="card">
              {ROWS.map((r) => (
                <div key={r.key} className="setting-row">
                  <span>
                    <span className="t-title-sm" style={{ display: 'block' }}>{r.title}</span>
                    <span className="t-body-sm muted">{r.sub}</span>
                  </span>
                  <Switch checked={current[r.key]} label={r.title} onChange={(v) => set(r.key, v)} />
                </div>
              ))}
            </div>

            <section>
              <h2 className="t-title-sm" style={{ marginBottom: 'var(--s-1)' }}>Muted groups</h2>
              <p className="t-body-sm muted" style={{ marginBottom: 'var(--s-3)' }}>Mute a group from its page. You still see its messages, just no banners.</p>
              {groups.status === 'loading' && <Skeleton height={56} radius={16} />}
              {groups.status === 'error' && <ErrorBanner error={groups.error} onRetry={groups.reload} />}
              {groups.status === 'ready' && groups.data.length === 0 && <p className="t-body-sm muted">No muted groups.</p>}
              {groups.status === 'ready' && groups.data.length > 0 && (
                <div className="card">
                  {groups.data.map((g) => (
                    <div key={g.id} className="setting-row">
                      <span className="t-title-sm" style={{ overflowWrap: 'anywhere' }}>{g.name}</span>
                      <Button variant="tertiary" block={false} onClick={() => void api.notifications.setGroupMuted(g.id, false).then(groups.reload)}>Unmute</Button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {asking && (
        <BottomSheet title="Notifications" onClose={() => { setAsking(false); setDenied(false) }}>
          {denied ? (
            <div className="stack-lg">
              <Banner kind="offline" title="Notifications are off">Turn them on in your device settings, then try again. Your choices here are saved.</Banner>
              <div className="stack">
                <Button onClick={() => void allow()}>Try again</Button>
                <Button variant="tertiary" onClick={() => { setAsking(false); setDenied(false) }}>Close</Button>
              </div>
            </div>
          ) : (
            <div className="stack-lg">
              <div className="perm">
                <span className="empty__icon"><IconBell size={36} /></span>
                <p className="t-title">Get a banner when it matters</p>
                <p className="t-body-sm muted">We show a banner for new messages and updates, even when the app is closed. You choose which ones, and can mute any group.</p>
              </div>
              <div className="stack">
                <Button onClick={() => void allow()}>Continue</Button>
                <Button variant="tertiary" onClick={() => { track('permission_answered', { kind: 'notifications', result: 'not_now' }); setAsking(false) }}>Not now</Button>
              </div>
            </div>
          )}
        </BottomSheet>
      )}
    </main>
  )
}
