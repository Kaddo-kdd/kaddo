import { MarkdownRenderer } from './MarkdownRenderer'
import type { ProjectOverview } from '../lib/api'

type PocReport = NonNullable<ProjectOverview['pocReport']>

const statusStyle: Record<PocReport['status'], { color: string; background: string }> = {
  missing: { color: 'var(--foreground-muted)', background: 'var(--surface-muted)' },
  current: { color: 'var(--success)', background: 'color-mix(in srgb, var(--success) 12%, transparent)' },
  stale: { color: 'var(--warning)', background: 'color-mix(in srgb, var(--warning) 14%, transparent)' },
}

function label(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function PocFinalReport({ report }: { report: PocReport }) {
  const status = statusStyle[report.status]
  const latestReport = report.latestReport

  return (
    <section aria-labelledby="poc-final-report-title" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h3 id="poc-final-report-title" style={{ fontSize: 12, fontWeight: 600, color: 'var(--foreground-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: 0.3 }}>
            Final POC Report
          </h3>
          <p style={{ fontSize: 14, margin: '8px 0 0', color: 'var(--foreground-muted)' }}>
            Conclusion: <strong style={{ color: 'var(--foreground)' }}>{label(report.conclusion)}</strong>
          </p>
        </div>
        <span style={{ display: 'inline-flex', padding: '3px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600, color: status.color, background: status.background }}>
          {label(report.status)}
        </span>
      </div>

      {!report.eligible && (
        <p style={{ fontSize: 14, color: 'var(--foreground-muted)', margin: '16px 0 0' }}>{report.handoff}</p>
      )}

      {report.eligible && !latestReport && (
        <p style={{ fontSize: 14, color: 'var(--foreground-muted)', margin: '16px 0 0' }}>
          No final report has been persisted. Prepare and confirm it through the CLI or MCP workflow.
        </p>
      )}

      {latestReport && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '120px minmax(0, 1fr)', gap: '8px 16px', fontSize: 13, marginTop: 16 }}>
            <span style={{ color: 'var(--foreground-muted)' }}>Version</span>
            <span>v{String(latestReport.version).padStart(3, '0')}</span>
            <span style={{ color: 'var(--foreground-muted)' }}>Path</span>
            <code style={{ overflowWrap: 'anywhere', fontFamily: 'var(--font-mono)' }}>{latestReport.path}</code>
          </div>

          {report.status === 'stale' && report.changesSinceLatest.length > 0 && (
            <div style={{ marginTop: 16, padding: 12, background: 'color-mix(in srgb, var(--warning) 8%, transparent)', borderLeft: '3px solid var(--warning)', fontSize: 13 }}>
              <strong>Changed since this report</strong>
              <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
                {report.changesSinceLatest.map((path) => <li key={path}><code style={{ fontFamily: 'var(--font-mono)' }}>{path}</code></li>)}
              </ul>
            </div>
          )}

          {report.sources.length > 0 && (
            <details style={{ marginTop: 16 }}>
              <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Selected sources ({report.sources.length})</summary>
              <ul style={{ margin: '8px 0 0', paddingLeft: 20, fontSize: 13 }}>
                {report.sources.map((source) => <li key={source.path}><code style={{ fontFamily: 'var(--font-mono)' }}>{source.path}</code> <span style={{ color: 'var(--foreground-muted)' }}>({source.kind})</span></li>)}
              </ul>
            </details>
          )}

          {report.reportContent && (
            <details style={{ marginTop: 16 }}>
              <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>View report</summary>
              <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                <MarkdownRenderer content={report.reportContent} />
              </div>
            </details>
          )}
        </>
      )}
    </section>
  )
}
