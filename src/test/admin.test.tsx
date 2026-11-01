import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { mockApi } from '../data/mock/mockApi'
import { roleStore } from '../data/mock/role'
import { scenarioStore } from '../data/mock/scenario'
import { AdminShell } from '../features/admin/AdminShell'
import { InvitesPage } from '../features/admin/InvitesPage'
import { MembersPage } from '../features/admin/MembersPage'
import { OverviewPage } from '../features/admin/OverviewPage'
import { TeamsPage } from '../features/admin/TeamsPage'
import { SessionProvider } from '../state/session'

beforeEach(async () => {
  localStorage.clear()
  sessionStorage.clear()
  scenarioStore.set('normal')
  roleStore.set('admin')
  await mockApi.auth.signIn('layla@acme.co', 'longpass1')
})
afterEach(cleanup)

const admin = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <SessionProvider>
        <Routes>
          <Route path="/admin" element={<AdminShell />}>
            <Route index element={<OverviewPage />} />
            <Route path="members" element={<MembersPage />} />
            <Route path="invites" element={<InvitesPage />} />
            <Route path="teams" element={<TeamsPage />} />
          </Route>
        </Routes>
      </SessionProvider>
    </MemoryRouter>,
  )

describe('admin console', () => {
  it('shows the overview with headroom, and turns members away', async () => {
    admin('/admin')
    await screen.findByText('Needs attention', {}, { timeout: 4000 })
    expect(screen.getByText(/is nearly full/)).toBeTruthy()
    cleanup()
    roleStore.set('member')
    admin('/admin')
    await screen.findByText('Admins only', {}, { timeout: 4000 })
  })

  it('lists members in a table and adds one', async () => {
    admin('/admin/members')
    await screen.findByRole('table', {}, { timeout: 4000 })
    fireEvent.click(screen.getByRole('button', { name: /Add member/ }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('Full name'), { target: { value: 'Rania Saleh' } })
    fireEvent.change(within(dialog).getByLabelText('Work email'), { target: { value: 'rania@acme.example' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add member' }))
    await screen.findByText(/Rania Saleh was added/, {}, { timeout: 4000 })
    await screen.findByText('Not signed in', {}, { timeout: 4000 })
  }, 15000)

  it('makes an invite and shows its link', async () => {
    admin('/admin/invites')
    await screen.findByText('ORG-ACME', {}, { timeout: 4000 })
    fireEvent.click(screen.getByRole('button', { name: /New invite/ }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create invite' }))
    await screen.findByText('Invite ready', {}, { timeout: 4000 })
    expect(document.querySelector('.linkbox__url')?.textContent).toMatch(/\/invite\/ORG-/)
  }, 15000)

  it('shows teams with their member counters and an error with retry', async () => {
    admin('/admin/teams')
    await screen.findByRole('table', {}, { timeout: 4000 })
    expect(screen.getAllByRole('progressbar').length).toBeGreaterThan(2)
    expect(screen.getByText(/5 of 5 main groups/)).toBeTruthy()
    cleanup()
    scenarioStore.set('error')
    admin('/admin/teams')
    await waitFor(() => expect(screen.getAllByRole('button', { name: 'Try again' }).length).toBeGreaterThan(0), { timeout: 4000 })
  })
})
