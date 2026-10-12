import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { BarChart3, CircleHelp, RefreshCw, TrendingDown, Wallet } from 'lucide-react'
import { api, downloadReport, type ReportData, type ReportKind } from '../lib/api'
import { EmptyState } from '../components/EmptyState'
import { StatusBadge } from '../components/StatusBadge'

const labels: Record<ReportKind, { title: string; description: string; icon: typeof BarChart3 }> = {
  impact: { title: 'Impact Report', description: 'Knowledge coverage, delivery evidence, traceability and actionable findings.', icon: BarChart3 },
  drift: { title: 'Drift Report', description: 'Current consistency findings, Guard history and knowledge drift trends.', icon: TrendingDown },
  savings: { title: 'Savings Report', description: 'Estimated delivery value, assumptions, confidence and projections.', icon: Wallet },
}

function object(value: unknown): Record<string, unknown> { return value && typeof value === 'object' ? value as Record<string, unknown> : {} }
function array(value: unknown): Record<string, unknown>[] { return Array.isArray(value) ? value.map(object) : [] }
function stringList(value: unknown): string { return Array.isArray(value) ? value.map(String).join(', ') : value === null || value === undefined ? 'Not available' : String(value) }
function value(value: unknown): string { return value === null || value === undefined ? 'Not available' : String(value) }
function numeric(value: unknown): number { const parsed = typeof value === 'number' ? value : Number(value); return Number.isFinite(parsed) ? Math.max(0, parsed) : 0 }
function variant(priority: unknown): 'danger' | 'warning' | 'info' | 'muted' {
  return priority === 'high' ? 'danger' : priority === 'medium' ? 'warning' : priority === 'low' ? 'info' : 'muted'
}
function findingLabel(classification: unknown): string {
  return classification === 'consistency_violation' ? 'A rule needs attention'
    : classification === 'coverage_gap' ? 'Information may be missing'
      : classification === 'review_hint' ? 'Worth a quick check'
        : classification === 'historical_drift' ? 'Pattern seen over time'
          : value(classification)
}
function priorityLabel(priority: unknown): string {
  return priority === 'high' ? 'High urgency' : priority === 'medium' ? 'Medium urgency' : priority === 'low' ? 'Low urgency' : value(priority)
}
function resolutionLabel(status: unknown): string { return status === 'open' ? 'Needs review' : status === 'resolved' ? 'Resolved' : value(status) }
function artifactLink(artifact: unknown) {
  const id = String(artifact)
  const match = id.match(/^(WI-\d+|RES-\d+|DEP-\d+)/)
  if (!match) return id
  const path = match[1].startsWith('WI-') ? `/work-items/${match[1]}` : match[1].startsWith('RES-') ? `/resources/${match[1]}` : `/deprecations/${match[1]}`
  return <a href={path} style={artifactAnchor}>{id}</a>
}

export function Reports({ kind }: { kind?: ReportKind }) {
  const router = useRouter()
  if (!kind) {
    return <div style={page}>
      <h2 style={heading}>Reports</h2>
      <p style={subheading}>Explore deterministic project evidence. Reports are calculated on demand and never modify project artifacts.</p>
      <div style={grid}>{(Object.keys(labels) as ReportKind[]).map((report) => {
        const item = labels[report]; const Icon = item.icon
        return <button key={report} onClick={() => router.navigate({ to: `/reports/${report}` })} style={cardButton}>
          <Icon size={24} color="var(--primary)" /><strong>{item.title}</strong><span>{item.description}</span>
        </button>
      })}</div>
    </div>
  }
  return <ReportDashboard kind={kind} />
}

