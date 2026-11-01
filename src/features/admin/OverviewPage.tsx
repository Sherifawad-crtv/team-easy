import { useNavigate } from 'react-router-dom'
import { api } from '../../data'
import { Banner, Button, Skeleton } from '../../design/ui'
import { useAsync } from '../../state/useAsync'
import { useReviewRole } from '../../state/useReviewRole'
import { ErrorBanner } from '../auth/AuthFrame'
import { PageHead } from './AdminShell'

function Stat({ label, value, sub, to }: { label: string; value: string | number; sub?: string; to: string }) {
  const navigate = useNavigate()
  return (
    <button type="button" className="stat" onClick={() => navigate(to)}>
      <span className="stat__label">{label}</span>
      <span className="stat__value">{value}</span>
      {sub && <span className="stat__sub">{sub}</span>}
    </button>
  )
}

/** Where the organization stands (GRP-05): people, groups, headroom against the member cap, open invites. */
export function OverviewPage() {
  const role = useReviewRole()
  const navigate = useNavigate()
  const data = useAsync(() => api.admin.overview(), [role])
  return (
    <div className="admin__page">
      <PageHead title="Overview" sub="How your organization is doing" action={<Button block={false} onClick={() => navigate('/admin/invites')}>Invite people</Button>} />
      {data.status === 'loading' && <div className="stats" aria-busy="true" aria-label="Loading overview">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} height={104} radius={20} />)}</div>}
      {data.status === 'error' && <ErrorBanner error={data.error} onRetry={data.reload} />}
      {data.status === 'ready' && (
        <>
          <div className="stats">
            <Stat label="Members" value={data.data.members} sub={data.data.pendingMembers ? `${data.data.pendingMembers} waiting to sign in` : 'All signed in'} to="/admin/members" />
            <Stat label="Main groups" value={`${data.data.mainGroups} of ${data.data.limits.mainGroups}`} sub="Archived ones don't count" to="/admin/teams" />
            <Stat label="Open invites" value={data.data.activeInvites} sub="Links people can join with" to="/admin/invites" />
            <Stat label="Calendars" value={data.data.calendars} sub="Assigned to people" to="/admin/calendars" />
            <Stat label="Members per main group" value={data.data.limits.memberCap} sub="The most one main group can hold" to="/account/plan" />
          </div>

          <section className="admin__section" aria-label="Needs attention">
            <h2 className="t-title-sm">Needs attention</h2>
            {data.data.nearCap.length === 0 && data.data.pendingMembers === 0 && <p className="t-body-sm muted">Nothing needs you right now.</p>}
            {data.data.nearCap.map((g) => (
              <Banner key={g.id} kind="offline" title={`${g.name} is nearly full`} actionLabel="See teams" onAction={() => navigate('/admin/teams')}>
                {g.members} of {g.cap} members, counting its sub-groups. {g.cap - g.members} {g.cap - g.members === 1 ? 'spot' : 'spots'} left.
              </Banner>
            ))}
            {data.data.pendingMembers > 0 && (
              <Banner kind="info" title={`${data.data.pendingMembers} ${data.data.pendingMembers === 1 ? 'person has' : 'people have'} not signed in yet`} actionLabel="See members" onAction={() => navigate('/admin/members')}>
                They were added by email and will show here until they finish signing up.
              </Banner>
            )}
          </section>
        </>
      )}
    </div>
  )
}
