import type { ReactNode } from 'react'

type Props = {
  title: string
  value: string | number
  subtitle?: string
  icon?: ReactNode
}

export function SummaryCard({ title, value, subtitle, icon }: Props) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '16px 18px',
      boxShadow: 'var(--shadow-sm)',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
    }}>
      {icon && <div style={{ fontSize: 22, flexShrink: 0 }}>{icon}</div>}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--foreground-muted)', textTransform: 'uppercase', letterSpacing: 0.3 }}>
          {title}
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--foreground)', marginTop: 2 }}>
          {value}
        </div>
        {subtitle && (
          <div style={{ fontSize: 12, color: 'var(--foreground-muted)', marginTop: 2 }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  )
}
