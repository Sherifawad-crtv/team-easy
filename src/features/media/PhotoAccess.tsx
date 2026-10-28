import { useRef, useState, type ReactNode } from 'react'
import { Banner, BottomSheet, Button } from '../../design/ui'
import { IconCamera } from '../../design/icons'
import { track } from '../../experiments/analytics'
import { usePermission } from './usePermission'

/**
 * Our own explanation before the real photo permission request (NFR-04),
 * and a way forward when the answer was no.
 */
export function PhotoAccessBody({ onGranted, onCancel }: { onGranted: () => void; onCancel: () => void }) {
  const photos = usePermission('photos')
  const [denied, setDenied] = useState(false)

  const allow = async () => {
    const s = await photos.request()
    track('permission_answered', { kind: 'photos', result: s })
    if (s === 'granted') onGranted()
    else setDenied(true)
  }

  if (denied) {
    return (
      <div className="stack-lg">
        <Banner kind="offline" title="Photo access is off">Turn it on in your device settings, then try again. You can still send documents.</Banner>
        <div className="stack">
          <Button onClick={() => void allow()}>Try again</Button>
          <Button variant="tertiary" onClick={onCancel}>Back</Button>
        </div>
      </div>
    )
  }
  return (
    <div className="stack-lg">
      <div className="perm">
        <span className="empty__icon"><IconCamera size={36} /></span>
        <p className="t-title">Allow access to your photos</p>
        <p className="t-body-sm muted">To share a photo we need to read the photos on your device. You choose which ones to send. We never look at the rest.</p>
      </div>
      <div className="stack">
        <Button onClick={() => void allow()}>Continue</Button>
        <Button variant="tertiary" onClick={() => { track('permission_answered', { kind: 'photos', result: 'not_now' }); onCancel() }}>Not now</Button>
      </div>
    </div>
  )
}

/** Opens the file picker for one photo, asking for access first when needed. */
export function usePhotoChooser(onFile: (file: File) => void): { open: () => void; node: ReactNode } {
  const photos = usePermission('photos')
  const [asking, setAsking] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  const pick = () => {
    if (input.current) {
      input.current.value = ''
      input.current.click()
    }
  }
  return {
    open: () => (photos.status === 'granted' ? pick() : setAsking(true)),
    node: (
      <>
        <input ref={input} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        {asking && (
          <BottomSheet title="Photo access" onClose={() => setAsking(false)}>
            <PhotoAccessBody onGranted={() => { setAsking(false); pick() }} onCancel={() => setAsking(false)} />
          </BottomSheet>
        )}
      </>
    ),
  }
}
