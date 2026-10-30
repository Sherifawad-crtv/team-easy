import { useEffect, useRef, useState } from 'react'
import { api } from '../../data'
import { useCalls } from '../../state/calls'
import { Button, BottomSheet } from '../../design/ui'
import { describeError, ApiError } from '../../data/errors'
import { ErrorBanner } from '../auth/AuthFrame'
import { CallAccessSheet } from './CallAccess'

/** Between tapping a call button and the call: daily cap check, then permission, then start. */
export function PrepareCall() {
  const { preparing, cancelPrepare, start } = useCalls()
  const [stage, setStage] = useState<'cap' | 'access' | 'starting' | 'error' | null>(null)
  const [error, setError] = useState<unknown>(null)
  const ran = useRef<string | null>(null)

  const key = preparing ? `${preparing.conversationId}:${preparing.mode}` : null
  useEffect(() => {
    if (!preparing) { ran.current = null; setStage(null); return }
    if (ran.current === key) return
    ran.current = key
    let live = true
    void api.calls.usage().then(
      (u) => {
        if (!live) return
        setStage(u.usedSeconds >= u.capSeconds ? 'cap' : 'access')
      },
      (e: unknown) => { if (live) { setError(e); setStage('error') } },
    )
    return () => { live = false }
  }, [key, preparing])

  if (!preparing || !stage) return null
  const go = async (cameraOn: boolean) => {
    setStage('starting')
    try {
      await start(preparing.conversationId, preparing.mode, { cameraOn })
    } catch (e) {
      setError(e)
      setStage(e instanceof ApiError && e.code === 'call_cap_reached' ? 'cap' : 'error')
    }
  }

  if (stage === 'access') return <CallAccessSheet mode={preparing.mode} onGranted={(c) => void go(c)} onCancel={cancelPrepare} />
  if (stage === 'starting') return <div className="call-wait" role="status"><span className="spinner" aria-hidden="true" /> Calling…</div>
  if (stage === 'cap') {
    return (
      <BottomSheet title="No calling time left" onClose={cancelPrepare}>
        <div className="stack">
          <p className="t-body-sm muted">{describeError(new ApiError('call_cap_reached')).body} You can still send messages.</p>
          <Button onClick={cancelPrepare}>OK</Button>
        </div>
      </BottomSheet>
    )
  }
  return (
    <BottomSheet title="Couldn't start the call" onClose={cancelPrepare}>
      <div className="stack">
        <ErrorBanner error={error} onRetry={() => { ran.current = null; setStage('access') }} />
        <Button variant="tertiary" onClick={cancelPrepare}>Cancel</Button>
      </div>
    </BottomSheet>
  )
}
