import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../data'
import type { Ad, AdSlot as Slot } from '../../data/types'
import { Avatar, BottomSheet, Button } from '../../design/ui'
import { IconInfo } from '../../design/icons'
import { track } from '../../experiments/analytics'
import { useAsync } from '../../state/useAsync'

/** MON-01, 02: asks for an ad for this place, and shows it only when the server returns one. Failing to load never shows an error. */
export function useAd(slot: Slot) {
  const ad = useAsync(() => api.ads.forSlot(slot), [slot])
  const [hidden, setHidden] = useState(false)
  const shown = ad.status === 'ready' && ad.data && !hidden ? ad.data : null
  useEffect(() => {
    if (shown) {
      void api.ads.report(shown.id, 'impression')
      track('ad_impression', { slot })
    }
  }, [shown, slot])
  return { ad: shown, hide: () => { if (shown) { void api.ads.report(shown.id, 'hide'); track('ad_hidden', { slot }) } setHidden(true) } }
}

function Why({ ad, onClose, onHide }: { ad: Ad; onClose: () => void; onHide: () => void }) {
  const navigate = useNavigate()
  return (
    <BottomSheet title="Why you see this ad" onClose={onClose}>
      <div className="stack">
        <p className="t-body-sm muted">You see ads on the free plan in your personal chats. Chats in your organization never show ads, and any paid add-on removes them everywhere.</p>
        <p className="t-body-sm">Ad from <strong>{ad.advertiser}</strong>. They don't see your messages.</p>
        <Button variant="secondary" onClick={() => { onClose(); navigate('/account/plan') }}>See add-ons</Button>
        <Button variant="tertiary" onClick={() => { onHide(); onClose() }}>Hide this ad</Button>
      </div>
    </BottomSheet>
  )
}

function open(ad: Ad) {
  void api.ads.report(ad.id, 'click')
  track('ad_click')
  window.open(ad.url, '_blank', 'noopener')
}

/** A sponsored row that sits between chats in the list. */
export function AdRow() {
  const { ad, hide } = useAd('chat_list')
  const [why, setWhy] = useState(false)
  if (!ad) return null
  return (
    <div className="ad-row" role="complementary" aria-label={`Ad from ${ad.advertiser}`}>
      <button type="button" className="ad-row__main" onClick={() => open(ad)}>
        <Avatar name={ad.advertiser} size={56} tone={ad.tone} />
        <span className="chat-row__main">
          <span className="chat-row__top"><span className="chat-row__title">{ad.advertiser}</span><span className="ad-tag">Ad</span></span>
          <span className="ad-row__head">{ad.headline}</span>
          <span className="ad-row__cta">{ad.cta}</span>
        </span>
      </button>
      <button type="button" className="icon-btn" aria-label="Why am I seeing this ad?" onClick={() => setWhy(true)}><IconInfo size={20} /></button>
      {why && <Why ad={ad} onClose={() => setWhy(false)} onHide={hide} />}
    </div>
  )
}

/** A slim banner at the top of a conversation. */
export function AdBanner() {
  const { ad, hide } = useAd('conversation')
  const [why, setWhy] = useState(false)
  if (!ad) return null
  return (
    <div className="ad-banner" role="complementary" aria-label={`Ad from ${ad.advertiser}`}>
      <button type="button" className="ad-banner__main" onClick={() => open(ad)}>
        <span className="ad-tag">Ad</span>
        <span className="ad-banner__text"><strong>{ad.advertiser}</strong> · {ad.headline}</span>
      </button>
      <button type="button" className="icon-btn" aria-label="Why am I seeing this ad?" onClick={() => setWhy(true)}><IconInfo size={18} /></button>
      {why && <Why ad={ad} onClose={() => setWhy(false)} onHide={hide} />}
    </div>
  )
}
