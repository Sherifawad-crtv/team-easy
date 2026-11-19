import { useEffect, useState } from 'react'
import { IconClose, IconPhone } from '../../design/icons'
import { track } from '../../analytics'
import { snooze, useInstall } from '../../state/install'
import { InstallSheet } from './InstallSheet'

/** A quiet nudge on the chat list for phones that can still add the app. It stays away for a week once closed. */
export function InstallBanner() {
  const { mode, installed, touch, snoozed } = useInstall()
  const [open, setOpen] = useState(false)
  const show = touch && !installed && !snoozed
  useEffect(() => {
    if (show) track('install_banner_shown', { mode })
  }, [show, mode])
  if (!show && !open) return null
  return (
    <>
      {show && (
        <div className="ubanner ibanner" role="region" aria-label="Add to home screen">
          <button type="button" className="ubanner__main" onClick={() => { track('install_banner_opened', { mode }); setOpen(true) }}>
            <span className="ubanner__icon"><IconPhone size={20} /></span>
            <span className="people__text">
              <span className="t-title-sm people__name">Add to your home screen</span>
              <span className="t-caption muted">Opens full screen, like an app</span>
            </span>
          </button>
          <button type="button" className="icon-btn" aria-label="Hide for a week" onClick={() => { track('install_banner_snoozed'); snooze() }}><IconClose size={18} /></button>
        </div>
      )}
      {open && <InstallSheet mode={mode} onClose={() => setOpen(false)} />}
    </>
  )
}
