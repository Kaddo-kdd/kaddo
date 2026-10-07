const BASE = '/api/v1/admin'

export class ApiError extends Error {
  code: string
  status: number
  constructor(code: string, message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}

async function fetchApi<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { credentials: 'include' })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new ApiError(body?.error?.code ?? 'ERROR', body?.error?.message ?? `Request failed: ${res.status}`, res.status)
  }
  return res.json()
}

async function mutateApi<T>(path: string, method: 'POST' | 'PUT' | 'DELETE', body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: 'include',
    ...(body === undefined
      ? {}
      : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  })
  if (!res.ok) {
    const errBody = await res.json().catch(() => null)
    throw new ApiError(errBody?.error?.code ?? 'ERROR', errBody?.error?.message ?? `Request failed: ${res.status}`, res.status)
  }
  return res.json()
}

export type ProjectOverview = {
  project: { name: string; state: string; structure: string; language: string; teamSize: string }
  knowledge: { layers: { layer: string; status: string }[]; missing: string[] }
  workItems: {
    total: number
    byState: Record<string, number>
    byType: Record<string, number>
    items: { id: string; title: string; type: string; lifecycle: string; initiative: string }[]
  }
  modules: { modules: { id: string; role: string; path?: string; available: boolean }[] }
  readiness: { overall: string; recommendedNextStep: { label: string; command?: string } }
  route: { type: string; completed: number; total: number; progressPercent: number; steps: { id: string; label: string; status: string }[] }
  findings: { blocking: number; warning: number; fyi: number; items: { level: string; message: string }[] }
}

export type KnowledgeArtifactSummary = {
  id: string
  title: string
  layer: string
  path: string
  status: string
  type?: string
}

export type KnowledgeInventoryLayer = {
  id: string
  label: string
  status: string
  artifacts: KnowledgeArtifactSummary[]
}

export type KnowledgeInventory = {
  layers: KnowledgeInventoryLayer[]
}

export type KnowledgeArtifactDetail = {
  id: string
  title: string
  layer: string
  path: string
  status: string
  format: string
  content: string
  type?: string
}

// --- Work Items (VS-098) -----------------------------------------------------

export type WorkItemsSummaryStats = {
  total: number
  active: number
  draft: number
  ready: number
  inProgress: number
  blocked: number
  completed: number
  archived: number
}

export type WorkItemListItem = {
  id: string
  title: string
  type: string
  status: string
  implementationStatus: string | null
  validationStatus: string | null
  releaseStatus: string | null
  affectedModules: string[]
  scopeConfidenceLevel: string | null
  initiative: string | null
}

export type WorkItemsList = {
  summary: WorkItemsSummaryStats
  items: WorkItemListItem[]
  modules: string[]
}

export type CoverageEntry = { id: string; status: string; reason?: string }
export type ImpactEntry = { surface: string; status: string; reason?: string; question?: string }
export type AcceptanceCriterion = { text: string; checked: boolean | null }
export type ReleaseGateEntry = { id: string; status: string; reason?: string; requiredFor?: string }
export type CompletionExceptionEntry = { id: string; status: string; reason?: string; category?: string; impact?: string }
export type RepoValidation = { command: string; status: string; reason?: string }
export type RepoMigration = { id: string; environment: string; status: string; reason?: string }
export type EvidenceRepo = {
  module: string
  role: string
  status: string
  changedPaths: string[]
  validations: RepoValidation[]
  migrations: RepoMigration[]
}
export type LinkedDecision = { id: string; title?: string; knowledgeId?: string; knowledgeLayer?: string }
export type LinkedKnowledge = { id: string; title: string; layer: string }

export type WorkItemDetail = WorkItemListItem & {
  summary: string | null
  actor: string | null
  outcome: string | null
  currentBehavior: string | null
  targetBehavior: string | null
  entryPoints: string | null
  endToEndFlow: string | null
  scopeConfidence: { level: string; reasons: string[] } | null
  scopeUnknowns: string[]
  moduleCoverage: CoverageEntry[]
  impactAnalysis: ImpactEntry[]
  acceptanceCriteria: AcceptanceCriterion[]
  implementationEvidence: EvidenceRepo[]
  releaseGates: ReleaseGateEntry[]
  completionExceptions: CompletionExceptionEntry[]
  decisions: LinkedDecision[]
  relatedKnowledge: LinkedKnowledge[]
  affectedSystemEntities: SystemImpactEntity[]
  reviewedSystemEntities: ReviewedSystemEntity[]
  graphRevision: string | null
  graphCoverage: GraphCoverage
  source: {
    type: string; id?: string; inferred: boolean
    provider?: string; integration?: string; url?: string
    imported_at?: string; external_updated_at?: string
  }
  originalSnapshot: ExternalSnapshot | null
  path: string
  /** Canonical Markdown body (verbatim) for the full-definition view (WI-025). */
  markdownBody: string
  /** Project Resources (external systems) this WI relates to, by role (WI-034). */
  resources: { id: string; role: string }[]
  refinement: RefinementStatus
}

