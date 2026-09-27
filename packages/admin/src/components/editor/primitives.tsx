import type { ReactNode } from 'react'

export const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  background: 'var(--surface)',
  color: 'var(--foreground)',
  fontSize: 14,
  fontFamily: 'inherit',
  boxSizing: 'border-box' as const,
}

export function Labeled({ label, hint, htmlFor, children }: { label: string; hint?: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label htmlFor={htmlFor} style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--foreground)' }}>{label}</label>
      {hint && <p style={{ fontSize: 12, color: 'var(--foreground-muted)', margin: '0 0 6px' }}>{hint}</p>}
      {children}
    </div>
  )
}

export function TextField({ id, label, hint, value, onChange, placeholder }: {
  id: string; label: string; hint?: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <Labeled label={label} hint={hint} htmlFor={id}>
      <input id={id} type="text" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} style={inputStyle} />
    </Labeled>
  )
}

export function TextArea({ id, label, hint, value, onChange, placeholder, rows = 3 }: {
  id: string; label: string; hint?: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number
}) {
  return (
    <Labeled label={label} hint={hint} htmlFor={id}>
      <textarea id={id} value={value} placeholder={placeholder} rows={rows} onChange={(e) => onChange(e.target.value)} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
    </Labeled>
  )
}

export function SelectField({ id, label, hint, value, onChange, options }: {
  id: string; label: string; hint?: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]
}) {
  return (
    <Labeled label={label} hint={hint} htmlFor={id}>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Labeled>
  )
}

export const btnStyle: React.CSSProperties = { padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)', color: 'var(--foreground)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }
export const primaryBtnStyle: React.CSSProperties = { ...btnStyle, background: 'var(--primary)', color: 'var(--primary-foreground, #fff)', fontWeight: 600 }
export const dangerBtnStyle: React.CSSProperties = { ...btnStyle, color: 'var(--danger)', borderColor: 'var(--danger)' }

export function SecondaryButton({ children, onClick, disabled }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: '8px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)',
      color: 'var(--foreground)', cursor: disabled ? 'default' : 'pointer', fontSize: 13, fontFamily: 'inherit', opacity: disabled ? 0.5 : 1,
    }}>{children}</button>
  )
}

export function PrimaryButton({ children, onClick, disabled }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: '8px 16px', border: '1px solid var(--primary)', borderRadius: 'var(--radius)', background: 'var(--primary)',
      color: 'var(--primary-foreground)', cursor: disabled ? 'default' : 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', opacity: disabled ? 0.5 : 1,
    }}>{children}</button>
  )
}

export function DangerButton({ children, onClick, disabled }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...dangerBtnStyle, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1,
    }}>{children}</button>
  )
}
