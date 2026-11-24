import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { mockApi } from '../data/mock/mockApi'
import { scenarioStore } from '../data/mock/scenario'
import { roleStore } from '../data/mock/role'
import { settings } from '../state/settings'
import { SessionProvider } from '../state/session'
import { CallsProvider } from '../state/calls'
import type { Conversation } from '../data/types'
import { AccountScreen } from '../features/account/AccountScreen'
import { DeleteAccountScreen } from '../features/account/DeleteAccountScreen'
import { PrivacyScreen } from '../features/account/PrivacyScreen'
import { BlockedScreen } from '../features/account/BlockedScreen'
import { ContactSheet } from '../features/chat/ContactSheet'
import { ReportSheet } from '../features/safety/ReportSheet'
import { HelpScreen } from '../features/account/HelpScreen'
import { LegalScreen } from '../features/legal/LegalScreen'
import { PlanScreen } from '../features/plan/PlanScreen'
import { SignUpScreen } from '../features/auth/SignUpScreen'
import { WelcomeScreen } from '../features/auth/WelcomeScreen'

beforeEach(async () => {
  localStorage.clear()
  sessionStorage.clear()
  scenarioStore.set('normal')
  roleStore.set('admin')
  settings.setAnalytics(false)
  settings.setPersonalizedAds(false)
  await mockApi.auth.signIn('layla@acme.co', 'longpass1')
  for (const b of await mockApi.safety.blocked()) await mockApi.safety.unblock(b.id)
})
afterEach(cleanup)

function Where() {
  const l = useLocation()
  return <p data-testid="where">{l.pathname}</p>
}
const app = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Where />
      <SessionProvider>
        <Routes>
          <Route path="/account" element={<AccountScreen />} />
          <Route path="/account/delete" element={<DeleteAccountScreen />} />
          <Route path="/account/privacy" element={<PrivacyScreen />} />
          <Route path="/account/privacy/blocked" element={<BlockedScreen />} />
          <Route path="/account/help" element={<HelpScreen />} />
          <Route path="/account/plan" element={<PlanScreen />} />
          <Route path="/legal/:kind" element={<LegalScreen />} />
          <Route path="/sign-up" element={<SignUpScreen />} />
          <Route path="/welcome" element={<WelcomeScreen />} />
          <Route path="*" element={<p>Elsewhere</p>} />
        </Routes>
      </SessionProvider>
    </MemoryRouter>,
  )

describe('settings home', () => {
  it('lists the settings groups like a messaging app and signs out', async () => {
    app('/account')
    await screen.findByText('Layla Haddad', {}, { timeout: 3000 })
    for (const name of ['Your account', 'Privacy', 'Chats', 'Notifications', 'Storage and data', 'Calls', 'Accessibility', 'Plan and add-ons', 'Invite a friend', 'Help', "What's new"]) {
      expect(screen.getByRole('button', { name: new RegExp(name) })).toBeTruthy()
    }
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeTruthy()
  })

  it('opens a settings page when a row is tapped', async () => {
    app('/account')
    await screen.findByText('Layla Haddad', {}, { timeout: 3000 })
    fireEvent.click(screen.getByRole('button', { name: /Privacy/ }))
    await waitFor(() => expect(screen.getByTestId('where').textContent).toBe('/account/privacy'))
  })
})

describe('privacy', () => {
  it('keeps ads personalization and usage data off until chosen, and asks before tracking', async () => {
    app('/account/privacy')
    const ads = await screen.findByRole('switch', { name: 'Personalized ads' }, { timeout: 3000 })
    expect(ads.getAttribute('aria-checked')).toBe('false')
    expect(screen.getByRole('switch', { name: 'Share usage data' }).getAttribute('aria-checked')).toBe('false')
    fireEvent.click(ads)
    await screen.findByText('Ads that fit you')
    expect(settings.personalizedAds()).toBe(false) // not yet: the system question comes first
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    await waitFor(() => expect(settings.personalizedAds()).toBe(true), { timeout: 3000 })
  })

  it('"Not now" leaves personalized ads off', async () => {
    app('/account/privacy')
    fireEvent.click(await screen.findByRole('switch', { name: 'Personalized ads' }, { timeout: 3000 }))
    fireEvent.click(await screen.findByRole('button', { name: 'Not now' }))
    expect(settings.personalizedAds()).toBe(false)
  })

  it('saves who can see your online status', async () => {
    app('/account/privacy')
    fireEvent.click(await screen.findByRole('button', { name: /Online status/ }, { timeout: 3000 }))
    fireEvent.click(await screen.findByRole('radio', { name: /Nobody/ }))
    await waitFor(async () => expect((await mockApi.settings.privacy()).onlineStatus).toBe('nobody'), { timeout: 3000 })
  })
})