export type ExternalSnapshot = {
  title: string; description?: string; type?: string; status?: string
  labels?: string[]; assignee?: string; created_at?: string; updated_at?: string
}

// System impact on a Work Item (VS-101 / VS-101.1). Persisted by an agent+human, resolved against
// the topology. Carries explainability (why reviewed / graph reason / repository evidence).
export type GraphCoverage = 'unavailable' | 'partial' | 'available'
export type SystemImpactGraphReason = { relationship: string | null; path: string[] }
export type SystemImpactEntity = {
  id: string
  nodeId: string
  label: string
  kind: string
  moduleId: string | null
  reason: string | null
  graphReason: SystemImpactGraphReason | null
  evidenceRefs: string[]
  evidenceSummary: string | null
}
export type ReviewedSystemEntity = SystemImpactEntity & { status: string }

export type WorkItemInput = {
  title: string
  type: string
  summary?: string
  actor?: string
  outcome?: string
  currentBehavior?: string
  targetBehavior?: string
  entryPoints?: string
  endToEndFlow?: string
  scopeConfidence: { level: string; reasons: string[] } | null
  scopeUnknowns: string[]
  affectedModules: string[]
  moduleCoverage: CoverageEntry[]
  impactAnalysis: ImpactEntry[]
  acceptanceCriteria: AcceptanceCriterion[]
  decisions: string[]
  relatedKnowledge: string[]
}

export type WorkItemEditModel = WorkItemInput & {
  id: string
  status: string
  revision: string
  path: string
  editable: boolean
  editableReason?: string
}

export type ValidationFinding = { level: 'blocking' | 'warning' | 'fyi'; message: string }
export type ValidationResult = { findings: ValidationFinding[]; canMarkReady: boolean }
export type WorkItemWriteResult = { id: string; path: string; revision: string; status?: string }

// --- Refinement (VS-099.1) ---------------------------------------------------

export type CaptureQuestion = { id: string; prompt: string; placeholder: string; field: string; required: boolean }
export type WorkItemCaptureDefinition = { types: { value: string; label: string }[]; questions: Record<string, CaptureQuestion[]> }

export type RefinementStatus = {
  status: 'needs-refinement' | 'refined'
  aspects: { outcome: boolean; journey: boolean; modules: boolean; impact: boolean; acceptance: boolean }
}

export type RefinementHandoff = {
  workItemId: string
  title: string
  projectName: string
  refinement: RefinementStatus
  recommendedAgent: string
  recommendedSkill: string
  text: string
}

// --- System Map (VS-100) -----------------------------------------------------

export type SystemDimension = 'system' | 'knowledge' | 'delivery' | 'implementation' | 'unknown'
export type SystemMapNode = {
  id: string
  type: string
  label: string
  dimension: SystemDimension
  status?: string
  path?: string
  workItemRef?: string
  knowledgeRef?: { id: string; layer: string }
  moduleId?: string
  purpose?: string
  implementationRefs?: string[]
  knowledgeRefs?: { id: string; layer: string }[]
  provenance?: string
  evidence?: string[]
}
export type SystemMapRelationship = { id: string; source: string; target: string; type: string; label: string }
export type SystemMapGroup = { id: string; label: string; repositoryId: string; available: boolean }
export type SystemMapProjection = {
  system: { name: string }
  nodes: SystemMapNode[]
  relationships: SystemMapRelationship[]
  groups: SystemMapGroup[]
  metadata: {
    projectName: string; structure: string; nodeCount: number; relationshipCount: number
    coverage: 'good' | 'partial' | 'sparse' | 'empty'; available: boolean
    dimensions: Record<SystemDimension, number>; topologyAvailable: boolean
    topologyStatus: 'unavailable' | 'partial' | 'available'
    semanticEntityCount: number; technicalRelationshipCount: number
    topologyFindings: { level: 'blocking' | 'warning'; message: string }[]
  }
}
export type TopologyEnrichmentHandoff = { projectName: string; recommendedAgent: string; recommendedSkill: string; targetFile: string; text: string }

