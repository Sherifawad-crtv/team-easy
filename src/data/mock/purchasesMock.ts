// Simulated purchases and ads (MON-01..04). No money moves and no store is
// called. Prices are example text. The next purchase can be made to fail from
// the review tools, to design the failure states.

import { LIMITS } from '../../config/limits'
import type { AdsApi, PurchasesApi } from '../api'
import { ApiError } from '../errors'
import type { Ad, Entitlements, GroupLimits, IdentityKind, Product, ProductId } from '../types'
import { roleStore } from './role'
import { scenarioStore } from './scenario'

const OWNED_KEY = 'te.purchases'
const FAIL_KEY = 'te.purchase.fail'
const DAY = 86_400_000

const CATALOG: Omit<Product, 'owned'>[] = [
  { id: 'members_100', title: 'More members', description: '100 more members in every main group', priceLabel: '$9.99 / month (example)' },
  { id: 'main_groups_3', title: 'More main groups', description: '3 more main groups for your organization', priceLabel: '$14.99 / month (example)' },
  { id: 'subgroups_5', title: 'More sub-groups', description: '5 more sub-groups in every group and sub-group', priceLabel: '$7.99 / month (example)' },
]

type Owned = Partial<Record<ProductId, { renewsAt: number; endsAt?: number }>>

function readOwned(): Owned {
  try {
    const raw = JSON.parse(localStorage.getItem(OWNED_KEY) ?? '{}') as Owned
    // A cancelled add-on stops at the end of its period.
    for (const id of Object.keys(raw) as ProductId[]) if (raw[id]?.endsAt && raw[id]!.endsAt! < Date.now()) delete raw[id]
    return raw
  } catch {
    return {}
  }
}
function writeOwned(o: Owned) {
  try {
    localStorage.setItem(OWNED_KEY, JSON.stringify(o))
  } catch {
    // lasts for this page only
  }
}

export const failNextPurchase = (on: boolean) => {
  try {
    if (on) localStorage.setItem(FAIL_KEY, '1')
    else localStorage.removeItem(FAIL_KEY)
  } catch {
    // ignore
  }
}
const shouldFail = () => {
  try {
    return localStorage.getItem(FAIL_KEY) === '1'
  } catch {
    return false
  }
}

/** The free limits plus whatever has been bought. Group code asks this for every limit. */
export function currentLimits(): GroupLimits {
  const o = readOwned()
  return {
    memberCap: LIMITS.maxMembers + (o.members_100 ? 100 : 0),
    mainGroups: LIMITS.maxChildren[1] + (o.main_groups_3 ? 3 : 0),
    subgroups: LIMITS.maxChildren[2] + (o.subgroups_5 ? 5 : 0),
    subSubgroups: LIMITS.maxChildren[3] + (o.subgroups_5 ? 5 : 0),
    groupsPerUser: LIMITS.maxGroupsPerUser,
  }
}
export const isPaid = () => Object.keys(readOwned()).length > 0

const ADS: Ad[] = [
  { id: 'ad-1', advertiser: 'Northwind Coffee', headline: 'Meetings run better with good coffee', body: 'Office beans delivered every week. First box free.', cta: 'Get the first box', url: 'https://example.com/northwind', tone: 2 },
  { id: 'ad-2', advertiser: 'Lumen Desks', headline: 'Stand up for your back', body: 'Height-adjustable desks, assembled in minutes.', cta: 'See desks', url: 'https://example.com/lumen', tone: 1 },
  { id: 'ad-3', advertiser: 'Pocket Notes', headline: 'Write it down before it gets away', body: 'A notebook app that syncs everywhere. Free for teams of 5.', cta: 'Try it free', url: 'https://example.com/pocketnotes', tone: 4 },
]

export function createPurchases(deps: { gate: (base?: number) => Promise<void>; identity: () => IdentityKind }) {
  const entitlements = (): Entitlements => ({ plan: isPaid() ? 'paid' : 'free', limits: currentLimits() })
  const needAdmin = () => {
    if (roleStore.get() !== 'admin') throw new ApiError('not_allowed')
  }
  let seen = 0

  const purchases: PurchasesApi = {
    async offerings() {
      await deps.gate(400)
      if (scenarioStore.get() === 'empty') return []
      const o = readOwned()
      return CATALOG.map((p) => ({ ...p, owned: o[p.id] ?? null }))
    },
    async entitlements() {
      await deps.gate(250)
      return entitlements()
    },
    async purchase(id) {
      await deps.gate(1600)
      needAdmin()
      if (shouldFail()) {
        failNextPurchase(false)
        throw new ApiError('purchase_failed')
      }
      const o = readOwned()
      o[id] = { renewsAt: Date.now() + 30 * DAY }
      writeOwned(o)
      return entitlements()
    },
    async cancel(id) {
      await deps.gate(700)
      needAdmin()
      const o = readOwned()
      if (o[id]) o[id] = { ...o[id]!, endsAt: o[id]!.renewsAt }
      writeOwned(o)
      return entitlements()
    },
    async restore() {
      await deps.gate(1200)
      return entitlements()
    },
  }

  const ads: AdsApi = {
    async forSlot() {
      await deps.gate(300)
      // MON-01, 02 (assumed, open question 19): free plan only, and only outside the organization.
      if (isPaid() || deps.identity() === 'organization' || scenarioStore.get() === 'empty') return null
      return ADS[seen++ % ADS.length]
    },
    async report() {
      // fire and forget: reporting never blocks the screen
    },
  }
  return { purchases, ads, reset: () => writeOwned({}) }
}
