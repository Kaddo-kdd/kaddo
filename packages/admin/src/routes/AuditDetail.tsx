import { useState } from 'react'
import { useParams, useRouter } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { AuditRunView, AuditFindingView, AuditFindingFilters } from '../lib/api'
import {
  describeAuditScope, auditStatusLabel, auditStatusTone, countConfirmed,
  confidenceIsFirm, findingLocationLabel, cleanAuditFilters, hasActiveFilters,
  SEVERITY_OPTIONS, CONFIDENCE_OPTIONS, STATUS_OPTIONS,
} from '../lib/audit-presentation'

// WI-104 (INI-002, AUD-ADMIN-C4) — Findings & Evidence Explorer, extending the detail (C2) with the per-run
// findings table: severity and confidence differentiated, evidence, provenance, recommendation, references and
// correlation, with server-side filters. Read-only (Work Item linking is C6).

const TONE_COLOR = { success: 'var(--success, #2f855a)', warning: 'var(--warning, #b7791f)', danger: 'var(--danger, #c53030)' } as const
const SEVERITY_COLOR: Record<string, string> = {
  critical: 'var(--danger, #c53030)', high: 'var(--danger, #c53030)', medium: 'var(--warning, #b7791f)',
  low: 'var(--foreground-muted)', info: 'var(--foreground-muted)',
}
const controlStyle = {
  padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
  background: 'var(--surface)', color: 'var(--foreground)', fontSize: 13, fontFamily: 'inherit',
} as const

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

/** Severity (solid) and confidence (firm vs inferred) are shown distinctly so an inference is never read as a fact. */
function FindingBadges({ finding }: { finding: AuditFindingView }) {
  const firm = confidenceIsFirm(finding.confidence)
  return (
    <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
      <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, padding: '2px 7px', borderRadius: 4, color: '#fff', background: SEVERITY_COLOR[finding.severity] ?? 'var(--foreground-muted)' }}>{finding.severity}</span>
      <span
        title={firm ? 'Tool-reported fact' : 'Inference — not a confirmed fact'}
        style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, padding: '2px 7px', borderRadius: 4, border: `1px ${firm ? 'solid' : 'dashed'} var(--border)`, color: 'var(--foreground-muted)' }}
      >{finding.confidence}{firm ? '' : ' ·inferred'}</span>
    </span>
  )
}

function FindingCard({ finding }: { finding: AuditFindingView }) {
  const [open, setOpen] = useState(false)
  const loc = findingLocationLabel(finding.location)
  const refs = finding.references
  const corr = finding.correlation
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', padding: 12, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--foreground)', flexWrap: 'wrap' }}
      >
        <FindingBadges finding={finding} />
        <span style={{ fontSize: 14, fontWeight: 600 }}>{finding.title}</span>
        <span style={{ fontSize: 12, color: 'var(--foreground-muted)' }}>{finding.category}</span>
        {loc && <span className="font-mono" style={{ fontSize: 12, color: 'var(--foreground-muted)' }}>{loc}</span>}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--foreground-muted)' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
          <div><span style={{ color: 'var(--foreground-muted)' }}>Evidence: </span>{finding.evidence}</div>
          <div><span style={{ color: 'var(--foreground-muted)' }}>Provenance: </span>{finding.provenance}</div>
          <div><span style={{ color: 'var(--foreground-muted)' }}>Recommendation: </span>{finding.recommendation}</div>
          {refs && (refs.workItems?.length || refs.adrs?.length || refs.capabilities?.length) ? (
            <div><span style={{ color: 'var(--foreground-muted)' }}>References: </span>
              {[refs.workItems?.length ? `WIs: ${refs.workItems.join(', ')}` : '', refs.adrs?.length ? `ADRs: ${refs.adrs.join(', ')}` : '', refs.capabilities?.length ? `Capabilities: ${refs.capabilities.join(', ')}` : ''].filter(Boolean).join(' · ')}
            </div>
          ) : null}
          {corr && corr.matchStrength !== 'none' && (
            <div><span style={{ color: 'var(--foreground-muted)' }}>Correlation: </span>{corr.matchStrength}
              {corr.owners.length ? ` · owners: ${corr.owners.map((o) => `${o.domain}→${o.owners.join('/')}`).join('; ')}` : ''}
              {corr.risks.length ? ` · risks: ${corr.risks.join(', ')}` : ''}
            </div>
          )}
          <div style={{ color: 'var(--foreground-muted)', fontSize: 12 }}>Status: {finding.status}</div>
        </div>
      )}
    </div>
  )
}

export function AuditDetail() {
  const { auditId } = useParams({ from: '/audits/$auditId' })
  const router = useRouter()
  const [filters, setFilters] = useState<AuditFindingFilters>({})
  const active = cleanAuditFilters(filters)

  const { data, isLoading, error } = useQuery({
    queryKey: ['audit', auditId, active],
    queryFn: () => api.getAudit(auditId, active),
    retry: false,
  })

  const run = data?.run
  const findings = data?.findings ?? []
  const confirmed = countConfirmed(findings)

  const setField = (key: keyof AuditFindingFilters, value: string) => setFilters((f) => ({ ...f, [key]: value || undefined }))

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

          {run.coverage.notEvaluated.length > 0 && (
            <section style={{ marginBottom: 16 }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 8px' }}>Not evaluated</h2>
              <ul style={{ fontSize: 13, color: 'var(--foreground-muted)', margin: 0, paddingLeft: 18 }}>
                {run.coverage.notEvaluated.map((area, i) => <li key={i}>{area}</li>)}
              </ul>
            </section>
          )}

          <section>
            <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 10px' }}>Findings</h2>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' }}>
              <select aria-label="Severity" style={controlStyle} value={filters.severity ?? ''} onChange={(e) => setField('severity', e.target.value)}>
                <option value="">All severities</option>
                {SEVERITY_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select aria-label="Confidence" style={controlStyle} value={filters.confidence ?? ''} onChange={(e) => setField('confidence', e.target.value)}>
                <option value="">All confidence</option>
                {CONFIDENCE_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select aria-label="Status" style={controlStyle} value={filters.status ?? ''} onChange={(e) => setField('status', e.target.value)}>
                <option value="">All statuses</option>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <input aria-label="Category" placeholder="category" style={controlStyle} value={filters.category ?? ''} onChange={(e) => setField('category', e.target.value)} />
              <input aria-label="Module" placeholder="module" style={controlStyle} value={filters.module ?? ''} onChange={(e) => setField('module', e.target.value)} />
              {hasActiveFilters(filters) && (
                <button onClick={() => setFilters({})} style={{ ...controlStyle, cursor: 'pointer', color: 'var(--foreground-muted)' }}>Clear</button>
              )}
            </div>

            {findings.length === 0 ? (
              <p style={{ fontSize: 14, color: 'var(--foreground-muted)', margin: 0 }}>
                {hasActiveFilters(filters) ? 'No findings match these filters.' : 'No findings in this audit.'}
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {findings.map((f) => <FindingCard key={f.id} finding={f} />)}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