export type WorkItemFilters = { status?: string; module?: string; query?: string }

// --- Integrations (VS-102 + VS-103) ------------------------------------------
export type IntegrationCapabilities = { workItems: { list: boolean; read: boolean; import: boolean; write?: boolean; statusSync?: boolean; comments?: boolean; webhooks?: boolean } }
export type IntegrationStatusValue = 'configured' | 'available' | 'unavailable' | 'unauthorized' | 'invalid-config' | 'disabled'
export type ConfigFieldSchema = {
  type: 'string' | 'url' | 'password' | 'number' | 'boolean' | 'select' | 'multi-select'
  required: boolean; label: string; description?: string; placeholder?: string
  options?: { value: string; label: string }[]; defaultValue?: unknown
}
export type FilterCapabilities = {
  projects?: { supported: boolean; multiple?: boolean }
  types?: { supported: boolean; multiple?: boolean }
  statuses?: { supported: boolean; multiple?: boolean }
  labels?: { supported: boolean; multiple?: boolean }
  assignees?: { supported: boolean; multiple?: boolean }
  updatedAfter?: { supported: boolean }
  search?: { supported: boolean }
  providerQuery?: { supported: boolean; label?: string }
}
export type ExternalWorkItemFilters = {
  projects?: string[]; types?: string[]; statuses?: string[]; labels?: string[]; assignees?: string[]
  updatedAfter?: string; search?: string; providerQuery?: string
}
export type AdapterTypeInfo = {
  id: string; displayName: string; description?: string; icon?: string
  configSchema: Record<string, ConfigFieldSchema>; secretSchema: Record<string, ConfigFieldSchema>
  filterCapabilities?: FilterCapabilities
  capabilities: IntegrationCapabilities
}
export type IntegrationSummary = {
  id: string
  adapter: string
  enabled: boolean
  status: IntegrationStatusValue
  displayName: string
  capabilities: IntegrationCapabilities | null
  metadata: { id: string; displayName: string; icon?: string; configSchema?: Record<string, ConfigFieldSchema>; secretSchema?: Record<string, ConfigFieldSchema>; filterCapabilities?: FilterCapabilities } | null
  credentialRefs: string[]
  secretRefs: string[]
  secretStatus: Record<string, boolean>
  filters?: ExternalWorkItemFilters
  findings: { level: 'blocking' | 'warning'; message: string }[]
}
export type IntegrationStatusResult = { id: string; status: IntegrationStatusValue; connection: unknown; missingCredentials: string[]; message?: string }
export type ExternalWorkItem = {
  externalId: string; provider: string; title: string; description?: string; type?: string; status?: string; url?: string
  labels?: string[]; assignees?: { id?: string; name?: string; email?: string; url?: string }[]; createdAt?: string; updatedAt?: string
}
export type ExternalWorkItemPage = { items: ExternalWorkItem[]; hasMore: boolean; nextCursor?: string }
export type ImportPreview = {
  source: { provider: string; integration: string; externalId: string; url?: string; identityKey: string; displayKey: string }
  capturedIntent: string; description?: string; externalType?: string; externalStatus?: string; kaddoStatus: 'draft'; kaddoType: string | null; writes: false
}
export type ImportPreviewResult = { preview: ImportPreview; duplicate: { workItemId: string; title: string } | null }
export type ImportResult = { workItemId: string; created: boolean; duplicateOf?: string; path?: string }

// --- Discovery (VS-104 + VS-105) ---------------------------------------------
export type DiscoveryItemImportState = { imported: true; workItemId: string; title: string } | { imported: false }
export type EnrichedExternalWorkItem = ExternalWorkItem & { importState: DiscoveryItemImportState }
export type DiscoveryIntegrationResult = {
  integrationId: string; adapter: string; displayName: string; icon?: string
  items: EnrichedExternalWorkItem[]; hasMore: boolean; nextCursor?: string; error?: string
}
export type DiscoveryResult = { results: DiscoveryIntegrationResult[]; totalItems: number }

