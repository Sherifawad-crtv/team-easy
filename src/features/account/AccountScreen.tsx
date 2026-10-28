import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar, Banner, BottomSheet, Button } from '../../design/ui'
import { ErrorBanner } from '../auth/AuthFrame'
import { useSession } from '../../state/session'
import { useSubmit } from '../../state/useSubmit'
import type { IdentityKind } from '../../data/types'

/** Profile, identity switching (ACC-07), sign out and delete account (ACC-08). */
export function AccountScreen() {
  const { account, signOut, switchIdentity, deleteAccount } = useSession()
  const navigate = useNavigate()
  const action = useSubmit()
  const [confirmDelete, setConfirmDelete] = useState(false)
  if (!account) return null
  const org = account.organization

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
          <Avatar name={account.name} size={64} />
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

        <div className="stack">
          <Button variant="secondary" loading={action.busy} onClick={() => void action.run(signOut)}>Sign out</Button>
          <Button variant="tertiary" onClick={() => navigate('/results')} className="only-mobile">A/B results</Button>
          <Button variant="tertiary" onClick={() => setConfirmDelete(true)} disabled={action.busy}>Delete account</Button>
        </div>
      </div>

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
