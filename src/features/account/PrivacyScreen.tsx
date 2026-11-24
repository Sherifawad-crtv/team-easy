import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../data'
import type { Audience, PrivacySettings } from '../../data/types'
import { Banner, BackButton, BottomSheet, Button, SettingsGroup, SettingsRow, Skeleton, Switch } from '../../design/ui'
import { IconBlock, IconChart, IconEye, IconLock, IconPeople, IconShield, IconUser, IconCamera, IconTag } from '../../design/icons'
import { track } from '../../analytics'
import { useAnimatedNavigate } from '../../design/nav'
import { settings, useAnalyticsConsent, usePersonalizedAds } from '../../state/settings'
import { useAsync } from '../../state/useAsync'
import { useSubmit } from '../../state/useSubmit'
import { ErrorBanner } from '../auth/AuthFrame'

const AUDIENCES: { id: Audience; title: string; sub: string }[] = [
  { id: 'everyone', title: 'Everyone', sub: 'Anyone using the app' },
  { id: 'contacts', title: 'My contacts', sub: 'People you chat with or share a group with' },
  { id: 'nobody', title: 'Nobody', sub: 'Only you' },
]
const label = (a: Audience) => AUDIENCES.find((x) => x.id === a)!.title

type Field = 'onlineStatus' | 'profilePhoto' | 'jobTitle' | 'addToGroups'
const FIELDS: Record<Field, { title: string; ask: string; options: Audience[] }> = {
  onlineStatus: { title: 'Online status', ask: 'Who can see when I am online', options: ['everyone', 'contacts', 'nobody'] },
  profilePhoto: { title: 'Profile photo', ask: 'Who can see my profile photo', options: ['everyone', 'contacts', 'nobody'] },
  jobTitle: { title: 'Job title', ask: 'Who can see my job title', options: ['everyone', 'contacts', 'nobody'] },
  addToGroups: { title: 'Groups', ask: 'Who can add me to groups', options: ['everyone', 'contacts'] },
}

/** Pick who can see one thing. Saves as soon as you choose. */
function AudienceSheet({ field, current, onPick, onClose }: { field: Field; current: Audience; onPick: (a: Audience) => void; onClose: () => void }) {
  const f = FIELDS[field]
  return (
    <BottomSheet title={f.ask} onClose={onClose}>
      <div className="card" role="radiogroup" aria-label={f.ask}>
        {AUDIENCES.filter((a) => f.options.includes(a.id)).map((a) => (
          <button key={a.id} type="button" className="radio-row" role="radio" aria-checked={current === a.id} onClick={() => { onPick(a.id); onClose() }}>
            <span className="radio-dot" />
            <span>
              <span className="t-title-sm" style={{ display: 'block' }}>{a.title}</span>
              <span className="t-body-sm muted">{a.sub}</span>
            </span>
          </button>
        ))}
      </div>
    </BottomSheet>
  )
}

