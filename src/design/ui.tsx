import { useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react'
import { IconAlert, IconBack, IconCheckCircle, IconEye, IconEyeOff, IconInfo, IconUser, IconWifiOff } from './icons'

/* ---------- Button ---------- */

type Variant = 'primary' | 'secondary' | 'outlined' | 'tertiary' | 'destructive'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  loading?: boolean
  block?: boolean
}

export function Button({ variant = 'primary', loading = false, block = true, className = '', children, disabled, onClick, ...rest }: ButtonProps) {
  const cls = ['btn', variant !== 'primary' && `btn--${variant}`, block && 'btn--block', className].filter(Boolean).join(' ')
  return (
    <button
      type="button"
      className={cls}
      disabled={disabled}
      aria-busy={loading || undefined}
      // Keep the enabled look while loading but ignore taps.
      onClick={loading ? undefined : onClick}
      {...rest}
    >
      {loading ? <span className="spinner" role="status" aria-label="Loading" /> : children}
    </button>
  )
}

export function IconButton({ label, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button type="button" className="icon-btn" aria-label={label} {...rest}>
      {children}
    </button>
  )
}

export function BackButton({ onClick, label = 'Back' }: { onClick: () => void; label?: string }) {
  return (
    <IconButton label={label} onClick={onClick}>
      <IconBack />
    </IconButton>
  )
}

/* ---------- TextField ---------- */

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  hint?: string
  password?: boolean
}

export function TextField({ label, value, onChange, error, hint, password = false, id, ...rest }: TextFieldProps) {
  const auto = useId()
  const inputId = id ?? auto
  const [hidden, setHidden] = useState(true)
  const describedBy = error ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined
  return (
    <div className={`field${error ? ' field--error' : ''}`}>
      <label className="field__label" htmlFor={inputId}>{label}</label>
      <div className="field__control">
        <input
          id={inputId}
          className={`field__input${password ? ' field__input--pw' : ''}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          type={password && hidden ? 'password' : password ? 'text' : (rest.type ?? 'text')}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...rest}
        />
        {password && (
          <button type="button" className="icon-btn field__toggle" aria-label={hidden ? 'Show password' : 'Hide password'} onClick={() => setHidden((h) => !h)}>
            {hidden ? <IconEye size={20} /> : <IconEyeOff size={20} />}
          </button>
        )}
      </div>
      {error ? <p id={`${inputId}-err`} className="field__error" role="alert">{error}</p> : hint ? <p id={`${inputId}-hint`} className="field__hint">{hint}</p> : null}
    </div>
  )
}

/* ---------- Banner ---------- */

export type BannerKind = 'error' | 'offline' | 'info' | 'success'

export function Banner({ kind = 'info', title, children, actionLabel, onAction }: { kind?: BannerKind; title?: string; children?: ReactNode; actionLabel?: string; onAction?: () => void }) {
  const Icon = { error: IconAlert, offline: IconWifiOff, info: IconInfo, success: IconCheckCircle }[kind]
  return (
    <div className={`banner banner--${kind}`} role={kind === 'error' || kind === 'offline' ? 'alert' : 'status'}>
      <span className="banner__icon"><Icon size={22} /></span>
      <div className="banner__body">
        {title && <p className="banner__title">{title}</p>}
        {children && <p className="banner__text">{children}</p>}
        {actionLabel && <button type="button" className="banner__action" onClick={onAction}>{actionLabel}</button>}
      </div>
    </div>
  )
}

/* ---------- Avatar ---------- */

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = Array.from(parts[0])[0] ?? '?'
  const last = parts.length > 1 ? (Array.from(parts[parts.length - 1])[0] ?? '') : ''
  return (first + last).toUpperCase()
}

/** Stable tone (0 to 4) from a name, so the same person always gets the same color. */
export function toneFor(name: string): number {
  let n = 0
  for (const ch of name) n = (n * 31 + ch.codePointAt(0)!) >>> 0
  return n % 5
}

export function Avatar({ name, size = 48, group = false, presence, icon, tone, src }: { name: string; size?: number; group?: boolean; presence?: 'online' | 'away' | 'offline'; icon?: ReactNode; tone?: number; src?: string }) {
  return (
    <span className={`avatar avatar--t${tone ?? toneFor(name)}${group ? ' avatar--group' : ''}`} style={{ ['--size' as string]: `${size}px` }} role="img" aria-label={name || 'Profile photo'}>
      {src ? <img className="avatar__img" src={src} alt="" /> : (icon ?? (name.trim() ? initials(name) : <IconUser size={Math.round(size * 0.5)} />))}
      {presence && presence !== 'offline' && <span className={`avatar__dot${presence === 'away' ? ' avatar__dot--away' : ''}`} />}
    </span>
  )
}

export function Badge({ count, muted = false }: { count: number; muted?: boolean }) {
  if (count <= 0) return null
  return <span className={`badge${muted ? ' badge--muted' : ''}`} aria-label={`${count} unread`}>{count > 99 ? '99+' : count}</span>
}

/* ---------- Logo ---------- */

export function Logo({ size = 64, label }: { size?: number; label?: string }) {
  return <img src="/brand/t_logo.png" width={size} height={size} alt={label ?? ''} aria-hidden={label ? undefined : true} />
}

/* ---------- Bottom sheet ---------- */

export function BottomSheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    ref.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      prev?.focus?.()
    }
  }, [onClose])
  return (
    <div className="sheet-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}>
        <div className="sheet__handle" />
        <h2 className="t-title sheet__title">{title}</h2>
        {children}
      </div>
    </div>
  )
}

/* ---------- Skeleton ---------- */

export function Skeleton({ width = '100%', height = 16, radius }: { width?: number | string; height?: number; radius?: number | string }) {
  return <div className="skeleton" style={{ width, height, borderRadius: radius }} aria-hidden="true" />
}

/* ---------- Offline hook ---------- */

export function useOnline(): boolean {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine))
  useEffect(() => {
    const up = () => setOnline(true)
    const down = () => setOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    return () => {
      window.removeEventListener('online', up)
      window.removeEventListener('offline', down)
    }
  }, [])
  return online
}

/* ---------- Snackbar ---------- */

/** A short-lived message with one action, e.g. Undo. The bar shows how long is left. */
export function Snackbar({ message, actionLabel, onAction, durationMs, onDone }: { message: string; actionLabel: string; onAction: () => void; durationMs: number; onDone: () => void }) {
  useEffect(() => {
    const t = window.setTimeout(onDone, durationMs)
    return () => window.clearTimeout(t)
  }, [durationMs, onDone])
  return (
    <div className="snackbar" role="status" aria-live="polite">
      <span className="snackbar__text">{message}</span>
      <button type="button" className="snackbar__action" onClick={onAction}>{actionLabel}</button>
      <span className="snackbar__timer" style={{ animationDuration: `${durationMs}ms` }} aria-hidden="true" />
    </div>
  )
}

/* ---------- Switch ---------- */

/** An on/off setting row control. The label comes from `label` for screen readers. */
export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (next: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} className="switch" onClick={() => onChange(!checked)}>
      <span className="switch__thumb" />
    </button>
  )
}
