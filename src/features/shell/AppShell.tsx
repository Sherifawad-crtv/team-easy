import { NavLink, Outlet, matchPath, useLocation, useNavigate } from 'react-router-dom'
import { Avatar, Logo } from '../../design/ui'
import { IconChart, IconChat, IconEdit, IconUser } from '../../design/icons'
import { useSession } from '../../state/session'

// Phones: docked navigation bar with a pill indicator and an extended action
// button above it. Desktop (1024+): navigation rail. Only screens that exist
// are listed.

const NAV = [
  { to: '/chats', label: 'Chats', icon: IconChat },
  { to: '/account', label: 'Account', icon: IconUser },
]
const RAIL = [...NAV, { to: '/results', label: 'A/B', icon: IconChart }]

export function AppShell() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { account } = useSession()
  const inConversation = Boolean(matchPath('/chats/:id', pathname))
  const newChat = () => navigate('/chats?new=1')

  return (
    <div className={`shell${inConversation ? ' shell--convo' : ''}`}>
      <aside className="rail" aria-label="Main">
        <span className="rail__logo"><Logo size={40} label="Team Easy" /></span>
        <button type="button" className="rail__fab" aria-label="New chat" onClick={newChat}><IconEdit size={24} /></button>
        <nav className="rail__nav">
          {RAIL.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `rail__item${isActive ? ' is-active' : ''}`}>
              <span className="navbar__ind"><Icon size={24} /></span>
              {label}
            </NavLink>
          ))}
        </nav>
        {account && <span className="rail__who"><Avatar name={account.name} size={40} /></span>}
      </aside>

      <div className="shell__main"><Outlet /></div>

      {pathname === '/chats' && (
        <button type="button" className="efab" onClick={newChat}>
          <IconEdit size={24} />
          New chat
        </button>
      )}
      <nav className="navbar" aria-label="Main">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `navbar__item${isActive ? ' is-active' : ''}`}>
            <span className="navbar__ind"><Icon size={24} /></span>
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
