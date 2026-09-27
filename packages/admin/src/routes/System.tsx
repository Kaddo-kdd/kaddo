import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter, useSearch } from '@tanstack/react-router'
import {
  ReactFlow, ReactFlowProvider, Background, Controls, useReactFlow,
  type Node as RFNode, type Edge as RFEdge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { api } from '../lib/api'
import type { SystemMapProjection, SystemDimension } from '../lib/api'
import { SystemNode, SystemGroupNode } from '../components/system/SystemNode'
import { SystemDetails } from '../components/system/SystemDetails'
import { TopologyStatus } from '../components/system/TopologyStatus'
import { WorkItemImpactOverlay } from '../components/system/WorkItemImpactOverlay'
import {
  layoutSystemMap, toReactFlowNodes, toReactFlowEdges, searchNodes, nodeCategory, type ImpactClass,
} from '../lib/systemMap'
import { EmptyState } from '../components/EmptyState'

const NODE_TYPES = { system: SystemNode, systemGroup: SystemGroupNode }

function Skeleton() {
  return <div style={{ padding: 24 }}><div style={{ height: 'calc(100vh - 120px)', background: 'var(--surface-muted)', borderRadius: 'var(--radius)', animation: 'pulse 1.5s ease-in-out infinite' }} /><style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style></div>
}

const inputStyle = { padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)', color: 'var(--foreground)', fontSize: 13, fontFamily: 'inherit' } as const

function Canvas({ projection }: { projection: SystemMapProjection }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const search = useSearch({ from: '/system' }) as { node?: string; workItem?: string }
  const rf = useReactFlow()

  // Work Item impact overlay (VS-101). Read the canonical Work Item and classify its confirmed
  // system entities; the Graph highlights what was reviewed, it never decides scope here.
  const workItemId = search.workItem ?? null
  const { data: overlayWi } = useQuery({
    queryKey: ['work-item', workItemId],
    queryFn: () => api.getWorkItem(workItemId!),
    enabled: workItemId != null,
    retry: false,
  })
  const impactMap = useMemo<Map<string, ImpactClass> | undefined>(() => {
    if (!workItemId || !overlayWi) return undefined
    const m = new Map<string, ImpactClass>()
    for (const e of overlayWi.affectedSystemEntities) m.set(e.nodeId, 'affected')
    for (const r of overlayWi.reviewedSystemEntities) if (!m.has(r.nodeId)) m.set(r.nodeId, r.status === 'unknown' ? 'unknown' : 'reviewed')
    return m
  }, [workItemId, overlayWi])

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(search.node ?? null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [moduleFilter, setModuleFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  // Topology-first: System (base) + Knowledge + Delivery on; Implementation artifacts off so files
  // don't dominate. Unknown stays visible so nothing is silently dropped.
  const [overlays, setOverlays] = useState<Record<SystemDimension, boolean>>({
    system: true, knowledge: true, delivery: true, implementation: false, unknown: true,
  })

  const types = useMemo(() => [...new Set(projection.nodes.map((n) => n.type))].sort(), [projection])

  const filtered = useMemo<SystemMapProjection>(() => {
    const nodes = projection.nodes.filter((n) =>
      overlays[n.dimension] &&
      (moduleFilter === 'all' || n.moduleId === moduleFilter) &&
      (typeFilter === 'all' || n.type === typeFilter),
    )
    const kept = new Set(nodes.map((n) => n.id))
    return {
      ...projection,
      nodes,
      relationships: projection.relationships.filter((r) => kept.has(r.source) && kept.has(r.target)),
    }
  }, [projection, moduleFilter, typeFilter, overlays])

  const toggle = (d: SystemDimension) => setOverlays((o) => ({ ...o, [d]: !o[d] }))
  const overlayControl = (d: SystemDimension, label: string) => (
    <label style={{ display: 'inline-flex', gap: 5, alignItems: 'center', fontSize: 12, cursor: 'pointer', color: 'var(--foreground-muted)' }}>
      <input type="checkbox" checked={overlays[d]} onChange={() => toggle(d)} aria-label={`Toggle ${label}`} />{label}
    </label>
  )

  const layout = useMemo(() => layoutSystemMap(filtered), [filtered])
  const rfNodes = useMemo<RFNode[]>(() => toReactFlowNodes(filtered, layout, selectedNodeId, impactMap), [filtered, layout, selectedNodeId, impactMap])
  const rfEdges = useMemo<RFEdge[]>(() => toReactFlowEdges(filtered, selectedNodeId), [filtered, selectedNodeId])

  const focus = (id: string) => {
    const pos = layout.positions.get(id)
    if (pos) rf.setCenter(pos.x + 95, pos.y + 29, { zoom: 1.2, duration: 400 })
  }

  // Deep-link: focus the node from ?node= once the layout is ready.
  useEffect(() => {
    if (search.node && layout.positions.has(search.node)) {
      setSelectedNodeId(search.node)
      const t = setTimeout(() => focus(search.node!), 100)
      return () => clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Impact overlay: fit the view to the impacted entities so the Work Item's scope is centered,
  // while unrelated nodes stay dimmed (not removed) for context. Runs once the impact map resolves.
  useEffect(() => {
    if (!impactMap || impactMap.size === 0) return
    const ids = [...impactMap.keys()].filter((id) => layout.positions.has(id))
    if (ids.length === 0) return
    const t = setTimeout(() => rf.fitView({ nodes: ids.map((id) => ({ id })), duration: 500, padding: 0.3, maxZoom: 1.4 }), 120)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [impactMap, layout])

  const selectNode = (id: string) => {
    setSelectedNodeId(id); setSelectedEdgeId(null)
    router.navigate({ to: '/system', search: { node: id, workItem: workItemId ?? undefined }, replace: true })
    focus(id)
  }

  const searchResults = query.trim() ? searchNodes(filtered.nodes, query).slice(0, 8) : []

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 56px)' }}>
      <div style={{ flex: 1, minWidth: 0, position: 'relative', display: 'flex', flexDirection: 'column' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 10, padding: '12px 16px', borderBottom: '1px solid var(--border)', alignItems: 'center', flexWrap: 'wrap', position: 'relative', zIndex: 5, background: 'var(--background)' }}>
          <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 180 }}>
            <input type="search" placeholder="Search system…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search system" style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
            {searchResults.length > 0 && (
              <ul style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, listStyle: 'none', padding: 4, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', zIndex: 10, maxHeight: 260, overflowY: 'auto' }}>
                {searchResults.map((n) => (
                  <li key={n.id}>
                    <button onClick={() => { selectNode(n.id); setQuery('') }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 8px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--foreground)', fontFamily: 'inherit', fontSize: 13 }}>
                      {n.label} <span style={{ color: 'var(--foreground-muted)', fontSize: 11 }}>· {nodeCategory(n.type).label}{n.moduleId ? ` · ${n.moduleId}` : ''}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {projection.groups.length > 0 && (
            <select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)} aria-label="Filter by module" style={inputStyle}>
              <option value="all">All modules</option>
              {projection.groups.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
            </select>
          )}
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} aria-label="Filter by type" style={inputStyle}>
            <option value="all">All types</option>
            {types.map((t) => <option key={t} value={t}>{nodeCategory(t).label}</option>)}
          </select>
          <div style={{ display: 'inline-flex', gap: 12, alignItems: 'center', paddingLeft: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3, color: 'var(--foreground-muted)' }}>Show</span>
            {overlayControl('knowledge', 'Knowledge')}
            {overlayControl('delivery', 'Delivery')}
            {overlayControl('implementation', 'Implementation')}
          </div>
          <span style={{ fontSize: 12, color: 'var(--foreground-muted)' }}>
            {filtered.nodes.length} nodes · {filtered.relationships.length} relationships · coverage {projection.metadata.coverage}
          </span>
          <button onClick={() => queryClient.invalidateQueries({ queryKey: ['system-map'] })} style={{ ...inputStyle, cursor: 'pointer', color: 'var(--foreground-muted)' }}>↻ Refresh</button>
        </div>

        <TopologyStatus metadata={projection.metadata} />

        {workItemId && (
          <WorkItemImpactOverlay
            workItemId={workItemId}
            wi={overlayWi ?? null}
            topologyStatus={projection.metadata.topologyStatus}
            onClear={() => router.navigate({ to: '/system', search: {}, replace: true })}
            onSelectNode={selectNode}
          />
        )}

        {filtered.nodes.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--foreground-muted)', fontSize: 14 }}>No nodes match these filters.</div>
        ) : (
          <div style={{ flex: 1 }}>
            <ReactFlow
              nodes={rfNodes}
              edges={rfEdges}
              nodeTypes={NODE_TYPES}
              onNodeClick={(_, n) => { if (n.type === 'system') selectNode(n.id) }}
              onEdgeClick={(_, e) => { setSelectedEdgeId(e.id); setSelectedNodeId(null) }}
              onPaneClick={() => { setSelectedNodeId(null); setSelectedEdgeId(null) }}
              fitView
              minZoom={0.2}
              proOptions={{ hideAttribution: true }}
            >
              <Background color="var(--border)" gap={20} />
              <Controls showInteractive={false} />
            </ReactFlow>
          </div>
        )}
      </div>

      {(selectedNodeId || selectedEdgeId) && (
        <SystemDetails
          projection={projection}
          selectedNodeId={selectedNodeId}
          selectedEdgeId={selectedEdgeId}
          onClose={() => { setSelectedNodeId(null); setSelectedEdgeId(null) }}
          onSelectNode={selectNode}
        />
      )}
    </div>
  )
}

export function System() {
  const queryClient = useQueryClient()
  const { data, isLoading, error } = useQuery({ queryKey: ['system-map'], queryFn: api.getSystemMap, refetchOnWindowFocus: false })

  if (isLoading) return <Skeleton />
  if (error) return (
    <div style={{ padding: 24 }}>
      <div style={{ background: 'color-mix(in srgb, var(--danger) 10%, transparent)', border: '1px solid var(--danger)', borderRadius: 'var(--radius)', padding: 16 }}>
        <strong>System map could not be loaded</strong>
        <p style={{ margin: '4px 0 8px', fontSize: 14, color: 'var(--foreground-muted)' }}>The project remains available, but Kaddo could not build the current System Map.</p>
        <button onClick={() => queryClient.invalidateQueries({ queryKey: ['system-map'] })} style={{ ...inputStyle, cursor: 'pointer' }}>Retry</button>
      </div>
    </div>
  )
  if (!data || !data.metadata.available) return (
    <EmptyState
      icon="🗺️"
      title="System map not available yet"
      description="Kaddo does not have enough system metadata to build a System Map for this project yet. Review the project Knowledge and graph metadata to enrich the map."
    />
  )

  return (
    <ReactFlowProvider>
      <Canvas projection={data} />
    </ReactFlowProvider>
  )
}