function ReportDashboard({ kind }: { kind: ReportKind }) {
  const queryClient = useQueryClient()
  const [scope, setScope] = useState<'all' | 'active'>('all')
  const [classification, setClassification] = useState('all')
  const [priority, setPriority] = useState('all')
  const query = useQuery({ queryKey: ['report', kind, kind === 'drift' ? 'none' : scope], queryFn: () => api.getReport(kind, kind === 'drift' ? undefined : scope), retry: false })
  const meta = labels[kind]
  if (query.isLoading) return <div style={page}>Loading {meta.title}…</div>
  if (query.error) return <div style={page}><EmptyState title="Report unavailable" description={(query.error as Error).message} action={{ label: 'Retry', onClick: () => { void query.refetch() } }} /></div>
  if (!query.data) return <div style={page}><EmptyState title="No report data" description="The project has not produced report data yet." /></div>
  const report = query.data
  return <div style={page}>
    <header style={header}><div><h2 style={heading}>{meta.title}</h2><p style={subheading}>Generated {new Date(report.generated_at).toLocaleString()} · {report.project} · {report.project_context.mode}</p></div><div style={actions}>
      {kind !== 'drift' && <select aria-label="Report scope" value={scope} onChange={(e) => setScope(e.target.value as 'all' | 'active')} style={select}><option value="all">All scope</option><option value="active">Active scope</option></select>}
      <button style={button} onClick={() => queryClient.invalidateQueries({ queryKey: ['report', kind] })}><RefreshCw size={15} /> Refresh report</button>
      <button style={button} onClick={() => void downloadReport(kind, 'markdown', kind === 'drift' ? undefined : scope)}>Markdown</button>
      <button style={button} onClick={() => void downloadReport(kind, 'json', kind === 'drift' ? undefined : scope)}>JSON</button>
    </div></header>
    {kind === 'impact' && <Impact report={report} classification={classification} priority={priority} setClassification={setClassification} setPriority={setPriority} />}
    {kind === 'drift' && <Drift report={report} classification={classification} priority={priority} setClassification={setClassification} setPriority={setPriority} />}
    {kind === 'savings' && <Savings report={report} />}
  </div>
}

