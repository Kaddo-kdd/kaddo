import { useState, useMemo } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { api } from '../lib/api'
import type { EnrichedExternalWorkItem, ExternalWorkItemFilters, DiscoveryIntegrationResult, ImportPreviewResult } from '../lib/api'

const btnStyle: React.CSSProperties = { padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)', color: 'var(--foreground)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }
const primaryBtnStyle: React.CSSProperties = { ...btnStyle, background: 'var(--primary)', color: 'var(--primary-foreground, #fff)', fontWeight: 600 }
const inputStyle: React.CSSProperties = { padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)', color: 'var(--foreground)', fontSize: 13, fontFamily: 'inherit' }
const cardStyle: React.CSSProperties = { border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16, background: 'var(--surface)' }
const chipStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 500, background: 'var(--surface-muted)', color: 'var(--foreground-muted)' }

function TypeBadge({ type }: { type?: string }) {
  if (!type) return null
  const colors: Record<string, string> = { Feature: 'var(--primary)', Bug: 'var(--danger)', Task: 'var(--foreground-muted)', Epic: 'var(--warning)' }
  return <span style={{ ...chipStyle, borderLeft: `3px solid ${colors[type] ?? 'var(--foreground-muted)'}` }}>{type}</span>
}

function StatusBadge({ status }: { status?: string }) {
  if (!status) return null
  const colors: Record<string, string> = { Open: 'var(--primary)', 'To Do': 'var(--foreground-muted)', 'In Progress': 'var(--warning)', Done: 'var(--success)' }
  return (
    <span style={{ ...chipStyle }}>
      <span style={{ width: 6, height: 6, borderRadius: 6, background: colors[status] ?? 'var(--foreground-muted)' }} />
      {status}
    </span>
  )
}

function FilterBar({ filters, onChange, onRefresh, loading }: { filters: ExternalWorkItemFilters; onChange: (f: ExternalWorkItemFilters) => void; onRefresh: () => void; loading: boolean }) {
  const [search, setSearch] = useState(filters.search ?? '')

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') onChange({ ...filters, search: search.trim() || undefined }) }}
        placeholder="Search items…"
        style={{ ...inputStyle, width: 260 }}
      />
      <button onClick={() => onChange({ ...filters, search: search.trim() || undefined })} style={btnStyle}>Search</button>
      <button onClick={onRefresh} disabled={loading} style={btnStyle}>{loading ? 'Refreshing…' : 'Refresh'}</button>
      {(filters.statuses?.length || filters.types?.length || filters.labels?.length || filters.search) && (
        <button onClick={() => { setSearch(''); onChange({}) }} style={{ ...btnStyle, color: 'var(--foreground-muted)', fontSize: 12 }}>Clear filters</button>
      )}
    </div>
  )
}

