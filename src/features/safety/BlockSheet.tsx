import { api } from '../../data'
import { BottomSheet, Button } from '../../design/ui'
import { haptic } from '../../design/haptics'
import { track } from '../../analytics'
import { useSubmit } from '../../state/useSubmit'
import { ErrorBanner } from '../auth/AuthFrame'

/** Confirm blocking someone. Blocked people can't message or call you, and they aren't told. */
export function BlockSheet({ userId, name, onClose }: { userId: string; name: string; onClose: () => void }) {
  const block = useSubmit()
  return (
    <BottomSheet title={`Block ${name}?`} onClose={onClose}>
      <div className="stack">
        {block.error != null && <ErrorBanner error={block.error} />}
        <p className="t-body-sm">{name} won't be able to message or call you. They aren't told that you blocked them. You can unblock {name} at any time in Privacy, Blocked contacts.</p>
        <Button variant="destructive" loading={block.busy} onClick={async () => {
          if (await block.run(() => api.safety.block(userId))) { haptic('warning'); track('person_blocked'); onClose() }
        }}>{block.error != null ? 'Try again' : 'Block'}</Button>
        <Button variant="tertiary" onClick={onClose} disabled={block.busy}>Cancel</Button>
      </div>
    </BottomSheet>
  )
}
