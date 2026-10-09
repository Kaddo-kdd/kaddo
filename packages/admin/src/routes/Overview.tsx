import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { api } from '../lib/api'
import { ReadinessBadge } from '../components/ReadinessBadge'
import { KnowledgeRow } from '../components/KnowledgeRow'
import { ModuleBadge } from '../components/ModuleBadge'
import { EmptyState } from '../components/EmptyState'
import { NextAction } from '../components/NextAction'
import { SummaryCard } from '../components/SummaryCard'
import { ProjectRouteSummary } from '../components/ProjectRouteSummary'
import { FindingSummary } from '../components/FindingSummary'
import { PocFinalReport } from '../components/PocFinalReport'
import {
  presentStructure,
  presentKnowledgeCount,
  presentWorkItemsSummary,
  presentModulesSummary,
  presentFindingsSummary,
} from '../lib/presentation'

function Skeleton() {
  return (
    <div style={{ padding: 24 }}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{
          height: 120,
          background: 'var(--surface-muted)',
          borderRadius: 'var(--radius)',
          marginBottom: 16,
          animation: 'pulse 1.5s ease-in-out infinite',
        }} />
      ))}
      <style>{`@keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.5 } }`}</style>
    </div>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: 20,
    }}>
      <h3 style={{ fontSize: 12, fontWeight: 600, color: 'var(--foreground-muted)', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: 0.3 }}>
        {title}
      </h3>
      {children}
    </div>
  )
}

export function Overview() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const { data, isLoading, error } = useQuery({
    queryKey: ['overview'],
    queryFn: api.getOverview,
    refetchOnWindowFocus: true,
  })
  const { mutate: updateMode, isPending: isUpdatingMode } = useMutation({
    mutationFn: api.updateProjectMode,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['overview'] }),
  })

  if (isLoading) return <Skeleton />
  if (error) return (
    <div style={{ padding: 24 }}>
      <div style={{ background: 'color-mix(in srgb, var(--danger) 10%, transparent)', border: '1px solid var(--danger)', borderRadius: 'var(--radius)', padding: 16 }}>
        <strong>Error loading project</strong>
        <p style={{ margin: '4px 0 0', fontSize: 14 }}>{error.message}</p>
      </div>
    </div>
  )
  if (!data) return <EmptyState title="No project data" description="Could not load project information." />

  const { project, knowledge, workItems, modules, readiness, route, findings, pocReport } = data
  const knowledgeCount = presentKnowledgeCount(knowledge.layers)
  const findingsPresentation = presentFindingsSummary(findings.blocking, findings.warning, findings.fyi)

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Project header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>{project.name}</h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="font-mono" style={{ fontSize: 13, color: 'var(--foreground-muted)' }}>
              {presentStructure(project.structure)}
            </span>
            <span style={{ color: 'var(--border-strong)' }}>&middot;</span>
            <select
              aria-label="Project mode"
              value={project.mode}
              disabled={isUpdatingMode}
              onChange={(event) => updateMode(event.target.value as 'standard' | 'poc')}
              style={{ fontSize: 12, fontFamily: 'inherit', color: 'var(--foreground-muted)', border: '1px solid var(--border)', background: 'var(--surface)', borderRadius: 4, padding: '3px 6px' }}
            >
              <option value="standard">Standard</option>
              <option value="poc">POC</option>
            </select>
            {project.mode === 'poc' && <span style={{ fontSize: 12, color: 'var(--foreground-muted)' }}>Evidence-led experiment</span>}
            <span style={{ color: 'var(--border-strong)' }}>&middot;</span>
            <ReadinessBadge status={readiness.overall} />
          </div>
        </div>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['overview'] })}
          aria-label="Refresh overview"
          style={{
            padding: '8px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
            background: 'var(--surface)', color: 'var(--foreground-muted)', cursor: 'pointer',
            fontSize: 13, fontFamily: 'inherit',
          }}
        >
          ↻ Refresh
        </button>
      </div>

      {/* Next Action */}
      <NextAction readiness={readiness} />

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
        <div onClick={() => router.navigate({ to: '/knowledge' })} style={{ cursor: 'pointer' }}>
          <SummaryCard
            title="Knowledge"
            value={`${knowledgeCount.ready}/${knowledgeCount.total}`}
            subtitle="Layers ready"
          />
        </div>
        <div onClick={() => router.navigate({ to: '/work-items' })} style={{ cursor: 'pointer' }}>
          <SummaryCard
            title="Work Items"
            value={workItems.total}
            subtitle={presentWorkItemsSummary(workItems.byState, workItems.total)}
          />
        </div>
        <SummaryCard
          title="Modules"
          value={modules.modules.length}
          subtitle={presentModulesSummary(modules.modules.length)}
        />
        <SummaryCard
          title="Findings"
          value={findingsPresentation.total}
          subtitle={findingsPresentation.label}
        />
      </div>

      {/* Project Route (compact, expandable) */}
      <div style={{ marginBottom: 16 }}>
        <ProjectRouteSummary
          completed={route.completed}
          total={route.total}
          progressPercent={route.progressPercent}
          steps={route.steps}
        />
      </div>

      {/* Findings (compact, expandable) */}
      <div style={{ marginBottom: 16 }}>
        <FindingSummary
          blocking={findings.blocking}
          warning={findings.warning}
          fyi={findings.fyi}
          items={findings.items}
        />
      </div>

      {project.mode === 'poc' && pocReport && <PocFinalReport report={pocReport} />}

      {/* Knowledge layers + Modules */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 16 }}>
        <SectionCard title="Knowledge">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {knowledge.layers.map((l) => (
              <KnowledgeRow key={l.layer} layer={l.layer} status={l.status} navigable />
            ))}
          </div>
        </SectionCard>

        {modules.modules.length > 0 && (
          <SectionCard title="Modules">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {modules.modules.map((m) => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14 }}>
                  <div>
                    <span className="font-mono" style={{ fontWeight: 600 }}>{m.id}</span>
                    {m.path && <span style={{ color: 'var(--foreground-muted)', marginLeft: 8, fontSize: 12 }}>{m.path}</span>}
                  </div>
                  <ModuleBadge role={m.role} available={m.available} />
                </div>
              ))}
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  )
}
