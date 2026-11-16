import { useState } from 'react'
import { BottomSheet, Button } from '../design/ui'
import { DEFAULT_SPRINGS, SPRING_LABELS, applySprings, clearSprings, saveTuning, springCurve, storedTuning, type SpringName, type SpringSpec } from '../design/springs'

const NAMES = Object.keys(DEFAULT_SPRINGS) as SpringName[]

/**
 * Review tool for tuning the springs on a real phone (docs/MOTION_PLAN.md, M6).
 * Move the sliders, press Play to feel each spring, and the whole app uses the
 * new values straight away (on this device only). "Copy numbers" gives the
 * values to hand back to be built in for everyone.
 */
export function MotionLab({ onClose }: { onClose: () => void }) {
  const [values, setValues] = useState(storedTuning)
  const [played, setPlayed] = useState<Record<string, boolean>>({})
  const [copied, setCopied] = useState(false)

  const change = (name: SpringName, patch: Partial<SpringSpec>) => {
    const next = { ...values, [name]: { ...values[name], ...patch } }
    setValues(next)
    saveTuning(next)
    applySprings(next)
  }
  const reset = () => {
    setValues({ ...DEFAULT_SPRINGS })
    saveTuning(null)
    clearSprings()
  }
  const text = NAMES.map((n) => `${SPRING_LABELS[n].title}: response ${values[n].response.toFixed(2)}, damping ${values[n].damping.toFixed(2)}`).join('\n')

  return (
    <BottomSheet title="Tune the springs" onClose={onClose} detents>
      <div className="stack">
        <p className="t-body-sm muted">Response is how quick it is, damping is how bouncy: 1 means no bounce. Changes apply to the whole app on this phone right away. Make sure motion style B is on.</p>
        {NAMES.map((n) => {
          const spec = values[n]
          const curve = springCurve(spec)
          const on = played[n]
          return (
            <section key={n} className="lab">
              <div className="lab__head">
                <span>
                  <span className="t-title-sm" style={{ display: 'block' }}>{SPRING_LABELS[n].title}</span>
                  <span className="t-caption muted">{SPRING_LABELS[n].use}</span>
                </span>
                <span className="t-caption muted">{curve.durationMs} ms</span>
              </div>
              <label className="lab__row">
                <span>Response {spec.response.toFixed(2)}</span>
                <input type="range" min={0.15} max={0.8} step={0.01} value={spec.response} aria-label={`${SPRING_LABELS[n].title} response`} onChange={(e) => change(n, { response: Number(e.target.value) })} />
              </label>
              <label className="lab__row">
                <span>Damping {spec.damping.toFixed(2)}</span>
                <input type="range" min={0.4} max={1} step={0.01} value={spec.damping} aria-label={`${SPRING_LABELS[n].title} damping`} onChange={(e) => change(n, { damping: Number(e.target.value) })} />
              </label>
              <div className="lab__track" aria-hidden="true">
                <span className="lab__dot" style={{ left: on ? 'calc(100% - 28px)' : '0px', transition: `left ${curve.durationMs}ms ${curve.css}` }} />
              </div>
              <Button variant="secondary" onClick={() => setPlayed((p) => ({ ...p, [n]: !p[n] }))}>Play</Button>
            </section>
          )
        })}
        <pre className="lab__text selectable" aria-label="Current numbers">{text}</pre>
        <Button onClick={() => { void navigator.clipboard?.writeText(text).then(() => setCopied(true), () => setCopied(false)) }}>{copied ? 'Copied' : 'Copy numbers'}</Button>
        <Button variant="tertiary" onClick={reset}>Back to the built-in values</Button>
      </div>
    </BottomSheet>
  )
}
