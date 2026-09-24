import { useState } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { api } from '../lib/api'
import type { IntegrationSummary, AdapterTypeInfo, ExternalWorkItem, ImportPreviewResult, ConfigFieldSchema } from '../lib/api'

// --- Provider Icon -----------------------------------------------------------

const PROVIDER_ICONS: Record<string, string> = {
  mock: '🧪', jira: '🟦', github: '🐙', 'azure-devops': '🔷', linear: '🟣', gitlab: '🦊',
}

function ProviderIcon({ icon, size = 32 }: { icon?: string; size?: number }) {
  const emoji = icon ? PROVIDER_ICONS[icon] ?? '🔌' : '🔌'
  return <span style={{ fontSize: size, lineHeight: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size + 8, height: size + 8 }}>{emoji}</span>
}

// --- Shared styles -----------------------------------------------------------

const STATUS_TONE: Record<string, string> = {
  available: 'var(--success)', configured: 'var(--foreground-muted)', unauthorized: 'var(--danger)',
  unavailable: 'var(--warning)', 'invalid-config': 'var(--danger)', disabled: 'var(--foreground-muted)',
}
function StatusBadge({ status }: { status: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--foreground)' }}>
      <span aria-hidden style={{ width: 8, height: 8, borderRadius: 8, background: STATUS_TONE[status] ?? 'var(--foreground-muted)' }} />{status}
    </span>
  )
}

function Cap({ on, label }: { on: boolean; label: string }) {
  return <span style={{ fontSize: 12, color: on ? 'var(--foreground)' : 'var(--foreground-muted)' }}>{on ? '✓' : '✗'} {label}</span>
}

const btnStyle: React.CSSProperties = { padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)', color: 'var(--foreground)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }
const primaryBtnStyle: React.CSSProperties = { ...btnStyle, background: 'var(--primary)', color: 'var(--primary-foreground, #fff)', fontWeight: 600 }
const dangerBtnStyle: React.CSSProperties = { ...btnStyle, color: 'var(--danger)', borderColor: 'var(--danger)' }
const inputStyle: React.CSSProperties = { padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)', color: 'var(--foreground)', fontSize: 13, fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' as const }
const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: 'var(--foreground)', marginBottom: 4, display: 'block' }
const cardStyle: React.CSSProperties = { border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16, background: 'var(--surface)' }

// --- Dynamic Field -----------------------------------------------------------

function DynamicField({ name, schema, value, onChange }: { name: string; schema: ConfigFieldSchema; value: unknown; onChange: (v: unknown) => void }) {
  if (schema.type === 'select' && schema.options) {
    return (
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>{schema.label}{schema.required && ' *'}</label>
        {schema.description && <div style={{ fontSize: 12, color: 'var(--foreground-muted)', marginBottom: 4 }}>{schema.description}</div>}
        <select value={String(value ?? schema.defaultValue ?? '')} onChange={(e) => onChange(e.target.value)} style={inputStyle}>
          <option value="">Choose…</option>
          {schema.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    )
  }
  if (schema.type === 'multi-select' && schema.options) {
    const selected = Array.isArray(value) ? (value as string[]) : []
    return (
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>{schema.label}{schema.required && ' *'}</label>
        {schema.description && <div style={{ fontSize: 12, color: 'var(--foreground-muted)', marginBottom: 4 }}>{schema.description}</div>}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {schema.options.map((o) => {
            const on = selected.includes(o.value)
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => onChange(on ? selected.filter((v) => v !== o.value) : [...selected, o.value])}
                style={{ ...btnStyle, background: on ? 'var(--primary)' : 'var(--surface)', color: on ? 'var(--primary-foreground, #fff)' : 'var(--foreground)', fontWeight: on ? 600 : 400 }}
              >
                {o.label}
              </button>
            )
          })}
        </div>
      </div>
    )
  }
  if (schema.type === 'boolean') {
    return (
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" checked={Boolean(value ?? schema.defaultValue)} onChange={(e) => onChange(e.target.checked)} id={`field-${name}`} />
        <label htmlFor={`field-${name}`} style={{ fontSize: 13, fontWeight: 600 }}>{schema.label}</label>
        {schema.description && <span style={{ fontSize: 12, color: 'var(--foreground-muted)' }}>{schema.description}</span>}
      </div>
    )
  }
  if (schema.type === 'password') {
    return (
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>{schema.label}{schema.required && ' *'}</label>
        {schema.description && <div style={{ fontSize: 12, color: 'var(--foreground-muted)', marginBottom: 4 }}>{schema.description}</div>}
        <input type="password" value={String(value ?? '')} placeholder={schema.placeholder} onChange={(e) => onChange(e.target.value)} style={inputStyle} />
      </div>
    )
  }
  const inputType = schema.type === 'url' ? 'url' : schema.type === 'number' ? 'number' : 'text'
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={labelStyle}>{schema.label}{schema.required && ' *'}</label>
      {schema.description && <div style={{ fontSize: 12, color: 'var(--foreground-muted)', marginBottom: 4 }}>{schema.description}</div>}
      <input
        type={inputType}
        value={String(value ?? '')}
        placeholder={schema.placeholder}
        onChange={(e) => onChange(schema.type === 'number' ? Number(e.target.value) : e.target.value)}
        style={inputStyle}
      />
    </div>
  )
}

