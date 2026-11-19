import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { Logo } from './design/ui'
import { AccountScreen } from './features/account/AccountScreen'
import { SignInScreen } from './features/auth/SignInScreen'
import { WelcomeScreen } from './features/auth/WelcomeScreen'
import { GroupsScreen } from './features/groups/GroupsScreen'
import { ChatsScreen } from './features/chat/ChatsScreen'
import { AppShell } from './features/shell/AppShell'
import { SessionProvider, useSession } from './state/session'

import { pendingJoin } from './features/groups/pendingJoin'

// Screens people open less often load on demand, then are fetched quietly once the app is idle
// so opening them later is instant. Keeps the first load small.
// Review tools (fake data states, springs) are not part of the product. Engineers switch them
// on by opening the app once with `?review` in the address; that is remembered for the tab.
const ReviewTools = lazy(() => import('./debug/ReviewTools').then((m) => ({ default: m.ReviewTools })))
function reviewTools(): boolean {
  try {
    if (new URLSearchParams(window.location.search).has('review')) sessionStorage.setItem('te.review', '1')
    return sessionStorage.getItem('te.review') === '1'
  } catch {
    return false
  }
}

const screens = {
  EditProfileScreen: () => import('./features/account/EditProfileScreen').then((m) => ({ default: m.EditProfileScreen })),
  ForgotPasswordScreen: () => import('./features/auth/ForgotPasswordScreen').then((m) => ({ default: m.ForgotPasswordScreen })),
  InviteScreen: () => import('./features/auth/InviteScreen').then((m) => ({ default: m.InviteScreen })),
  SignUpScreen: () => import('./features/auth/SignUpScreen').then((m) => ({ default: m.SignUpScreen })),
  JoinScreen: () => import('./features/groups/JoinScreen').then((m) => ({ default: m.JoinScreen })),
  AdminShell: () => import('./features/admin/AdminShell').then((m) => ({ default: m.AdminShell })),
  CalendarsPage: () => import('./features/admin/CalendarsPage').then((m) => ({ default: m.CalendarsPage })),
  InvitesPage: () => import('./features/admin/InvitesPage').then((m) => ({ default: m.InvitesPage })),
  MembersPage: () => import('./features/admin/MembersPage').then((m) => ({ default: m.MembersPage })),
  OverviewPage: () => import('./features/admin/OverviewPage').then((m) => ({ default: m.OverviewPage })),
  TeamsPage: () => import('./features/admin/TeamsPage').then((m) => ({ default: m.TeamsPage })),
  PlanScreen: () => import('./features/plan/PlanScreen').then((m) => ({ default: m.PlanScreen })),
  CallsScreen: () => import('./features/calls/CallsScreen').then((m) => ({ default: m.CallsScreen })),
  CalendarScreen: () => import('./features/calendar/CalendarScreen').then((m) => ({ default: m.CalendarScreen })),
  DataScreen: () => import('./features/data/DataScreen').then((m) => ({ default: m.DataScreen })),
  NotificationSettingsScreen: () => import('./features/notifications/NotificationSettingsScreen').then((m) => ({ default: m.NotificationSettingsScreen })),
  UpdatesScreen: () => import('./features/notifications/UpdatesScreen').then((m) => ({ default: m.UpdatesScreen })),
}
const EditProfileScreen = lazy(screens.EditProfileScreen)
const ForgotPasswordScreen = lazy(screens.ForgotPasswordScreen)
const InviteScreen = lazy(screens.InviteScreen)
const SignUpScreen = lazy(screens.SignUpScreen)
const JoinScreen = lazy(screens.JoinScreen)
const AdminShell = lazy(screens.AdminShell)
const CalendarsPage = lazy(screens.CalendarsPage)
const InvitesPage = lazy(screens.InvitesPage)
const MembersPage = lazy(screens.MembersPage)
const OverviewPage = lazy(screens.OverviewPage)
const TeamsPage = lazy(screens.TeamsPage)
const PlanScreen = lazy(screens.PlanScreen)
const CallsScreen = lazy(screens.CallsScreen)
const CalendarScreen = lazy(screens.CalendarScreen)
const DataScreen = lazy(screens.DataScreen)
const NotificationSettingsScreen = lazy(screens.NotificationSettingsScreen)
const UpdatesScreen = lazy(screens.UpdatesScreen)

if (typeof window !== 'undefined') {
  const idle = (window as unknown as { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1500))
  window.addEventListener('load', () => idle(() => Object.values(screens).forEach((load) => void load())))
}

function Splash() {
  return <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center' }}><Logo size={96} label="Team Easy" /></div>
}

/** Signed-out screens. Signed-in users go to the app. */
function PublicOnly() {
  const { account } = useSession()
  if (account === undefined) return <Splash />
  const pending = pendingJoin.get()
  return account ? <Navigate to={pending ? `/join/${encodeURIComponent(pending)}` : '/chats'} replace /> : <Outlet />
}

function Private() {
  const { account } = useSession()
  if (account === undefined) return <Splash />
  return account ? <AppShell /> : <Navigate to="/welcome" replace />
}

export function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <Suspense fallback={<Splash />}>
        <Routes>
          <Route element={<PublicOnly />}>
            <Route path="/welcome" element={<WelcomeScreen />} />
            <Route path="/sign-in" element={<SignInScreen />} />
            <Route path="/sign-up" element={<SignUpScreen />} />
            <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
          </Route>
          {/* Invite links work whether or not you're signed in. */}
          <Route path="/invite" element={<InviteScreen />} />
          <Route path="/invite/:token" element={<InviteScreen />} />
          <Route path="/join/:token" element={<JoinScreen />} />
          <Route path="/admin" element={<AdminShell />}>
            <Route index element={<OverviewPage />} />
            <Route path="members" element={<MembersPage />} />
            <Route path="invites" element={<InvitesPage />} />
            <Route path="teams" element={<TeamsPage />} />
            <Route path="calendars" element={<CalendarsPage />} />
          </Route>
          <Route element={<Private />}>
            <Route path="/chats/:id?" element={<ChatsScreen />} />
            <Route path="/groups/:id?" element={<GroupsScreen />} />
            <Route path="/calendar" element={<CalendarScreen />} />
            <Route path="/updates/:id?" element={<UpdatesScreen />} />
            <Route path="/account/notifications" element={<NotificationSettingsScreen />} />
            <Route path="/account/plan" element={<PlanScreen />} />
            <Route path="/account/calls" element={<CallsScreen />} />
            <Route path="/account/data" element={<DataScreen />} />
            <Route path="/account" element={<AccountScreen />} />
            <Route path="/account/edit" element={<EditProfileScreen />} />
          </Route>
          <Route path="*" element={<Navigate to="/chats" replace />} />
        </Routes>
        </Suspense>
        {reviewTools() && (
          <Suspense fallback={null}>
            <ReviewTools />
          </Suspense>
        )}
      </SessionProvider>
    </BrowserRouter>
  )
}
