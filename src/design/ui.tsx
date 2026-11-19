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

export function BackButton({ onClick, label = 'Back', animated = true }: { onClick: () => void; label?: string; animated?: boolean }) {
  return (
    <IconButton label={label} onClick={animated ? () => animateNav('pop', onClick) : onClick}>
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
  // A wrong field gives a small shake when its error appears or changes.
  const control = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = control.current
    if (!error || !el) return
    el.classList.remove('is-shaking')
    void el.offsetWidth
    el.classList.add('is-shaking')
  }, [error])
  return (
    <div className={`field${error ? ' field--error' : ''}`}>
      <label className="field__label" htmlFor={inputId}>{label}</label>
      <div className="field__control" ref={control}>
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

export function Badge({ count, muted = false, dot = false }: { count: number; muted?: boolean; dot?: boolean }) {
  if (count <= 0) return dot ? <span className={`badge badge--dot${muted ? ' badge--muted' : ''}`} role="img" aria-label="Marked as unread" /> : null
  return <span key={count} className={`badge${muted ? ' badge--muted' : ''}`} aria-label={`${count} unread`}>{count > 99 ? '99+' : count}</span>
}

/* ---------- Logo ---------- */

export function Logo({ size = 64, label }: { size?: number; label?: string }) {
  return <img src="/brand/t_logo.png" width={size} height={size} alt={label ?? ''} aria-hidden={label ? undefined : true} />
}

/* ---------- Bottom sheet ---------- */

export function BottomSheet({ title, onClose, children, detents = false }: { title: string; onClose: () => void; children: ReactNode; detents?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const backdrop = useRef<HTMLDivElement>(null)
  const phone = useMedia('(max-width: 1023.98px)')
  const draggable = phone
  // On phones in motion style B a sheet can be dragged down, and between two heights when it has them.
  const closeNicely = useSheetDrag({ sheet: ref, backdrop, enabled: draggable, detents, onClose })
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    ref.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeNicely()
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      prev?.focus?.()
    }
  }, [closeNicely])
  return (
    <div className="sheet-backdrop" ref={backdrop} onMouseDown={(e) => e.target === e.currentTarget && closeNicely()}>
      <div className={`sheet${draggable && detents ? ' sheet--detents' : ''}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}>
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

/* ---------- Segmented control ---------- */

/** Two or three options in one pill, with a highlight that slides to the one you pick. */
export function Segmented<T extends string | number>({ label, options, value, onChange }: { label: string; options: { id: T; label: string }[]; value: T; onChange: (id: T) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useSlide(ref, value)
  return (
    <div className="seg" role="group" aria-label={label} ref={ref} data-slide style={{ alignSelf: 'flex-start' }}>
      {options.map((o) => (
        <button key={String(o.id)} type="button" aria-pressed={o.id === value} onClick={() => { haptic('selection'); onChange(o.id) }}>{o.label}</button>
      ))}
    </div>
  )
}

/* ---------- Switch ---------- */

/** An on/off setting row control. The label comes from `label` for screen readers. */
import { useMedia } from '../state/useMedia'
import { animateNav } from './nav'
import { useSheetDrag } from './useSheetDrag'
import { useSlide } from './useSlide'
import { haptic } from './haptics'

export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (next: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} className="switch" onClick={() => { haptic('selection'); onChange(!checked) }}>
      <span className="switch__thumb" />
    </button>
  )
}