// --- Secret Field (edit mode) ------------------------------------------------

function SecretField({ schema, configured, onSave }: { name: string; schema: ConfigFieldSchema; configured: boolean; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState('')

  if (!editing) {
    return (
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>{schema.label}{schema.required && ' *'}</label>
        {schema.description && <div style={{ fontSize: 12, color: 'var(--foreground-muted)', marginBottom: 4 }}>{schema.description}</div>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: configured ? 'var(--success)' : 'var(--warning)' }}>
            {configured ? 'Configured' : 'Not configured'}
          </span>
          <button onClick={() => { setEditing(true); setVal('') }} style={btnStyle}>{configured ? 'Replace' : 'Set'}</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <label style={labelStyle}>{schema.label}{schema.required && ' *'}</label>
      <div style={{ display: 'flex', gap: 8 }}>
        <input type="password" value={val} onChange={(e) => setVal(e.target.value)} placeholder="Enter value…" style={{ ...inputStyle, flex: 1 }} />
        <button disabled={!val.trim()} onClick={() => { onSave(val); setEditing(false); setVal('') }} style={primaryBtnStyle}>Save</button>
        <button onClick={() => setEditing(false)} style={btnStyle}>Cancel</button>
      </div>
    </div>
  )
}

// --- Provider Catalog (VS-103A) ----------------------------------------------

function ProviderCatalog({ types, onSelect, onCancel }: { types: AdapterTypeInfo[]; onSelect: (t: AdapterTypeInfo) => void; onCancel: () => void }) {
  return (
    <div style={{ ...cardStyle, marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Add Integration</h3>
        <button onClick={onCancel} style={{ ...btnStyle, border: 'none', background: 'none', color: 'var(--foreground-muted)' }}>✕</button>
      </div>
      <p style={{ fontSize: 13, color: 'var(--foreground-muted)', margin: '0 0 16px' }}>Choose a provider from the Integration Registry:</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
        {types.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelect(t)}
            style={{
              ...cardStyle,
              cursor: 'pointer',
              textAlign: 'center' as const,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              padding: '20px 16px',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <ProviderIcon icon={t.icon} size={36} />
            <div style={{ fontWeight: 700, fontSize: 15 }}>{t.displayName}</div>
            {t.description && <div style={{ fontSize: 12, color: 'var(--foreground-muted)', lineHeight: 1.4 }}>{t.description}</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <Cap on={t.capabilities.workItems.read} label="Read" />
              <Cap on={t.capabilities.workItems.list} label="List" />
              <Cap on={t.capabilities.workItems.import} label="Import" />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// --- Create Integration Panel (VS-103A) --------------------------------------

function CreateIntegrationPanel({ onCreated, onCancel }: { onCreated: () => void; onCancel: () => void }) {
  const queryClient = useQueryClient()
  const { data: types } = useQuery({ queryKey: ['integration-types'], queryFn: () => api.getIntegrationTypes() })
  const [selectedType, setSelectedType] = useState<AdapterTypeInfo | null>(null)
  const [id, setId] = useState('')
  const [config, setConfig] = useState<Record<string, unknown>>({})
  const [secrets, setSecrets] = useState<Record<string, string>>({})
  const [verifyResult, setVerifyResult] = useState<{ status: string; message?: string } | null>(null)
  const [verifying, setVerifying] = useState(false)

  const createMut = useMutation({
    mutationFn: () => api.createIntegration({ id: id.trim(), adapter: selectedType!.id, config }),
    onSuccess: async (result) => {
      for (const [name, value] of Object.entries(secrets)) {
        if (value.trim()) await api.setIntegrationSecret(result.id, name, value)
      }
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
      onCreated()
    },
  })

  if (!types) return <div style={{ ...cardStyle, marginBottom: 16 }}><p style={{ fontSize: 13, color: 'var(--foreground-muted)' }}>Loading providers…</p></div>

  if (!selectedType) {
    return <ProviderCatalog types={types} onSelect={(t) => { setSelectedType(t); setId(''); setConfig({}); setSecrets({}); setVerifyResult(null) }} onCancel={onCancel} />
  }

  const configSchema = selectedType.configSchema
  const secretSchema = selectedType.secretSchema
  const canSave = id.trim() && /^[a-z0-9][a-z0-9._-]*$/i.test(id.trim())

  const handleVerify = async () => {
    setVerifying(true)
    setVerifyResult(null)
    try {
      const created = await api.createIntegration({ id: id.trim(), adapter: selectedType.id, config })
      for (const [name, value] of Object.entries(secrets)) {
        if (value.trim()) await api.setIntegrationSecret(created.id, name, value)
      }
      const res = await api.getIntegrationStatus(created.id)
      setVerifyResult({ status: res.status, message: res.message })
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
      if (res.status === 'available') {
        onCreated()
      } else {
        await api.deleteIntegration(created.id)
      }
    } catch (err) {
      setVerifyResult({ status: 'error', message: (err as Error).message })
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div style={{ ...cardStyle, marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ProviderIcon icon={selectedType.icon} size={24} />
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{selectedType.displayName} Integration</h3>
        </div>
        <button onClick={() => setSelectedType(null)} style={{ ...btnStyle, border: 'none', background: 'none', color: 'var(--foreground-muted)', fontSize: 12 }}>← Back</button>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Integration ID *</label>
        <div style={{ fontSize: 12, color: 'var(--foreground-muted)', marginBottom: 4 }}>A unique identifier (alphanumeric, dashes, dots).</div>
        <input value={id} onChange={(e) => setId(e.target.value)} placeholder="e.g. company-jira" style={inputStyle} />
      </div>

      {Object.keys(configSchema).length > 0 && (
        <>
          <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground-muted)', margin: '16px 0 8px', textTransform: 'uppercase' as const, letterSpacing: 0.4 }}>Configuration</h4>
          {Object.entries(configSchema).map(([key, schema]) => (
            <DynamicField key={key} name={key} schema={schema} value={config[key]} onChange={(v) => setConfig({ ...config, [key]: v })} />
          ))}
        </>
      )}

      {Object.keys(secretSchema).length > 0 && (
        <>
          <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground-muted)', margin: '16px 0 8px', textTransform: 'uppercase' as const, letterSpacing: 0.4 }}>Credentials</h4>
          {Object.entries(secretSchema).map(([key, schema]) => (
            <div key={key} style={{ marginBottom: 12 }}>
              <label style={labelStyle}>{schema.label}{schema.required && ' *'}</label>
              {schema.description && <div style={{ fontSize: 12, color: 'var(--foreground-muted)', marginBottom: 4 }}>{schema.description}</div>}
              <input type="password" value={secrets[key] ?? ''} onChange={(e) => setSecrets({ ...secrets, [key]: e.target.value })} placeholder="Enter value…" style={inputStyle} />
            </div>
          ))}
        </>
      )}

      {verifyResult && (
        <div style={{
          marginTop: 8, marginBottom: 8, fontSize: 13, padding: '8px 12px', borderRadius: 'var(--radius)',
          background: verifyResult.status === 'available' ? 'var(--success-bg, rgba(0,180,0,0.08))' : 'var(--danger-bg, rgba(200,0,0,0.08))',
        }}>
          Connection: <strong>{verifyResult.status}</strong>{verifyResult.message ? ` — ${verifyResult.message}` : ''}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button disabled={!canSave || createMut.isPending} onClick={() => createMut.mutate()} style={primaryBtnStyle}>
          {createMut.isPending ? 'Creating…' : 'Save'}
        </button>
        <button disabled={!canSave || verifying} onClick={handleVerify} style={btnStyle}>
          {verifying ? 'Verifying…' : 'Verify & Save'}
        </button>
        <button onClick={onCancel} style={btnStyle}>Cancel</button>
      </div>
      {createMut.isError && <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 8 }}>{(createMut.error as Error).message}</p>}
    </div>
  )
}

// --- Edit Integration Panel --------------------------------------------------

function EditIntegrationPanel({ integration, onDone }: { integration: IntegrationSummary; onDone: () => void }) {
  const queryClient = useQueryClient()
  const configSchema = integration.metadata?.configSchema ?? {}
  const secretSchema = integration.metadata?.secretSchema ?? {}
  const adapterUnavailable = !integration.metadata

  const { data: detail } = useQuery({ queryKey: ['integration-detail', integration.id], queryFn: () => api.getIntegrationDetail(integration.id) })
  const { data: secretStatus, refetch: refetchSecrets } = useQuery({ queryKey: ['integration-secrets', integration.id], queryFn: () => api.getIntegrationSecretStatus(integration.id) })

  const [config, setConfig] = useState<Record<string, unknown>>(() => ({ ...((detail as IntegrationSummary | undefined) ?? integration) }))
  const [configDirty, setConfigDirty] = useState(false)

  const detailConfig = (detail as unknown as { config?: Record<string, unknown> })?.config
  useState(() => {
    if (detailConfig && !configDirty) setConfig(detailConfig)
  })

  const updateMut = useMutation({
    mutationFn: () => api.updateIntegration(integration.id, { config }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
      queryClient.invalidateQueries({ queryKey: ['integration-detail', integration.id] })
      setConfigDirty(false)
    },
  })

  const setSecretMut = useMutation({
    mutationFn: ({ name, value }: { name: string; value: string }) => api.setIntegrationSecret(integration.id, name, value),
    onSuccess: () => {
      refetchSecrets()
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
    },
  })

  return (
    <div style={{ ...cardStyle, marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ProviderIcon icon={integration.metadata?.icon} size={20} />
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Configure: {integration.displayName}</h3>
        </div>
        <button onClick={onDone} style={{ ...btnStyle, border: 'none', background: 'none', color: 'var(--foreground-muted)' }}>✕</button>
      </div>

      {adapterUnavailable && (
        <div style={{ padding: '10px 14px', borderRadius: 'var(--radius)', background: 'var(--danger-bg, rgba(200,0,0,0.08))', fontSize: 13, color: 'var(--danger)', marginBottom: 12 }}>
          This integration's adapter (<span className="font-mono">{integration.adapter}</span>) is not currently available. Configuration is preserved but the integration cannot be used until its adapter is registered.
        </div>
      )}

      {Object.keys(configSchema).length > 0 && (
        <>
          <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground-muted)', margin: '0 0 8px', textTransform: 'uppercase' as const, letterSpacing: 0.4 }}>Configuration</h4>
          {Object.entries(configSchema).map(([key, schema]) => (
            <DynamicField key={key} name={key} schema={schema} value={config[key]} onChange={(v) => { setConfig({ ...config, [key]: v }); setConfigDirty(true) }} />
          ))}
          <button disabled={!configDirty || updateMut.isPending} onClick={() => updateMut.mutate()} style={primaryBtnStyle}>
            {updateMut.isPending ? 'Saving…' : 'Save Configuration'}
          </button>
          {updateMut.isError && <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>{(updateMut.error as Error).message}</p>}
        </>
      )}

      {Object.keys(secretSchema).length > 0 && (
        <>
          <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground-muted)', margin: '16px 0 8px', textTransform: 'uppercase' as const, letterSpacing: 0.4 }}>Credentials</h4>
          {Object.entries(secretSchema).map(([key, schema]) => (
            <SecretField
              key={key}
              name={key}
              schema={schema}
              configured={secretStatus?.[key] ?? false}
              onSave={(value) => setSecretMut.mutate({ name: key, value })}
            />
          ))}
          {setSecretMut.isError && <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>{(setSecretMut.error as Error).message}</p>}
        </>
      )}
    </div>
  )
}

// --- Import Panel (carried from VS-102) --------------------------------------

function ImportPanel({ integrationId, item, onClose }: { integrationId: string; item: ExternalWorkItem; onClose: () => void }) {
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
      queryClient.invalidateQueries({ queryKey: ['import-preview', integrationId, item.externalId] })
      router.navigate({ to: '/work-items/$workItemId', params: { workItemId: res.workItemId } })
    },
  })

  return (
    <div style={{ ...cardStyle, marginTop: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 0.4, color: 'var(--foreground-muted)', margin: 0 }}>Import work item</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--foreground-muted)', fontSize: 13 }}>✕</button>
      </div>
      {isLoading && <p style={{ fontSize: 13, color: 'var(--foreground-muted)' }}>Loading preview…</p>}
      {preview?.duplicate ? (
        <div style={{ marginTop: 8 }}>
          <p style={{ fontSize: 14 }}>Already imported as <strong className="font-mono">{preview.duplicate.workItemId}</strong> — "{preview.duplicate.title}".</p>
          <button onClick={() => router.navigate({ to: '/work-items/$workItemId', params: { workItemId: preview.duplicate!.workItemId } })} style={btnStyle}>View Work Item</button>
        </div>
      ) : preview ? (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 13 }}><span style={{ color: 'var(--foreground-muted)' }}>Source:</span> {preview.preview.source.provider} · {preview.preview.source.externalId}</div>
          <div style={{ fontSize: 13 }}><span style={{ color: 'var(--foreground-muted)' }}>Captured intent:</span> {preview.preview.capturedIntent}</div>
          <div style={{ fontSize: 13 }}><span style={{ color: 'var(--foreground-muted)' }}>Will create:</span> a Draft Work Item (needs refinement)</div>
          {preview.preview.externalType && (
            <div style={{ fontSize: 12, color: 'var(--foreground-muted)' }}>External type "{preview.preview.externalType}" — choose the Kaddo type explicitly (never inferred):</div>
          )}
          <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Kaddo Work Item type" style={{ ...inputStyle, alignSelf: 'flex-start', width: 'auto' }}>
            <option value="">Choose Kaddo Work Item type…</option>
            {(types?.types ?? []).map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <p style={{ fontSize: 12, color: 'var(--foreground-muted)', margin: 0 }}>No project files have been modified yet.</p>
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

// --- Integration Card --------------------------------------------------------

function IntegrationCard({ integration, onEdit }: { integration: IntegrationSummary; onEdit: () => void }) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [importing, setImporting] = useState<ExternalWorkItem | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const adapterAvailable = integration.metadata !== null
  const canBrowse = adapterAvailable && integration.status !== 'disabled' && integration.status !== 'invalid-config' && integration.capabilities?.workItems.list

  const status = useQuery({ queryKey: ['integration-status', integration.id], queryFn: () => api.getIntegrationStatus(integration.id), enabled: Boolean(canBrowse), retry: false })
  const items = useQuery({ queryKey: ['external-items', integration.id], queryFn: () => api.getExternalWorkItems(integration.id), enabled: open && Boolean(canBrowse), retry: false })

  const toggleMut = useMutation({
    mutationFn: () => integration.enabled ? api.disableIntegration(integration.id) : api.enableIntegration(integration.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['integrations'] }),
  })

  const deleteMut = useMutation({
    mutationFn: () => api.deleteIntegration(integration.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['integrations'] }),
  })

  const verifyMut = useMutation({
    mutationFn: () => api.getIntegrationStatus(integration.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integration-status', integration.id] })
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
    },
  })

  return (
    <div style={{ ...cardStyle, marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 12, flex: 1 }}>
          <ProviderIcon icon={integration.metadata?.icon} size={28} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{integration.displayName} <span className="font-mono" style={{ fontSize: 12, color: 'var(--foreground-muted)', fontWeight: 400 }}>· {integration.id}</span></div>
            <div style={{ marginTop: 4, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <StatusBadge status={status.data?.status ?? integration.status} />
              {!adapterAvailable && <span style={{ fontSize: 12, color: 'var(--danger)' }}>Adapter unavailable</span>}
              {integration.capabilities && (
                <span style={{ display: 'inline-flex', gap: 10 }}>
                  <Cap on={integration.capabilities.workItems.read} label="Read" />
                  <Cap on={integration.capabilities.workItems.list} label="List" />
                  <Cap on={integration.capabilities.workItems.import} label="Import" />
                </span>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={onEdit} style={btnStyle}>Configure</button>
          {adapterAvailable && (
            <button onClick={() => verifyMut.mutate()} disabled={verifyMut.isPending} style={btnStyle}>
              {verifyMut.isPending ? 'Verifying…' : 'Verify'}
            </button>
          )}
          <button onClick={() => toggleMut.mutate()} disabled={toggleMut.isPending} style={btnStyle}>
            {toggleMut.isPending ? '…' : integration.enabled ? 'Disable' : 'Enable'}
          </button>
          {canBrowse && (
            <button onClick={() => setOpen((o) => !o)} style={btnStyle}>{open ? 'Hide items' : 'Browse'}</button>
          )}
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)} style={dangerBtnStyle}>Delete</button>
          ) : (
            <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--danger)' }}>Delete?</span>
              <button onClick={() => deleteMut.mutate()} style={dangerBtnStyle}>Yes</button>
              <button onClick={() => setConfirmDelete(false)} style={btnStyle}>No</button>
            </span>
          )}
        </div>
      </div>

      {verifyMut.data && (
        <div style={{ marginTop: 8, fontSize: 13, padding: '6px 10px', borderRadius: 'var(--radius)', background: verifyMut.data.status === 'available' ? 'var(--success-bg, rgba(0,180,0,0.08))' : 'var(--danger-bg, rgba(200,0,0,0.08))' }}>
          Connection: <strong>{verifyMut.data.status}</strong>{verifyMut.data.message ? ` — ${verifyMut.data.message}` : ''}
        </div>
      )}

      {integration.findings.map((f, i) => (
        <p key={i} style={{ fontSize: 12, color: f.level === 'blocking' ? 'var(--danger)' : 'var(--warning)', margin: '6px 0 0' }}>[{f.level}] {f.message}</p>
      ))}

      {deleteMut.isError && <p style={{ fontSize: 12, color: 'var(--danger)', margin: '6px 0 0' }}>{(deleteMut.error as Error).message}</p>}

      {open && canBrowse && (
        <div style={{ marginTop: 12 }}>
          {items.isLoading && <p style={{ fontSize: 13, color: 'var(--foreground-muted)' }}>Loading…</p>}
          {items.isError && <p style={{ fontSize: 13, color: 'var(--danger)' }}>{(items.error as Error).message}</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.data?.items.map((it) => (
              <div key={it.externalId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                <div>
                  <span className="font-mono" style={{ fontSize: 12, color: 'var(--foreground-muted)' }}>{it.externalId}</span>{' '}
                  <span style={{ fontSize: 14 }}>{it.title}</span>
                  {it.status && <span style={{ fontSize: 12, color: 'var(--foreground-muted)' }}> · {it.status}</span>}
                </div>
                {integration.capabilities?.workItems.import && (
                  <button onClick={() => setImporting(it)} style={btnStyle}>Import</button>
                )}
              </div>
            ))}
          </div>
          {importing && <ImportPanel integrationId={integration.id} item={importing} onClose={() => setImporting(null)} />}
        </div>
      )}
    </div>
  )
}

// --- Page --------------------------------------------------------------------

export function Integrations() {
  const queryClient = useQueryClient()
  const { data, isLoading, error } = useQuery({ queryKey: ['integrations'], queryFn: () => api.getIntegrations(), retry: false })
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)

  const editingIntegration = data?.find((i) => i.id === editing)

  return (
    <div style={{ padding: '24px 32px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Integrations</h2>
          <p style={{ fontSize: 14, color: 'var(--foreground-muted)', margin: 0 }}>
            Connect Kaddo to external work systems. Configuration lives in <span className="font-mono">.kaddo/integrations.yml</span> — Admin and CLI share the same source of truth.
          </p>
        </div>
        {!creating && (
          <button onClick={() => { setCreating(true); setEditing(null) }} style={primaryBtnStyle}>+ Add Integration</button>
        )}
      </div>

      {creating && (
        <CreateIntegrationPanel
          onCreated={() => { setCreating(false); queryClient.invalidateQueries({ queryKey: ['integrations'] }) }}
          onCancel={() => setCreating(false)}
        />
      )}

      {editing && editingIntegration && (
        <EditIntegrationPanel integration={editingIntegration} onDone={() => setEditing(null)} />
      )}

      {isLoading && <p style={{ color: 'var(--foreground-muted)' }}>Loading…</p>}
      {error && <p style={{ color: 'var(--danger)' }}>{(error as Error).message}</p>}
      {data && data.length === 0 && !creating && (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--foreground-muted)', border: '1px dashed var(--border)', borderRadius: 'var(--radius)' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🔌</div>
          <p style={{ fontSize: 14, margin: 0 }}>No integrations are configured. Click <strong>+ Add Integration</strong> to get started.</p>
        </div>
      )}
      {data?.map((i) => <IntegrationCard key={i.id} integration={i} onEdit={() => { setEditing(i.id); setCreating(false) }} />)}
    </div>
  )
}
