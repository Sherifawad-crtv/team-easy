import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, Link } from 'react-router-dom'
import { BottomSheet, Segmented } from '../design/ui'
import { IconBug } from '../design/icons'
import { EXPERIMENTS, useVariant, variants, type ExperimentId } from '../experiments/experiments'
import { CompareTab } from './CompareTab'
import { experimentsFor } from './compareInfo'
import { MotionLab } from './MotionLab'
import { StatesTab } from './StatesTab'

type Tab = 'compare' | 'states' | 'motion'

const QUICK_KEY = 'te.quick'
const readQuick = () => { try { return localStorage.getItem(QUICK_KEY) !== 'off' } catch { return true } }

/** A small A|B switch for the screen you are on, with one tap to the full panel. */
function QuickSwitch({ onOpen, onHide }: { onOpen: () => void; onHide: () => void }) {
  const { pathname } = useLocation()
  const ids = experimentsFor(pathname)
  const [i, setI] = useState(0)
  const id: ExperimentId = ids[i % ids.length]
  const current = useVariant(id)
  return (
    <div className="quick" role="group" aria-label="Quick A/B switch">
      <button type="button" className="quick__label" onClick={() => setI((n) => n + 1)} aria-label={`${EXPERIMENTS[id].label}. Tap for the next one`}>{EXPERIMENTS[id].label}</button>
      <Segmented label="Variant" value={current} onChange={(x) => variants.setOverride(id, x)} options={[{ id: 'A', label: 'A' }, { id: 'B', label: 'B' }]} />
      <button type="button" className="quick__btn" onClick={onOpen} aria-label="Open review tools"><IconBug size={16} /></button>
      <button type="button" className="quick__btn" onClick={onHide} aria-label="Hide the quick switch">×</button>
    </div>
  )
}

/** Review tools: compare A and B on any screen, record the final choice, and fake states. */
export function DebugPanel() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('compare')
  const [quick, setQuick] = useState(readQuick)
  const [lab, setLab] = useState(false)
  const close = () => setOpen(false)
  useEffect(() => { try { localStorage.setItem(QUICK_KEY, quick ? 'on' : 'off') } catch { /* fine */ } }, [quick])
  return (
    <>
      {quick && !open && createPortal(<QuickSwitch onOpen={() => setOpen(true)} onHide={() => setQuick(false)} />, document.body)}
      {!quick && !open && createPortal(
        <button type="button" className="debug__fab" aria-label="Open review tools" onClick={() => setOpen(true)}><IconBug size={20} /></button>, document.body)}
      {open && createPortal(
        <BottomSheet title="Review" onClose={close}>
          <div className="review">
            <Segmented label="Review section" value={tab} onChange={setTab} options={[{ id: 'compare', label: 'Compare' }, { id: 'states', label: 'States' }, { id: 'motion', label: 'Motion' }]} />
            {tab === 'compare' && <CompareTab onClose={close} />}
            {tab === 'states' && <StatesTab onClose={close} />}
            {tab === 'motion' && (
              <div className="review__states">
                <p className="t-caption muted">Tune how springs feel on a real phone and copy the numbers back.</p>
                <button type="button" className="btn btn--secondary" onClick={() => { setLab(true); close() }}>Tune the springs…</button>
              </div>
            )}
            <p className="t-caption muted review__foot">
              <Link to="/results" onClick={close}>See results</Link>
              {' · '}
              <button type="button" className="linkish" onClick={() => setQuick((q) => !q)}>{quick ? 'Hide quick switch' : 'Show quick switch'}</button>
            </p>
          </div>
        </BottomSheet>, document.body)}
      {lab && createPortal(<MotionLab onClose={() => setLab(false)} />, document.body)}
    </>
  )
}