function toQuery(filters: WorkItemFilters): string {
  const params = new URLSearchParams()
  if (filters.status && filters.status !== 'all') params.set('status', filters.status)
  if (filters.module && filters.module !== 'all') params.set('module', filters.module)
  if (filters.query && filters.query.trim()) params.set('query', filters.query.trim())
  const s = params.toString()
  return s ? `?${s}` : ''
}

export type InitiativePlanning = { totalCandidates: number; materialized: number; remaining: number }
export type InitiativeDelivery = { total: number; byState: Record<string, number> }

export type InitiativeListItem = {
  id: string
  title: string
  status: string
  horizon: string | null
  priority: string | null
  planning: InitiativePlanning
  delivery: InitiativeDelivery
}

export type InitiativeCandidate = {
  id: string
  title: string
  type?: string
  expectedValue?: string
  materializedAs: string | null
}

export type InitiativeExternalLink = {
  integration: string
  externalId: string
  externalType?: string
  url?: string
  externalStatus?: string
}

export type InitiativeFinding = {
  code: string
  severity: 'info' | 'warning' | 'blocking'
  message: string
  items?: string[]
}

export type InitiativeDetail = {
  id: string
  title: string
  status: string
  horizon: string | null
  priority: string | null
  knowledgeLevel: string | null
  domains: string[]
  relatedCapabilities: string[]
  source: string | null
  sourceId: string | null
  externalLinks: InitiativeExternalLink[]
  candidates: InitiativeCandidate[]
  progress: { initiative: string; status: string; planning: InitiativePlanning; delivery: InitiativeDelivery }
  workItems: { id: string; title: string; status: string }[]
  analysis: { findings: InitiativeFinding[]; suggestedCandidates: InitiativeCandidate[]; successCriteria: { text: string; checked: boolean | null }[] }
  completion: { ready: boolean; readiness: string; reasons: string[] }
  body: string
}

// Project Resources (WI-039)
export type ResourceAccessInterface = {
  type: string; tool: string | null; provider: string | null; purpose: string | null
  operations: string[]; environments: string[]; constraints: string | null
}
export type ResourceScope = { type: string; module: string | null }
export type ResourceSummary = {
  id: string; title: string; resourceType: string | null; provider: string | null
  environments: string[]; scope: ResourceScope | null; modules: string[]; path: string
}
export type ResourceReference = { kind: string; id: string; role: string; path: string }
export type ResourceDetail = ResourceSummary & {
  purpose: string | null; interfaces: ResourceAccessInterface[]
  boundaries: Record<string, string[]>; authRefs: string[]; authMode: string | null
  markdownBody: string; references: ResourceReference[]
}
export type ResourceInput = {
  title?: string; resourceType?: string; provider?: string; environments?: string[]
  scope?: { type: string; module?: string | null }; modules?: string[]; purpose?: string
  accessInterfaces?: { type: string; tool?: string; provider?: string; purpose?: string; operations?: string[]; environments?: string[]; constraints?: string }[]
  authentication?: { mode?: string; refs?: string[] }
}

