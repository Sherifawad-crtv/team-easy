import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { Logo } from './design/ui'
import { DebugPanel } from './debug/DebugPanel'
import { AccountScreen } from './features/account/AccountScreen'
import { EditProfileScreen } from './features/account/EditProfileScreen'
import { ForgotPasswordScreen } from './features/auth/ForgotPasswordScreen'
import { InviteScreen } from './features/auth/InviteScreen'
import { SignInScreen } from './features/auth/SignInScreen'
import { SignUpScreen } from './features/auth/SignUpScreen'
import { WelcomeScreen } from './features/auth/WelcomeScreen'
import { GroupsScreen } from './features/groups/GroupsScreen'
import { JoinScreen, pendingJoin } from './features/groups/JoinScreen'
import { CalendarScreen } from './features/calendar/CalendarScreen'
import { DataScreen } from './features/data/DataScreen'
import { NotificationSettingsScreen } from './features/notifications/NotificationSettingsScreen'
import { UpdatesScreen } from './features/notifications/UpdatesScreen'
import { ChatsScreen } from './features/chat/ChatsScreen'
import { ResultsScreen } from './features/results/ResultsScreen'
import { AppShell } from './features/shell/AppShell'
import { SessionProvider, useSession } from './state/session'

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
          <Route element={<Private />}>
            <Route path="/chats/:id?" element={<ChatsScreen />} />
            <Route path="/groups/:id?" element={<GroupsScreen />} />
            <Route path="/calendar" element={<CalendarScreen />} />
            <Route path="/updates/:id?" element={<UpdatesScreen />} />
            <Route path="/account/notifications" element={<NotificationSettingsScreen />} />
            <Route path="/account/data" element={<DataScreen />} />
            <Route path="/account" element={<AccountScreen />} />
            <Route path="/account/edit" element={<EditProfileScreen />} />
            <Route path="/results" element={<ResultsScreen />} />
          </Route>
          <Route path="*" element={<Navigate to="/chats" replace />} />
        </Routes>
        <DebugPanel />
      </SessionProvider>
    </BrowserRouter>
  )
}