function ImportPanel({ integrationId, item, onClose }: { integrationId: string; item: EnrichedExternalWorkItem; onClose: () => void }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [type, setType] = useState('')
  const { data: types } = useQuery({ queryKey: ['capture-def'], queryFn: () => api.getCaptureDefinition() })
  const { data: preview, isLoading } = useQuery<ImportPreviewResult>({
    queryKey: ['import-preview', integrationId, item.externalId],
    queryFn: () => api.getImportPreview(integrationId, item.externalId),
    retry: false,
  })
  const doImport = useMutation({
    mutationFn: () => api.importExternalWorkItem(integrationId, item.externalId, type),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['discover'] })
      router.navigate({ to: '/work-items/$workItemId', params: { workItemId: res.workItemId } })
    },
  })

  return (
    <div style={{ ...cardStyle, marginTop: 10, marginLeft: 16, borderLeft: '3px solid var(--primary)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>Import: {item.title}</h4>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--foreground-muted)', fontSize: 13 }}>✕</button>
      </div>
      {isLoading && <p style={{ fontSize: 13, color: 'var(--foreground-muted)' }}>Loading preview…</p>}
      {preview?.duplicate ? (
        <div style={{ marginTop: 8 }}>
          <p style={{ fontSize: 13 }}>Already imported as <strong className="font-mono">{preview.duplicate.workItemId}</strong>.</p>
          <button onClick={() => router.navigate({ to: '/work-items/$workItemId', params: { workItemId: preview.duplicate!.workItemId } })} style={btnStyle}>View Work Item</button>
        </div>
      ) : preview ? (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 12, color: 'var(--foreground-muted)' }}>Source: {preview.preview.source.provider} · {preview.preview.source.externalId}</div>
          <select value={type} onChange={(e) => setType(e.target.value)} style={{ ...inputStyle, width: 'auto', alignSelf: 'flex-start' }}>
            <option value="">Choose Kaddo Work Item type…</option>
            {(types?.types ?? []).map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <p style={{ fontSize: 11, color: 'var(--foreground-muted)', margin: 0 }}>No project files have been modified yet.</p>
          <div>
            <button disabled={!type || doImport.isPending} onClick={() => doImport.mutate()} style={type ? primaryBtnStyle : btnStyle}>
              {doImport.isPending ? 'Importing…' : 'Import as Draft'}
            </button>
          </div>
          {doImport.isError && <p style={{ fontSize: 12, color: 'var(--danger)' }}>{(doImport.error as Error).message}</p>}
        </div>
      ) : null}
    </div>
  )
}

function ImportedBadge({ workItemId }: { workItemId: string }) {
  const router = useRouter()
  return (
    <button
      onClick={() => router.navigate({ to: '/work-items/$workItemId', params: { workItemId } })}
      style={{ ...chipStyle, cursor: 'pointer', border: '1px solid var(--success)', background: 'color-mix(in srgb, var(--success) 12%, transparent)', color: 'var(--success)', fontWeight: 600, fontSize: 11, gap: 4 }}
    >
      Imported &rarr; {workItemId}
    </button>
  )
}

function ExternalItemRow({ item, integrationId, integrationName, icon }: { item: EnrichedExternalWorkItem; integrationId: string; integrationName: string; icon?: string }) {
  const [importing, setImporting] = useState(false)
  const imported = item.importState.imported

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: imported ? 'color-mix(in srgb, var(--success) 4%, var(--surface))' : 'var(--surface)' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span className="font-mono" style={{ fontSize: 11, color: 'var(--foreground-muted)', flexShrink: 0 }}>{item.externalId}</span>
            <span style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</span>
            {item.importState.imported && <ImportedBadge workItemId={item.importState.workItemId} />}
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <TypeBadge type={item.type} />
            <StatusBadge status={item.status} />
            {item.labels?.map((l) => <span key={l} style={{ ...chipStyle, fontSize: 10 }}>{l}</span>)}
            <span style={{ fontSize: 11, color: 'var(--foreground-muted)' }}>{icon ? `${icon} ` : ''}{integrationName}</span>
            {item.assignees?.length ? (
              <span style={{ fontSize: 11, color: 'var(--foreground-muted)' }}>{item.assignees.map((a) => a.name).join(', ')}</span>
            ) : null}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ ...btnStyle, textDecoration: 'none', fontSize: 12 }}>Open</a>}
          {!imported && <button onClick={() => setImporting(!importing)} style={btnStyle}>{importing ? 'Cancel' : 'Import'}</button>}
        </div>
      </div>
      {importing && <ImportPanel integrationId={integrationId} item={item} onClose={() => setImporting(false)} />}
    </div>
  )
}

