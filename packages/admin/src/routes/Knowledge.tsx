import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { api } from '../lib/api'
import { KnowledgeStatus } from '../components/KnowledgeStatus'
import { EmptyState } from '../components/EmptyState'

function Skeleton() {
  return (
    <div style={{ padding: 24 }}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} style={{ height: 100, background: 'var(--surface-muted)', borderRadius: 'var(--radius)', marginBottom: 16, animation: 'pulse 1.5s ease-in-out infinite' }} />
      ))}
      <style>{`@keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.5 } }`}</style>
    </div>
  )
}

export function Knowledge() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [layerFilter, setLayerFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const { data, isLoading, error } = useQuery({
    queryKey: ['knowledge-inventory'],
    queryFn: api.getKnowledgeInventory,
    refetchOnWindowFocus: true,
  })

  if (isLoading) return <Skeleton />
  if (error) return (
    <div style={{ padding: 24 }}>
      <div style={{ background: 'color-mix(in srgb, var(--danger) 10%, transparent)', border: '1px solid var(--danger)', borderRadius: 'var(--radius)', padding: 16 }}>
        <strong>Knowledge could not be loaded</strong>
        <p style={{ margin: '4px 0 8px', fontSize: 14, color: 'var(--foreground-muted)' }}>The project is still available, but the Knowledge inventory could not be read.</p>
        <button onClick={() => queryClient.invalidateQueries({ queryKey: ['knowledge-inventory'] })} style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', color: 'var(--foreground)' }}>
          Retry
        </button>
      </div>
    </div>
  )

  if (!data || data.layers.length === 0) return (
    <EmptyState
      icon="📚"
      title="No knowledge available"
      description="This project does not contain knowledge artifacts yet. Use the Kaddo workflow to build the project knowledge baseline."
    />
  )

  const searchLower = search.toLowerCase()
  const filteredLayers = data.layers
    .filter((l) => layerFilter === 'all' || l.id === layerFilter)
    .map((l) => ({
      ...l,
      artifacts: l.artifacts.filter((a) => {
        if (statusFilter !== 'all' && a.status !== statusFilter) return false
        if (searchLower && !a.title.toLowerCase().includes(searchLower) && !a.path.toLowerCase().includes(searchLower) && !a.layer.toLowerCase().includes(searchLower)) return false
        return true
      }),
    }))

  const statuses = [...new Set(data.layers.flatMap((l) => l.artifacts.map((a) => a.status)))]

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Knowledge</h2>
          <p style={{ fontSize: 14, color: 'var(--foreground-muted)', margin: 0 }}>Explore the project knowledge used by Kaddo.</p>
        </div>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['knowledge-inventory'] })}
          aria-label="Refresh knowledge"
          style={{ padding: '8px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)', color: 'var(--foreground-muted)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}
        >
          ↻ Refresh
        </button>
      </div>

      {/* Search and filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="search"
          placeholder="Search knowledge..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search knowledge"
          style={{
            flex: '1 1 200px', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
            background: 'var(--surface)', color: 'var(--foreground)', fontSize: 14, fontFamily: 'inherit',
            outline: 'none', minWidth: 200,
          }}
        />
        <select
          value={layerFilter}
          onChange={(e) => setLayerFilter(e.target.value)}
          aria-label="Filter by layer"
          style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)', color: 'var(--foreground)', fontSize: 13, fontFamily: 'inherit' }}
        >
          <option value="all">All layers</option>
          {data.layers.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
        </select>
        {statuses.length > 1 && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
            style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)', color: 'var(--foreground)', fontSize: 13, fontFamily: 'inherit' }}
          >
            <option value="all">All statuses</option>
            {statuses.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        )}
      </div>

      {/* Layer cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {filteredLayers.map((layer) => {
          const needsAttention = layer.artifacts.filter((a) => a.status === 'missing' || a.status === 'placeholder').length
          return (
            <button
              key={layer.id}
              onClick={() => router.navigate({ to: '/knowledge/$layer', params: { layer: layer.id } })}
              style={{
                background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                padding: 20, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: 'var(--foreground)' }}>{layer.label}</h3>
                <KnowledgeStatus status={layer.status} />
              </div>
              <div style={{ fontSize: 13, color: 'var(--foreground-muted)' }}>
                {layer.artifacts.length} artifact{layer.artifacts.length !== 1 ? 's' : ''}
                {needsAttention > 0 && (
                  <span style={{ color: 'var(--warning)', marginLeft: 8 }}>
                    {needsAttention} needs attention
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {filteredLayers.every((l) => l.artifacts.length === 0) && search && (
        <div style={{ textAlign: 'center', padding: 32, color: 'var(--foreground-muted)' }}>
          <p style={{ fontSize: 14 }}>No artifacts match "{search}"</p>
        </div>
      )}
    </div>
  )
}