/** Our own explanation before the system asks to track (Apple's App Tracking Transparency). */
function TrackingSheet({ onClose }: { onClose: () => void }) {
  const [denied, setDenied] = useState(false)
  const ask = useSubmit()
  return (
    <BottomSheet title="Personalized ads?" onClose={onClose}>
      <div className="stack">
        <div className="perm">
          <span className="empty__icon"><IconChart size={36} /></span>
          <p className="t-title">Ads that fit you</p>
          <p className="t-body-sm muted">The free plan shows ads. If you allow it, they can be based on how you use this app and other apps and websites. This is called tracking. Paid add-ons remove ads.</p>
        </div>
        {denied && <Banner kind="info" title="Tracking is switched off for this app">Turn it on in your phone's settings, then try again. Ads stay less personal until then.</Banner>}
        {ask.error != null && <ErrorBanner error={ask.error} />}
        <Button loading={ask.busy} onClick={async () => {
          let result = 'denied'
          if (await ask.run(async () => { result = await api.permissions.request('tracking') })) {
            track('permission_answered', { kind: 'tracking', result })
            if (result === 'granted') { settings.setPersonalizedAds(true); onClose() } else setDenied(true)
          }
        }}>Continue</Button>
        <Button variant="tertiary" onClick={onClose}>Not now</Button>
      </div>
    </BottomSheet>
  )
}

/** Privacy: who sees what, blocked people, permissions, ads and usage data. */
export function PrivacyScreen() {
  const navigate = useNavigate()
  const go = useAnimatedNavigate()
  const privacy = useAsync(() => api.settings.privacy(), [])
  const blocked = useAsync(() => api.safety.blocked(), [])
  const save = useSubmit()
  const [local, setLocal] = useState<PrivacySettings | null>(null)
  const [editing, setEditing] = useState<Field | null>(null)
  const [tracking, setTracking] = useState(false)
  const analytics = useAnalyticsConsent()
  const ads = usePersonalizedAds()
  const current = local ?? (privacy.status === 'ready' ? privacy.data : null)

  const choose = (field: Field, value: Audience) => {
    if (!current) return
    setLocal({ ...current, [field]: value })
    void save.run(() => api.settings.savePrivacy({ [field]: value })).then((ok) => { if (!ok) setLocal(current) })
  }

  return (
    <main className="page surface fade-in">
      <header className="bar bar--back">
        <BackButton onClick={() => navigate('/account')} />
        <h1 className="bar__title">Privacy</h1>
      </header>
      <div className="page__body stack-lg">
        {privacy.status === 'loading' && <div aria-busy="true" aria-label="Loading privacy settings"><Skeleton height={220} radius={28} /></div>}
        {privacy.status === 'error' && <ErrorBanner error={privacy.error} onRetry={privacy.reload} />}
        {save.error != null && <ErrorBanner error={save.error} />}

        {current && (
          <>
            <SettingsGroup title="Who can see my info" footer="People you block never see any of this.">
              <SettingsRow icon={<IconEye size={20} />} title="Online status" value={label(current.onlineStatus)} onClick={() => setEditing('onlineStatus')} />
              <SettingsRow icon={<IconCamera size={20} />} title="Profile photo" value={label(current.profilePhoto)} onClick={() => setEditing('profilePhoto')} />
              <SettingsRow icon={<IconTag size={20} />} title="Job title" value={label(current.jobTitle)} onClick={() => setEditing('jobTitle')} />
            </SettingsGroup>
            <SettingsGroup title="Groups">
              <SettingsRow icon={<IconPeople size={20} />} title="Who can add me to groups" value={label(current.addToGroups)} onClick={() => setEditing('addToGroups')} />
            </SettingsGroup>
          </>
        )}

        <SettingsGroup title="Safety">
          <SettingsRow icon={<IconBlock size={20} />} title="Blocked contacts"
            value={blocked.status === 'ready' ? String(blocked.data.length) : undefined}
            subtitle={blocked.status === 'error' ? "Couldn't load. Tap to open" : undefined}
            onClick={() => go('/account/privacy/blocked')} />
          <SettingsRow icon={<IconShield size={20} />} title="App permissions" subtitle="Photos, microphone, camera, notifications" onClick={() => go('/account/privacy/permissions')} />
        </SettingsGroup>

        <SettingsGroup title="Ads and data" footer="Both are off until you turn them on. You can change them at any time.">
          <SettingsRow icon={<IconChart size={20} />} title="Personalized ads" subtitle="On the free plan, ads can fit you better"
            trailing={<Switch checked={ads} label="Personalized ads" onChange={(on) => { if (on) setTracking(true); else { settings.setPersonalizedAds(false); track('consent_changed', { kind: 'ads', on: false }) } }} />} />
          <SettingsRow icon={<IconLock size={20} />} title="Share usage data" subtitle="Helps us fix problems and improve the app"
            trailing={<Switch checked={analytics} label="Share usage data" onChange={(on) => { settings.setAnalytics(on); if (on) track('consent_changed', { kind: 'analytics', on: true }) }} />} />
        </SettingsGroup>

        <SettingsGroup>
          <SettingsRow icon={<IconUser size={20} />} title="Privacy policy" onClick={() => go('/legal/privacy')} />
        </SettingsGroup>
      </div>

      {editing && current && <AudienceSheet field={editing} current={current[editing]} onPick={(a) => choose(editing, a)} onClose={() => setEditing(null)} />}
      {tracking && <TrackingSheet onClose={() => setTracking(false)} />}
    </main>
  )
}
