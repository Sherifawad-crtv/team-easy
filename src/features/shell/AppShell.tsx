import { NavLink, Outlet, matchPath, useLocation, useNavigate } from 'react-router-dom'
import { Logo } from '../../design/ui'
import { IconChat, IconChart, IconPlus, IconUser } from '../../design/icons'
import { useSession } from '../../state/session'

// Phones: floating glass pill with a sibling round button. Desktop (1024+):
// left sidebar. Only screens that exist are listed here.

const NAV = [
  { to: '/chats', label: 'Chats', icon: IconChat },
  { to: '/account', label: 'Account', icon: IconUser },
]

export function AppShell() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { account } = useSession()
  const inConversation = Boolean(matchPath('/chats/:id', pathname))

  return (
    <div className={`shell${inConversation ? ' shell--convo' : ''}`}>
      <aside className="side" aria-label="Main">
        <div className="side__brand"><Logo size={36} /><span className="t-title">Team Easy</span></div>
        <nav className="side__nav">
          {[...NAV, { to: '/results', label: 'A/B results', icon: IconChart }].map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `side__link${isActive ? ' is-active' : ''}`}>
              <Icon size={22} /> {label}
            </NavLink>
          ))}
        </nav>
        {account && <p className="side__who t-caption muted">{account.name}</p>}
      </aside>

      <div className="shell__main"><Outlet /></div>

      <div className="dock">
        <nav className="pill" aria-label="Main">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `pill__link${isActive ? ' is-active' : ''}`}>
              <Icon size={22} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        {pathname === '/chats' && (
          <button type="button" className="fab" aria-label="New chat" onClick={() => navigate('/chats?new=1')}>
            <IconPlus size={26} />
          </button>
        )}
      </div>
    </div>
  )
}