function Metrics({ items }: { items: [string, unknown][] }) { return <div style={grid}>{items.map(([label, metric]) => <div key={label} style={metricCard}><span>{label}</span><strong>{value(metric)}</strong></div>)}</div> }
type ChartDatum = { label: string; value: number; color: string }
function HorizontalBars({ title, description, data }: { title: string; description: string; data: ChartDatum[] }) {
  const max = Math.max(1, ...data.map((item) => item.value))
  return <section style={section} aria-label={title}><h3>{title}</h3><p style={muted}>{description}</p><div role="img" aria-label={`${title}: ${data.map((item) => `${item.label} ${item.value}`).join(', ')}`} style={chartList}>{data.map((item) => <div key={item.label} style={chartRow}><span style={chartLabel}>{item.label}</span><div style={chartTrack}><div style={{ ...chartFill, width: `${(item.value / max) * 100}%`, background: item.color }} /></div><strong style={chartValue}>{item.value}</strong></div>)}</div></section>
}
function SegmentedBar({ title, description, data }: { title: string; description: string; data: ChartDatum[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  return <section style={section} aria-label={title}><h3>{title}</h3><p style={muted}>{description}</p>{total === 0 ? <p style={muted}>No recorded values for this distribution.</p> : <><div role="img" aria-label={`${title}: ${data.map((item) => `${item.label} ${item.value}`).join(', ')}`} style={segmentedTrack}>{data.filter((item) => item.value > 0).map((item) => <div key={item.label} title={`${item.label}: ${item.value}`} style={{ width: `${(item.value / total) * 100}%`, minWidth: 4, background: item.color }} />)}</div><div style={legend}>{data.map((item) => <span key={item.label} style={legendItem}><i style={{ ...legendMark, background: item.color }} />{item.label} ({item.value})</span>)}</div></>}</section>
}
function Findings({ findings, classification, priority, setClassification, setPriority }: { findings: Record<string, unknown>[]; classification: string; priority: string; setClassification: (v: string) => void; setPriority: (v: string) => void }) {
  const filtered = findings.filter((item) => (classification === 'all' || item.classification === classification) && (priority === 'all' || item.priority === priority))
  return <section style={section}><h3>What needs attention</h3><div style={findingsGuide}><div style={guideHeading}><CircleHelp size={17} color="var(--primary)" /><strong>Start here</strong></div><p style={muted}>This section highlights places that may deserve a look. It does not mean something is broken. Read the reason and suggested next step before deciding whether to act.</p><div style={guideGrid}><span><strong>A rule needs attention:</strong> two declared pieces of information do not agree.</span><span><strong>Information may be missing:</strong> an important link or piece of context is not recorded yet.</span><span><strong>Worth a quick check:</strong> useful context that may or may not need action.</span><span><strong>Pattern seen over time:</strong> the same concern appeared in more than one recorded Guard run.</span></div><p style={muted}><strong>Urgency</strong> helps order the review. The columns “Why it matters”, “What supports it”, and “Suggested next step” explain what to do with each item.</p></div><div style={actions}><select aria-label="Findings classification" value={classification} onChange={(e) => setClassification(e.target.value)} style={select}><option value="all">Show everything</option><option value="consistency_violation">Rules to review</option><option value="coverage_gap">Information that may be missing</option><option value="review_hint">Quick checks</option><option value="historical_drift">Patterns over time</option></select><select aria-label="Findings priority" value={priority} onChange={(e) => setPriority(e.target.value)} style={select}><option value="all">Any urgency</option><option value="high">High urgency</option><option value="medium">Medium urgency</option><option value="low">Low urgency</option></select></div>
    {filtered.length === 0 ? <p style={muted}>Nothing matches these filters. This only reflects the checks that have run so far.</p> : <div style={tableWrap}><table style={table}><thead><tr><th>What we found</th><th>Urgency</th><th>Review status</th><th>Where it came from</th><th>Related item</th><th>Why it matters</th><th>What supports it</th><th>Suggested next step</th></tr></thead><tbody>{filtered.map((finding, index) => <tr key={`${value(finding.id)}-${index}`}><td>{findingLabel(finding.classification)}</td><td><StatusBadge variant={variant(finding.priority)}>{priorityLabel(finding.priority)}</StatusBadge></td><td>{resolutionLabel(finding.resolution_status)}</td><td>{value(finding.source)}</td><td>{Array.isArray(finding.affected_artifacts) ? finding.affected_artifacts.map((artifact, artifactIndex) => <span key={`${String(artifact)}-${artifactIndex}`}>{artifactIndex > 0 && ', '}{artifactLink(artifact)}</span>) : stringList(finding.affected_artifacts)}</td><td>{value(finding.explanation)}</td><td>{value(finding.evidence)}</td><td>{value(finding.suggested_action)}</td></tr>)}</tbody></table></div>}</section>
}
function Impact({ report, ...filters }: { report: ReportData; classification: string; priority: string; setClassification: (v: string) => void; setPriority: (v: string) => void }) {
  const delivery = object(report.delivery_evidence); const ownership = object(report.ownership_coverage); const graph = object(report.graph_quality); const traceability = object(report.traceability); const readiness = object(report.work_item_readiness)
  return <><Metrics items={[["Completed Work Items", delivery.completed], ["Validation passed", delivery.validation_passed], ["Validation failed", delivery.validation_failed], ["Validation pending", delivery.validation_pending], ["Validation not recorded", delivery.validation_not_recorded], ["Ownership coverage", ownership.coverage_percent === undefined ? 'Not available' : `${ownership.coverage_percent}%`], ["Graph quality", graph.quality], ["Current findings", array(report.findings).length]]} />
    <SegmentedBar title="Delivery evidence" description="Persisted validation is independent from completion. Not recorded is not a failed validation." data={[{ label: 'Passed', value: numeric(delivery.validation_passed), color: 'var(--success)' }, { label: 'Failed', value: numeric(delivery.validation_failed), color: 'var(--danger)' }, { label: 'Pending', value: numeric(delivery.validation_pending), color: 'var(--warning)' }, { label: 'Not recorded', value: numeric(delivery.validation_not_recorded), color: 'var(--foreground-muted)' }]} />
    <section style={section}><h3>Knowledge health</h3><Metrics items={Object.entries(object(report.knowledge_health))} /><p style={muted}>Legacy Knowledge Impact Score: {value(report.score)} (deprecated; informational only).</p></section>
    <section style={section}><h3>Traceability and delivery detail</h3><Metrics items={[["Graph hints", traceability.graph_hints], ["Roadmap candidates", traceability.roadmap_candidates], ["Work Items linked to roadmap", traceability.work_items_connected_to_roadmap], ["Work Items linked to code", traceability.work_items_connected_to_code], ["Ready Work Items", readiness.ready], ["Blocked Work Items", readiness.blocked]]} /></section>
    <Findings findings={array(report.findings)} {...filters} />
  </>
}
function Drift({ report, ...filters }: { report: ReportData; classification: string; priority: string; setClassification: (v: string) => void; setPriority: (v: string) => void }) {
  const history = object(report.guard_history); const warnings = object(report.drift_warnings); const structural = object(report.structural_consistency)
  const findings = array(report.current_consistency_findings)
  const classificationCount = (classification: string) => findings.filter((finding) => finding.classification === classification).length
  return <><Metrics items={[["Recorded runs", history.total_runs], ["Open warnings", warnings.open], ["Resolved warnings", warnings.resolved], ["Trend", object(report.trend).direction], ["Plans discovered", structural.plans_discovered], ["Plans evaluated", structural.plans_with_targets_evaluated], ["Plans without targets", structural.plans_without_targets], ["Structural findings", structural.structural_findings]]} />
    {!history.available && <section style={notice}><strong>No Guard history recorded.</strong><span> Run: <code>kaddo guard --record</code>. Historical drift is not available without comparable observations.</span></section>}
    {history.available && <HorizontalBars title="Guard history" description={`Recorded observations from ${value(history.first_run)} to ${value(history.last_run)}.`} data={[{ label: 'Runs', value: numeric(history.total_runs), color: 'var(--primary)' }, { label: 'Warnings detected', value: numeric(warnings.detected), color: 'var(--warning)' }, { label: 'Open', value: numeric(warnings.open), color: 'var(--danger)' }, { label: 'Resolved', value: numeric(warnings.resolved), color: 'var(--success)' }]} />}
    <HorizontalBars title="Current findings by classification" description="Current deterministic checks; this is not a historical trend." data={[{ label: 'Consistency violations', value: classificationCount('consistency_violation'), color: 'var(--danger)' }, { label: 'Coverage gaps', value: classificationCount('coverage_gap'), color: 'var(--warning)' }, { label: 'Review hints', value: classificationCount('review_hint'), color: 'var(--primary)' }, { label: 'Historical drift', value: classificationCount('historical_drift'), color: 'var(--foreground-muted)' }]} />
    <Findings findings={findings} {...filters} />
    <section style={section}><h3>Deprecation consistency</h3><p style={muted}>Target checks: {value(structural.deprecation_target_checks)}. Structural consistency does not verify operational removal.</p></section>
  </>
}
function Savings({ report }: { report: ReportData }) {
  const totals = object(report.totals); const historical = object(totals.observed_history_estimate); const monthly = object(totals.monthly_projection); const confidence = object(report.confidence)
  return <><section style={notice}><strong>Estimated, not measured savings or proven ROI.</strong> These values use explicit project assumptions.</section><Metrics items={[["Historical hours", historical.estimated_hours], ["Historical value", historical.estimated_value], ["Monthly hours", monthly.estimated_hours], ["Monthly value", monthly.estimated_value], ["Confidence", confidence.level], ["Assumptions", report.assumptions_source]]} />
    <HorizontalBars title="Estimated hours by reporting period" description="Historical and monthly periods are shown separately and must not be added together." data={[{ label: 'Historical estimate', value: numeric(historical.estimated_hours), color: 'var(--primary)' }, { label: 'Monthly projection', value: numeric(monthly.estimated_hours), color: 'var(--success)' }]} />
    <section style={section}><h3>Estimate breakdown</h3><div style={grid}>{Object.entries(object(report.estimated_savings)).map(([name, item]) => <div style={metricCard} key={name}><span>{name.replace(/_/g, ' ')}</span><strong>{value(object(item).hours)} hours</strong><small>{value(object(item).formula ?? object(item).reason)}</small></div>)}</div></section>
    <section style={section}><h3>Calibration</h3><p style={muted}>{value(object(report.calibration_opportunities).reason ?? 'Review available calibration opportunities before treating estimates as measured.')}</p>{array(object(report.calibration_opportunities).opportunities).map((opportunity) => <p style={muted} key={value(opportunity.area)}><strong>{value(opportunity.area)}:</strong> {value(opportunity.suggested_evidence)}</p>)}</section>
  </>
}

const page: React.CSSProperties = { padding: '24px 32px', maxWidth: 1280, margin: '0 auto' }
const heading: React.CSSProperties = { margin: 0, fontSize: 24 }
const subheading: React.CSSProperties = { color: 'var(--foreground-muted)', margin: '6px 0 0' }
const header: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 24 }
const actions: React.CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }
const grid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }
const section: React.CSSProperties = { marginTop: 20, padding: 18, border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)' }
const notice: React.CSSProperties = { ...section, background: 'var(--surface-muted)', color: 'var(--foreground)' }
const metricCard: React.CSSProperties = { padding: 14, border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)', display: 'grid', gap: 6, color: 'var(--foreground-muted)', fontSize: 13 }
const cardButton: React.CSSProperties = { ...metricCard, textAlign: 'left', color: 'var(--foreground)', cursor: 'pointer', font: 'inherit' }
const button: React.CSSProperties = { display: 'inline-flex', gap: 6, alignItems: 'center', padding: '8px 11px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)', color: 'var(--foreground)', cursor: 'pointer', font: 'inherit', fontSize: 13 }
const select: React.CSSProperties = { padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)', color: 'var(--foreground)' }
const muted: React.CSSProperties = { color: 'var(--foreground-muted)', fontSize: 13 }
const tableWrap: React.CSSProperties = { overflowX: 'auto', marginTop: 14 }
const table: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 980 }
const artifactAnchor: React.CSSProperties = { color: 'var(--primary)', textDecoration: 'underline' }
const chartList: React.CSSProperties = { display: 'grid', gap: 10, marginTop: 14 }
const chartRow: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(120px, 180px) minmax(80px, 1fr) 40px', gap: 10, alignItems: 'center', fontSize: 13 }
const chartLabel: React.CSSProperties = { color: 'var(--foreground-muted)' }
const chartTrack: React.CSSProperties = { height: 10, borderRadius: 99, overflow: 'hidden', background: 'var(--surface-muted)' }
const chartFill: React.CSSProperties = { height: '100%', minWidth: 0, borderRadius: 99, transition: 'width 180ms ease' }
const chartValue: React.CSSProperties = { textAlign: 'right', color: 'var(--foreground)' }
const segmentedTrack: React.CSSProperties = { display: 'flex', height: 16, overflow: 'hidden', borderRadius: 99, background: 'var(--surface-muted)', marginTop: 14 }
const legend: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '8px 14px', marginTop: 10, fontSize: 12, color: 'var(--foreground-muted)' }
const legendItem: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5 }
const legendMark: React.CSSProperties = { width: 8, height: 8, borderRadius: '50%', display: 'inline-block' }
const findingsGuide: React.CSSProperties = { margin: '10px 0 14px', padding: 14, borderLeft: '3px solid var(--primary)', borderRadius: '0 var(--radius) var(--radius) 0', background: 'var(--surface-muted)', display: 'grid', gap: 8, fontSize: 13, color: 'var(--foreground)' }
const guideHeading: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 7 }
const guideGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '6px 16px', color: 'var(--foreground-muted)' }
