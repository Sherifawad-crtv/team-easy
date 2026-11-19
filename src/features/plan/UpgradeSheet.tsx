import { useState } from 'react'
import { api } from '../../data'
import type { Entitlements, Product, ProductId } from '../../data/types'
import { Banner, BottomSheet, Button, Skeleton } from '../../design/ui'
import { IconCheck } from '../../design/icons'
import { haptic } from '../../design/haptics'
import { track } from '../../analytics'
import { useAsync } from '../../state/useAsync'
import { useReviewRole } from '../../state/useReviewRole'
import { useSubmit } from '../../state/useSubmit'
import { ErrorBanner } from '../auth/AuthFrame'

const date = (ms: number) => new Date(ms).toLocaleDateString([], { day: 'numeric', month: 'long' })

/** What the add-on does now, in plain words, from the limits the server returns. */
function gains(p: ProductId, e: Entitlements): string {
  if (p === 'members_100') return `Each main group can now hold ${e.limits.memberCap} members.`
  if (p === 'main_groups_3') return `You can now have ${e.limits.mainGroups} main groups.`
  return `Groups can now hold ${e.limits.subgroups} sub-groups, and sub-groups ${e.limits.subSubgroups} more.`
}

/**
 * Buy an add-on (MON-03, MON-04): pick, confirm with the terms, then a clear
 * result. No payment happens in this prototype; the store step is wired later.
 */
export function UpgradeSheet({ focus, onClose, onChanged }: { focus?: ProductId; onClose: () => void; onChanged: () => void }) {
  const offers = useAsync(() => api.purchases.offerings(), [])
  const role = useReviewRole()
  const [picked, setPicked] = useState<Product | null>(null)
  const [done, setDone] = useState<{ product: Product; entitlements: Entitlements } | null>(null)
  const buy = useSubmit()
  const canBuy = role === 'admin'

  const list = offers.status === 'ready' ? [...offers.data].sort((a, b) => Number(b.id === focus) - Number(a.id === focus)) : []

  if (done) {
    return (
      <BottomSheet title="You're all set" onClose={() => { onChanged(); onClose() }}>
        <div className="stack">
          <div className="perm">
            <span className="empty__icon success-mark"><IconCheck size={36} /></span>
            <p className="t-title">{done.product.title} added</p>
            <p className="t-body-sm muted">{gains(done.product.id, done.entitlements)}</p>
          </div>
          <Button onClick={() => { onChanged(); onClose() }}>Done</Button>
        </div>
      </BottomSheet>
    )
  }

  if (picked) {
    return (
      <BottomSheet title={picked.title} onClose={onClose}>
        <div className="stack">
          {buy.error != null && <ErrorBanner error={buy.error} />}
          <p className="t-body-sm">{picked.description}.</p>
          <div className="card" style={{ padding: 'var(--s-5)' }}>
            <p className="t-title">{picked.priceLabel}</p>
            <p className="t-body-sm muted" style={{ marginTop: 'var(--s-2)' }}>Renews every month until cancelled. You can cancel any time, and the add-on then runs until the end of the month you paid for. Nothing is deleted if it ends.</p>
          </div>
          {!canBuy && <Banner kind="info">Only an admin can buy add-ons. Ask an admin to do this.</Banner>}
          <Button loading={buy.busy} disabled={!canBuy} onClick={async () => {
            let result: Entitlements | undefined
            if (await buy.run(async () => { result = await api.purchases.purchase(picked.id) }) && result) {
              haptic('success')
              track('purchase_completed', { product: picked.id })
              setDone({ product: picked, entitlements: result })
            } else { haptic('error'); track('purchase_failed', { product: picked.id }) }
          }}>{buy.error != null ? 'Try again' : 'Subscribe'}</Button>
          <Button variant="tertiary" onClick={() => { buy.reset(); setPicked(null) }}>Back</Button>
        </div>
      </BottomSheet>
    )
  }

  return (
    <BottomSheet title="Add more room" onClose={onClose} detents>
      <div className="stack">
        <p className="t-body-sm muted">Add-ons raise a limit for your whole organization. Any paid add-on also removes ads.</p>
        {offers.status === 'loading' && <div aria-busy="true" aria-label="Loading add-ons"><Skeleton height={76} radius={16} /></div>}
        {offers.status === 'error' && <ErrorBanner error={offers.error} onRetry={offers.reload} />}
        {offers.status === 'ready' && list.length === 0 && <p className="t-body-sm muted">No add-ons are available right now.</p>}
        {list.map((p) => (
          <button key={p.id} type="button" className={`offer${p.id === focus ? ' offer--focus' : ''}`} disabled={Boolean(p.owned)} onClick={() => { track('upgrade_opened', { product: p.id }); setPicked(p) }}>
            <span className="people__text">
              <span className="t-title-sm people__name">{p.title}</span>
              <span className="t-body-sm muted">{p.description}</span>
            </span>
            <span className="offer__price">{p.owned ? 'Active' : p.priceLabel.split(' ')[0]}</span>
          </button>
        ))}
        {offers.status === 'ready' && list.some((p) => p.owned?.endsAt) && <p className="t-caption muted">Cancelled add-ons end on {date(list.find((p) => p.owned?.endsAt)!.owned!.endsAt!)}.</p>}
      </div>
    </BottomSheet>
  )
}
