import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../data'
import { ApiError } from '../../data/errors'
import { LEGAL, STORE_SUBSCRIPTIONS } from '../../config/legal'
import { Banner, BackButton, Button, SettingsGroup, SettingsRow, Skeleton, TextField } from '../../design/ui'
import { IconLink } from '../../design/icons'
import { haptic } from '../../design/haptics'
import { track } from '../../analytics'
import { storeName, storePlatform } from '../../state/platform'
import { useSession } from '../../state/session'
import { useAsync } from '../../state/useAsync'
import { useSubmit } from '../../state/useSubmit'
import { ErrorBanner } from '../auth/AuthFrame'
import { validate } from '../auth/validators'

/**
 * Delete account (ACC-08). Both stores require this to be possible inside the app, to remove the
 * account and its data (not just switch it off), and to be easy to find. The password is asked
 * for again, active subscriptions are called out because deleting does not cancel them, and a web
 * address is given for people who no longer have the app (Google Play asks for one).
 */
export function DeleteAccountScreen() {
  const navigate = useNavigate()
  const { account, deleteAccount } = useSession()
  const ent = useAsync(() => api.purchases.entitlements(), [])
  const del = useSubmit()
  const [password, setPassword] = useState('')
  const [touched, setTouched] = useState(false)
  if (!account) return null
  const platform = storePlatform()
  const store = storeName(platform)
  const wrong = del.error instanceof ApiError && del.error.code === 'invalid_credentials'
  const problem = validate.currentPassword(password)
  const paid = ent.status === 'ready' && ent.data.plan === 'paid'

  const submit = async (e?: FormEvent) => {
    e?.preventDefault()
    setTouched(true)
    if (problem) return
    if (await del.run(() => deleteAccount(password))) {
      haptic('warning')
      track('account_deleted')
    }
  }

  return (
    <main className="page surface fade-in">
      <header className="bar bar--back">
        <BackButton onClick={() => navigate('/account/manage')} />
        <h1 className="bar__title">Delete account</h1>
      </header>
      <form className="page__body stack-lg" onSubmit={submit} noValidate>
        <Banner kind="error" title="This can't be undone">Your account is deleted straight away, and so is what it holds.</Banner>

        <section aria-label="What happens">
          <h2 className="t-title-sm" style={{ marginBottom: 'var(--s-3)' }}>What happens</h2>
          <ul className="list" role="list">
            <li>Your profile, photo and settings are deleted.</li>
            <li>The chats you started and the files you sent are deleted for you.</li>
            <li>Messages you sent in group chats stay for the group, but no longer show your name or photo.</li>
            <li>You leave every group and organization.</li>
            <li>We keep only the records the law requires, such as purchase records, and delete them when the law allows.</li>
          </ul>
        </section>

        {ent.status === 'loading' && <div aria-busy="true" aria-label="Checking your add-ons"><Skeleton height={72} radius={16} /></div>}
        {(paid || ent.status === 'error') && (
          <Banner kind="warning" title="Cancel your add-ons first">
            Deleting your account does not cancel add-ons billed by {store}. Cancel them there so you are not charged again.
          </Banner>
        )}
        {(paid || ent.status === 'error') && platform !== 'other' && (
          <SettingsGroup>
            <SettingsRow icon={<IconLink size={20} />} title={`Manage subscriptions in ${store}`} external onClick={() => window.open(STORE_SUBSCRIPTIONS[platform], '_blank', 'noopener')} />
          </SettingsGroup>
        )}

        {del.error != null && !wrong && <ErrorBanner error={del.error} onRetry={del.busy ? undefined : () => void submit()} />}
        <TextField label="Enter your password to confirm" password autoComplete="current-password" value={password} onChange={setPassword} disabled={del.busy}
          error={wrong ? "That password isn't right" : touched ? problem : undefined} />

        <div className="stack">
          <Button type="submit" variant="destructive" loading={del.busy}>Delete my account</Button>
          <Button variant="tertiary" onClick={() => navigate('/account/manage')} disabled={del.busy}>Keep my account</Button>
        </div>

        <p className="t-caption muted">
          No longer have the app? You can also ask for deletion on the web:{' '}
          <a href={LEGAL.deleteAccountUrl} target="_blank" rel="noopener noreferrer">{LEGAL.deleteAccountUrl.replace('https://', '')}</a>
        </p>
      </form>
    </main>
  )
}
