import { useNavigate } from 'react-router-dom'
import { api } from '../../data'
import { IconBell, IconClose } from '../../design/icons'
import { track } from '../../experiments/analytics'
import { useAsync } from '../../state/useAsync'

const LABEL = { release: 'New version', update: "What's new", offer: 'Offer' } as const

/** NTF-01: an in-app notice from us (update logs, what's new). Quiet when there is nothing to say or it can't load. */
export function UpdatesBanner() {
  const navigate = useNavigate()
  const banners = useAsync(() => api.notifications.banners(), [])
  if (banners.status !== 'ready' || banners.data.length === 0) return null
  const b = banners.data[0]
  return (
    <div className="ubanner" role="region" aria-label="Notice">
      <button type="button" className="ubanner__main" onClick={() => { track('banner_opened', { kind: b.kind }); navigate(`/updates/${b.id}`) }}>
        <span className="ubanner__icon"><IconBell size={20} /></span>
        <span className="people__text">
          <span className="ubanner__kind">{LABEL[b.kind]}</span>
          <span className="t-title-sm people__name">{b.title}</span>
          <span className="t-caption muted">{b.summary}</span>
        </span>
      </button>
      <button type="button" className="icon-btn" aria-label={`Dismiss ${b.title}`} onClick={() => { track('banner_dismissed', { kind: b.kind }); void api.notifications.dismissBanner(b.id).then(banners.reload) }}>
        <IconClose size={18} />
      </button>
    </div>
  )
}
