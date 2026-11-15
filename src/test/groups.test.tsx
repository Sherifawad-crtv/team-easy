import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { roleStore } from '../data/mock/role'
import { scenarioStore } from '../data/mock/scenario'
import { GroupsScreen } from '../features/groups/GroupsScreen'
import { resetExperiments, variants } from '../experiments/experiments'
import { ConversationView } from '../features/chat/Conversation'
import type { Conversation } from '../data/types'
import { CallsProvider } from '../state/calls'

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  scenarioStore.set('normal')
  roleStore.set('admin')
  resetExperiments()
})
afterEach(cleanup)

const renderAt = (path = '/groups') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes><Route path="/groups/:id?" element={<GroupsScreen />} /></Routes>
    </MemoryRouter>,
  )

describe('groups navigation (A/B)', () => {
  it('A shows a collapsed tree that opens level by level', async () => {
    act(() => variants.setOverride('group_nav', 'A'))
    renderAt()
    await screen.findByText('Product Team', {}, { timeout: 3000 })
    expect(screen.queryByText('Mobile design')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Expand Product Team' }))
    expect(screen.getByText('Mobile design')).toBeTruthy()
    expect(screen.queryByText('Design systems')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Expand Mobile design' }))
    expect(screen.getByText('Design systems')).toBeTruthy()
  })

  it('B lists every group with its path and can filter', async () => {
    act(() => variants.setOverride('group_nav', 'B'))
    renderAt()
    await screen.findByText('Design systems', {}, { timeout: 3000 })
    expect(screen.getAllByText(/Product Team › Mobile design/).length).toBe(2)
    fireEvent.change(screen.getByLabelText('Find a group'), { target: { value: 'zzz' } })
    expect(screen.getByText(/No group matches/)).toBeTruthy()
  })

  it('shows an error with retry and an empty state', async () => {
    scenarioStore.set('error')
    renderAt()
    await screen.findByRole('button', { name: 'Try again' }, { timeout: 3000 })
    cleanup()
    scenarioStore.set('empty')
    renderAt()
    await screen.findByText('No groups yet', {}, { timeout: 3000 })
    expect(screen.getByRole('button', { name: 'Create a group' })).toBeTruthy()
  })
})

describe('group detail', () => {
  it('explains a full parent instead of letting an admin add to it', async () => {
    renderAt('/groups/g-eng')
    const add = await screen.findByRole('button', { name: /Add sub-group/ }, { timeout: 3000 })
    expect((add as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByText(/the most it can hold/)).toBeTruthy()
    expect(screen.getByText('5 of 5')).toBeTruthy()
  })

  it('shows the member limit to admins only', async () => {
    renderAt('/groups/g-product')
    await screen.findByText('Member limit', {}, { timeout: 3000 })
    cleanup()
    roleStore.set('member')
    renderAt('/groups/g-product')
    await screen.findByRole('heading', { name: 'Product Team' }, { timeout: 3000 })
    expect(screen.queryByText('Member limit')).toBeNull()
    expect(screen.queryByRole('button', { name: /Delete group/ })).toBeNull()
    expect(screen.getByRole('button', { name: /Leave group/ })).toBeTruthy()
  })

  it('deletes with an undo that brings the group back', async () => {
    act(() => variants.setOverride('group_nav', 'B'))
    renderAt('/groups/g-support')
    fireEvent.click(await screen.findByRole('button', { name: /Delete group/ }, { timeout: 3000 }))
    const sheet = await screen.findByRole('dialog')
    fireEvent.click(within(sheet).getByRole('button', { name: 'Delete group' }))
    const undo = await screen.findByRole('button', { name: 'Undo' }, { timeout: 3000 })
    await waitFor(() => expect(screen.queryByText('Support rota', { selector: '.grow__name' })).toBeNull(), { timeout: 3000 })
    fireEvent.click(undo)
    await screen.findByText('Support rota', { selector: '.grow__name' }, { timeout: 3000 })
  })
})

function Where() {
  const l = useLocation()
  return <p data-testid="where">{l.pathname}{(l.state as { from?: string } | null)?.from ? ` from ${(l.state as { from: string }).from}` : ''}</p>
}

describe('opening a group', () => {
  it('goes straight to its chat, not to the group page', async () => {
    act(() => variants.setOverride('group_nav', 'B'))
    render(
      <MemoryRouter initialEntries={['/groups']}>
        <Where />
        <Routes>
          <Route path="/groups/:id?" element={<GroupsScreen />} />
          <Route path="/chats/:id" element={<p>Chat page</p>} />
        </Routes>
      </MemoryRouter>,
    )
    fireEvent.click(await screen.findByText('Product Team', { selector: '.grow__name' }, { timeout: 3000 }))
    await screen.findByText('Chat page', {}, { timeout: 3000 })
    expect(screen.getByTestId('where').textContent).toBe('/chats/c-product')
  })

  it('opens the group page for an archived group, which has no chat in the list', async () => {
    act(() => variants.setOverride('group_nav', 'A'))
    renderAt('/groups')
    fireEvent.click(await screen.findByRole('button', { name: /Archived \(1\)/ }, { timeout: 3000 }))
    fireEvent.click(await screen.findByText('2025 Offsite', { selector: '.grow__name' }))
    await screen.findByRole('heading', { name: '2025 Offsite' }, { timeout: 3000 })
  })

  it('opens group info from the top bar of the chat, and back returns to the chat', async () => {
    const conv: Conversation = { id: 'c-product', kind: 'group', title: 'Product Team', groupId: 'g-product', memberCount: 24, lastMessage: '', lastAt: Date.now(), unread: 0 }
    render(
      <MemoryRouter initialEntries={['/chats/c-product']}>
        <Where />
        <Routes>
          <Route path="/chats/:id" element={<CallsProvider><ConversationView conversation={conv} onBack={() => {}} /></CallsProvider>} />
          <Route path="/groups/:id?" element={<GroupsScreen />} />
        </Routes>
      </MemoryRouter>,
    )
    fireEvent.click(await screen.findByRole('button', { name: /Product Team, group info/ }, { timeout: 3000 }))
    await screen.findByRole('heading', { name: 'Product Team' }, { timeout: 3000 })
    expect(screen.getByTestId('where').textContent).toBe('/groups/g-product from chat')
    fireEvent.click(screen.getByRole('button', { name: 'Back to groups' }))
    await screen.findByRole('button', { name: /Product Team, group info/ }, { timeout: 3000 })
    expect(screen.getByTestId('where').textContent).toBe('/chats/c-product')
  })
})
