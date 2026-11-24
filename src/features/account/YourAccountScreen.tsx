import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../data'
import { ApiError } from '../../data/errors'
import { LEGAL } from '../../config/legal'
import { Banner, BackButton, BottomSheet, Button, SettingsGroup, SettingsRow, TextField } from '../../design/ui'
import { IconCheck, IconDownload, IconKey, IconMail, IconTrash } from '../../design/icons'
import { track } from '../../analytics'
import { useAnimatedNavigate } from '../../design/nav'
import { useSession } from '../../state/session'
import { useAsync } from '../../state/useAsync'
import { useSubmit } from '../../state/useSubmit'
import { ErrorBanner } from '../auth/AuthFrame'
import { validate } from '../auth/validators'

const date = (ms: number) => new Date(ms).toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' })

/** Change your password. The current one is asked for again. */
function PasswordSheet({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [again, setAgain] = useState('')
  const [touched, setTouched] = useState(false)
  const [done, setDone] = useState(false)
  const save = useSubmit()
  const wrong = save.error instanceof ApiError && save.error.code === 'invalid_credentials'
  const errors = {
    current: validate.currentPassword(current),
    next: validate.newPassword(next) ?? (next === current ? 'Choose a password you have not used here' : undefined),
    again: again !== next ? "The passwords don't match" : undefined,
  }
  const submit = async (e?: FormEvent) => {
    e?.preventDefault()
    setTouched(true)
    if (errors.current || errors.next || errors.again) return
    if (await save.run(() => api.settings.changePassword(current, next))) {
      track('password_changed')
      setDone(true)
    }
  }
  if (done) {
    return (
      <BottomSheet title="Password changed" onClose={onClose}>
        <div className="stack">
          <div className="perm">
            <span className="empty__icon success-mark"><IconCheck size={36} /></span>
            <p className="t-body-sm muted">Use your new password the next time you sign in.</p>
          </div>
          <Button onClick={onClose}>Done</Button>
        </div>
      </BottomSheet>
    )
  }
  return (
    <BottomSheet title="Change password" onClose={onClose}>
      <form className="stack" onSubmit={submit} noValidate>
        {save.error != null && !wrong && <ErrorBanner error={save.error} />}
        <TextField label="Current password" password autoComplete="current-password" value={current} onChange={setCurrent} disabled={save.busy}
          error={wrong ? "That isn't your current password" : touched ? errors.current : undefined} />
        <TextField label="New password" password autoComplete="new-password" value={next} onChange={setNext} disabled={save.busy}
          hint="At least 8 characters, with a letter and a number" error={touched ? errors.next : undefined} />
        <TextField label="Repeat new password" password autoComplete="new-password" value={again} onChange={setAgain} disabled={save.busy} error={touched ? errors.again : undefined} />
        <Button type="submit" loading={save.busy}>Change password</Button>
        <Button variant="tertiary" onClick={onClose}>Cancel</Button>
      </form>
    </BottomSheet>
  )
}

/** Ask for a copy of your data (GDPR access and portability). It arrives by email. */
function ExportSheet({ email, onClose, onRequested }: { email: string; onClose: () => void; onRequested: () => void }) {
  const status = useAsync(() => api.settings.exportStatus(), [])
  const request = useSubmit()
  const [made, setMade] = useState<{ readyBy: number } | null>(null)
  const open = made ?? (status.status === 'ready' ? status.data : null)
  return (
    <BottomSheet title="Request your data" onClose={onClose}>
      <div className="stack">
        {status.status === 'error' && <ErrorBanner error={status.error} onRetry={status.reload} />}
        {request.error != null && <ErrorBanner error={request.error} />}
        {open ? (
          <div className="perm">
            <span className="empty__icon success-mark"><IconCheck size={36} /></span>
            <p className="t-title">Request received</p>
            <p className="t-body-sm muted">We'll email a copy to {email} by {date(open.readyBy)}. The link in the email works for a few days.</p>
          </div>
        ) : (
          <>
            <p className="t-body-sm">You'll get a file with what we hold about you: your profile, the messages and files you sent, your groups and calendars, and your settings.</p>
            <p className="t-body-sm muted">We email it to {email} within {LEGAL.exportDays} days. Only you can ask for it, and only your own data is included.</p>
          </>
        )}
        {!open && <Button loading={request.busy || status.status === 'loading'} onClick={async () => {
          let result: { readyBy: number } | undefined
          if (await request.run(async () => { result = await api.settings.requestExport() }) && result) { setMade(result); track('data_export_requested'); onRequested() }
        }}>Request a copy</Button>}
        <Button variant={open ? 'primary' : 'tertiary'} onClick={onClose}>{open ? 'Done' : 'Cancel'}</Button>
      </div>
    </BottomSheet>
  )
}

/** Your account: how you sign in, your data, and deleting the account (ACC-08). */
export function YourAccountScreen() {
  const navigate = useNavigate()
  const go = useAnimatedNavigate()
  const { account } = useSession()
  const exportStatus = useAsync(() => api.settings.exportStatus(), [])
  const [password, setPassword] = useState(false)
  const [exporting, setExporting] = useState(false)
  if (!account) return null
  const open = exportStatus.status === 'ready' ? exportStatus.data : null

  return (
    <main className="page surface fade-in">
      <header className="bar bar--back">
        <BackButton onClick={() => navigate('/account')} />
        <h1 className="bar__title">Your account</h1>
      </header>
      <div className="page__body stack-lg">
        <SettingsGroup title="Sign in">
          <SettingsRow icon={<IconMail size={20} />} title="Email" value={account.email} onClick={() => go('/account/edit')} />
          <SettingsRow icon={<IconKey size={20} />} title="Change password" onClick={() => setPassword(true)} />
        </SettingsGroup>

        {exportStatus.status === 'error' && <ErrorBanner error={exportStatus.error} onRetry={exportStatus.reload} />}
        <SettingsGroup title="Your data" footer="You have the right to a copy of your data. We never sell it.">
          <SettingsRow icon={<IconDownload size={20} />} title="Request your data"
            subtitle={open ? `Requested. We'll email it by ${date(open.readyBy)}` : 'Get a copy of what we hold about you'}
            onClick={() => setExporting(true)} />
        </SettingsGroup>

        <SettingsGroup>
          <SettingsRow icon={<IconTrash size={20} />} title="Delete account" subtitle="Remove your account and its data for good" danger onClick={() => go('/account/delete')} />
        </SettingsGroup>
        {account.organization && <Banner kind="info">Your organization can't read your personal chats, and deleting your account doesn't delete the organization's groups.</Banner>}
      </div>

      {password && <PasswordSheet onClose={() => setPassword(false)} />}
      {exporting && <ExportSheet email={account.email} onClose={() => setExporting(false)} onRequested={exportStatus.reload} />}
    </main>
  )
}
