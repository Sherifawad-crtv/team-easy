import { useState } from 'react'
import { resetPurchases, simulateCallTimeLeft, simulateIncomingCall, simulatePermission, simulatePurchaseFailure, simulatePush } from '../data/mock/mockApi'
import { roleStore } from '../data/mock/role'
import { SCENARIOS, scenarioStore } from '../data/mock/scenario'
import { forceInstallMode, forcedInstallMode, type InstallMode } from '../state/install'
import { settings, useConnection } from '../state/settings'
import { useReviewRole } from '../state/useReviewRole'
import { useScenario } from '../state/useScenario'

const read = (k: string, d: string) => { try { return localStorage.getItem(k) ?? d } catch { return d } }

/** Pretend the world is different: empty, slow, offline, denied permissions, other roles. */
export function StatesTab({ onClose }: { onClose: () => void }) {
  const scenario = useScenario()
  const connection = useConnection()
  const role = useReviewRole()
  const [micAccess, setMicAccess] = useState(() => (read('te.perm.microphone', 'ask') === 'denied' ? 'denied' : 'ask'))
  const [photoAccess, setPhotoAccess] = useState(() => read('te.perm.photos', 'ask'))
  const [, bump] = useState(0)
  return (
    <div className="review__states">
      <p className="t-label">Data state</p>
      <div className="seg seg--wrap" role="group" aria-label="Data state">
        {SCENARIOS.map((s) => <button key={s} type="button" aria-pressed={scenario === s} onClick={() => scenarioStore.set(s)}>{s}</button>)}
      </div>
      <p className="t-label">Connection (for media downloads)</p>
      <div className="seg" role="group" aria-label="Connection">
        {(['wifi', 'cellular'] as const).map((c) => <button key={c} type="button" aria-pressed={connection === c} onClick={() => settings.setConnection(c)}>{c === 'wifi' ? 'Wi-Fi' : 'Mobile data'}</button>)}
      </div>
      <p className="t-label">Photo access</p>
      <div className="seg" role="group" aria-label="Photo access">
        {([['ask', 'Ask first', null], ['denied', 'Denied', 'denied']] as const).map(([id, label, value]) => (
          <button key={id} type="button" aria-pressed={photoAccess === id || (id === 'ask' && photoAccess === 'granted')} onClick={() => { simulatePermission('photos', value); setPhotoAccess(id) }}>{label}</button>
        ))}
      </div>
      <p className="t-label">Mic and camera access</p>
      <div className="seg" role="group" aria-label="Mic and camera access">
        {([['ask', 'Ask first', null], ['denied', 'Denied', 'denied']] as const).map(([id, label, value]) => (
          <button key={id} type="button" aria-pressed={micAccess === id} onClick={() => { simulatePermission('microphone', value); simulatePermission('camera', value); setMicAccess(id) }}>{label}</button>
        ))}
      </div>
      <p className="t-label">Add to home screen shows the steps for</p>
      <div className="seg seg--wrap" role="group" aria-label="Install steps for">
        {([['auto', 'This browser', null], ['ios-safari', 'iPhone Safari', 'ios-safari'], ['ios-other', 'iPhone Chrome', 'ios-other'], ['in-app', 'In-app browser', 'in-app'], ['prompt', 'Android', 'prompt']] as const).map(([id, label, value]) => (
          <button key={id} type="button" aria-pressed={(forcedInstallMode() ?? 'auto') === id} onClick={() => { forceInstallMode(value as InstallMode | null); bump((n) => n + 1) }}>{label}</button>
        ))}
      </div>
      <p className="t-label">Purchases</p>
      <div className="seg seg--wrap" role="group" aria-label="Purchases">
        <button type="button" onClick={() => simulatePurchaseFailure(true)}>Next purchase fails</button>
        <button type="button" onClick={() => { resetPurchases(); window.location.reload() }}>Back to free plan</button>
      </div>
      <p className="t-label">Calls</p>
      <div className="seg seg--wrap" role="group" aria-label="Calls">
        <button type="button" onClick={() => { onClose(); simulateIncomingCall('direct', 'audio') }}>Incoming audio</button>
        <button type="button" onClick={() => { onClose(); simulateIncomingCall('direct', 'video') }}>Incoming video</button>
        <button type="button" onClick={() => { onClose(); simulateIncomingCall('group', 'video') }}>Incoming group</button>
      </div>
      <div className="seg seg--wrap" role="group" aria-label="Calling time">
        <button type="button" onClick={() => simulateCallTimeLeft(20)}>20 sec left today</button>
        <button type="button" onClick={() => simulateCallTimeLeft(0)}>None left</button>
        <button type="button" onClick={() => simulateCallTimeLeft(null)}>Reset</button>
      </div>
      <p className="t-label">Send a test push</p>
      <div className="seg" role="group" aria-label="Send a test push">
        <button type="button" onClick={() => simulatePush('release')}>New version</button>
        <button type="button" onClick={() => simulatePush('offer')}>Offer</button>
      </div>
      <p className="t-label">View groups and calendar as</p>
      <div className="seg" role="group" aria-label="View as">
        {(['admin', 'member'] as const).map((r) => <button key={r} type="button" aria-pressed={role === r} onClick={() => roleStore.set(r)}>{r === 'admin' ? 'Admin' : 'Member'}</button>)}
      </div>
    </div>
  )
}
