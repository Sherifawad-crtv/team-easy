import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { mockApi, simulatePurchaseFailure } from '../data/mock/mockApi'
import { roleStore } from '../data/mock/role'
import { scenarioStore } from '../data/mock/scenario'
import { AdRow } from '../features/ads/AdSlot'
import { PlanScreen } from '../features/plan/PlanScreen'
import { UpgradeSheet } from '../features/plan/UpgradeSheet'

beforeEach(() => {
  localStorage.clear()
  scenarioStore.set('normal')
  roleStore.set('admin')
})
afterEach(cleanup)

const at = (ui: React.ReactNode) => render(<MemoryRouter>{ui}</MemoryRouter>)

describe('upgrade flow', () => {
  it('picks an add-on, confirms the terms and says what changed', async () => {
    let changed = 0
    at(<UpgradeSheet focus="subgroups_5" onClose={() => {}} onChanged={() => { changed++ }} />)
    fireEvent.click(await screen.findByRole('button', { name: /More sub-groups/ }, { timeout: 3000 }))
    expect(screen.getByText(/Renews every month until cancelled/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }))
    await screen.findByText('More sub-groups added', {}, { timeout: 5000 })
    expect(screen.getByText(/can now hold 10 sub-groups/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Done' }))
    expect(changed).toBe(1)
  }, 15000)

  it('shows a failed payment with a way to try again, and blocks members', async () => {
    simulatePurchaseFailure(true)
    at(<UpgradeSheet onClose={() => {}} onChanged={() => {}} />)
    fireEvent.click(await screen.findByRole('button', { name: /More members/ }, { timeout: 3000 }))
    fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }))
    await screen.findByText("The payment didn't go through", {}, { timeout: 5000 })
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy()
    cleanup()
    roleStore.set('member')
    at(<UpgradeSheet onClose={() => {}} onChanged={() => {}} />)
    fireEvent.click(await screen.findByRole('button', { name: /More members/ }, { timeout: 3000 }))
    expect((screen.getByRole('button', { name: 'Subscribe' }) as HTMLButtonElement).disabled).toBe(true)
  }, 15000)
})

describe('plan screen', () => {
  it('shows the free limits, then add-ons after buying, and cancel', async () => {
    await mockApi.purchases.purchase('members_100')
    at(<PlanScreen />)
    await screen.findByText('400', {}, { timeout: 3000 })
    await screen.findByText(/Renews/, {}, { timeout: 3000 })
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel add-on' }))
    await screen.findByText(/^Ends /, {}, { timeout: 4000 })
  }, 15000)

  it('shows an error with retry', async () => {
    scenarioStore.set('error')
    at(<PlanScreen />)
    await screen.findAllByRole('button', { name: 'Try again' }, { timeout: 3000 })
  })
})

describe('ads', () => {
  it('shows a sponsored row that can be explained and hidden, and nothing on a paid plan', async () => {
    await mockApi.auth.signIn('a@b.co', 'longpass1')
    at(<AdRow />)
    await screen.findByRole('complementary', {}, { timeout: 3000 })
    expect(screen.getByText('Ad')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Why am I seeing this ad?' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Hide this ad' }))
    await waitFor(() => expect(screen.queryByRole('complementary')).toBeNull())
    cleanup()
    await mockApi.purchases.purchase('members_100')
    at(<AdRow />)
    await new Promise((r) => setTimeout(r, 800))
    expect(screen.queryByRole('complementary')).toBeNull()
  }, 15000)
})
