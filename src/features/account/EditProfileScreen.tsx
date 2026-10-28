import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar, Banner, BackButton, Button, TextField } from '../../design/ui'
import { IconCamera } from '../../design/icons'
import { ApiError } from '../../data/errors'
import { useSession } from '../../state/session'
import { useSubmit } from '../../state/useSubmit'
import { ErrorBanner } from '../auth/AuthFrame'
import { validate } from '../auth/validators'
import { toAvatarDataUrl } from '../media/image'
import { usePhotoChooser } from '../media/PhotoAccess'

/** Edit name, email, job title and photo (PRF-01). */
export function EditProfileScreen() {
  const { account, updateProfile } = useSession()
  const navigate = useNavigate()
  const { busy, error, run, reset } = useSubmit()
  const [name, setName] = useState(account?.name ?? '')
  const [email, setEmail] = useState(account?.email ?? '')
  const [jobTitle, setJobTitle] = useState(account?.jobTitle ?? '')
  const [photo, setPhoto] = useState<string | null | undefined>(undefined) // undefined = unchanged, null = removed
  const [touched, setTouched] = useState(false)
  const [saved, setSaved] = useState(false)
  const [photoError, setPhotoError] = useState(false)

  const chooser = usePhotoChooser((file) => {
    setPhotoError(false)
    toAvatarDataUrl(file).then(setPhoto, () => setPhotoError(true))
  })

  useEffect(() => { if (saved) { const t = window.setTimeout(() => setSaved(false), 3500); return () => window.clearTimeout(t) } }, [saved])

  if (!account) return null
  const currentPhoto = photo === undefined ? account.photoUrl : (photo ?? undefined)
  const errors = { name: validate.name(name), email: validate.email(email) }
  const dirty = name.trim() !== account.name || email.trim() !== account.email || jobTitle.trim() !== (account.jobTitle ?? '') || photo !== undefined
  const emailTaken = error instanceof ApiError && error.code === 'email_taken'

  const submit = async (e?: FormEvent) => {
    e?.preventDefault()
    setTouched(true)
    if (errors.name || errors.email) return
    const ok = await run(() =>
      updateProfile({
        name: name.trim(),
        email: email.trim(),
        jobTitle: jobTitle.trim(),
        ...(photo === undefined ? {} : { photoUrl: photo }),
      }),
    )
    if (ok) { setSaved(true); setPhoto(undefined) }
  }

  return (
    <main className="page surface fade-in">
      <header className="bar bar--back">
        <BackButton onClick={() => navigate('/account')} />
        <h1 className="bar__title">Edit profile</h1>
      </header>
      <form className="page__body stack-lg" onSubmit={submit} noValidate>
        {saved && <Banner kind="success" title="Profile updated" />}
        {error != null && !emailTaken && <ErrorBanner error={error} onRetry={busy ? undefined : () => void submit()} />}

        <div style={{ textAlign: 'center' }}>
          <button type="button" className="photo-btn" aria-label="Change profile photo" onClick={chooser.open} disabled={busy}>
            <Avatar name={name} src={currentPhoto} size={96} />
            <span className="photo-btn__badge"><IconCamera size={16} /></span>
          </button>
          <div style={{ marginTop: 'var(--s-3)' }}>
            {currentPhoto ? <Button variant="tertiary" block={false} onClick={() => setPhoto(null)} disabled={busy}>Remove photo</Button> : <p className="t-caption muted">Add a photo (optional)</p>}
            {photoError && <p className="t-caption" style={{ color: 'var(--error)' }}>That image could not be used. Try another.</p>}
          </div>
          {chooser.node}
        </div>

        <TextField label="Full name" autoComplete="name" autoCapitalize="words" value={name} onChange={(v) => { setName(v); reset() }} error={touched ? errors.name : undefined} disabled={busy} />
        <TextField
          label="Email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(v) => { setEmail(v); reset() }}
          error={emailTaken ? 'That email already has an account.' : touched ? errors.email : undefined} disabled={busy}
        />
        <TextField label="Job title (optional)" autoComplete="organization-title" autoCapitalize="words" value={jobTitle} onChange={setJobTitle} disabled={busy} />

        <Button type="submit" loading={busy} disabled={!dirty}>Save changes</Button>
      </form>
    </main>
  )
}
