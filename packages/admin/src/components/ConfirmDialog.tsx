import { useEffect, useRef, type ReactNode } from 'react'

type Props = {
  title: string
  children?: ReactNode
  confirmLabel: string
  cancelLabel?: string
  tone?: 'primary' | 'danger'
  onConfirm: () => void
  onCancel: () => void
}

/** A focus-trapping modal used for unsaved-changes, write-conflict and lifecycle-transition prompts. */
export function ConfirmDialog({ title, children, confirmLabel, cancelLabel = 'Cancel', tone = 'primary', onConfirm, onCancel }: Props) {
  const confirmRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    confirmRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
      if (e.key === 'Tab') {
        const focusables = dialogRef.current?.querySelectorAll<HTMLElement>('button')
        if (!focusables || focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  const confirmColor = tone === 'danger' ? 'var(--danger)' : 'var(--primary)'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
    >
      <div ref={dialogRef} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)', padding: 24, maxWidth: 440, width: '100%' }}>
        <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 10px', color: 'var(--foreground)' }}>{title}</h3>
        <div style={{ fontSize: 14, color: 'var(--foreground-muted)', lineHeight: 1.5, marginBottom: 20 }}>{children}</div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '8px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)', color: 'var(--foreground)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>{cancelLabel}</button>
          <button ref={confirmRef} onClick={onConfirm} style={{ padding: '8px 16px', border: `1px solid ${confirmColor}`, borderRadius: 'var(--radius)', background: confirmColor, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