describe('deleting your account (App Store 5.1.1(v), Google Play account deletion)', () => {
  it('is reachable inside the app, says what happens, and gives a web address', async () => {
    app('/account/delete')
    await screen.findByRole('heading', { name: 'Delete account' }, { timeout: 3000 })
    expect(screen.getByText('What happens')).toBeTruthy()
    expect(screen.getByRole('link', { name: /delete-account/ })).toBeTruthy()
  })

  it('needs the password, and refuses a wrong one without deleting', async () => {
    app('/account/delete')
    const field = await screen.findByLabelText('Enter your password to confirm', {}, { timeout: 3000 })
    fireEvent.click(screen.getByRole('button', { name: 'Delete my account' }))
    await screen.findByText('Enter your password')
    fireEvent.change(field, { target: { value: 'wrongpass1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Delete my account' }))
    await screen.findByText("That password isn't right", {}, { timeout: 3000 })
    expect(await mockApi.auth.restoreSession()).not.toBeNull()
  })

  it('deletes the account for good with the right password', async () => {
    app('/account/delete')
    fireEvent.change(await screen.findByLabelText('Enter your password to confirm', {}, { timeout: 3000 }), { target: { value: 'longpass1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Delete my account' }))
    await waitFor(async () => expect(await mockApi.auth.restoreSession()).toBeNull(), { timeout: 4000 })
    expect(sessionStorage.getItem('te.accountDeleted')).toBe('1')
  })

  it('warns that add-ons are not cancelled by deleting the account', async () => {
    await mockApi.purchases.purchase('members_100')
    app('/account/delete')
    await screen.findByText('Cancel your add-ons first', {}, { timeout: 3000 })
  })
})

const direct: Conversation = { id: 'c-omar', kind: 'direct', memberId: 'u-omar', title: 'Omar Al-Fayed', lastMessage: '', lastAt: 0, unread: 0, presence: 'online' }

describe('reporting and blocking (App Store 1.2, Google Play User Generated Content)', () => {
  it('a report needs a reason, is private, and says how fast it is looked at', async () => {
    render(<ReportSheet target={{ kind: 'message', conversationId: 'c-product', messageId: 'm1', userId: 'u-priya' }} subject="Priya" canBlock onClose={() => {}} />)
    const send = screen.getByRole('button', { name: 'Send report' }) as HTMLButtonElement
    expect(send.disabled).toBe(true)
    expect(screen.getByText(/Your report is private/)).toBeTruthy()
    fireEvent.click(screen.getByRole('radio', { name: 'Harassment or bullying' }))
    expect(send.disabled).toBe(false)
    fireEvent.click(send)
    await screen.findByText(/within 24 hours/, {}, { timeout: 3000 })
    expect(await mockApi.safety.blocked()).toEqual([])
  })

  it('can block the person in the same report', async () => {
    render(<ReportSheet target={{ kind: 'person', userId: 'u-omar' }} subject="Omar" canBlock onClose={() => {}} />)
    fireEvent.click(screen.getByRole('radio', { name: 'Spam' }))
    fireEvent.click(screen.getByRole('switch', { name: 'Also block Omar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Send report' }))
    await screen.findByText(/is now blocked/, {}, { timeout: 3000 })
    expect((await mockApi.safety.blocked()).map((b) => b.id)).toEqual(['u-omar'])
  })

  it('contact info offers Block and Report, and Block asks first', async () => {
    render(<MemoryRouter><CallsProvider><ContactSheet conversation={direct} onClose={() => {}} /></CallsProvider></MemoryRouter>)
    expect(screen.getByRole('button', { name: /Report Omar/ })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Block Omar/ }))
    await screen.findByText(/aren't told that you blocked them/)
    expect(await mockApi.safety.blocked()).toEqual([])
    const sheet = screen.getAllByRole('dialog').at(-1)!
    fireEvent.click(within(sheet).getByRole('button', { name: 'Block' }))
    await waitFor(async () => expect((await mockApi.safety.blocked()).length).toBe(1), { timeout: 3000 })
  })

  it('a blocked person can be unblocked from the list', async () => {
    await mockApi.safety.block('u-omar')
    app('/account/privacy/blocked')
    await screen.findByText('Omar Al-Fayed', {}, { timeout: 3000 })
    fireEvent.click(screen.getByRole('button', { name: 'Unblock' }))
    await screen.findByText('No blocked contacts', {}, { timeout: 3000 })
  })
})

describe('legal and consent', () => {
  it('Help lists terms, privacy policy, guidelines and licenses, and contact', async () => {
    app('/account/help')
    for (const name of ['Terms of Service', 'Privacy Policy', 'Community guidelines', 'Open-source licenses', 'Help center', 'Contact us']) {
      expect(await screen.findByRole('button', { name: new RegExp(name) }, { timeout: 3000 })).toBeTruthy()
    }
  })

  it('the privacy policy opens without an account', async () => {
    await mockApi.auth.signOut()
    app('/legal/privacy')
    await screen.findByRole('heading', { name: 'Privacy Policy' }, { timeout: 3000 })
    expect(screen.getByText('What we collect')).toBeTruthy()
  })

  it('sign up states the terms, privacy policy and minimum age before creating the account', async () => {
    await mockApi.auth.signOut()
    app('/sign-up')
    expect(await screen.findByRole('link', { name: 'Terms of Service' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toBeTruthy()
    expect(screen.getByText(/at least 16 years old/)).toBeTruthy()
  })

  it('the welcome screen links the terms and privacy policy', async () => {
    await mockApi.auth.signOut()
    app('/welcome')
    expect(await screen.findByRole('link', { name: 'Terms of Service' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toBeTruthy()
  })

  it('the plan screen has restore purchases, a way to manage the subscription, and the legal links', async () => {
    app('/account/plan')
    await screen.findByRole('button', { name: 'Restore purchases' }, { timeout: 3000 })
    expect(screen.getByRole('button', { name: /Manage in/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Terms of Service' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Privacy Policy' })).toBeTruthy()
  })
})
