import { Outlet } from '@tanstack/react-router'
import { Sidebar } from './Sidebar'
import { ErrorBoundary } from './ErrorBoundary'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

export function AppShell() {
  const { data } = useQuery({ queryKey: ['project'], queryFn: api.getProject, staleTime: 60_000 })

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
      <Sidebar projectName={data?.name ?? '...'} />
      <main style={{ flex: 1, minWidth: 0, overflow: 'auto' }}>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  )
}
