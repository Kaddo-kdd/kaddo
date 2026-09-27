import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { api } from '../lib/api'
import type { WorkItemListItem } from '../lib/api'
import { WorkItemRow } from '../components/WorkItemRow'
import { EmptyState } from '../components/EmptyState'

const ACTIVE_STATES = ['draft', 'ready', 'in-progress', 'blocked']

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'ready', label: 'Ready' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
]

function Skeleton() {
  return (
    <div style={{ padding: 24 }}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} style={{ height: 92, background: 'var(--surface-muted)', borderRadius: 'var(--radius)', marginBottom: 14, animation: 'pulse 1.5s ease-in-out infinite' }} />
      ))}
      <style>{`@keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.5 } }`}</style>
    </div>
  )
}

function Group({ title, items }: { title: string; items: WorkItemListItem[] }) {
  if (items.length === 0) return null
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid var(--border)', paddingBottom: 6, marginBottom: 12 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, color: 'var(--foreground-muted)', margin: 0 }}>{title}</h3>
        <span style={{ fontSize: 13, color: 'var(--foreground-muted)' }}>{items.length}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((it) => <WorkItemRow key={it.id} item={it} />)}
      </div>
    </div>
  )
}

function CountTab({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      style={{
        display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start', cursor: 'pointer',
        padding: '8px 16px', borderRadius: 'var(--radius)', fontFamily: 'inherit',
        background: active ? 'var(--surface-muted)' : 'transparent',
        border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
        color: 'var(--foreground)',
      }}
    >
      <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, color: 'var(--foreground-muted)' }}>{label}</span>
      <span style={{ fontSize: 18, fontWeight: 700 }}>{count}</span>
    </button>
  )
}

const inputStyle = {
  padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
  background: 'var(--surface)', color: 'var(--foreground)', fontSize: 13, fontFamily: 'inherit',
} as const

export function WorkItems() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [moduleFilter, setModuleFilter] = useState('all')

  const { data, isLoading, error } = useQuery({
    queryKey: ['work-items'],
    queryFn: () => api.getWorkItemsList(),
    refetchOnWindowFocus: true,
  })

  if (isLoading) return <Skeleton />

  if (error) return (
    <div style={{ padding: 24 }}>
      <div style={{ background: 'color-mix(in srgb, var(--danger) 10%, transparent)', border: '1px solid var(--danger)', borderRadius: 'var(--radius)', padding: 16 }}>
        <strong>Work Items could not be loaded</strong>
        <p style={{ margin: '4px 0 8px', fontSize: 14, color: 'var(--foreground-muted)' }}>{(error as Error).message}</p>
        <button onClick={() => queryClient.invalidateQueries({ queryKey: ['work-items'] })} style={{ ...inputStyle, cursor: 'pointer' }}>Retry</button>
      </div>
    </div>
  )

  if (!data) return null

  const { summary, items, modules } = data

  if (summary.total === 0) {
    return (
      <EmptyState
        icon="📋"
        title="No Work Items"
        description="No Work Items have been defined for this project yet."
        action={{ label: '+ Create Work Item', onClick: () => router.navigate({ to: '/work-items/new' }) }}
      />
    )
  }

  const q = search.trim().toLowerCase()
  const filtered = items.filter((it) => {
    if (moduleFilter !== 'all' && !it.affectedModules.includes(moduleFilter)) return false
    if (statusFilter === 'active' && !ACTIVE_STATES.includes(it.status)) return false
    if (statusFilter !== 'all' && statusFilter !== 'active' && it.status !== statusFilter) return false
    if (q && !it.id.toLowerCase().includes(q) && !it.title.toLowerCase().includes(q) && !it.affectedModules.some((m) => m.toLowerCase().includes(q))) return false
    return true
  })

  const active = filtered.filter((it) => ACTIVE_STATES.includes(it.status))
  const completed = filtered.filter((it) => it.status === 'completed')
  const archived = filtered.filter((it) => it.status === 'archived')

  const hasFilters = q !== '' || statusFilter !== 'all' || moduleFilter !== 'all'

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Work Items</h2>
          <p style={{ fontSize: 14, color: 'var(--foreground-muted)', margin: 0 }}>Explore the work defined and delivered through Kaddo.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['work-items'] })}
            aria-label="Refresh work items"
            style={{ ...inputStyle, color: 'var(--foreground-muted)', cursor: 'pointer', padding: '8px 14px' }}
          >
            ↻ Refresh
          </button>
          <button
            onClick={() => router.navigate({ to: '/work-items/new' })}
            style={{ padding: '8px 16px', border: '1px solid var(--primary)', borderRadius: 'var(--radius)', background: 'var(--primary)', color: 'var(--primary-foreground)', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}
          >
            + Create Work Item
          </button>
        </div>
      </div>

      {/* Count tabs */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '20px 0' }}>
        <CountTab label="All" count={summary.total} active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} />
        <CountTab label="Active" count={summary.active} active={statusFilter === 'active'} onClick={() => setStatusFilter('active')} />
        <CountTab label="Completed" count={summary.completed} active={statusFilter === 'completed'} onClick={() => setStatusFilter('completed')} />
        <CountTab label="Archived" count={summary.archived} active={statusFilter === 'archived'} onClick={() => setStatusFilter('archived')} />
      </div>

      {/* Search + filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="search"
          placeholder="Search work items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search work items"
          style={{ ...inputStyle, flex: '1 1 220px', minWidth: 200, fontSize: 14 }}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status" style={inputStyle}>
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{`Status: ${o.label}`}</option>)}
        </select>
        {modules.length > 0 && (
          <select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)} aria-label="Filter by module" style={inputStyle}>
            <option value="all">All modules</option>
            {modules.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        )}
      </div>

      {filtered.length === 0 ? (
        hasFilters ? (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--foreground-muted)' }}>
            <p style={{ fontSize: 14, marginBottom: 12 }}>No Work Items match these filters.</p>
            <button onClick={() => { setSearch(''); setStatusFilter('all'); setModuleFilter('all') }} style={{ ...inputStyle, cursor: 'pointer' }}>Clear filters</button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--foreground-muted)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--foreground)', margin: '0 0 6px' }}>No active Work Items</h3>
            <p style={{ fontSize: 14 }}>{summary.completed} Work Item{summary.completed !== 1 ? 's have' : ' has'} been completed.</p>
          </div>
        )
      ) : (
        <>
          <Group title="Active" items={active} />
          <Group title="Completed" items={completed} />
          <Group title="Archived" items={archived} />
        </>
      )}
    </div>
  )
}
