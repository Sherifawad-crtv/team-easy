import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { roleStore } from '../data/mock/role'
import { scenarioStore } from '../data/mock/scenario'
import { simulatePush } from '../data/mock/mockApi'
import { CalendarScreen } from '../features/calendar/CalendarScreen'
import { DataScreen } from '../features/data/DataScreen'
import { NotificationSettingsScreen } from '../features/notifications/NotificationSettingsScreen'
import { PushHost } from '../features/notifications/PushHost'
import { UpdatesBanner } from '../features/notifications/UpdatesBanner'
import { resetExperiments } from '../experiments/experiments'

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  scenarioStore.set('normal')
  roleStore.set('admin')
  resetExperiments()
})
afterEach(cleanup)

const at = (ui: React.ReactNode, path = '/') => render(<MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>)

describe('calendar', () => {
  it('shows the month, its calendars and an agenda, with an error and an empty state', async () => {
    at(<CalendarScreen />)
    await screen.findByRole('button', { name: 'Company' }, { timeout: 3000 })
    expect(screen.getByRole('button', { name: 'Previous month' })).toBeTruthy()
    expect(screen.getAllByRole('gridcell')).toHaveLength(42)
    cleanup()
    scenarioStore.set('error')
    at(<CalendarScreen />)
    await screen.findAllByRole('button', { name: 'Try again' }, { timeout: 3000 })
    cleanup()
    scenarioStore.set('empty')
    at(<CalendarScreen />)
    await screen.findByText('No calendar yet', {}, { timeout: 3000 })
  })

  it('offers calendar management to admins only', async () => {
    at(<CalendarScreen />)
    await screen.findByRole('button', { name: 'Manage calendars' }, { timeout: 3000 })
    cleanup()
    roleStore.set('member')
    at(<CalendarScreen />)
    await screen.findByRole('button', { name: 'Company' }, { timeout: 3000 })
    expect(screen.queryByRole('button', { name: 'Manage calendars' })).toBeNull()
  })
})

describe('notifications', () => {
  it('shows an in-app notice and lets you dismiss it', async () => {
    at(<UpdatesBanner />)
    const dismiss = await screen.findByRole('button', { name: /Dismiss/ }, { timeout: 3000 })
    fireEvent.click(dismiss)
    await waitFor(() => expect(screen.queryByRole('region', { name: 'Notice' })).toBeNull(), { timeout: 3000 })
  })

  it('turns a setting off and asks permission with our own sheet first', async () => {
    at(<NotificationSettingsScreen />)
    const offers = await screen.findByRole('switch', { name: 'Offers' }, { timeout: 3000 })
    expect(offers.getAttribute('aria-checked')).toBe('false')
    fireEvent.click(offers)
    expect(offers.getAttribute('aria-checked')).toBe('true')
    await screen.findByRole('dialog')
    expect(screen.getByText('Get a banner when it matters')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull(), { timeout: 3000 })
  })

  it('shows a pushed banner and opens its page when tapped', async () => {
    render(
      <MemoryRouter initialEntries={['/chats']}>
        <PushHost />
        <Routes><Route path="/updates/:id" element={<p>Update page</p>} /><Route path="*" element={<p>Elsewhere</p>} /></Routes>
      </MemoryRouter>,
    )
    act(() => simulatePush('offer'))
    fireEvent.click(await screen.findByRole('button', { name: /More room for your team/ }, { timeout: 3000 }))
    await screen.findByText('Update page')
  })
})

describe('data and storage', () => {
  it('explains retention, lists files about to be deleted and backs up', async () => {
    at(<DataScreen />)
    await screen.findByText(/deleted after 6 days/, {}, { timeout: 4000 })
    await screen.findByText('Q4-roadmap.pdf', {}, { timeout: 4000 })
    expect(screen.getAllByText(/hours? left|days? left/).length).toBeGreaterThan(1)
    expect(screen.getByText('No backup yet.')).toBeTruthy()
  })
})
