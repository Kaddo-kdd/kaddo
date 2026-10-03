import { useState } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { api } from '../lib/api'
import type { InitiativeListItem } from '../lib/api'
import { EmptyState } from '../components/EmptyState'

const inputStyle = {
  padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
  background: 'var(--surface)', color: 'var(--foreground)', fontSize: 13, fontFamily: 'inherit',
} as const

function StatusBadge({ status }: { status: string }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4,
      padding: '2px 8px', borderRadius: 999, border: '1px solid var(--border)',
      color: 'var(--foreground-muted)', background: 'var(--surface-muted)',
    }}>{status}</span>
  )
}

function Row({ item }: { item: InitiativeListItem }) {
  const router = useRouter()
  return (
    <button
      onClick={() => router.navigate({ to: '/initiatives/$initiativeId', params: { initiativeId: item.id } })}
      style={{
        display: 'flex', flexDirection: 'column', gap: 8, width: '100%', textAlign: 'left',
        padding: 16, border: '1px solid var(--border)', borderRadius: 'var(--radius)',
        background: 'var(--surface)', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--foreground)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className="font-mono" style={{ fontSize: 12, color: 'var(--foreground-muted)' }}>{item.id}</span>
        <span style={{ fontSize: 15, fontWeight: 600 }}>{item.title}</span>
        <span style={{ marginLeft: 'auto' }}><StatusBadge status={item.status} /></span>
      </div>
      <div style={{ display: 'flex', gap: 20, fontSize: 13, color: 'var(--foreground-muted)' }}>
        <span>Planning: {item.planning.materialized}/{item.planning.totalCandidates} materialized</span>
        <span>Delivery: {item.delivery.byState.completed ?? 0}/{item.delivery.total} completed</span>
      </div>
    </button>
  )
}

export function Initiatives() {
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [title, setTitle] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['initiatives'],
    queryFn: () => api.getInitiatives(),
    refetchOnWindowFocus: true,
  })

  const createMut = useMutation({
    mutationFn: (t: string) => api.createInitiative({ title: t }),
    onSuccess: () => {
      setTitle(''); setShowCreate(false)
      queryClient.invalidateQueries({ queryKey: ['initiatives'] })
    },
  })

  if (isLoading) return <div style={{ padding: 24, color: 'var(--foreground-muted)' }}>Loading initiatives…</div>
  if (error) return (
    <div style={{ padding: 24 }}>
      <div style={{ background: 'color-mix(in srgb, var(--danger) 10%, transparent)', border: '1px solid var(--danger)', borderRadius: 'var(--radius)', padding: 16 }}>
        <strong>Initiatives could not be loaded</strong>
        <p style={{ margin: '4px 0 8px', fontSize: 14, color: 'var(--foreground-muted)' }}>{(error as Error).message}</p>
        <button onClick={() => queryClient.invalidateQueries({ queryKey: ['initiatives'] })} style={{ ...inputStyle, cursor: 'pointer' }}>Retry</button>
      </div>
    </div>
  )
  if (!data) return null

  const initiatives = data.initiatives

  const CreateForm = (
    <div style={{ display: 'flex', gap: 10, marginBottom: 24, alignItems: 'center' }}>
      <input
        autoFocus
        type="text"
        placeholder="Initiative title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && title.trim()) createMut.mutate(title.trim()) }}
        style={{ ...inputStyle, flex: '1 1 320px', fontSize: 14 }}
      />
      <button
        disabled={!title.trim() || createMut.isPending}
        onClick={() => createMut.mutate(title.trim())}
        style={{ padding: '8px 16px', border: '1px solid var(--primary)', borderRadius: 'var(--radius)', background: 'var(--primary)', color: 'var(--primary-foreground)', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', opacity: !title.trim() || createMut.isPending ? 0.6 : 1 }}
      >
        {createMut.isPending ? 'Creating…' : 'Create'}
      </button>
      <button onClick={() => { setShowCreate(false); setTitle('') }} style={{ ...inputStyle, cursor: 'pointer' }}>Cancel</button>
    </div>
  )

  if (initiatives.length === 0 && !showCreate) {
    return (
      <EmptyState
        icon="🎯"
        title="No initiatives"
        description="Initiatives are the optional outcome layer over Work Items. Create one to group related delivery."
        action={{ label: '+ Create Initiative', onClick: () => setShowCreate(true) }}
      />
    )
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Initiatives</h2>
          <p style={{ fontSize: 14, color: 'var(--foreground-muted)', margin: 0 }}>The optional outcome layer that connects product intent to delivery.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => queryClient.invalidateQueries({ queryKey: ['initiatives'] })} style={{ ...inputStyle, cursor: 'pointer', padding: '8px 14px', color: 'var(--foreground-muted)' }}>↻ Refresh</button>
          {!showCreate && (
            <button onClick={() => setShowCreate(true)} style={{ padding: '8px 16px', border: '1px solid var(--primary)', borderRadius: 'var(--radius)', background: 'var(--primary)', color: 'var(--primary-foreground)', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>+ Create Initiative</button>
          )}
        </div>
      </div>

      {showCreate && CreateForm}
      {createMut.error && <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{(createMut.error as Error).message}</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {initiatives.map((it) => <Row key={it.id} item={it} />)}
      </div>
    </div>
  )
}
