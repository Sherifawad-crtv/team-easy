import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Segmented } from '../design/ui'
import { track } from '../experiments/analytics'
import { EXPERIMENTS, EXPERIMENT_IDS, useVariant, variants, type ExperimentId } from '../experiments/experiments'
import { COMPARE } from './compareInfo'
import { decidedCount, summaryText, useVerdicts, verdicts, type Pick } from './verdicts'

const PICKS: { id: Pick; label: string }[] = [
  { id: 'A', label: 'Prefer A' },
  { id: 'B', label: 'Prefer B' },
  { id: 'unsure', label: 'Not sure' },
]

function Card({ id, onOpen }: { id: ExperimentId; onOpen: (id: ExperimentId) => void }) {
  const current = useVariant(id)
  const all = useVerdicts()
  const info = COMPARE[id]
  const v = all[id]
  return (
    <section className="review__card" aria-label={EXPERIMENTS[id].label}>
      <header className="review__cardhead">
        <h3 className="t-title-sm">{EXPERIMENTS[id].label}</h3>
        {v && v.pick !== 'unsure' && <span className="review__done">Picked {v.pick}</span>}
      </header>
      <Segmented label={`${EXPERIMENTS[id].label} variant`} value={current} onChange={(x) => variants.setOverride(id, x)} options={[{ id: 'A', label: 'A' }, { id: 'B', label: 'B' }]} />
      <p className={`review__what${current === 'A' ? ' is-on' : ''}`}><b>A</b> {info.a}</p>
      <p className={`review__what${current === 'B' ? ' is-on' : ''}`}><b>B</b> {info.b}</p>
      <p className="t-caption muted">Try: {info.tryIt.join(' · ')}</p>
      <button type="button" className="btn btn--secondary review__open" onClick={() => onOpen(id)}>Open {info.open.label}</button>
      <div className="review__verdict" role="group" aria-label={`Your choice for ${EXPERIMENTS[id].label}`}>
        {PICKS.map((p) => (
          <button key={p.id} type="button" aria-pressed={v?.pick === p.id} onClick={() => { verdicts.set(id, p.id); track('verdict_set', { experiment: id, pick: p.id }) }}>{p.label}</button>
        ))}
      </div>
      <input className="review__note" aria-label={`Note about ${EXPERIMENTS[id].label}`} placeholder="Why? (optional)" value={v?.note ?? ''} onChange={(e) => verdicts.setNote(id, e.target.value)} />
    </section>
  )
}

/** Side by side judging: flip A and B on the screen you are on, then record the final choice. */
export function CompareTab({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const all = useVerdicts()
  const [copied, setCopied] = useState(false)
  const done = decidedCount(all)
  const text = summaryText(all, COMPARE)
  const open = (id: ExperimentId) => {
    onClose()
    navigate(COMPARE[id].open.path)
  }
  const forceAll = (v: 'A' | 'B' | null) => EXPERIMENT_IDS.forEach((id) => variants.setOverride(id, v))
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      try { document.execCommand('copy'); setCopied(true) } catch { /* the text is on screen to copy by hand */ }
      ta.remove()
    }
  }
  return (
    <div className="review__compare">
      <p className="t-caption muted">Flipping A or B keeps you on the same screen. {variants.isForced() ? 'This session is forced, so it is left out of the results.' : 'Nothing is forced yet, you are on your random pick.'}</p>
      <div className="seg seg--wrap" role="group" aria-label="Set all">
        <button type="button" onClick={() => forceAll('A')}>All A</button>
        <button type="button" onClick={() => forceAll('B')}>All B</button>
        <button type="button" onClick={() => forceAll(null)}>Back to random</button>
      </div>
      {EXPERIMENT_IDS.map((id) => <Card key={id} id={id} onOpen={open} />)}
      <section className="review__card" aria-label="Your choices">
        <h3 className="t-title-sm">Your choices · {done} of {EXPERIMENT_IDS.length} decided</h3>
        <pre className="review__summary">{text}</pre>
        <div className="seg seg--wrap" role="group" aria-label="Choices actions">
          <button type="button" onClick={copy}>{copied ? 'Copied' : 'Copy my choices'}</button>
          <button type="button" onClick={() => { verdicts.clear(); setCopied(false) }}>Clear</button>
        </div>
      </section>
    </div>
  )
}
