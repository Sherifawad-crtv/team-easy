import { useState } from 'react'
import { createPortal } from 'react-dom'
import { BottomSheet } from '../design/ui'
import { IconBug } from '../design/icons'
import { MotionLab } from './MotionLab'
import { StatesTab } from './StatesTab'

/**
 * Review tools: fake the states a real backend would produce (empty, error, slow, offline,
 * denied permissions, calls, roles) so every screen can be checked. Opens from the small
 * tab on the right edge. Not part of the product: it only appears after opening the app with
 * `?review` in the address (see App.tsx), and engineers can drop it from the build.
 */
export function ReviewTools() {
  const [open, setOpen] = useState(false)
  const [lab, setLab] = useState(false)
  const close = () => setOpen(false)
  return (
    <>
      {!open && createPortal(
        <button type="button" className="debug__fab" aria-label="Open review tools" onClick={() => setOpen(true)}><IconBug size={20} /></button>, document.body)}
      {open && createPortal(
        <BottomSheet title="Review tools" onClose={close}>
          <div className="review">
            <StatesTab onClose={close} />
            <div className="review__states">
              <p className="t-label">Motion</p>
              <button type="button" className="btn btn--secondary" onClick={() => { setLab(true); close() }}>Tune the springs…</button>
            </div>
          </div>
        </BottomSheet>, document.body)}
      {lab && createPortal(<MotionLab onClose={() => setLab(false)} />, document.body)}
    </>
  )
}
