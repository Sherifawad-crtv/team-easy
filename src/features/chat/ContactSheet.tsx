import { useState } from 'react'
import { api } from '../../data'
import type { Conversation } from '../../data/types'
import { Avatar, BottomSheet, Button } from '../../design/ui'
import { IconBell, IconCall, IconMegaphone, IconVideo } from '../../design/icons'
import { useCalls } from '../../state/calls'
import { ErrorBanner } from '../auth/AuthFrame'

const STATUS = { online: 'Online', away: 'Away', offline: 'Offline' } as const

/** Profile info for the other person in a direct chat, or the announcements chat. Opens from the name in the chat header. */
export function ContactSheet({ conversation, onClose }: { conversation: Conversation; onClose: () => void }) {
  const calls = useCalls()
  const direct = conversation.kind === 'direct'
  const [muted, setMuted] = useState(Boolean(conversation.muted))
  const [error, setError] = useState<Error | null>(null)
  const canCall = !conversation.left && conversation.kind !== 'general'
  const toggleMute = () => {
    setError(null)
    const next = !muted
    setMuted(next)
    api.chat.setMuted(conversation.id, next).catch((e: Error) => { setMuted(!next); setError(e) })
  }
  const call = (kind: 'audio' | 'video') => { onClose(); calls.begin(conversation.id, kind) }
  return (
    <BottomSheet title={direct ? 'Contact info' : 'Announcements'} onClose={onClose}>
      <div className="contact">
        <Avatar name={conversation.title} size={96} group={!direct} presence={direct ? conversation.presence : undefined} icon={conversation.kind === 'general' ? <IconMegaphone size={40} /> : undefined} tone={conversation.kind === 'general' ? 0 : undefined} />
        <h3 className="t-title contact__name">{conversation.title}</h3>
        {conversation.jobTitle && <p className="t-body">{conversation.jobTitle}</p>}
        <p className="t-caption muted">
          {direct ? STATUS[conversation.presence ?? 'offline'] : `${conversation.memberCount ?? ''} members · Only admins can post`}
        </p>
        {error && <ErrorBanner error={error} onRetry={toggleMute} />}
        <div className="contact__actions">
          {canCall && <Button variant="secondary" block={false} disabled={Boolean(calls.call)} onClick={() => call('audio')}><IconCall size={20} /> Audio</Button>}
          {canCall && <Button variant="secondary" block={false} disabled={Boolean(calls.call)} onClick={() => call('video')}><IconVideo size={20} /> Video</Button>}
          <Button variant="secondary" block={false} onClick={toggleMute} aria-pressed={muted}><IconBell size={20} /> {muted ? 'Unmute' : 'Mute'}</Button>
        </div>
      </div>
    </BottomSheet>
  )
}
