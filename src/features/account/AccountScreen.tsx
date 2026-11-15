import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar, Banner, BottomSheet, Button, Switch } from '../../design/ui'
import { useHaptics, useMediaPolicy, settings, type MediaPolicy } from '../../state/settings'
import { ErrorBanner } from '../auth/AuthFrame'
import { useReviewRole } from '../../state/useReviewRole'
import { InstallSheet } from '../install/InstallSheet'
import { useInstall } from '../../state/install'
import { useAnimatedNavigate } from '../../design/nav'
import { useSession } from '../../state/session'
import { useSubmit } from '../../state/useSubmit'
import type { IdentityKind } from '../../data/types'

const MEDIA_CHOICES: { id: MediaPolicy; title: string; sub: string }[] = [
  { id: 'auto', title: 'Always', sub: 'Download everything as it arrives' },
  { id: 'wifi', title: 'Wi-Fi only', sub: 'Wait for Wi-Fi, tap to download on mobile data' },
  { id: 'manual', title: 'Never', sub: 'Tap each photo or document to download it' },
]

/** Profile, identity switching (ACC-07), sign out and delete account (ACC-08). */
export function AccountScreen() {
  const { account, signOut, switchIdentity, deleteAccount } = useSession()
  const navigate = useNavigate()
  const go = useAnimatedNavigate()
  const action = useSubmit()
  const [confirmDelete, setConfirmDelete] = useState(false)
  if (!account) return null
  const org = account.organization
  const policy = useMediaPolicy()
  const role = useReviewRole()
  const haptics = useHaptics()
  const install = useInstall()
  const [installing, setInstalling] = useState(false)

  const choices: { kind: IdentityKind; title: string; sub: string }[] = org
    ? [
        { kind: 'individual', title: 'Myself', sub: 'Your personal chats and groups' },
        { kind: 'organization', title: org.name, sub: 'Your work chats and groups' },
      ]
    : []

  return (
    <main className="page surface fade-in">
      <header className="bar"><h1 className="bar__title">Account</h1></header>
      <div className="page__body stack-lg">
        <div className="row-flex" style={{ gap: 'var(--s-5)' }}>
          <Avatar name={account.name} src={account.photoUrl} size={64} />
          <div style={{ minWidth: 0 }}>
            <p className="t-title" style={{ overflowWrap: 'anywhere' }}>{account.name}</p>
            <p className="t-body-sm muted" style={{ overflowWrap: 'anywhere' }}>{account.email}</p>
            {account.jobTitle && <span className="chip chip--static" style={{ marginTop: 'var(--s-3)' }}>{account.jobTitle}</span>}
          </div>
        </div>

        {action.error != null && <ErrorBanner error={action.error} />}

        {org && (
          <section>
            <h2 className="t-title-sm" style={{ marginBottom: 'var(--s-3)' }}>Chat as</h2>
            <div className="card" role="radiogroup" aria-label="Identity">
              {choices.map((c) => (
                <button key={c.kind} type="button" className="radio-row" role="radio" aria-checked={account.activeIdentity === c.kind} disabled={action.busy}
                  onClick={() => account.activeIdentity !== c.kind && void action.run(() => switchIdentity(c.kind))}>
                  <span className="radio-dot" />
                  <span>
                    <span className="t-title-sm" style={{ display: 'block' }}>{c.title}</span>
                    <span className="t-body-sm muted">{c.sub}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="t-title-sm" style={{ marginBottom: 'var(--s-1)' }}>Media downloads</h2>
          <p className="t-body-sm muted" style={{ marginBottom: 'var(--s-3)' }}>When photos and documents you receive download on their own.</p>
          <div className="card" role="radiogroup" aria-label="Media downloads">
            {MEDIA_CHOICES.map((c) => (
              <button key={c.id} type="button" className="radio-row" role="radio" aria-checked={policy === c.id} onClick={() => settings.setPolicy(c.id)}>
                <span className="radio-dot" />
                <span>
                  <span className="t-title-sm" style={{ display: 'block' }}>{c.title}</span>
                  <span className="t-body-sm muted">{c.sub}</span>
                </span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="card">
            <div className="setting-row">
              <span>
                <span className="t-title-sm" style={{ display: 'block' }}>Haptics</span>
                <span className="t-body-sm muted">A small tap you can feel for tabs, switches, sending and results, on phones that support it.</span>
              </span>
              <Switch checked={haptics} label="Haptics" onChange={(v) => settings.setHaptics(v)} />
            </div>
          </div>
        </section>

        <div className="stack">
          {!install.installed && <Button variant="secondary" onClick={() => setInstalling(true)}>Add to home screen</Button>}
          <Button variant="secondary" onClick={() => go('/account/edit')}>Edit profile</Button>
          {role === 'admin' && <Button variant="secondary" onClick={() => go('/admin')}>Admin console</Button>}
          <Button variant="secondary" onClick={() => go('/account/plan')}>Plan and add-ons</Button>
          <Button variant="secondary" onClick={() => go('/account/calls')}>Calls</Button>
          <Button variant="secondary" onClick={() => go('/account/notifications')}>Notifications</Button>
          <Button variant="secondary" onClick={() => go('/account/data')}>Data and storage</Button>
          <Button variant="secondary" onClick={() => go('/updates')}>What's new</Button>
          <Button variant="secondary" loading={action.busy} onClick={() => void action.run(signOut)}>Sign out</Button>
          <Button variant="tertiary" onClick={() => navigate('/results')} className="only-mobile">A/B results</Button>
          <Button variant="tertiary" onClick={() => setConfirmDelete(true)} disabled={action.busy}>Delete account</Button>
        </div>
      </div>

      {installing && <InstallSheet mode={install.mode} onClose={() => setInstalling(false)} />}

      {confirmDelete && (
        <BottomSheet title="Delete your account?" onClose={() => setConfirmDelete(false)}>
          <div className="stack">
            <Banner kind="error">Your profile, chats and files are deleted for good. This cannot be undone.</Banner>
            <Button variant="destructive" loading={action.busy} onClick={async () => { if (await action.run(deleteAccount)) setConfirmDelete(false) }}>Delete account</Button>
            <Button variant="tertiary" onClick={() => setConfirmDelete(false)}>Keep my account</Button>
          </div>
        </BottomSheet>
      )}
    </main>
  )
}
