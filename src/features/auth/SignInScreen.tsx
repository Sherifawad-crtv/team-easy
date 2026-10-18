import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, TextField } from '../../design/ui'
import { useSession } from '../../state/session'
import { useSubmit } from '../../state/useSubmit'
import { AuthFrame, ErrorBanner } from './AuthFrame'
import { validate } from './validators'

export function SignInScreen() {
  const navigate = useNavigate()
  const { signIn } = useSession()
  const { busy, error, run } = useSubmit()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [touched, setTouched] = useState(false)

  const errors = { email: validate.email(email), password: validate.currentPassword(password) }

  const submit = async (e?: FormEvent) => {
    e?.preventDefault()
    setTouched(true)
    if (errors.email || errors.password) return
    await run(() => signIn(email.trim(), password))
  }

  return (
    <AuthFrame>
      <h1 className="t-headline">Sign in</h1>
      <form className="stack" style={{ marginTop: 'var(--s-7)' }} onSubmit={submit} noValidate>
        {error != null && <ErrorBanner error={error} onRetry={busy ? undefined : () => void submit()} />}
        <TextField label="Email" type="email" autoComplete="email" inputMode="email" value={email} onChange={setEmail} error={touched ? errors.email : undefined} disabled={busy} />
        <TextField label="Password" password autoComplete="current-password" value={password} onChange={setPassword} error={touched ? errors.password : undefined} disabled={busy} />
        <div style={{ textAlign: 'right' }}>
          <Button variant="tertiary" block={false} onClick={() => navigate('/forgot-password')}>Forgot password?</Button>
        </div>
        <Button type="submit" loading={busy}>Sign in</Button>
        <Button variant="tertiary" onClick={() => navigate('/sign-up', { replace: true })}>New here? Create an account</Button>
      </form>
    </AuthFrame>
  )
}
