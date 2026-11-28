import { useParams, useRouter } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { AuditRunView } from '../lib/api'
import { describeAuditScope, auditStatusLabel, auditStatusTone, countConfirmed, summarizeBySeverity } from '../lib/audit-presentation'

// WI-103 (INI-002, AUD-ADMIN-C2) — Audit detail: the run header (id, date, commit, scope, status, coverage)
// and a summary of findings by severity and confidence. The full findings/evidence explorer is AUD-ADMIN-C4.
// Read-only.

const TONE_COLOR = { success: 'var(--success, #2f855a)', warning: 'var(--warning, #b7791f)', danger: 'var(--danger, #c53030)' } as const

function StatusBadge({ status }: { status: AuditRunView['status'] }) {
  const color = TONE_COLOR[auditStatusTone(status)]
  return <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, padding: '2px 8px', borderRadius: 999, border: `1px solid ${color}`, color }}>{auditStatusLabel(status)}</span>
}

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4, color: 'var(--foreground-muted)' }}>{label}</span>
      <span style={{ fontSize: 14 }}>{value}</span>
    </div>
  )
}

export function AuditDetail() {
  const { auditId } = useParams({ from: '/audits/$auditId' })
  const router = useRouter()
  const { data, isLoading, error } = useQuery({
    queryKey: ['audit', auditId],
    queryFn: () => api.getAudit(auditId),
    retry: false,
  })

  const run = data?.run
  const findings = data?.findings ?? []
  const confirmed = countConfirmed(findings)
  const bySeverity = summarizeBySeverity(findings)

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
      <button
        onClick={() => router.navigate({ to: '/audits' })}
        style={{ background: 'none', border: 'none', color: 'var(--foreground-muted)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', marginBottom: 12, padding: 0 }}
      >← Audits</button>

      {isLoading && <p style={{ color: 'var(--foreground-muted)', fontSize: 14 }}>Loading audit…</p>}

      {error && (
        <div style={{ padding: 16, border: '1px solid var(--danger, #c53030)', borderRadius: 'var(--radius)', background: 'var(--danger-bg, rgba(197,48,48,0.08))', color: 'var(--danger, #c53030)', fontSize: 14 }}>
          Could not load audit {auditId}: {(error as Error).message}
        </div>
      )}

      {run && (
        <>
          <header style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <h1 className="font-mono" style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{run.id}</h1>
            <StatusBadge status={run.status} />
          </header>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, padding: 16, border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)', marginBottom: 16 }}>
            <Meta label="Date" value={new Date(run.createdAt).toLocaleString()} />
            <Meta label="Commit" value={run.commit ? <span className="font-mono">{run.commit.slice(0, 10)}</span> : '—'} />
            <Meta label="Scope" value={describeAuditScope(run.scope)} />
            <Meta label="Findings" value={`${findings.length} (confirmed: ${confirmed}, inferences: ${findings.length - confirmed})`} />
            <Meta label="Coverage" value={run.coverage.complete ? 'complete' : 'incomplete'} />
          </div>

          <section style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 8px' }}>Findings by severity</h2>
            {bySeverity.length === 0
              ? <p style={{ fontSize: 14, color: 'var(--foreground-muted)', margin: 0 }}>No findings.</p>
              : (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {bySeverity.map(({ severity, count }) => (
                    <span key={severity} style={{ fontSize: 13, padding: '4px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface-muted)' }}>
                      {severity}: <strong>{count}</strong>
                    </span>
                  ))}
                </div>
              )}
            <p style={{ fontSize: 12, color: 'var(--foreground-muted)', margin: '10px 0 0' }}>
              The full findings and evidence explorer arrives with the Findings &amp; Evidence Explorer.
            </p>
          </section>

          {run.coverage.notEvaluated.length > 0 && (
            <section>
              <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 8px' }}>Not evaluated</h2>
              <ul style={{ fontSize: 13, color: 'var(--foreground-muted)', margin: 0, paddingLeft: 18 }}>
                {run.coverage.notEvaluated.map((area, i) => <li key={i}>{area}</li>)}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  )
}
