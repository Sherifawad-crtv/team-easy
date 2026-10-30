import type { Conversation } from '../../data/types'
import { IconButton } from '../../design/ui'
import { IconCall, IconVideo } from '../../design/icons'
import { useCalls } from '../../state/calls'

/** Audio and video call buttons for a chat header (CLL-01..04). Not in announcement chats or groups you left. */
export function CallButtons({ conversation }: { conversation: Conversation }) {
  const c = useCalls()
  if (conversation.kind === 'general' || conversation.left) return null
  const busy = Boolean(c.call)
  const what = conversation.kind === 'direct' ? conversation.title : `${conversation.title} group`
  return (
    <span className="convo__calls">
      <IconButton label={`Video call ${what}`} disabled={busy} onClick={() => c.begin(conversation.id, 'video')}><IconVideo size={24} /></IconButton>
      <IconButton label={`Audio call ${what}`} disabled={busy} onClick={() => c.begin(conversation.id, 'audio')}><IconCall size={22} /></IconButton>
    </span>
  )
}