function IntegrationSection({ result }: { result: DiscoveryIntegrationResult }) {
  if (result.error) {
    return (
      <div style={{ ...cardStyle, borderLeft: '3px solid var(--danger)', marginBottom: 12 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{result.displayName} <span style={{ fontWeight: 400, fontSize: 12, color: 'var(--danger)' }}>Error</span></div>
        <p style={{ fontSize: 13, color: 'var(--danger)', margin: '4px 0 0' }}>{result.error}</p>
      </div>
    )
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>{result.displayName}</span>
        <span style={{ ...chipStyle }}>{result.items.length} item{result.items.length !== 1 ? 's' : ''}{result.hasMore ? '+' : ''}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {result.items.map((item) => (
          <ExternalItemRow
            key={`${result.integrationId}-${item.externalId}`}
            item={item}
            integrationId={result.integrationId}
            integrationName={result.displayName}
            icon={result.icon}
          />
        ))}
      </div>
    </div>
  )
}

export function ExternalWorkItems() {
  const [filters, setFilters] = useState<ExternalWorkItemFilters>({})

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['discover', filters],
    queryFn: () => api.discoverExternalWorkItems({ filters, pageSize: 50 }),
    retry: false,
  })

  const allItems = useMemo(() => {
    if (!data) return []
    return data.results.flatMap((r) => r.items.map((item) => ({ ...item, _integrationId: r.integrationId, _integrationName: r.displayName, _icon: r.icon })))
  }, [data])

  const uniqueTypes = useMemo(() => [...new Set(allItems.map((i) => i.type).filter(Boolean))].sort(), [allItems])
  const uniqueStatuses = useMemo(() => [...new Set(allItems.map((i) => i.status).filter(Boolean))].sort(), [allItems])

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>External Work Items</h2>
        <p style={{ fontSize: 14, color: 'var(--foreground-muted)', margin: 0 }}>
          Discover items from all enabled integrations. Read-only — import creates a Draft Work Item through human confirmation.
        </p>
      </div>

      <FilterBar filters={filters} onChange={setFilters} onRefresh={() => refetch()} loading={isLoading} />

      {uniqueTypes.length > 0 && (
        <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--foreground-muted)', lineHeight: '24px' }}>Types:</span>
          {uniqueTypes.map((t) => (
            <button
              key={t}
              onClick={() => {
                const cur = filters.types ?? []
                setFilters({ ...filters, types: cur.includes(t!) ? cur.filter((x) => x !== t) : [...cur, t!] })
              }}
              style={{ ...chipStyle, cursor: 'pointer', border: '1px solid var(--border)', background: filters.types?.includes(t!) ? 'var(--primary)' : 'var(--surface)', color: filters.types?.includes(t!) ? 'var(--primary-foreground, #fff)' : 'var(--foreground-muted)' }}
            >
              {t}
            </button>
          ))}
        </div>
      )}
      {uniqueStatuses.length > 0 && (
        <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--foreground-muted)', lineHeight: '24px' }}>Statuses:</span>
          {uniqueStatuses.map((s) => (
            <button
              key={s}
              onClick={() => {
                const cur = filters.statuses ?? []
                setFilters({ ...filters, statuses: cur.includes(s!) ? cur.filter((x) => x !== s) : [...cur, s!] })
              }}
              style={{ ...chipStyle, cursor: 'pointer', border: '1px solid var(--border)', background: filters.statuses?.includes(s!) ? 'var(--primary)' : 'var(--surface)', color: filters.statuses?.includes(s!) ? 'var(--primary-foreground, #fff)' : 'var(--foreground-muted)' }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {isLoading && <p style={{ color: 'var(--foreground-muted)' }}>Discovering work items across integrations…</p>}
      {error && <p style={{ color: 'var(--danger)' }}>{(error as Error).message}</p>}

      {data && data.totalItems === 0 && data.results.every((r) => !r.error) && (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--foreground-muted)', border: '1px dashed var(--border)', borderRadius: 'var(--radius)' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
          <p style={{ fontSize: 14, margin: 0 }}>No external work items found. Check that integrations are configured and enabled.</p>
        </div>
      )}

      {data && (
        <div style={{ fontSize: 12, color: 'var(--foreground-muted)', marginBottom: 12 }}>
          {data.totalItems} item{data.totalItems !== 1 ? 's' : ''} from {data.results.length} integration{data.results.length !== 1 ? 's' : ''}
        </div>
      )}

      {data?.results.map((r) => <IntegrationSection key={r.integrationId} result={r} />)}
    </div>
  )
}
