import { useNavigate } from 'react-router-dom'
import { useCalls } from '../../state/calls'
import { Button, BottomSheet } from '../../design/ui'
import { IconCall } from '../../design/icons'
import { InCall } from './InCall'
import { IncomingCall } from './IncomingCall'
import { PrepareCall } from './PrepareCall'
import { clock, endedText, minutes, modeLabel } from './format'

/** Everything a call puts on screen, drawn above the app. */
export function CallOverlay() {
  const c = useCalls()
  const navigate = useNavigate()
  const { call, incoming, minimized, ended } = c

  return (
    <>
      <PrepareCall />
      {call && incoming && <IncomingCall />}
      {call && !incoming && !minimized && <InCall />}
      {call && !incoming && minimized && (
        <button type="button" className="callbar" onClick={() => c.setMinimized(false)} aria-label={`Return to call with ${call.title}`}>
          <IconCall size={18} />
          <span className="callbar__text">{call.title}</span>
          <span className="callbar__time">{call.startedAt ? clock(c.elapsed) : 'Ringing…'}</span>
        </button>
      )}
      {ended && !call && (
        <BottomSheet title={endedText(ended.reason, ended.mode).title} onClose={c.dismissEnded}>
          <div className="stack">
            {endedText(ended.reason, ended.mode).body && <p className="t-body-sm muted">{endedText(ended.reason, ended.mode).body}</p>}
            {ended.seconds > 0 && <p className="t-body-sm"><strong>{ended.title}</strong> · {modeLabel(ended.mode, false)} · {minutes(ended.seconds)} ({clock(ended.seconds)})</p>}
            {ended.reason !== 'cap_reached' && (
              <Button onClick={() => { const e = ended; c.dismissEnded(); c.begin(e.conversationId, e.mode) }}>Call again</Button>
            )}
            {(ended.reason === 'no_answer' || ended.reason === 'declined') && (
              <Button variant="secondary" onClick={() => { const id = ended.conversationId; c.dismissEnded(); navigate(`/chats/${id}`) }}>Send a message</Button>
            )}
            <Button variant="tertiary" onClick={c.dismissEnded}>Close</Button>
          </div>
        </BottomSheet>
      )}
    </>
  )
}