export const api = {
  initSession: () => fetchApi<{ status: string }>('/session'),
  getOverview: () => fetchApi<ProjectOverview>('/overview'),
  getProject: () => fetchApi<ProjectOverview['project']>('/project'),
  getKnowledge: () => fetchApi<ProjectOverview['knowledge']>('/knowledge'),
  getModules: () => fetchApi<ProjectOverview['modules']>('/modules'),
  getReadiness: () => fetchApi<ProjectOverview['readiness']>('/readiness'),
  getRoute: () => fetchApi<ProjectOverview['route']>('/route'),
  getFindings: () => fetchApi<ProjectOverview['findings']>('/findings'),
  getSystemMap: () => fetchApi<SystemMapProjection>('/system'),
  getTopologyHandoff: () => fetchApi<TopologyEnrichmentHandoff>('/system/topology-handoff'),
  getKnowledgeInventory: () => fetchApi<KnowledgeInventory>('/knowledge/inventory'),
  getKnowledgeArtifact: (artifactId: string) => fetchApi<KnowledgeArtifactDetail>(`/knowledge/artifact/${encodeURIComponent(artifactId)}`),
  getWorkItemsList: (filters: WorkItemFilters = {}) => fetchApi<WorkItemsList>(`/work-items${toQuery(filters)}`),
  getWorkItem: (workItemId: string) => fetchApi<WorkItemDetail>(`/work-items/${encodeURIComponent(workItemId)}`),
  // Initiatives (WI-022)
  getInitiatives: () => fetchApi<{ initiatives: InitiativeListItem[] }>('/initiatives'),
  getInitiative: (initiativeId: string) => fetchApi<InitiativeDetail>(`/initiatives/${encodeURIComponent(initiativeId)}`),
  createInitiative: (body: { title: string; domains?: string[]; horizon?: string; priority?: string }) =>
    mutateApi<{ id: string }>('/initiatives', 'POST', body),
  updateInitiative: (initiativeId: string, body: { status?: string; title?: string; horizon?: string; priority?: string; domains?: string[] }) =>
    mutateApi<{ id: string; status: string }>(`/initiatives/${encodeURIComponent(initiativeId)}`, 'PUT', body),
  // Project Resources (WI-039)
  getResources: () => fetchApi<{ resources: ResourceSummary[] }>('/resources'),
  getResource: (id: string) => fetchApi<ResourceDetail>(`/resources/${encodeURIComponent(id)}`),
  createResource: (body: ResourceInput) => mutateApi<{ id: string; path: string }>('/resources', 'POST', body),
  updateResource: (id: string, body: ResourceInput) => mutateApi<{ id: string; path: string }>(`/resources/${encodeURIComponent(id)}`, 'PUT', body),
  deleteResource: (id: string, confirm: boolean) => mutateApi<{ deleted: boolean; path?: string; preview?: { id: string; references: ResourceReference[] } }>(`/resources/${encodeURIComponent(id)}?confirm=${confirm}`, 'DELETE'),
  // Writes (VS-099)
  getCaptureDefinition: () => fetchApi<WorkItemCaptureDefinition>('/work-items-capture'),
  createWorkItem: (intent: string, type: string, answers?: Record<string, string>) => mutateApi<WorkItemWriteResult>('/work-items', 'POST', { intent, type, ...(answers ? { answers } : {}) }),
  getWorkItemEdit: (workItemId: string) => fetchApi<WorkItemEditModel>(`/work-items/${encodeURIComponent(workItemId)}/edit`),
  updateWorkItem: (workItemId: string, model: WorkItemInput, expectedRevision: string) =>
    mutateApi<WorkItemWriteResult>(`/work-items/${encodeURIComponent(workItemId)}`, 'PUT', { model, expectedRevision }),
  validateWorkItem: (workItemId: string) => mutateApi<ValidationResult>(`/work-items/${encodeURIComponent(workItemId)}/validate`, 'POST'),
  transitionReady: (workItemId: string, expectedRevision: string) =>
    mutateApi<WorkItemWriteResult>(`/work-items/${encodeURIComponent(workItemId)}/transitions/ready`, 'POST', { expectedRevision }),
  transitionDraft: (workItemId: string, expectedRevision: string) =>
    mutateApi<WorkItemWriteResult>(`/work-items/${encodeURIComponent(workItemId)}/transitions/draft`, 'POST', { expectedRevision }),
  // Refinement handoff (VS-099.1) — read-only; refinement happens externally.
  getRefinementHandoff: (workItemId: string) =>
    fetchApi<RefinementHandoff>(`/work-items/${encodeURIComponent(workItemId)}/refinement-handoff`),
  // Integrations (VS-102 + VS-103)
  getIntegrations: () => fetchApi<IntegrationSummary[]>('/integrations'),
  getIntegrationTypes: () => fetchApi<AdapterTypeInfo[]>('/integrations/types'),
  getIntegrationDetail: (id: string) => fetchApi<IntegrationSummary>(`/integrations/${encodeURIComponent(id)}`),
  getIntegrationSecretStatus: (id: string) => fetchApi<Record<string, boolean>>(`/integrations/${encodeURIComponent(id)}/secrets`),
  getIntegrationStatus: (id: string) => fetchApi<IntegrationStatusResult>(`/integrations/${encodeURIComponent(id)}/status`),
  createIntegration: (body: { id: string; adapter: string; enabled?: boolean; config?: Record<string, unknown>; secrets?: Record<string, string> }) =>
    mutateApi<IntegrationSummary>('/integrations', 'POST', body),
  updateIntegration: (id: string, body: { enabled?: boolean; config?: Record<string, unknown>; secrets?: Record<string, string> }) =>
    mutateApi<IntegrationSummary>(`/integrations/${encodeURIComponent(id)}`, 'PUT', body),
  deleteIntegration: (id: string) =>
    mutateApi<{ ok: boolean }>(`/integrations/${encodeURIComponent(id)}`, 'DELETE'),
  enableIntegration: (id: string) =>
    mutateApi<IntegrationSummary>(`/integrations/${encodeURIComponent(id)}/enable`, 'POST'),
  disableIntegration: (id: string) =>
    mutateApi<IntegrationSummary>(`/integrations/${encodeURIComponent(id)}/disable`, 'POST'),
  setIntegrationSecret: (id: string, name: string, value: string) =>
    mutateApi<{ ok: boolean }>(`/integrations/${encodeURIComponent(id)}/secrets/${encodeURIComponent(name)}`, 'POST', { value }),
  removeIntegrationSecret: (id: string, name: string) =>
    mutateApi<{ ok: boolean }>(`/integrations/${encodeURIComponent(id)}/secrets/${encodeURIComponent(name)}`, 'DELETE'),
  getExternalWorkItems: (id: string, opts: { cursor?: string; pageSize?: number; filters?: ExternalWorkItemFilters } = {}) => {
    const p = new URLSearchParams()
    if (opts.cursor) p.set('cursor', opts.cursor)
    if (opts.pageSize) p.set('pageSize', String(opts.pageSize))
    if (opts.filters?.projects?.length) p.set('projects', opts.filters.projects.join(','))
    if (opts.filters?.statuses?.length) p.set('statuses', opts.filters.statuses.join(','))
    if (opts.filters?.types?.length) p.set('types', opts.filters.types.join(','))
    if (opts.filters?.labels?.length) p.set('labels', opts.filters.labels.join(','))
    if (opts.filters?.assignees?.length) p.set('assignees', opts.filters.assignees.join(','))
    if (opts.filters?.search) p.set('search', opts.filters.search)
    const q = p.toString()
    return fetchApi<ExternalWorkItemPage>(`/integrations/${encodeURIComponent(id)}/work-items${q ? `?${q}` : ''}`)
  },
  getExternalWorkItem: (id: string, externalId: string) =>
    fetchApi<ExternalWorkItem>(`/integrations/${encodeURIComponent(id)}/work-items/${encodeURIComponent(externalId)}`),
  getImportPreview: (id: string, externalId: string, type?: string) =>
    fetchApi<ImportPreviewResult>(`/integrations/${encodeURIComponent(id)}/work-items/${encodeURIComponent(externalId)}/import-preview${type ? `?type=${encodeURIComponent(type)}` : ''}`),
  importExternalWorkItem: (id: string, externalId: string, type: string) =>
    mutateApi<ImportResult>(`/integrations/${encodeURIComponent(id)}/work-items/${encodeURIComponent(externalId)}/import`, 'POST', { type }),
  // VS-104: Discovery + filter management
  discoverExternalWorkItems: (opts: { filters?: ExternalWorkItemFilters; pageSize?: number; integrationIds?: string[]; cursors?: Record<string, string> } = {}) => {
    const p = new URLSearchParams()
    if (opts.filters?.projects?.length) p.set('projects', opts.filters.projects.join(','))
    if (opts.filters?.statuses?.length) p.set('statuses', opts.filters.statuses.join(','))
    if (opts.filters?.types?.length) p.set('types', opts.filters.types.join(','))
    if (opts.filters?.labels?.length) p.set('labels', opts.filters.labels.join(','))
    if (opts.filters?.assignees?.length) p.set('assignees', opts.filters.assignees.join(','))
    if (opts.filters?.search) p.set('search', opts.filters.search)
    if (opts.pageSize) p.set('pageSize', String(opts.pageSize))
    if (opts.integrationIds?.length) p.set('integrationIds', opts.integrationIds.join(','))
    if (opts.cursors && Object.keys(opts.cursors).length) p.set('cursors', JSON.stringify(opts.cursors))
    const q = p.toString()
    return fetchApi<DiscoveryResult>(`/integrations/discover${q ? `?${q}` : ''}`)
  },
  getIntegrationFilters: (id: string) =>
    fetchApi<ExternalWorkItemFilters>(`/integrations/${encodeURIComponent(id)}/filters`),
  updateIntegrationFilters: (id: string, filters: ExternalWorkItemFilters) =>
    mutateApi<IntegrationSummary>(`/integrations/${encodeURIComponent(id)}/filters`, 'PUT', filters),
}
