import { useEffect, useState } from 'react'
import { api } from '../../data'
import type { CallMode } from '../../data/types'
import { Banner, BottomSheet, Button } from '../../design/ui'
import { IconMic } from '../../design/icons'
import { track } from '../../experiments/analytics'

/**
 * NFR-04: microphone (and camera for video) access with our own explanation
 * first. Calls `onGranted` straight away when access is already there, and
 * carries on without the camera if only the camera is refused.
 */
export function CallAccessSheet({ mode, onGranted, onCancel }: { mode: CallMode; onGranted: (cameraOn: boolean) => void; onCancel: () => void }) {
  const [step, setStep] = useState<'checking' | 'ask' | 'denied'>('checking')
  const video = mode === 'video'

  useEffect(() => {
    let live = true
    void Promise.all([api.permissions.status('microphone'), video ? api.permissions.status('camera') : Promise.resolve('granted' as const)]).then(([mic, cam]) => {
      if (!live) return
      if (mic === 'granted' && cam !== 'unknown') onGranted(cam === 'granted')
      else setStep('ask')
    })
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const allow = async () => {
    const mic = await api.permissions.request('microphone')
    track('permission_answered', { kind: 'microphone', result: mic })
    if (mic !== 'granted') { setStep('denied'); return }
    let cameraOn = false
    if (video) {
      const cam = await api.permissions.request('camera')
      track('permission_answered', { kind: 'camera', result: cam })
      cameraOn = cam === 'granted'
    }
    onGranted(cameraOn)
  }

  if (step === 'checking') return null
  return (
    <BottomSheet title="Calls" onClose={onCancel}>
      {step === 'denied' ? (
        <div className="stack-lg">
          <Banner kind="offline" title="Microphone access is off">Turn it on in your device settings, then try again. Without it, people can't hear you.</Banner>
          <div className="stack">
            <Button onClick={() => void allow()}>Try again</Button>
            <Button variant="tertiary" onClick={onCancel}>Not now</Button>
          </div>
        </div>
      ) : (
        <div className="stack-lg">
          <div className="perm">
            <span className="empty__icon"><IconMic size={36} /></span>
            <p className="t-title">{video ? 'Allow microphone and camera' : 'Allow your microphone'}</p>
            <p className="t-body-sm muted">{video ? 'So people can hear and see you on a call. You can turn either off during the call, and nothing is recorded.' : 'So people can hear you on a call. You can mute yourself during the call, and nothing is recorded.'}</p>
          </div>
          <div className="stack">
            <Button onClick={() => void allow()}>Continue</Button>
            <Button variant="tertiary" onClick={() => { track('permission_answered', { kind: 'microphone', result: 'not_now' }); onCancel() }}>Not now</Button>
          </div>
        </div>
      )}
    </BottomSheet>
  )
}
