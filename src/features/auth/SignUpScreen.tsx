import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../../data'
import { Avatar, Banner, Button, TextField } from '../../design/ui'
import { IconCamera, IconClose } from '../../design/icons'
import { toAvatarDataUrl } from '../media/image'
import { usePhotoChooser } from '../media/PhotoAccess'
import { track } from '../../experiments/analytics'
import { useAsync } from '../../state/useAsync'
import { useSession } from '../../state/session'
import { useSubmit } from '../../state/useSubmit'
import { ApiError } from '../../data/errors'
import { AuthFrame, ErrorBanner } from './AuthFrame'
import { validate } from './validators'
import { useEffect } from 'react'

/**
 * Create an account. Covers all three signup paths (ACC-02..04): on your own,
 * on your own with an optional invite code, or arriving from an invite link.
 */
export function SignUpScreen() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const linkToken = params.get('invite')
  const { signUp } = useSession()
  const { busy, error, run } = useSubmit()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [invite, setInvite] = useState('')
  const [showInvite, setShowInvite] = useState(false)
  const [photoUrl, setPhotoUrl] = useState<string | undefined>()
  const hasPhoto = Boolean(photoUrl)
  const chooser = usePhotoChooser((file) => { toAvatarDataUrl(file).then(setPhotoUrl, () => undefined) })
  const [touched, setTouched] = useState(false)

  useEffect(() => track('signup_started', { via_invite_link: Boolean(linkToken) }), [linkToken])

  const linked = useAsync(() => (linkToken ? api.auth.resolveInvite(linkToken) : Promise.resolve(null)), [linkToken])

  const errors = { name: validate.name(name), email: validate.email(email), password: validate.newPassword(password) }
  const code = error instanceof ApiError ? error.code : undefined
  const emailTaken = code === 'email_taken'
  const inviteProblem = code === 'invite_invalid' || code === 'invite_expired'

  const submit = async (e?: FormEvent) => {
    e?.preventDefault()
    setTouched(true)
    if (errors.name || errors.email || errors.password) return
    await run(() =>
      signUp({
        name: name.trim(),
        email: email.trim(),
        password,
        jobTitle: jobTitle.trim() || undefined,
        hasPhoto,
        photoUrl,
        inviteToken: linkToken ?? (invite.trim() || undefined),
      }),
    )
  }

  return (
    <AuthFrame>
      <h1 className="t-headline">Create your account</h1>
      <form className="stack" style={{ marginTop: 'var(--s-7)' }} onSubmit={submit} noValidate>
        {linkToken && linked.status === 'ready' && linked.data && (
          <Banner kind="success" title={`Joining ${linked.data.organization.name}`}>Invited by {linked.data.invitedBy}</Banner>
        )}
        {linkToken && linked.status === 'error' && (
          <Banner kind="error" title="This invite isn't valid">
            You can still create an account on your own and ask your admin for a new invite.
          </Banner>
        )}
        {error != null && !emailTaken && !inviteProblem && <ErrorBanner error={error} onRetry={busy ? undefined : () => void submit()} />}

        <div style={{ textAlign: 'center' }}>
          <button
            type="button"
            className="icon-btn"
            style={{ width: 'auto', height: 'auto', position: 'relative' }}
            aria-label={hasPhoto ? 'Remove profile photo' : 'Add a profile photo, optional'}
            onClick={() => (hasPhoto ? setPhotoUrl(undefined) : chooser.open())}
            disabled={busy}
          >
            <Avatar name={name} src={photoUrl} size={88} />
            <span style={{ position: 'absolute', right: 0, bottom: 0, width: 28, height: 28, borderRadius: '50%', background: 'var(--action)', color: 'var(--on-action)', display: 'grid', placeItems: 'center', border: '2px solid var(--bg)' }}>
              {hasPhoto ? <IconClose size={16} /> : <IconCamera size={16} />}
            </span>
          </button>
          <p className="t-caption muted" style={{ marginTop: 'var(--s-3)' }}>{hasPhoto ? 'Tap to remove' : 'Add a photo (optional)'}</p>
        </div>

        {chooser.node}
        <TextField label="Full name" autoComplete="name" autoCapitalize="words" value={name} onChange={setName} error={touched ? errors.name : undefined} disabled={busy} />
        <TextField
          label="Email" type="email" autoComplete="email" inputMode="email" value={email} onChange={setEmail}
          error={emailTaken ? 'That email already has an account. Sign in instead.' : touched ? errors.email : undefined}
          disabled={busy}
        />
        <TextField label="Password" password autoComplete="new-password" value={password} onChange={setPassword} error={touched ? errors.password : undefined} hint="At least 8 characters, with a letter and a number" disabled={busy} />
        <TextField label="Job title (optional)" autoComplete="organization-title" autoCapitalize="words" value={jobTitle} onChange={setJobTitle} disabled={busy} />

        {!linkToken &&
          (showInvite || inviteProblem ? (
            <TextField
              label="Organization invite code" value={invite} onChange={setInvite} autoCapitalize="characters" disabled={busy}
              error={code === 'invite_expired' ? 'That invite has expired. Ask your admin for a new one.' : code === 'invite_invalid' ? "That invite isn't valid. Check the code." : undefined}
            />
          ) : (
            <Button variant="tertiary" block={false} onClick={() => setShowInvite(true)} disabled={busy}>I have an organization invite</Button>
          ))}

        <Button type="submit" loading={busy}>Create account</Button>
        <Button variant="tertiary" onClick={() => navigate('/sign-in', { replace: true })}>Already have an account? Sign in</Button>
      </form>
    </AuthFrame>
  )
}
