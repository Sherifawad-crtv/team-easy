import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { Banner, Button, Logo } from '../../design/ui'
import { IconCalendar, IconChart, IconLink, IconPeople, IconUser } from '../../design/icons'
import { useSession } from '../../state/session'
import { useReviewRole } from '../../state/useReviewRole'

const NAV = [
  { to: '/admin', end: true, label: 'Overview', icon: IconChart },
  { to: '/admin/members', label: 'Members', icon: IconUser },
  { to: '/admin/invites', label: 'Invites', icon: IconLink },
  { to: '/admin/teams', label: 'Teams', icon: IconPeople },
  { to: '/admin/calendars', label: 'Calendars', icon: IconCalendar },
] as const

/** The admin console: sidebar and pages. Built for a desktop browser, readable on a phone. */
export function AdminShell() {
  const { account } = useSession()
  const role = useReviewRole()
  const navigate = useNavigate()
  if (account === null) return <Navigate to="/welcome" replace />
  return (
    <div className="admin">
      <aside className="admin__side" aria-label="Admin">
        <div className="admin__brand">
          <Logo size={36} label="Team Easy" />
          <span>
            <span className="admin__org">{account?.organization?.name ?? 'Your organization'}</span>
            <span className="admin__tag">Admin console</span>
          </span>
        </div>
        <nav className="admin__nav">
          {NAV.map(({ to, label, icon: Icon, ...rest }) => (
            <NavLink key={to} to={to} end={'end' in rest} className={({ isActive }) => `admin__link${isActive ? ' is-active' : ''}`}>
              <Icon size={20} />{label}
            </NavLink>
          ))}
          <NavLink to="/account/plan" className="admin__link">Plan and add-ons</NavLink>
        </nav>
        <div className="admin__back"><Button variant="secondary" onClick={() => navigate('/account')}>Back to the app</Button></div>
      </aside>
      <main className="admin__main">
        {role !== 'admin' ? (
          <div className="admin__page">
            <Banner kind="offline" title="Admins only">You're viewing as a member, and the admin console is only for admins. Ask an admin for help.</Banner>
          </div>
        ) : <Outlet />}
      </main>
    </div>
  )
}

export function PageHead({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <header className="admin__head">
      <div>
        <h1 className="admin__title">{title}</h1>
        {sub && <p className="t-body-sm muted">{sub}</p>}
      </div>
      {action}
    </header>
  )
}
