import { NavLink, Outlet, matchPath, useLocation } from 'react-router-dom'
import { Avatar, Logo } from '../../design/ui'
import { IconChart, IconChat, IconPeople, IconUser } from '../../design/icons'
import { useSession } from '../../state/session'

// Phones: tab bar docked to the bottom edge. Desktop (1024+): navigation rail.
// Only screens that exist are listed. New chat lives at the top of the chat list.

const NAV = [
  { to: '/chats', label: 'Chats', icon: IconChat },
  { to: '/groups', label: 'Groups', icon: IconPeople },
  { to: '/account', label: 'Account', icon: IconUser },
]
const RAIL = [...NAV, { to: '/results', label: 'A/B', icon: IconChart }]

export function AppShell() {
  const { pathname } = useLocation()
  const { account } = useSession()
  const inConversation = Boolean(matchPath('/chats/:id', pathname) || matchPath('/groups/:id', pathname))

  return (
    <div className={`shell${inConversation ? ' shell--convo' : ''}`}>
      <aside className="rail" aria-label="Main">
        <span className="rail__logo"><Logo size={40} label="Team Easy" /></span>
        <nav className="rail__nav">
          {RAIL.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `rail__item${isActive ? ' is-active' : ''}`}>
              <span className="navbar__ind"><Icon size={24} /></span>
              {label}
            </NavLink>
          ))}
        </nav>
        {account && <span className="rail__who"><Avatar name={account.name} src={account.photoUrl} size={40} /></span>}
      </aside>

      <div className="shell__main"><Outlet /></div>

      <div className="dock">
        <nav className="pill" aria-label="Main">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `pill__link${isActive ? ' is-active' : ''}`}>
              <span className="navbar__ind"><Icon size={22} /></span><span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
