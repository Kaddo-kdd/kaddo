import { useRouter, useRouterState } from '@tanstack/react-router'
import { isNavItemActive } from '../lib/presentation'

type NavItem = { label: string; path: string; icon: string; disabled?: boolean }

const navItems: NavItem[] = [
  { label: 'Overview', path: '/overview', icon: '◎' },
  { label: 'Knowledge', path: '/knowledge', icon: '📚' },
  { label: 'Work Items', path: '/work-items', icon: '📋' },
  { label: 'Initiatives', path: '/initiatives', icon: '🎯' },
  { label: 'System', path: '/system', icon: '⚙' },
  { label: 'Integrations', path: '/integrations', icon: '🔌' },
  { label: 'External Items', path: '/external-items', icon: '🔍' },
]

export function Sidebar({ projectName }: { projectName: string }) {
  const router = useRouter()
  // Subscribe to the location so the active item updates on SPA navigation (not just full loads).
  const currentPath = useRouterState({ select: (s) => s.location.pathname })

  return (
    <aside style={{
      width: 220,
      flexShrink: 0,
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary)' }}>Kaddo Admin</div>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--foreground-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 10 }}>Project</div>
        <div className="font-mono" style={{ fontSize: 12, color: 'var(--foreground-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {projectName}
        </div>
      </div>

      <nav style={{ padding: '8px 0', flex: 1 }}>
        {navItems.map((item) => {
          const active = isNavItemActive(currentPath, item.path)
          return (
            <button
              key={item.path}
              onClick={() => !item.disabled && router.navigate({ to: item.path })}
              disabled={item.disabled}
              aria-current={active ? 'page' : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '10px 16px',
                border: 'none',
                background: active ? 'var(--surface-muted)' : 'transparent',
                color: item.disabled ? 'var(--foreground-muted)' : active ? 'var(--foreground)' : 'var(--foreground-muted)',
                fontSize: 14,
                fontWeight: active ? 600 : 400,
                cursor: item.disabled ? 'default' : 'pointer',
                opacity: item.disabled ? 0.5 : 1,
                textAlign: 'left',
                borderLeft: active ? '3px solid var(--primary)' : '3px solid transparent',
                fontFamily: 'inherit',
              }}
            >
              <span style={{ width: 20, textAlign: 'center' }}>{item.icon}</span>
              <span>{item.label}</span>
              {item.disabled && <span style={{ fontSize: 10, marginLeft: 'auto' }}>Soon</span>}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
