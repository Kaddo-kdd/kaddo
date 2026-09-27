type Props = {
  title: string
  description?: string
  icon?: string
  action?: { label: string; onClick: () => void }
}

export function EmptyState({ title, description, icon, action }: Props) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      color: 'var(--foreground-muted)',
      textAlign: 'center',
    }}>
      {icon && <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>}
      <p style={{ fontSize: 16, fontWeight: 600, margin: '0 0 4px' }}>{title}</p>
      {description && <p style={{ fontSize: 14, margin: 0 }}>{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          style={{
            marginTop: 12,
            padding: '6px 14px',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            background: 'var(--surface)',
            cursor: 'pointer',
            fontSize: 13,
            fontFamily: 'inherit',
            color: 'var(--foreground)',
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
