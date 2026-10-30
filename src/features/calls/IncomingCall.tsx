import { useState } from 'react'
import { useCalls } from '../../state/calls'
import { Avatar } from '../../design/ui'
import { IconCall, IconEndCall, IconVideo } from '../../design/icons'
import { CallAccessSheet } from './CallAccess'
import { modeLabel } from './format'

/** Someone is calling: answer or decline. Microphone access is asked on answering, if needed. */
export function IncomingCall() {
  const c = useCalls()
  const call = c.call!
  const [asking, setAsking] = useState(false)
  const callers = call.participants.filter((p) => !p.isMe && p.state === 'connected')
  const who = call.group ? call.title : (callers[0]?.name ?? call.title)

  return (
    <div className="call call--incoming" role="alertdialog" aria-label={`Incoming ${modeLabel(call.mode, call.group)} from ${who}`}>
      <div className="call__ring">
        <span className="call__pulse" aria-hidden="true" />
        <Avatar name={who} size={120} group={call.group} />
      </div>
      <h2 className="call__title call__title--big">{who}</h2>
      <p className="call__sub">
        Incoming {modeLabel(call.mode, call.group)}
        {call.group && callers[0] && ` · ${callers[0].name.split(' ')[0]}${callers.length > 1 ? ` and ${callers.length - 1} more` : ''} on it`}
      </p>
      <footer className="call__controls call__controls--incoming">
        <button type="button" className="cctl cctl--end" onClick={() => void c.decline()}>
          <span className="cctl__ic"><IconEndCall size={28} /></span><span>Decline</span>
        </button>
        <button type="button" className="cctl cctl--answer" onClick={() => setAsking(true)}>
          <span className="cctl__ic">{call.mode === 'video' ? <IconVideo size={28} /> : <IconCall size={28} />}</span><span>Answer</span>
        </button>
      </footer>
      {asking && <CallAccessSheet mode={call.mode} onGranted={(cam) => { setAsking(false); if (!cam && call.mode === 'video' && c.cameraOn) c.toggleCamera(); void c.answer() }} onCancel={() => setAsking(false)} />}
    </div>
  )
}
