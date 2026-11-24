import { useState } from 'react'
import { api } from '../../data'
import type { Conversation } from '../../data/types'
import { Avatar, BottomSheet, Button, SettingsGroup, SettingsRow } from '../../design/ui'
import { IconBell, IconBlock, IconCall, IconFlag, IconMegaphone, IconVideo } from '../../design/icons'
import { useCalls } from '../../state/calls'
import { useSubmit } from '../../state/useSubmit'
import { ErrorBanner } from '../auth/AuthFrame'
import { BlockSheet } from '../safety/BlockSheet'
import { ReportSheet } from '../safety/ReportSheet'

const STATUS = { online: 'Online', away: 'Away', offline: 'Offline' } as const

/** Profile info for the other person in a direct chat, or the announcements chat. Opens from the name in the chat header. */
export function ContactSheet({ conversation, onClose }: { conversation: Conversation; onClose: () => void }) {
  const calls = useCalls()
  const direct = conversation.kind === 'direct'
  const [muted, setMuted] = useState(Boolean(conversation.muted))
  const [error, setError] = useState<Error | null>(null)
  const [blocking, setBlocking] = useState(false)
  const [reporting, setReporting] = useState(false)
  const unblock = useSubmit()
  const person = direct ? conversation.memberId : undefined
  const canCall = !conversation.left && !conversation.blocked && conversation.kind !== 'general'
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
        {person && (
          <div className="contact__safety">
            {unblock.error != null && <ErrorBanner error={unblock.error} />}
            <SettingsGroup>
              {conversation.blocked
                ? <SettingsRow icon={<IconBlock size={20} />} title={`Unblock ${conversation.title}`} onClick={() => void unblock.run(() => api.safety.unblock(person))} />
                : <SettingsRow icon={<IconBlock size={20} />} title={`Block ${conversation.title}`} danger onClick={() => setBlocking(true)} />}
              <SettingsRow icon={<IconFlag size={20} />} title={`Report ${conversation.title}`} danger onClick={() => setReporting(true)} />
            </SettingsGroup>
          </div>
        )}
      </div>
      {blocking && person && <BlockSheet userId={person} name={conversation.title} onClose={() => setBlocking(false)} />}
      {reporting && person && <ReportSheet target={{ kind: 'person', userId: person }} subject={conversation.title} canBlock={!conversation.blocked} onClose={() => setReporting(false)} />}
    </BottomSheet>
  )
}
