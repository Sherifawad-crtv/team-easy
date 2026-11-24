import { useState } from 'react'
import { LEGAL } from '../../config/legal'
import { Avatar, Banner, Button, SettingsGroup, SettingsRow } from '../../design/ui'
import {
  IconAccessibility, IconBell, IconCall, IconCard, IconChart, IconChat, IconChevronRight, IconDatabase, IconHelp,
  IconInfo, IconInvite, IconLock, IconPhone, IconUser,
} from '../../design/icons'
import { ErrorBanner } from '../auth/AuthFrame'
import { useReviewRole } from '../../state/useReviewRole'
import { InstallSheet } from '../install/InstallSheet'
import { useInstall } from '../../state/install'
import { useAnimatedNavigate } from '../../design/nav'
import { useSession } from '../../state/session'
import { useSubmit } from '../../state/useSubmit'
import type { IdentityKind } from '../../data/types'

/** Settings home: your profile, then grouped settings like WhatsApp. Identity switching (ACC-07) sits on top. */
export function AccountScreen() {
  const { account, signOut, switchIdentity } = useSession()
  const go = useAnimatedNavigate()
  const action = useSubmit()
  const role = useReviewRole()
  const install = useInstall()
  const [installing, setInstalling] = useState(false)
  const [shared, setShared] = useState<'copied' | 'failed' | null>(null)
  if (!account) return null
  const org = account.organization

  const choices: { kind: IdentityKind; title: string; sub: string }[] = org
    ? [
        { kind: 'individual', title: 'Myself', sub: 'Your personal chats and groups' },
        { kind: 'organization', title: org.name, sub: 'Your work chats and groups' },
      ]
    : []

  /** DEV-04 on the web: the system share sheet where there is one, otherwise the link is copied. */
  const invite = async () => {
    const text = `Join me: ${LEGAL.shareUrl}`
    try {
      if (navigator.share) await navigator.share({ text })
      else {
        await navigator.clipboard.writeText(text)
        setShared('copied')
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setShared('failed')
    }
  }

  return (
    <main className="page surface fade-in">
      <header className="bar"><h1 className="bar__title">Account</h1></header>
      <div className="page__body stack-lg">
        <button type="button" className="card sprofile" onClick={() => go('/account/edit')} aria-label={`${account.name}, edit profile`}>
          <Avatar name={account.name} src={account.photoUrl} size={64} />
          <span className="sprofile__text">
            <span className="t-title" style={{ overflowWrap: 'anywhere' }}>{account.name}</span>
            <span className="t-body-sm muted" style={{ overflowWrap: 'anywhere' }}>{account.jobTitle ?? account.email}</span>
          </span>
          <IconChevronRight size={20} />
        </button>

        {action.error != null && <ErrorBanner error={action.error} />}
        {shared === 'copied' && <Banner kind="success" title="Link copied">Paste it into any message to invite someone.</Banner>}
        {shared === 'failed' && <Banner kind="error" title="Couldn't share">Copy this link instead: {LEGAL.shareUrl}</Banner>}

        {org && (
          <section>
            <h2 className="sgroup__title" style={{ marginBottom: 'var(--s-3)' }}>Chat as</h2>
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

        <SettingsGroup>
          <SettingsRow icon={<IconUser size={20} />} title="Your account" subtitle="Email, password, your data" onClick={() => go('/account/manage')} />
          <SettingsRow icon={<IconLock size={20} />} title="Privacy" subtitle="Who sees you, blocked people, ads" onClick={() => go('/account/privacy')} />
          <SettingsRow icon={<IconChat size={20} />} title="Chats" subtitle="Media quality, backup, transfer" onClick={() => go('/account/chats')} />
          <SettingsRow icon={<IconBell size={20} />} title="Notifications" subtitle="Messages, groups, updates" onClick={() => go('/account/notifications')} />
          <SettingsRow icon={<IconDatabase size={20} />} title="Storage and data" subtitle="Downloads, storage, retention" onClick={() => go('/account/data')} />
          <SettingsRow icon={<IconCall size={20} />} title="Calls" subtitle="Calling time and recent calls" onClick={() => go('/account/calls')} />
          <SettingsRow icon={<IconAccessibility size={20} />} title="Accessibility" subtitle="Text size, haptics, motion" onClick={() => go('/account/accessibility')} />
        </SettingsGroup>

        <SettingsGroup>
          <SettingsRow icon={<IconCard size={20} />} title="Plan and add-ons" subtitle="Limits, subscriptions, restore" onClick={() => go('/account/plan')} />
          {role === 'admin' && <SettingsRow icon={<IconChart size={20} />} title="Admin console" onClick={() => go('/admin')} />}
          <SettingsRow icon={<IconInvite size={20} />} title="Invite a friend" onClick={() => void invite()} />
          {!install.installed && <SettingsRow icon={<IconPhone size={20} />} title="Add to home screen" onClick={() => setInstalling(true)} />}
        </SettingsGroup>

        <SettingsGroup>
          <SettingsRow icon={<IconHelp size={20} />} title="Help" subtitle="Help center, contact us, terms, privacy" onClick={() => go('/account/help')} />
          <SettingsRow icon={<IconInfo size={20} />} title="What's new" onClick={() => go('/updates')} />
        </SettingsGroup>

        <div className="stack">
          <Button variant="secondary" loading={action.busy} onClick={() => void action.run(signOut)}>Sign out</Button>
          <p className="t-caption muted" style={{ textAlign: 'center' }}>Version {LEGAL.version} ({LEGAL.build})</p>
        </div>
      </div>

      {installing && <InstallSheet mode={install.mode} onClose={() => setInstalling(false)} />}
    </main>
  )
}
