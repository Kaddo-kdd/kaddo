import { useQuery } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { api } from '../lib/api'
import type { AuditRunSummary } from '../lib/api'
import { EmptyState } from '../components/EmptyState'

// WI-103 (INI-002, AUD-ADMIN-C2) — Audit Explorer: list persisted audit runs with their status and finding
// metrics, honest coverage marking, and navigation to the per-run detail. Read-only (execution is C3).

const STATUS_META: Record<AuditRunSummary['status'], { label: string; color: string; bg: string }> = {
  completed: { label: 'completed', color: 'var(--success, #2f855a)', bg: 'var(--success-bg, rgba(47,133,90,0.10))' },
  partial: { label: 'partial — incomplete coverage', color: 'var(--warning, #b7791f)', bg: 'var(--warning-bg, rgba(183,121,31,0.10))' },
  failed: { label: 'failed', color: 'var(--danger, #c53030)', bg: 'var(--danger-bg, rgba(197,48,48,0.10))' },
}

function StatusBadge({ status }: { status: AuditRunSummary['status'] }) {
  const meta = STATUS_META[status] ?? STATUS_META.completed
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4,
      padding: '2px 8px', borderRadius: 999, border: `1px solid ${meta.color}`, color: meta.color, background: meta.bg,
    }}>{meta.label}</span>
  )
}

function Row({ item }: { item: AuditRunSummary }) {
  const router = useRouter()
  return (
    <button
      onClick={() => router.navigate({ to: '/audits/$auditId', params: { auditId: item.id } })}
      style={{
        display: 'flex', flexDirection: 'column', gap: 8, width: '100%', textAlign: 'left',
        padding: 16, border: '1px solid var(--border)', borderRadius: 'var(--radius)',
        background: 'var(--surface)', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--foreground)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span className="font-mono" style={{ fontSize: 12, color: 'var(--foreground-muted)' }}>{item.id}</span>
        <span style={{ fontSize: 13, color: 'var(--foreground-muted)' }}>{new Date(item.createdAt).toLocaleString()}</span>
        <span style={{ marginLeft: 'auto' }}><StatusBadge status={item.status} /></span>
      </div>
      <div style={{ display: 'flex', gap: 20, fontSize: 13, color: 'var(--foreground-muted)', flexWrap: 'wrap' }}>
        <span>{item.total} finding{item.total === 1 ? '' : 's'}</span>
        <span>Confirmed: {item.confirmed}</span>
        <span>Inferences: {item.inferences}</span>
      </div>
    </button>
  )
}

export function Audits() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['audits'],
    queryFn: () => api.listAudits(),
    refetchOnWindowFocus: true,
  })

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
      <header style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Audit</h1>
        <p style={{ fontSize: 14, color: 'var(--foreground-muted)', margin: 0 }}>
          Evidence-based audits of this project, newest last. Read-only.
        </p>
      </header>

      {isLoading && <p style={{ color: 'var(--foreground-muted)', fontSize: 14 }}>Loading audits…</p>}

      {error && (
        <div style={{
          padding: 16, border: '1px solid var(--danger, #c53030)', borderRadius: 'var(--radius)',
          background: 'var(--danger-bg, rgba(197,48,48,0.08))', color: 'var(--danger, #c53030)', fontSize: 14,
        }}>
          Could not load audits: {(error as Error).message}
        </div>
      )}

      {data && data.length === 0 && (
        <EmptyState
          icon="🛡️"
          title="No audits yet"
          description="Run `kaddo audit run` in this project to produce an evidence-based audit. It will appear here."
        />
      )}

      {data && data.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.map((item) => <Row key={item.id} item={item} />)}
        </div>
      )}
    </div>
  )
}
