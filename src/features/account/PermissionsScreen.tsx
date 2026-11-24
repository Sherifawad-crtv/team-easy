import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../data'
import type { PermissionKind, PermissionStatus } from '../../data/types'
import { BackButton, BottomSheet, Button, SettingsGroup, SettingsRow, Skeleton } from '../../design/ui'
import { IconBell, IconCamera, IconMic, IconDocument } from '../../design/icons'
import { track } from '../../analytics'
import { storePlatform } from '../../state/platform'
import { useAsync } from '../../state/useAsync'
import { useSubmit } from '../../state/useSubmit'
import { ErrorBanner } from '../auth/AuthFrame'

type Listed = Exclude<PermissionKind, 'tracking'>
const KINDS: { kind: Listed; title: string; why: string; icon: React.ReactNode }[] = [
  { kind: 'photos', title: 'Photos', why: 'To send pictures from your library and to choose a profile photo.', icon: <IconDocument size={20} /> },
  { kind: 'microphone', title: 'Microphone', why: 'So people can hear you on calls. Nothing is recorded.', icon: <IconMic size={20} /> },
  { kind: 'camera', title: 'Camera', why: 'To show your video on video calls.', icon: <IconCamera size={20} /> },
  { kind: 'notifications', title: 'Notifications', why: 'To tell you about new messages and calls when the app is closed.', icon: <IconBell size={20} /> },
]
const SAID: Record<PermissionStatus, string> = { granted: 'Allowed', denied: 'Not allowed', unknown: 'Not asked yet' }

function where(title: string): string {
  const p = storePlatform()
  if (p === 'ios') return `Open Settings on your iPhone, find this app, then turn ${title} on or off.`
  if (p === 'android') return `Open Settings, then Apps, this app and Permissions, then choose ${title}.`
  return `Change it in your browser's site settings for this page.`
}

/** The permissions the app uses and why. The system owns the answer; this page shows it and says where to change it. */
export function PermissionsScreen() {
  const navigate = useNavigate()
  const states = useAsync(() => Promise.all(KINDS.map((k) => api.permissions.status(k.kind))), [])
  const [open, setOpen] = useState<(typeof KINDS)[number] | null>(null)
  const ask = useSubmit()

  return (
    <main className="page surface fade-in">
      <header className="bar bar--back">
        <BackButton onClick={() => navigate('/account/privacy')} />
        <h1 className="bar__title">App permissions</h1>
      </header>
      <div className="page__body stack-lg">
        <p className="t-body-sm muted">The app only asks for what a feature needs, and explains why first. You can change any of these at any time.</p>
        {states.status === 'loading' && <div aria-busy="true" aria-label="Loading permissions"><Skeleton height={220} radius={28} /></div>}
        {states.status === 'error' && <ErrorBanner error={states.error} onRetry={states.reload} />}
        {states.status === 'ready' && (
          <SettingsGroup>
            {KINDS.map((k, i) => <SettingsRow key={k.kind} icon={k.icon} title={k.title} value={SAID[states.data[i]]} onClick={() => setOpen(k)} />)}
          </SettingsGroup>
        )}
      </div>

      {open && states.status === 'ready' && (() => {
        const status = states.data[KINDS.indexOf(open)]
        return (
          <BottomSheet title={open.title} onClose={() => { ask.reset(); setOpen(null) }}>
            <div className="stack">
              <p className="t-body-sm"><strong>Why we ask.</strong> {open.why}</p>
              <p className="t-body-sm muted"><strong>Right now:</strong> {SAID[status]}.</p>
              {ask.error != null && <ErrorBanner error={ask.error} />}
              {status === 'unknown' && (
                <Button loading={ask.busy} onClick={async () => {
                  let result: PermissionStatus = 'unknown'
                  if (await ask.run(async () => { result = await api.permissions.request(open.kind) })) { track('permission_answered', { kind: open.kind, result }); states.reload(); setOpen(null) }
                }}>Allow {open.title.toLowerCase()}</Button>
              )}
              {status !== 'unknown' && <p className="t-body-sm">{where(open.title)}</p>}
              <Button variant={status === 'unknown' ? 'tertiary' : 'primary'} onClick={() => setOpen(null)}>{status === 'unknown' ? 'Not now' : 'Done'}</Button>
            </div>
          </BottomSheet>
        )
      })()}
    </main>
  )
}
