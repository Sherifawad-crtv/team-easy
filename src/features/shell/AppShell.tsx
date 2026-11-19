import { useEffect } from 'react'
import { NavLink, Outlet, matchPath, useLocation, useNavigate } from 'react-router-dom'
import { Avatar, Logo } from '../../design/ui'
import { IconCalendar, IconChat, IconPeople, IconUser } from '../../design/icons'
import { useSession } from '../../state/session'
import { haptic } from '../../design/haptics'
import { animateNav } from '../../design/nav'
import { CallsProvider } from '../../state/calls'
import { CallOverlay } from '../calls/CallOverlay'
import { PushHost } from '../notifications/PushHost'

// Phones: floating glass pill with the tabs. Desktop (1024+): navigation rail.
// Only screens that exist are listed. New chat lives at the top of the chat list.

const NAV = [
  { to: '/chats', label: 'Chats', icon: IconChat },
  { to: '/groups', label: 'Groups', icon: IconPeople },
  { to: '/calendar', label: 'Calendar', icon: IconCalendar },
  { to: '/account', label: 'Account', icon: IconUser },
]

export function AppShell() {
  const { pathname } = useLocation()
  const { account } = useSession()
  const navigate = useNavigate()

  // Lets pages with a large title tuck it away and show a hairline once they scroll.
  useEffect(() => {
    const onScroll = () => { document.documentElement.dataset.scrolled = window.scrollY > 4 ? 'true' : 'false' }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [pathname])
  const inConversation = Boolean(matchPath('/chats/:id', pathname) || matchPath('/groups/:id', pathname))

  return (
    <CallsProvider>
    <div className={`shell${inConversation ? ' shell--convo' : ''}`}>
      <aside className="rail" aria-label="Main">
        <span className="rail__logo"><Logo size={40} label="Team Easy" /></span>
        <nav className="rail__nav">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `rail__item${isActive ? ' is-active' : ''}`}>
              <span className="navbar__ind"><Icon size={24} /></span>
              {label}
            </NavLink>
          ))}
        </nav>
        {account && <span className="rail__who"><Avatar name={account.name} src={account.photoUrl} size={40} /></span>}
      </aside>

      <div className="shell__main"><Outlet /></div>
      <PushHost />
      <CallOverlay />

      <div className="dock">
        <nav className="pill" aria-label="Main">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `pill__link${isActive ? ' is-active' : ''}`} onClick={(e) => {
                if (pathname === to || pathname.startsWith(`${to}/`)) return
                haptic('selection')
                e.preventDefault()
                animateNav('tab', () => navigate(to))
              }}>
              <Icon size={22} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
    </CallsProvider>
  )
}
