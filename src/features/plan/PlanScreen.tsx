import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../data'
import type { Product } from '../../data/types'
import { STORE_SUBSCRIPTIONS } from '../../config/legal'
import { Banner, BackButton, BottomSheet, Button, SettingsGroup, SettingsRow, Skeleton } from '../../design/ui'
import { IconDocument, IconLink, IconShield } from '../../design/icons'
import { useAnimatedNavigate } from '../../design/nav'
import { storeName, storePlatform } from '../../state/platform'
import { track } from '../../analytics'
import { useAsync } from '../../state/useAsync'
import { useReviewRole } from '../../state/useReviewRole'
import { useSubmit } from '../../state/useSubmit'
import { ErrorBanner } from '../auth/AuthFrame'
import { UpgradeSheet } from './UpgradeSheet'

const date = (ms: number) => new Date(ms).toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' })

/** Plan and add-ons (MON-03, 04): what you have, the limits that follow, buy, cancel and restore. */
export function PlanScreen() {
  const navigate = useNavigate()
  const go = useAnimatedNavigate()
  const platform = storePlatform()
  const store = storeName(platform)
  const role = useReviewRole()
  const ent = useAsync(() => api.purchases.entitlements(), [])
  const offers = useAsync(() => api.purchases.offerings(), [])
  const [buying, setBuying] = useState(false)
  const [cancelling, setCancelling] = useState<Product | null>(null)
  const [restored, setRestored] = useState(false)
  const restore = useSubmit()
  const cancel = useSubmit()
  const refresh = () => { ent.reload(); offers.reload() }
  const admin = role === 'admin'
  const owned = offers.status === 'ready' ? offers.data.filter((p) => p.owned) : []

  return (
    <main className="page surface fade-in">
      <header className="bar bar--back">
        <BackButton onClick={() => navigate('/account')} />
        <h1 className="bar__title">Plan and add-ons</h1>
      </header>
      <div className="page__body stack-lg">
        {ent.status === 'loading' && <div aria-busy="true" aria-label="Loading plan"><Skeleton height={160} radius={28} /></div>}
        {ent.status === 'error' && <ErrorBanner error={ent.error} onRetry={ent.reload} />}

        {ent.status === 'ready' && (
          <>
            <section className="card plan" aria-label="Your plan">
              <p className="ubanner__kind">{ent.data.plan === 'paid' ? 'With add-ons' : 'Free plan'}</p>
              <ul className="plan__limits" role="list">
                <li><span>Members per main group</span><strong>{ent.data.limits.memberCap}</strong></li>
                <li><span>Main groups</span><strong>{ent.data.limits.mainGroups}</strong></li>
                <li><span>Sub-groups in each group</span><strong>{ent.data.limits.subgroups}</strong></li>
                <li><span>Sub-sub-groups in each sub-group</span><strong>{ent.data.limits.subSubgroups}</strong></li>
                <li><span>Ads</span><strong>{ent.data.plan === 'paid' ? 'None' : 'Shown on personal chats'}</strong></li>
              </ul>
            </section>

            {!admin && <Banner kind="info">Only an admin can buy or cancel add-ons.</Banner>}
            {restored && <Banner kind="success" title="Purchases restored">Anything you bought with this store account is back.</Banner>}
            {restore.error != null && <ErrorBanner error={restore.error} />}

            <section aria-label="Add-ons">
              <h2 className="t-title-sm" style={{ marginBottom: 'var(--s-3)' }}>Your add-ons</h2>
              {offers.status === 'loading' && <Skeleton height={64} radius={16} />}
              {offers.status === 'error' && <ErrorBanner error={offers.error} onRetry={offers.reload} />}
              {offers.status === 'ready' && owned.length === 0 && <p className="t-body-sm muted">None yet. Add-ons raise a limit for your whole organization.</p>}
              {owned.length > 0 && (
                <ul className="card" role="list">
                  {owned.map((p) => (
                    <li key={p.id} className="setting-row">
                      <span>
                        <span className="t-title-sm" style={{ display: 'block' }}>{p.title}</span>
                        <span className="t-body-sm muted">{p.owned!.endsAt ? `Ends ${date(p.owned!.endsAt)}` : `Renews ${date(p.owned!.renewsAt)} · ${p.priceLabel}`}</span>
                      </span>
                      {!p.owned!.endsAt && <Button variant="tertiary" block={false} disabled={!admin} onClick={() => setCancelling(p)}>Cancel</Button>}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <div className="stack">
              <Button onClick={() => setBuying(true)}>{owned.length ? 'Add another add-on' : 'See add-ons'}</Button>
              <Button variant="secondary" loading={restore.busy} onClick={async () => { if (await restore.run(() => api.purchases.restore())) { setRestored(true); track('purchases_restored'); refresh() } }}>Restore purchases</Button>
              <p className="t-caption muted">Prices shown are examples until the store is connected.</p>
            </div>

            <SettingsGroup title="Subscriptions" footer={`Add-ons are billed by your ${store} account and renew every month until you cancel. Cancel at least 24 hours before the renewal date to avoid the next charge. Deleting the app or your account does not cancel them.`}>
              <SettingsRow icon={<IconLink size={20} />} title={`Manage in ${store}`} subtitle="Change or cancel any add-on" external
                onClick={() => (platform === 'other' ? window.open(STORE_SUBSCRIPTIONS.ios, '_blank', 'noopener') : window.open(STORE_SUBSCRIPTIONS[platform], '_blank', 'noopener'))} />
              <SettingsRow icon={<IconDocument size={20} />} title="Terms of Service" onClick={() => go('/legal/terms')} />
              <SettingsRow icon={<IconShield size={20} />} title="Privacy Policy" onClick={() => go('/legal/privacy')} />
            </SettingsGroup>
          </>
        )}
      </div>

      {buying && <UpgradeSheet onClose={() => setBuying(false)} onChanged={refresh} />}
      {cancelling && (
        <BottomSheet title={`Cancel ${cancelling.title}?`} onClose={() => { cancel.reset(); setCancelling(null) }}>
          <div className="stack">
            {cancel.error != null && <ErrorBanner error={cancel.error} />}
            <p className="t-body-sm muted">It keeps working until {date(cancelling.owned!.renewsAt)}, then stops renewing. Nothing is deleted: if you're over a limit afterwards, you just can't add more until you're back under it.</p>
            <Button variant="destructive" loading={cancel.busy} onClick={async () => { if (await cancel.run(() => api.purchases.cancel(cancelling.id))) { track('purchase_cancelled', { product: cancelling.id }); setCancelling(null); refresh() } }}>Cancel add-on</Button>
            <Button variant="tertiary" onClick={() => setCancelling(null)}>Keep it</Button>
          </div>
        </BottomSheet>
      )}
    </main>
  )
}
