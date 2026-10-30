import { useCalls } from '../../state/calls'
import type { CallParticipant } from '../../data/types'
import { LIMITS } from '../../config/limits'
import { Avatar, Banner } from '../../design/ui'
import { IconChevronDown, IconEndCall, IconMic, IconSpeaker, IconVideo, IconVideoOff } from '../../design/icons'
import { capWarning, clock, modeLabel, participantStatus } from './format'

function Tile({ p, video, solo }: { p: CallParticipant; video: boolean; solo: boolean }) {
  const dim = p.state !== 'connected'
  return (
    <div className={`ctile${p.speaking ? ' is-speaking' : ''}${dim ? ' is-dim' : ''}${video && p.cameraOn && !dim ? ' has-video' : ''}${solo ? ' ctile--solo' : ''}`}>
      <Avatar name={p.name} size={solo ? 120 : 72} />
      <span className="ctile__name">{p.isMe ? 'You' : p.name}</span>
      <span className="ctile__status">{p.isMe && p.muted ? 'Muted' : participantStatus(p)}</span>
      {video && p.state === 'connected' && !p.cameraOn && <span className="ctile__cam"><IconVideoOff size={16} /> Camera off</span>}
    </div>
  )
}

/** The call screen: who is on it, how long, and the controls (CLL-01..05). */
export function InCall() {
  const c = useCalls()
  const call = c.call!
  const video = call.mode === 'video'
  const mine = call.participants.find((p) => p.isMe)!
  const others = call.participants.filter((p) => !p.isMe)
  const self: CallParticipant = { ...mine, muted: c.muted, cameraOn: c.cameraOn }
  const connected = others.filter((p) => p.state === 'connected').length
  const status = call.startedAt ? clock(c.elapsed) : call.direction === 'incoming' ? 'Connecting…' : 'Ringing…'
  const warning = call.startedAt ? capWarning(c.remaining) : null
  const oneToOne = !call.group

  return (
    <div className="call" role="dialog" aria-label={`${modeLabel(call.mode, call.group)} with ${call.title}`}>
      <header className="call__top">
        <button type="button" className="call__min" aria-label="Minimize call" onClick={() => c.setMinimized(true)}><IconChevronDown size={26} /></button>
        <div className="call__who">
          <h2 className="call__title">{call.title}</h2>
          <p className="call__sub" role="timer" aria-live="off">
            {status}{call.group && ` · ${connected + 1} of ${LIMITS.maxCallParticipants}`}
          </p>
        </div>
      </header>

      {warning && <div className="call__warn"><Banner kind="offline">{warning}</Banner></div>}

      {oneToOne ? (
        <div className="call__stage">
          <Tile p={others[0]} video={video} solo />
          {video && <div className="call__self"><Tile p={self} video solo={false} /></div>}
        </div>
      ) : (
        <div className={`call__grid call__grid--${others.length + 1}`}>
          {[self, ...others].map((p) => <Tile key={p.id} p={p} video={video} solo={false} />)}
        </div>
      )}

      <footer className="call__controls">
        <button type="button" className={`cctl${c.muted ? ' is-on' : ''}`} aria-pressed={c.muted} onClick={c.toggleMute}>
          <span className={`cctl__ic${c.muted ? ' is-slashed' : ''}`}><IconMic size={26} /></span>
          <span>{c.muted ? 'Unmute' : 'Mute'}</span>
        </button>
        {video && (
          <button type="button" className={`cctl${!c.cameraOn ? ' is-on' : ''}`} aria-pressed={!c.cameraOn} onClick={c.toggleCamera}>
            <span className="cctl__ic">{c.cameraOn ? <IconVideo size={26} /> : <IconVideoOff size={26} />}</span>
            <span>{c.cameraOn ? 'Camera' : 'Camera off'}</span>
          </button>
        )}
        <button type="button" className={`cctl${c.speaker ? ' is-on' : ''}`} aria-pressed={c.speaker} onClick={c.toggleSpeaker}>
          <span className="cctl__ic"><IconSpeaker size={26} /></span>
          <span>Speaker</span>
        </button>
        <button type="button" className="cctl cctl--end" onClick={() => void c.hangUp()}>
          <span className="cctl__ic"><IconEndCall size={28} /></span>
          <span>End</span>
        </button>
      </footer>
    </div>
  )
}
