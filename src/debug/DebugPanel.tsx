import { useState } from 'react'
import { Link } from 'react-router-dom'
import { simulatePermission } from '../data/mock/mockApi'
import { SCENARIOS, scenarioStore } from '../data/mock/scenario'
import { settings, useConnection } from '../state/settings'
import { IconBug, IconClose } from '../design/icons'
import { EXPERIMENTS, EXPERIMENT_IDS, useVariant, variants, type ExperimentId } from '../experiments/experiments'
import { useScenario } from '../state/useScenario'

function Toggle({ id }: { id: ExperimentId }) {
  const current = useVariant(id)
  return (
    <div className="debug__row">
      <span>{EXPERIMENTS[id].label}</span>
      <span className="seg" role="group" aria-label={EXPERIMENTS[id].label}>
        {(['A', 'B'] as const).map((v) => (
          <button key={v} type="button" aria-pressed={current === v} onClick={() => variants.setOverride(id, v)}>{v}</button>
        ))}
      </span>
    </div>
  )
}

/** Review tools: flip the mock data state and force an A/B variant on any screen. */
export function DebugPanel() {
  const [open, setOpen] = useState(false)
  const scenario = useScenario()
  const connection = useConnection()
  const [photoAccess, setPhotoAccess] = useState<string>(() => { try { return localStorage.getItem('te.perm.photos') ?? 'ask' } catch { return 'ask' } })
  return (
    <div className="debug">
      {open && (
        <div className="debug__panel" role="dialog" aria-label="Review tools">
          <p className="t-label">Data state</p>
          <div className="seg seg--wrap" role="group" aria-label="Data state">
            {SCENARIOS.map((s) => (
              <button key={s} type="button" aria-pressed={scenario === s} onClick={() => scenarioStore.set(s)}>{s}</button>
            ))}
          </div>
          <p className="t-label" style={{ marginTop: 'var(--s-4)' }}>Connection (for media downloads)</p>
          <div className="seg" role="group" aria-label="Connection">
            {(['wifi', 'cellular'] as const).map((c) => (
              <button key={c} type="button" aria-pressed={connection === c} onClick={() => settings.setConnection(c)}>{c === 'wifi' ? 'Wi-Fi' : 'Mobile data'}</button>
            ))}
          </div>
          <p className="t-label" style={{ marginTop: 'var(--s-4)' }}>Photo access</p>
          <div className="seg" role="group" aria-label="Photo access">
            {([['ask', 'Ask first', null], ['denied', 'Denied', 'denied']] as const).map(([id, label, value]) => (
              <button key={id} type="button" aria-pressed={photoAccess === id || (id === 'ask' && photoAccess === 'granted')} onClick={() => { simulatePermission('photos', value); setPhotoAccess(id) }}>{label}</button>
            ))}
          </div>
          <p className="t-label" style={{ marginTop: 'var(--s-4)' }}>Force a variant</p>
          {EXPERIMENT_IDS.map((id) => <Toggle key={id} id={id} />)}
          <p className="t-caption muted" style={{ marginTop: 'var(--s-3)' }}>
            Forced sessions are left out of the results. <Link to="/results" onClick={() => setOpen(false)}>See results</Link>
          </p>
        </div>
      )}
      <button type="button" className="debug__fab" aria-label={open ? 'Close review tools' : 'Open review tools'} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {open ? <IconClose size={20} /> : <IconBug size={20} />}
      </button>
    </div>
  )
}
