import { useRouter, useRouterState } from '@tanstack/react-router'
import {
  ArchiveX,
  BookOpen,
  ClipboardList,
  Database,
  FileBarChart,
  LayoutDashboard,
  Plug,
  Search,
  Settings,
  Target,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { isNavItemActive } from '../lib/presentation'

type NavItem = { label: string; path: string; icon: LucideIcon; disabled?: boolean }
type ThemePreference = 'light' | 'dark' | 'system'

function parseThemePreference(value: string | null): ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system'
}

function resolveTheme(preference: ThemePreference): 'light' | 'dark' {
  return preference === 'dark' ||
    (preference === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches)
    ? 'dark'
    : 'light'
}

const navItems: NavItem[] = [
  { label: 'Overview', path: '/overview', icon: LayoutDashboard },
  { label: 'Knowledge', path: '/knowledge', icon: BookOpen },
  { label: 'Work Items', path: '/work-items', icon: ClipboardList },
  { label: 'Initiatives', path: '/initiatives', icon: Target },
  { label: 'Resources', path: '/resources', icon: Database },
  { label: 'Deprecations', path: '/deprecations', icon: ArchiveX },
  { label: 'System', path: '/system', icon: Settings },
  { label: 'Reports', path: '/reports', icon: FileBarChart },
  { label: 'Integrations', path: '/integrations', icon: Plug },
  { label: 'External Items', path: '/external-items', icon: Search },
]

export function Sidebar({ projectName }: { projectName: string }) {
  const router = useRouter()
  const [theme, setTheme] = useState<ThemePreference>(() =>
    parseThemePreference(window.localStorage.getItem('kaddo-admin-theme')),
  )
  // Subscribe to the location so the active item updates on SPA navigation (not just full loads).
  const currentPath = useRouterState({ select: (s) => s.location.pathname })

  useEffect(() => {
    const applyTheme = () => {
      document.documentElement.dataset.theme = resolveTheme(theme)
    }
    applyTheme()
    window.localStorage.setItem('kaddo-admin-theme', theme)
    const media = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (theme !== 'system' || !media) return
    media.addEventListener('change', applyTheme)
    return () => media.removeEventListener('change', applyTheme)
  }, [theme])

  return (
    <aside className="kaddo-sidebar" style={{
      width: 220,
      flexShrink: 0,
      background: 'var(--sidebar)',
      borderRight: '1px solid var(--sidebar-border)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div className="kaddo-sidebar__project" style={{ padding: '24px 16px 18px', borderBottom: '1px solid var(--sidebar-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 17, fontWeight: 800, color: '#f8f6f0', letterSpacing: -0.4 }}>
          <img src="/favicon.png" width={28} height={28} alt="Kaddo" style={{ display: 'block', borderRadius: 7 }} />
          <span>Kaddo <span style={{ color: '#f4b942' }}>Admin</span></span>
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--sidebar-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 16 }}>Project</div>
        <div className="font-mono" style={{ fontSize: 12, color: '#f8f6f0', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {projectName}
        </div>
      </div>

      <nav className="kaddo-sidebar__nav" style={{ padding: '12px 8px', flex: 1 }}>
        {navItems.map((item) => {
          const active = isNavItemActive(currentPath, item.path)
          const Icon = item.icon
          return (
            <button
              key={item.path}
              className="kaddo-sidebar__item"
              onClick={() => !item.disabled && router.navigate({ to: item.path })}
              disabled={item.disabled}
              aria-current={active ? 'page' : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: 'none',
                background: active ? 'var(--sidebar-active)' : 'transparent',
                color: item.disabled ? 'var(--sidebar-muted)' : active ? '#f8f6f0' : 'var(--sidebar-muted)',
                fontSize: 14,
                fontWeight: active ? 600 : 400,
                cursor: item.disabled ? 'default' : 'pointer',
                opacity: item.disabled ? 0.5 : 1,
                textAlign: 'left',
                borderLeft: active ? '3px solid #f4b942' : '3px solid transparent',
                fontFamily: 'inherit',
              }}
            >
              <span style={{ width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <span>{item.label}</span>
              {item.disabled && <span style={{ fontSize: 10, marginLeft: 'auto' }}>Soon</span>}
            </button>
          )
        })}
      </nav>

      <div style={{ padding: '12px 16px 18px', borderTop: '1px solid var(--sidebar-border)' }}>
        <label htmlFor="kaddo-admin-theme" style={{ display: 'block', marginBottom: 6, fontSize: 10, fontWeight: 700, color: 'var(--sidebar-muted)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
          Theme
        </label>
        <select
          id="kaddo-admin-theme"
          value={theme}
          onChange={(event) => setTheme(event.target.value as ThemePreference)}
          style={{ width: '100%', padding: '7px 8px', border: '1px solid var(--sidebar-border)', borderRadius: 7, background: '#1c2740', color: '#f8f6f0', fontSize: 12, cursor: 'pointer' }}
        >
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>
    </aside>
  )
}
