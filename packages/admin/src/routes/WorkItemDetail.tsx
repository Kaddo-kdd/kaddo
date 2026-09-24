import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from '@tanstack/react-router'
import { api } from '../lib/api'
import type { WorkItemDetail as WorkItemDetailData } from '../lib/api'
import { Breadcrumbs } from '../components/Breadcrumbs'
import { WorkItemStatus } from '../components/WorkItemStatus'
import { DeliveryStatusSummary } from '../components/DeliveryStatusSummary'
import { Section, Field } from '../components/Section'
import { ScopeConfidence } from '../components/ScopeConfidence'
import { ModuleCoverage } from '../components/ModuleCoverage'
import { ImpactAnalysis } from '../components/ImpactAnalysis'
import { AcceptanceCriteria } from '../components/AcceptanceCriteria'
import { ImplementationEvidence } from '../components/ImplementationEvidence'
import { ReleaseGates } from '../components/ReleaseGates'
import { ArtifactPath } from '../components/ArtifactPath'
import { RefinementHandoffCard } from '../components/RefinementHandoffCard'
import { SystemImpact } from '../components/SystemImpact'
import { humanize, presentWorkItemType } from '../lib/presentation'

function Skeleton() {
  return (
    <div style={{ padding: 24 }}>
      <div style={{ height: 32, width: 320, background: 'var(--surface-muted)', borderRadius: 'var(--radius)', marginBottom: 16, animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div style={{ height: 240, background: 'var(--surface-muted)', borderRadius: 'var(--radius)', animation: 'pulse 1.5s ease-in-out infinite' }} />
      <style>{`@keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.5 } }`}</style>
    </div>
  )
}

export function WorkItemDetail() {
  const { workItemId } = useParams({ from: '/work-items/$workItemId' })
  const queryClient = useQueryClient()
  const router = useRouter()

  const { data, isLoading, error } = useQuery({
    queryKey: ['work-item', workItemId],
    queryFn: () => api.getWorkItem(workItemId),
    refetchOnWindowFocus: true,
    retry: false,
  })

  if (isLoading) return <Skeleton />

  if (error) {
    const notFound = (error as Error).message.toLowerCase().includes('does not exist') || (error as Error).message.toLowerCase().includes('not found')
    return (
      <div style={{ padding: '24px 32px', maxWidth: 900, margin: '0 auto' }}>
        <Breadcrumbs crumbs={[{ label: 'Work Items', path: '/work-items' }, { label: workItemId }]} />
        <div style={{ textAlign: 'center', padding: 32, color: 'var(--foreground-muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--foreground)', margin: '0 0 8px' }}>
            {notFound ? 'Work Item not found' : 'Work Item could not be loaded'}
          </h2>
          <p style={{ fontSize: 14, marginBottom: 16 }}>
            {notFound ? 'This Work Item does not exist in the current project.' : (error as Error).message}
          </p>
          <button
            onClick={() => notFound ? router.navigate({ to: '/work-items' }) : queryClient.invalidateQueries({ queryKey: ['work-item', workItemId] })}
            style={{ padding: '8px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)', color: 'var(--foreground)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}
          >
            {notFound ? 'Back to Work Items' : 'Retry'}
          </button>
        </div>
      </div>
    )
  }

  if (!data) return null
  const wi: WorkItemDetailData = data
  const hasDelivery = wi.implementationStatus || wi.validationStatus || wi.releaseStatus

  return (
    <div style={{ padding: '24px 32px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <Breadcrumbs crumbs={[{ label: 'Work Items', path: '/work-items' }, { label: wi.id }]} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['work-item', workItemId] })}
            aria-label="Refresh work item"
            style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)', color: 'var(--foreground-muted)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}
          >
            ↻ Refresh
          </button>
          {(wi.status === 'draft' || wi.status === 'ready') && (
            <button
              onClick={() => router.navigate({ to: '/work-items/$workItemId/edit', params: { workItemId } })}
              style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)', color: 'var(--foreground)', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div className="font-mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--foreground-muted)' }}>{wi.id}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 4 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{wi.title}</h2>
          <WorkItemStatus status={wi.status} />
        </div>
      </div>

      {/* Captured intent — shown while the Work Item still only carries the initial request. */}
      {wi.status === 'draft' && wi.refinement.status === 'needs-refinement' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px 18px', marginBottom: 4 }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, color: 'var(--foreground-muted)', margin: '0 0 6px' }}>Captured intent</h3>
          <p style={{ fontSize: 15, margin: 0 }}>{wi.summary || wi.outcome || wi.title}</p>
        </div>
      )}

      {/* Refinement handoff — refinement happens externally, next to the repository. */}
      {wi.status === 'draft' && <RefinementHandoffCard workItemId={workItemId} refinement={wi.refinement} />}

      {/* Delivery status trio — independent dimensions, only when the modern model records them */}
      {hasDelivery && (
        <DeliveryStatusSummary
          implementationStatus={wi.implementationStatus}
          validationStatus={wi.validationStatus}
          releaseStatus={wi.releaseStatus}
        />
      )}

      {/* Delivery ≠ release readiness note */}
      {wi.status === 'completed' && wi.releaseStatus === 'blocked' && (
        <p style={{ fontSize: 13, color: 'var(--foreground-muted)', marginTop: 12, fontStyle: 'italic' }}>
          Delivery is complete. Release readiness is tracked separately and remains blocked.
        </p>
      )}

      {/* Outcome */}
      {(wi.actor || wi.outcome || wi.currentBehavior || wi.targetBehavior) && (
        <Section title="Outcome">
          {wi.actor && <Field label="Actor" value={wi.actor} />}
          {wi.outcome && <Field label="Outcome" value={wi.outcome} />}
          {wi.currentBehavior && <Field label="Current behavior" value={wi.currentBehavior} />}
          {wi.targetBehavior && <Field label="Target behavior" value={wi.targetBehavior} />}
        </Section>
      )}

      {/* Scope */}
      {(wi.entryPoints || wi.endToEndFlow) && (
        <Section title="Scope">
          {wi.entryPoints && <Field label="Entry points" value={wi.entryPoints} />}
          {wi.endToEndFlow && <Field label="End-to-end flow" value={wi.endToEndFlow} />}
        </Section>
      )}

      {/* Scope confidence — shown everywhere except a bare (unrefined) draft, to avoid noise */}
      {!(wi.status === 'draft' && wi.refinement.status === 'needs-refinement' && !wi.scopeConfidence) && (
        <Section title="Scope confidence">
          <ScopeConfidence level={wi.scopeConfidence?.level ?? null} reasons={wi.scopeConfidence?.reasons ?? []} />
        </Section>
      )}

      {/* Scope unknowns */}
      {wi.scopeUnknowns.length > 0 && (
        <Section title="Open scope questions">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {wi.scopeUnknowns.map((u, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, fontSize: 14 }}>
                <span aria-hidden style={{ color: 'var(--warning)' }}>⚠</span>
                <span>{u}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Affected modules */}
      {wi.affectedModules.length > 0 && (
        <Section title="Affected modules">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {wi.affectedModules.map((m) => (
              <span key={m} className="font-mono" style={{ fontSize: 13, padding: '3px 10px', borderRadius: 'var(--radius)', background: 'var(--surface-muted)', color: 'var(--foreground)' }}>{m}</span>
            ))}
          </div>
        </Section>
      )}

      {/* System impact (VS-101) — graph-assisted, confirmed classification */}
      <SystemImpact
        workItemId={wi.id}
        affected={wi.affectedSystemEntities}
        reviewed={wi.reviewedSystemEntities}
        graphRevision={wi.graphRevision}
        graphCoverage={wi.graphCoverage}
        refined={wi.refinement.status === 'refined'}
      />

      {/* Module coverage */}
      {wi.moduleCoverage.length > 0 && (
        <Section title="Module coverage"><ModuleCoverage entries={wi.moduleCoverage} /></Section>
      )}

      {/* Impact analysis */}
      {wi.impactAnalysis.length > 0 && (
        <Section title="Impact analysis"><ImpactAnalysis entries={wi.impactAnalysis} /></Section>
      )}

      {/* Acceptance criteria */}
      {wi.acceptanceCriteria.length > 0 && (
        <Section title="Acceptance criteria"><AcceptanceCriteria criteria={wi.acceptanceCriteria} completed={wi.status === 'completed'} /></Section>
      )}

      {/* Decisions */}
      {wi.decisions.length > 0 && (
        <Section title="Decisions">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {wi.decisions.map((d) => (
              <div key={d.id} style={{ fontSize: 14 }}>
                {d.knowledgeId && d.knowledgeLayer ? (
                  <button
                    onClick={() => router.navigate({ to: '/knowledge/$layer/$artifactId', params: { layer: d.knowledgeLayer!, artifactId: d.knowledgeId! } })}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--primary)', fontFamily: 'inherit', fontSize: 14 }}
                  >
                    <span className="font-mono" style={{ fontWeight: 600 }}>{d.id}</span>{d.title ? ` — ${d.title}` : ''}
                  </button>
                ) : (
                  <span><span className="font-mono" style={{ fontWeight: 600 }}>{d.id}</span>{d.title ? ` — ${d.title}` : ''}</span>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Related knowledge */}
      {wi.relatedKnowledge.length > 0 && (
        <Section title="Related knowledge">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {wi.relatedKnowledge.map((k) => (
              <button
                key={k.id}
                onClick={() => router.navigate({ to: '/knowledge/$layer/$artifactId', params: { layer: k.layer, artifactId: k.id } })}
                style={{ alignSelf: 'flex-start', background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--primary)', fontFamily: 'inherit', fontSize: 14 }}
              >
                {humanize(k.layer)} / {k.title} →
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* Implementation evidence */}
      {wi.implementationEvidence.length > 0 && (
        <Section title="Implementation evidence"><ImplementationEvidence repos={wi.implementationEvidence} /></Section>
      )}

      {/* Release gates */}
      {wi.releaseGates.length > 0 && (
        <Section title="Release gates"><ReleaseGates gates={wi.releaseGates} /></Section>
      )}

      {/* Completion exceptions */}
      {wi.completionExceptions.length > 0 && (
        <Section title="Completion exceptions">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {wi.completionExceptions.map((e) => (
              <div key={e.id} style={{ fontSize: 14, color: 'var(--foreground)' }}>
                {e.reason ?? humanize(e.id)}
                <span style={{ fontSize: 12, color: 'var(--foreground-muted)', marginLeft: 8 }}>({humanize(e.status)})</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Details */}
      <Section title="Details">
        <div style={{ display: 'grid', gridTemplateColumns: '120px minmax(0, 1fr)', gap: '10px 16px', fontSize: 13, alignItems: 'baseline' }}>
          <span style={{ color: 'var(--foreground-muted)' }}>ID</span>
          <span className="font-mono">{wi.id}</span>
          <span style={{ color: 'var(--foreground-muted)' }}>Type</span>
          <span>{presentWorkItemType(wi.type)}</span>
          <span style={{ color: 'var(--foreground-muted)' }}>Status</span>
          <span><WorkItemStatus status={wi.status} /></span>
          <span style={{ color: 'var(--foreground-muted)' }}>Path</span>
          <ArtifactPath path={wi.path} copyable />
          <span style={{ color: 'var(--foreground-muted)' }}>Source</span>
          <span>{wi.source.type === 'manual' || wi.source.type === 'unknown' ? 'Kaddo project' : humanize(wi.source.type)}</span>
        </div>
      </Section>

      {/* Provenance (VS-105) — rich origin display for externally-imported Work Items */}
      {wi.source.type === 'external' && (
        <Section title="External provenance">
          <div style={{ display: 'grid', gridTemplateColumns: '140px minmax(0, 1fr)', gap: '10px 16px', fontSize: 13, alignItems: 'baseline' }}>
            {wi.source.provider && (
              <>
                <span style={{ color: 'var(--foreground-muted)' }}>Provider</span>
                <span style={{ fontWeight: 500 }}>{humanize(wi.source.provider)}</span>
              </>
            )}
            {wi.source.id && (
              <>
                <span style={{ color: 'var(--foreground-muted)' }}>External ID</span>
                <span className="font-mono">{wi.source.id}</span>
              </>
            )}
            {wi.source.integration && (
              <>
                <span style={{ color: 'var(--foreground-muted)' }}>Integration</span>
                <span className="font-mono">{wi.source.integration}</span>
              </>
            )}
            {wi.source.imported_at && (
              <>
                <span style={{ color: 'var(--foreground-muted)' }}>Imported at</span>
                <span>{new Date(wi.source.imported_at).toLocaleString()}</span>
              </>
            )}
            {wi.source.external_updated_at && (
              <>
                <span style={{ color: 'var(--foreground-muted)' }}>External updated</span>
                <span>{new Date(wi.source.external_updated_at).toLocaleString()}</span>
              </>
            )}
            {wi.source.url && (
              <>
                <span style={{ color: 'var(--foreground-muted)' }}>External link</span>
                <a href={wi.source.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>
                  Open in provider &rarr;
                </a>
              </>
            )}
          </div>
        </Section>
      )}

      {/* Original snapshot (VS-105) — the state of the external item at import time */}
      {wi.originalSnapshot && (
        <Section title="Original snapshot">
          <div style={{ display: 'grid', gridTemplateColumns: '140px minmax(0, 1fr)', gap: '10px 16px', fontSize: 13, alignItems: 'baseline' }}>
            <span style={{ color: 'var(--foreground-muted)' }}>Title</span>
            <span>{wi.originalSnapshot.title}</span>
            {wi.originalSnapshot.description && (
              <>
                <span style={{ color: 'var(--foreground-muted)' }}>Description</span>
                <span style={{ whiteSpace: 'pre-wrap' }}>{wi.originalSnapshot.description}</span>
              </>
            )}
            {wi.originalSnapshot.type && (
              <>
                <span style={{ color: 'var(--foreground-muted)' }}>Type</span>
                <span>{wi.originalSnapshot.type}</span>
              </>
            )}
            {wi.originalSnapshot.status && (
              <>
                <span style={{ color: 'var(--foreground-muted)' }}>Status</span>
                <span>{wi.originalSnapshot.status}</span>
              </>
            )}
            {wi.originalSnapshot.labels?.length ? (
              <>
                <span style={{ color: 'var(--foreground-muted)' }}>Labels</span>
                <span>{wi.originalSnapshot.labels.join(', ')}</span>
              </>
            ) : null}
            {wi.originalSnapshot.assignee && (
              <>
                <span style={{ color: 'var(--foreground-muted)' }}>Assignee</span>
                <span>{wi.originalSnapshot.assignee}</span>
              </>
            )}
          </div>
        </Section>
      )}

      {/* Actions zone reserved for VS-099 (create / edit / refine) — intentionally empty. */}
    </div>
  )
}
