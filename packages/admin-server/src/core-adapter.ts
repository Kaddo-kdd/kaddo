import {
  buildProjectExplanation,
  buildReadinessReport,
  buildProjectRoute,
  knowledgeLayers,
  loadConfig,
  projectMode,
  setProjectMode,
  isModule,
  loadMappedModules,
  discoverKnowledge,
  getWorkItems as coreGetWorkItems,
  getWorkItem as coreGetWorkItem,
  WorkItemNotFoundError,
  createWorkItem as coreCreateWorkItem,
  updateWorkItem as coreUpdateWorkItem,
  getWorkItemForEdit as coreGetWorkItemForEdit,
  validateWorkItem as coreValidateWorkItem,
  transitionWorkItem as coreTransitionWorkItem,
  getWorkItemCaptureDefinition as coreGetCaptureDefinition,
  buildRefinementHandoff as coreBuildRefinementHandoff,
  getSystemMapProjection as coreGetSystemMapProjection,
  buildTopologyEnrichmentHandoff as coreBuildTopologyHandoff,
  listIntegrations as coreListIntegrations,
  getIntegration as coreGetIntegration,
  getIntegrationSecretStatus as coreGetIntegrationSecretStatus,
  getAvailableIntegrationTypes as coreGetAvailableIntegrationTypes,
  createIntegration as coreCreateIntegration,
  updateIntegration as coreUpdateIntegration,
  deleteIntegration as coreDeleteIntegration,
  enableIntegration as coreEnableIntegration,
  disableIntegration as coreDisableIntegration,
  setIntegrationSecret as coreSetIntegrationSecret,
  removeIntegrationSecret as coreRemoveIntegrationSecret,
  verifyIntegration as coreVerifyIntegration,
  listExternalWorkItems as coreListExternalWorkItems,
  getExternalWorkItem as coreGetExternalWorkItem,
  previewImport as corePreviewImport,
  importExternalWorkItem as coreImportExternalWorkItem,
  discoverExternalWorkItems as coreDiscoverExternalWorkItems,
  getIntegrationFilters as coreGetIntegrationFilters,
  updateIntegrationFilters as coreUpdateIntegrationFilters,
  IntegrationError,
  IntegrationServiceError,
  WorkItemWriteError,
  discoverInitiatives,
  getInitiative as coreGetInitiative,
  computeInitiativeProgress,
  associatedWorkItems,
  analyzeInitiative,
  evaluateInitiativeCompletion,
  createInitiative as coreCreateInitiative,
  transitionInitiative as coreTransitionInitiative,
  updateInitiative as coreUpdateInitiative,
  InitiativeWriteError,
  getResources as coreGetResources,
  getResource as coreGetResource,
  createResource as coreCreateResource,
  updateResource as coreUpdateResource,
  deleteResource as coreDeleteResource,
  getResourceReferences as coreGetResourceReferences,
  ResourceWriteError,
  getDeprecationPlans as coreGetDeprecationPlans,
  getDeprecationPlan as coreGetDeprecationPlan,
  createPlan as coreCreatePlan,
  DeprecationWriteError,
  deriveRemovalWaves,
  planIntelligence,
  environmentSummary,
  observationStatus,
  parseWorkItemDeprecationTargets,
  getProductionRunbook as coreGetProductionRunbook,
  buildPocReportContext,
  redactSecrets,
  type ResourceInput,
  exists,
  join,
  readFile,
  type WorkItemFilters,
  type WorkItemInput as CoreWorkItemInput,
  type ExternalWorkItemFilters,
  type Initiative,
  type InitiativeStatus,
  type InitiativeProgress,
  type InitiativeCandidate,
  type InitiativeExternalLink,
  type AssociatedWorkItem,
  type InitiativeAnalysis,
  type CompletionReadiness,
} from '@kaddo/cli/core'
import type {
  ProjectOverview,
  ProjectSummary,
  KnowledgeSummary,
  WorkItemSummary,
  ModuleSummary,
  ProjectReadiness,
  ProjectRouteResponse,
  FindingsSummary,
  PocReportSummary,
  KnowledgeInventory,
  KnowledgeArtifactDetail,
  WorkItemsList,
  WorkItemDetail,
  WorkItemEditModel,
  WorkItemInput,
  ValidationResult,
  WorkItemWriteResult,
  SystemMapProjection,
} from './contracts/schemas.js'

export function getProjectSummary(dir: string): ProjectSummary {
  const config = loadConfig(dir)
  if (!config) throw new CoreError('PROJECT_NOT_FOUND', 'No Kaddo project was found.')
  return {
    name: config.project.name ?? 'unknown',
    state: config.project.state ?? 'unknown',
    mode: projectMode(config),
    structure: config.project.structure ?? 'unknown',
    language: (config.project as { language?: string }).language ?? 'en',
    teamSize: config.team.size ?? 'unknown',
  }
}

/** Admin mutation delegates to the same Core boundary used by the CLI. */
export function updateProjectMode(dir: string, mode: 'standard' | 'poc'): ProjectSummary {
  setProjectMode(dir, mode)
  return getProjectSummary(dir)
}

export function getKnowledgeSummary(dir: string): KnowledgeSummary {
  const exp = buildProjectExplanation(dir)
  return {
    layers: exp.layers.map((l) => ({ layer: l.layer, status: l.status })),
    missing: exp.missingKnowledge,
  }
}

export function getWorkItemSummary(dir: string): WorkItemSummary {
  const exp = buildProjectExplanation(dir)
  return {
    total: exp.workItems.total,
    byState: exp.workItems.byState,
    byType: exp.workItems.byType,
    items: exp.workItems.items.map((i) => ({
      id: i.id,
      title: i.title,
      type: i.type,
      lifecycle: i.lifecycle,
      initiative: i.initiative,
    })),
  }
}

export function getWorkItemsList(dir: string, filters: WorkItemFilters = {}): WorkItemsList {
  return coreGetWorkItems(dir, filters)
}

export function getWorkItemDetail(dir: string, workItemId: string): WorkItemDetail {
  // Path security: the endpoint accepts a Work Item id, never a filesystem path.
  if (
    !workItemId ||
    workItemId.includes('..') ||
    workItemId.includes('/') ||
    workItemId.includes('\\') ||
    workItemId.startsWith('.')
  ) {
    throw new CoreError('INVALID_WORK_ITEM_ID', 'Invalid Work Item identifier.')
  }
  try {
    return coreGetWorkItem(dir, workItemId)
  } catch (err) {
    if (err instanceof WorkItemNotFoundError) {
      throw new CoreError('WORK_ITEM_NOT_FOUND', 'This Work Item does not exist in the current project.')
    }
    throw err
  }
}

function assertValidWorkItemId(workItemId: string): void {
  if (
    !workItemId ||
    workItemId.includes('..') ||
    workItemId.includes('/') ||
    workItemId.includes('\\') ||
    workItemId.startsWith('.')
  ) {
    throw new CoreError('INVALID_WORK_ITEM_ID', 'Invalid Work Item identifier.')
  }
}

function mapWriteError(err: unknown): never {
  if (err instanceof WorkItemWriteError) throw new CoreError(err.code, err.message)
  if (err instanceof WorkItemNotFoundError) throw new CoreError('WORK_ITEM_NOT_FOUND', 'This Work Item does not exist in the current project.')
  throw err as Error
}

export function getCaptureDefinition(): ReturnType<typeof coreGetCaptureDefinition> {
  return coreGetCaptureDefinition()
}

export function getSystemMap(dir: string): SystemMapProjection {
  return coreGetSystemMapProjection(dir) as SystemMapProjection
}

export function getTopologyHandoff(dir: string): ReturnType<typeof coreBuildTopologyHandoff> {
  const config = loadConfig(dir)
  if (!config) throw new CoreError('PROJECT_NOT_FOUND', 'No Kaddo project was found.')
  return coreBuildTopologyHandoff(dir, config.project.name ?? 'this project')
}

export function getRefinementHandoff(dir: string, workItemId: string): ReturnType<typeof coreBuildRefinementHandoff> {
  assertValidWorkItemId(workItemId)
  try {
    return coreBuildRefinementHandoff(dir, workItemId)
  } catch (err) { mapWriteError(err) }
}

export function createWorkItemAdmin(dir: string, body: { intent: string; type: string; answers?: Record<string, string> }): WorkItemWriteResult {
  try {
    const res = coreCreateWorkItem(dir, { intent: body.intent, type: body.type, answers: body.answers })
    return { id: res.id, path: res.path, revision: res.revision, status: 'draft' }
  } catch (err) { mapWriteError(err) }
}

export function getWorkItemEdit(dir: string, workItemId: string): WorkItemEditModel {
  assertValidWorkItemId(workItemId)
  try {
    return coreGetWorkItemForEdit(dir, workItemId) as WorkItemEditModel
  } catch (err) { mapWriteError(err) }
}

export function updateWorkItemAdmin(dir: string, workItemId: string, body: { model: WorkItemInput; expectedRevision: string }): WorkItemWriteResult {
  assertValidWorkItemId(workItemId)
  try {
    const res = coreUpdateWorkItem(dir, workItemId, body.model as CoreWorkItemInput, body.expectedRevision)
    return { id: workItemId, path: res.path, revision: res.revision }
  } catch (err) { mapWriteError(err) }
}

export function validateWorkItemAdmin(dir: string, workItemId: string): ValidationResult {
  assertValidWorkItemId(workItemId)
  try {
    return coreValidateWorkItem(dir, workItemId)
  } catch (err) { mapWriteError(err) }
}

export function transitionWorkItemAdmin(dir: string, workItemId: string, to: 'ready' | 'draft', expectedRevision: string): WorkItemWriteResult {
  assertValidWorkItemId(workItemId)
  try {
    const res = coreTransitionWorkItem(dir, workItemId, to, expectedRevision)
    return { id: workItemId, path: res.path, revision: res.revision, status: res.status }
  } catch (err) { mapWriteError(err) }
}

export function getModules(dir: string): ModuleSummary {
  const mapped = loadMappedModules(dir)
  return {
    modules: mapped.map((m) => ({
      id: m.id,
      role: m.role,
      path: m.path,
      available: m.available,
    })),
  }
}

export function getProjectReadiness(dir: string): ProjectReadiness {
  const report = buildReadinessReport(dir)
  return {
    overall: report.overall,
    recommendedNextStep: {
      label: report.nextStepRecommendation.label,
      command: report.nextStepRecommendation.command,
    },
  }
}

export function getProjectRoute(dir: string): ProjectRouteResponse {
  const route = buildProjectRoute(dir)
  return {
    type: route.type,
    completed: route.completed,
    total: route.total,
    progressPercent: route.progressPercent,
    steps: route.steps.map((s) => ({
      id: s.id,
      label: s.label,
      status: s.status,
      ...(s.evidence ? { evidence: s.evidence } : {}),
      ...(s.reason ? { reason: s.reason } : {}),
      ...(s.command ? { command: s.command } : {}),
    })),
  }
}

export function getFindings(dir: string): FindingsSummary {
  const exp = buildProjectExplanation(dir)
  const items: FindingsSummary['items'] = []

  if (exp.missingKnowledge.length > 0) {
    for (const m of exp.missingKnowledge) {
      items.push({ level: 'warning', message: `Missing: ${m}` })
    }
  }

  if (exp.duplicateWorkItems.length > 0) {
    for (const d of exp.duplicateWorkItems) {
      items.push({ level: 'warning', message: `Possible duplicate Work Items: ${d.items.map((i) => i.id).join(', ')} (${d.reason})` })
    }
  }

  const blocking = items.filter((i) => i.level === 'blocking').length
  const warning = items.filter((i) => i.level === 'warning').length
  const fyi = items.filter((i) => i.level === 'fyi').length

  return { blocking, warning, fyi, items }
}

/** Project the Core report context without leaking source contents or fingerprints. */
export function getPocReportSummary(dir: string): PocReportSummary {
  const report = buildPocReportContext(dir)
  const reportContent = report.latestReport
    ? redactSecrets(readFile(join(dir, report.latestReport.path)))
    : null

  return {
    eligible: report.eligible,
    conclusion: report.conclusion,
    status: report.status,
    latestReport: report.latestReport
      ? { path: report.latestReport.path, version: report.latestReport.version }
      : null,
    nextPath: report.nextPath,
    sources: report.sources.map(({ path, kind }) => ({ path, kind })),
    changesSinceLatest: report.changesSinceLatest,
    handoff: report.handoff,
    reportContent,
  }
}

export function getProjectOverview(dir: string): ProjectOverview {
  const project = getProjectSummary(dir)
  return {
    project,
    knowledge: getKnowledgeSummary(dir),
    workItems: getWorkItemSummary(dir),
    modules: getModules(dir),
    readiness: getProjectReadiness(dir),
    route: getProjectRoute(dir),
    findings: getFindings(dir),
    ...(project.mode === 'poc' ? { pocReport: getPocReportSummary(dir) } : {}),
  }
}

export function getKnowledgeInventory(dir: string): KnowledgeInventory {
  const artifacts = discoverKnowledge(dir).filter((a) => !a.isWorkItem)
  const layerSummary = knowledgeLayers(dir)

  const layerMap = new Map<string, { id: string; label: string; status: string; artifacts: KnowledgeInventory['layers'][0]['artifacts'] }>()

  for (const ls of layerSummary) {
    const id = ls.layer.toLowerCase()
    layerMap.set(id, { id, label: ls.layer, status: ls.status, artifacts: [] })
  }

  for (const a of artifacts) {
    const layerId = a.layer === 'module' ? 'tech' : a.layer
    if (!layerMap.has(layerId)) {
      layerMap.set(layerId, { id: layerId, label: layerId.charAt(0).toUpperCase() + layerId.slice(1), status: 'unknown', artifacts: [] })
    }
    const layer = layerMap.get(layerId)!
    const status = a.status || 'available'
    layer.artifacts.push({
      id: a.id || a.relPath.replace(/[/\\]/g, '-').replace(/\.md$/, ''),
      title: a.title || a.relPath.split('/').pop()?.replace(/\.md$/, '').replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Untitled',
      layer: layerId,
      path: a.relPath,
      status: normalizeArtifactStatus(status),
      type: a.type || undefined,
    })
  }

  return { layers: Array.from(layerMap.values()) }
}

function normalizeArtifactStatus(status: string): string {
  if (!status || status === 'active' || status === 'ready') return 'available'
  if (status === 'placeholder' || status === 'draft') return 'placeholder'
  if (status === 'missing') return 'missing'
  if (status === 'not-applicable' || status === 'n/a') return 'not-applicable'
  return 'available'
}

export function getKnowledgeArtifactDetail(dir: string, artifactId: string): KnowledgeArtifactDetail {
  if (artifactId.includes('..') || artifactId.startsWith('/') || artifactId.includes('\\')) {
    throw new CoreError('INVALID_PATH', 'Invalid artifact identifier.')
  }

  const artifacts = discoverKnowledge(dir).filter((a) => !a.isWorkItem)
  const match = artifacts.find((a) => {
    const derivedId = a.id || a.relPath.replace(/[/\\]/g, '-').replace(/\.md$/, '')
    return derivedId === artifactId
  })

  if (!match) {
    throw new CoreError('ARTIFACT_NOT_FOUND', 'Knowledge artifact not found.')
  }

  const fullPath = join(dir, match.relPath)
  if (!exists(fullPath)) {
    throw new CoreError('ARTIFACT_UNAVAILABLE', 'This artifact existed when the Knowledge inventory was loaded but can no longer be read.')
  }

  const raw = readFile(fullPath)
  const contentStart = raw.indexOf('---', raw.indexOf('---') + 3)
  const content = contentStart > 0 ? raw.slice(contentStart + 3).trim() : raw

  const layerId = match.layer === 'module' ? 'tech' : match.layer
  const status = normalizeArtifactStatus(match.status || 'available')

  return {
    id: match.id || match.relPath.replace(/[/\\]/g, '-').replace(/\.md$/, ''),
    title: match.title || match.relPath.split('/').pop()?.replace(/\.md$/, '').replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Untitled',
    layer: layerId,
    path: match.relPath,
    status,
    format: 'markdown',
    content,
    type: match.type || undefined,
  }
}

export class CoreError extends Error {
  constructor(public code: string, message: string) {
    super(message)
    this.name = 'CoreError'
  }
}

// --- Integrations (VS-102) ---------------------------------------------------
// The Admin surface over the Integration Adapter Foundation. Reads never mutate; import always goes
// through the human-confirmed Core boundary. Errors are mapped to safe CoreError codes — secrets and
// raw provider messages are never surfaced.

function mapIntegrationError(err: unknown): never {
  if (err instanceof IntegrationError) throw new CoreError(err.code, err.safeMessage)
  if (err instanceof IntegrationServiceError) throw new CoreError(err.code, err.message)
  throw err as Error
}

function assertExternalId(externalId: string): void {
  if (!externalId || externalId.includes('/') || externalId.includes('\\') || externalId.includes('..')) {
    throw new CoreError('INVALID_EXTERNAL_ID', 'Invalid external work item identifier.')
  }
}

function assertIntegrationId(id: string): void {
  if (!id || id.includes('..') || id.includes('/') || id.includes('\\') || id.startsWith('.') || !/^[a-z0-9][a-z0-9._-]*$/i.test(id)) {
    throw new CoreError('INVALID_INTEGRATION_ID', 'Invalid integration identifier.')
  }
}

function assertSecretName(name: string): void {
  if (!name || name.includes('..') || name.includes('/') || name.includes('\\') || !/^[a-zA-Z0-9_-]+$/.test(name)) {
    throw new CoreError('INVALID_SECRET_NAME', 'Invalid secret name.')
  }
}

export function getIntegrations(dir: string): ReturnType<typeof coreListIntegrations> {
  return coreListIntegrations(dir)
}

export async function getIntegrationStatus(dir: string, id: string): Promise<Awaited<ReturnType<typeof coreVerifyIntegration>>> {
  assertIntegrationId(id)
  try {
    return await coreVerifyIntegration(dir, id)
  } catch (err) {
    mapIntegrationError(err)
  }
}

export async function getExternalWorkItems(
  dir: string,
  id: string,
  opts: { cursor?: string; pageSize?: number; filters?: ExternalWorkItemFilters },
): Promise<Awaited<ReturnType<typeof coreListExternalWorkItems>>> {
  assertIntegrationId(id)
  try {
    return await coreListExternalWorkItems(dir, id, { cursor: opts.cursor, pageSize: opts.pageSize, filters: opts.filters })
  } catch (err) {
    mapIntegrationError(err)
  }
}

export async function getExternalWorkItemDetail(dir: string, id: string, externalId: string): Promise<Awaited<ReturnType<typeof coreGetExternalWorkItem>>> {
  assertIntegrationId(id)
  assertExternalId(externalId)
  try {
    return await coreGetExternalWorkItem(dir, id, externalId)
  } catch (err) {
    mapIntegrationError(err)
  }
}

export async function previewIntegrationImport(dir: string, id: string, externalId: string, opts: { type?: string }): Promise<Awaited<ReturnType<typeof corePreviewImport>>> {
  assertIntegrationId(id)
  assertExternalId(externalId)
  try {
    return await corePreviewImport(dir, id, externalId, { type: opts.type })
  } catch (err) {
    mapIntegrationError(err)
  }
}

/** Mutating, human-confirmed (the UI confirm) import into a canonical Draft. Requires an explicit type. */
export async function importIntegrationWorkItem(dir: string, id: string, externalId: string, opts: { type: string }): Promise<Awaited<ReturnType<typeof coreImportExternalWorkItem>>> {
  assertIntegrationId(id)
  assertExternalId(externalId)
  try {
    return await coreImportExternalWorkItem(dir, id, externalId, { type: opts.type })
  } catch (err) {
    if (err instanceof WorkItemWriteError) throw new CoreError(err.code, err.message)
    mapIntegrationError(err)
  }
}

// --- Integration management (VS-103) ----------------------------------------

export function getIntegrationDetail(dir: string, id: string): ReturnType<typeof coreGetIntegration> {
  assertIntegrationId(id)
  try { return coreGetIntegration(dir, id) } catch (err) { mapIntegrationError(err) }
}

export async function getIntegrationSecretStatusAdmin(dir: string, id: string): Promise<Awaited<ReturnType<typeof coreGetIntegrationSecretStatus>>> {
  assertIntegrationId(id)
  try { return await coreGetIntegrationSecretStatus(dir, id) } catch (err) { mapIntegrationError(err) }
}

export function getAvailableIntegrationTypesAdmin(): ReturnType<typeof coreGetAvailableIntegrationTypes> {
  return coreGetAvailableIntegrationTypes()
}

export function createIntegrationAdmin(dir: string, body: { id: string; adapter: string; enabled?: boolean; config?: Record<string, unknown>; secrets?: Record<string, string> }): ReturnType<typeof coreCreateIntegration> {
  try { return coreCreateIntegration(dir, body) } catch (err) { mapIntegrationError(err) }
}

export function updateIntegrationAdmin(dir: string, id: string, body: { enabled?: boolean; config?: Record<string, unknown>; secrets?: Record<string, string> }): ReturnType<typeof coreUpdateIntegration> {
  assertIntegrationId(id)
  try { return coreUpdateIntegration(dir, id, body) } catch (err) { mapIntegrationError(err) }
}

export function deleteIntegrationAdmin(dir: string, id: string): void {
  assertIntegrationId(id)
  try { coreDeleteIntegration(dir, id) } catch (err) { mapIntegrationError(err) }
}

export function enableIntegrationAdmin(dir: string, id: string): ReturnType<typeof coreEnableIntegration> {
  assertIntegrationId(id)
  try { return coreEnableIntegration(dir, id) } catch (err) { mapIntegrationError(err) }
}

export function disableIntegrationAdmin(dir: string, id: string): ReturnType<typeof coreDisableIntegration> {
  assertIntegrationId(id)
  try { return coreDisableIntegration(dir, id) } catch (err) { mapIntegrationError(err) }
}

export async function setIntegrationSecretAdmin(dir: string, id: string, secretName: string, value: string): Promise<void> {
  assertIntegrationId(id)
  assertSecretName(secretName)
  try { await coreSetIntegrationSecret(dir, id, secretName, value) } catch (err) { mapIntegrationError(err) }
}

export async function removeIntegrationSecretAdmin(dir: string, id: string, secretName: string): Promise<void> {
  assertIntegrationId(id)
  assertSecretName(secretName)
  try { await coreRemoveIntegrationSecret(dir, id, secretName) } catch (err) { mapIntegrationError(err) }
}

// --- Discovery & filter management (VS-104) ----------------------------------

export async function discoverExternalWorkItemsAdmin(
  dir: string,
  opts: { filters?: ExternalWorkItemFilters; pageSize?: number; integrationIds?: string[]; cursors?: Record<string, string> },
): Promise<Awaited<ReturnType<typeof coreDiscoverExternalWorkItems>>> {
  try {
    return await coreDiscoverExternalWorkItems(dir, opts)
  } catch (err) {
    mapIntegrationError(err)
  }
}

// --- Initiatives (WI-022) ---------------------------------------------------

export type InitiativeListItemAdmin = {
  id: string
  title: string
  status: InitiativeStatus
  horizon: string | null
  priority: string | null
  planning: InitiativeProgress['planning']
  delivery: InitiativeProgress['delivery']
}

export type InitiativeDetailAdmin = {
  id: string
  title: string
  status: InitiativeStatus
  horizon: string | null
  priority: string | null
  knowledgeLevel: string | null
  domains: string[]
  relatedCapabilities: string[]
  source: string | null
  sourceId: string | null
  externalLinks: InitiativeExternalLink[]
  candidates: InitiativeCandidate[]
  progress: InitiativeProgress
  workItems: AssociatedWorkItem[]
  analysis: InitiativeAnalysis
  completion: CompletionReadiness
  body: string
}

function assertValidInitiativeId(id: string): void {
  if (!id || id.includes('..') || id.includes('/') || id.includes('\\') || id.startsWith('.')) {
    throw new CoreError('INVALID_INITIATIVE_ID', 'Invalid Initiative identifier.')
  }
}

function mapInitiativeError(err: unknown): never {
  if (err instanceof InitiativeWriteError) throw new CoreError('INITIATIVE_WRITE', err.message)
  throw err as Error
}

export function getInitiativesListAdmin(dir: string): { initiatives: InitiativeListItemAdmin[] } {
  const initiatives = discoverInitiatives(dir).map((ini: Initiative) => {
    const p = computeInitiativeProgress(dir, ini)
    return {
      id: ini.id,
      title: ini.title,
      status: ini.status,
      horizon: ini.horizon,
      priority: ini.priority,
      planning: p.planning,
      delivery: p.delivery,
    }
  })
  return { initiatives }
}

export function getInitiativeDetailAdmin(dir: string, id: string): InitiativeDetailAdmin {
  assertValidInitiativeId(id)
  const ini = coreGetInitiative(dir, id)
  if (!ini) throw new CoreError('INITIATIVE_NOT_FOUND', 'This Initiative does not exist in the current project.')
  return {
    id: ini.id,
    title: ini.title,
    status: ini.status,
    horizon: ini.horizon,
    priority: ini.priority,
    knowledgeLevel: ini.knowledgeLevel,
    domains: ini.domains,
    relatedCapabilities: ini.relatedCapabilities,
    source: ini.source,
    sourceId: ini.sourceId,
    externalLinks: ini.externalLinks,
    candidates: ini.candidates,
    progress: computeInitiativeProgress(dir, ini),
    workItems: associatedWorkItems(dir, ini.id),
    analysis: analyzeInitiative(dir, ini),
    completion: evaluateInitiativeCompletion(dir, ini),
    body: ini.body,
  }
}

export function createInitiativeAdmin(
  dir: string,
  body: { title: string; domains?: string[]; horizon?: string; priority?: string },
): { id: string } {
  try {
    const ini = coreCreateInitiative(dir, {
      title: body.title,
      domains: body.domains,
      horizon: body.horizon,
      priority: body.priority,
    })
    return { id: ini.id }
  } catch (err) { mapInitiativeError(err) }
}

export function updateInitiativeAdmin(
  dir: string,
  id: string,
  body: { status?: string; title?: string; horizon?: string; priority?: string; domains?: string[] },
): { id: string; status: InitiativeStatus } {
  assertValidInitiativeId(id)
  try {
    let ini = coreGetInitiative(dir, id)
    if (!ini) throw new CoreError('INITIATIVE_NOT_FOUND', 'This Initiative does not exist in the current project.')
    if (body.status) {
      ini = coreTransitionInitiative(dir, id, body.status as InitiativeStatus)
    }
    if (body.title !== undefined || body.horizon !== undefined || body.priority !== undefined || body.domains !== undefined) {
      ini = coreUpdateInitiative(dir, id, {
        title: body.title,
        horizon: body.horizon,
        priority: body.priority,
        domains: body.domains,
      })
    }
    return { id: ini.id, status: ini.status }
  } catch (err) {
    if (err instanceof CoreError) throw err
    mapInitiativeError(err)
  }
}

export function getIntegrationFiltersAdmin(dir: string, id: string): ReturnType<typeof coreGetIntegrationFilters> {
  assertIntegrationId(id)
  try { return coreGetIntegrationFilters(dir, id) } catch (err) { mapIntegrationError(err) }
}

export function updateIntegrationFiltersAdmin(dir: string, id: string, filters: ExternalWorkItemFilters): ReturnType<typeof coreUpdateIntegrationFilters> {
  assertIntegrationId(id)
  try { return coreUpdateIntegrationFilters(dir, id, filters) } catch (err) { mapIntegrationError(err) }
}

// --- Project Resources (WI-039) — read + CRUD, delegating to the Core contract. ------------------

function mapResourceError(err: unknown): never {
  if (err instanceof ResourceWriteError) throw new CoreError(err.code, err.message)
  throw err
}

export function getResourcesAdmin(dir: string) {
  return { resources: coreGetResources(dir) }
}

export function getResourceDetailAdmin(dir: string, id: string) {
  const resource = coreGetResource(dir, id)
  if (!resource) throw new CoreError('RESOURCE_NOT_FOUND', 'This Project Resource does not exist in the current project.')
  const references = coreGetResourceReferences(dir, resource.id)
  return { ...resource, references }
}

export function createResourceAdmin(dir: string, body: ResourceInput) {
  try {
    return coreCreateResource(dir, body)
  } catch (err) {
    mapResourceError(err)
  }
}

export function updateResourceAdmin(dir: string, id: string, body: ResourceInput) {
  try {
    return coreUpdateResource(dir, id, body)
  } catch (err) {
    mapResourceError(err)
  }
}

export function deleteResourceAdmin(dir: string, id: string, confirm: boolean) {
  try {
    return coreDeleteResource(dir, id, { confirm })
  } catch (err) {
    mapResourceError(err)
  }
}

// --- Controlled Deprecation (WI-053) ----------------------------------------
// The adapter projects Core facts for Admin; lifecycle and dependency rules are never recreated in
// the browser.
function assertDeprecationId(value: string): void {
  if (!value || value.includes('..') || value.includes('/') || value.includes('\\')) {
    throw new CoreError('INVALID_DEPRECATION_ID', 'Invalid Deprecation identifier.')
  }
}

function deprecationPlanProjection(dir: string, planId: string) {
  const plan = coreGetDeprecationPlan(dir, planId)
  if (!plan) throw new CoreError('DEPRECATION_NOT_FOUND', 'This Deprecation Plan does not exist in the current project.')
  const intelligence = planIntelligence(plan)
  const { waves, blocked } = deriveRemovalWaves(plan)
  const waveByTarget = new Map(waves.flatMap((wave, index) => wave.map((id) => [id, index + 1] as const)))
  const targets = plan.targets.map((target) => {
    const environment = environmentSummary(target)
    const relatedWorkItems = discoverKnowledge(dir)
      .filter((artifact) => artifact.isWorkItem)
      .filter((artifact) => parseWorkItemDeprecationTargets(artifact.rawFrontmatter)
        .some((ref) => ref.target === target.id && (!ref.plan || ref.plan === plan.id)))
      .map((artifact) => ({ id: artifact.id, title: artifact.title, lifecycle: artifact.lifecycle ?? 'ready' }))
    const runbooks = discoverKnowledge(dir)
      .filter((artifact) => artifact.type === 'production-runbook')
      .filter((artifact) => artifact.rawFrontmatter.deprecation_plan === plan.id && artifact.rawFrontmatter.deprecation_target === target.id)
      .map((artifact) => coreGetProductionRunbook(dir, artifact.id))
      .filter((runbook): runbook is NonNullable<typeof runbook> => Boolean(runbook))
      .map((runbook) => ({ id: runbook.id, path: runbook.path, approval: runbook.approval }))
    return {
      ...target,
      environment,
      observation: observationStatus(target),
      wave: waveByTarget.get(target.id) ?? null,
      dependents: plan.targets.filter((candidate) => candidate.dependsOnRemoval.includes(target.id)).map((candidate) => candidate.id),
      resource: target.resource ? coreGetResource(dir, target.resource) : null,
      relatedWorkItems,
      runbooks,
    }
  })
  const lifecycleCounts = plan.lifecycleCounts
  return {
    ...plan,
    summary: {
      targets: plan.targetCount,
      softDeprecated: lifecycleCounts['soft-deprecated'] ?? 0,
      devTestRemoved: plan.targets.filter((target) => environmentSummary(target).removedInDevTest).length,
      productionPending: plan.targets.filter((target) => ['production-ready', 'production-changed', 'observing'].includes(String(target.lifecycle))).length,
      completed: lifecycleCounts.completed ?? 0,
    },
    pipeline: lifecycleCounts,
    board: Object.entries(lifecycleCounts).map(([state, count]) => ({ state, count, targets: targets.filter((target) => target.lifecycle === state).map((target) => target.id) })),
    dependency: { waves, blocked },
    targets,
    intelligence,
  }
}

export function getDeprecationsAdmin(dir: string) {
  return { plans: coreGetDeprecationPlans(dir).map((plan) => deprecationPlanProjection(dir, plan.id)) }
}

export function getDeprecationPlanAdmin(dir: string, planId: string) {
  assertDeprecationId(planId)
  return deprecationPlanProjection(dir, planId)
}

/**
 * Create a single Deprecation Plan from Admin (WI-056). Captures a draft INTENT — title + purpose —
 * through the existing Core contract. Admin Server never writes Markdown and never creates targets,
 * runs discovery, or authorizes any removal; the plan starts as a draft with zero targets.
 */
export function createDeprecationAdmin(dir: string, body: { title: string; purpose?: string }) {
  try {
    const result = coreCreatePlan(dir, { title: body.title, purpose: body.purpose })
    return deprecationPlanProjection(dir, result.id)
  } catch (err) {
    if (err instanceof DeprecationWriteError) throw new CoreError(err.code, err.message)
    throw err
  }
}

export function getDeprecationTargetAdmin(dir: string, planId: string, targetId: string) {
  assertDeprecationId(planId); assertDeprecationId(targetId)
  const plan = deprecationPlanProjection(dir, planId)
  const target = plan.targets.find((item) => item.id === targetId)
  if (!target) throw new CoreError('DEPRECATION_TARGET_NOT_FOUND', 'This Deprecation Target does not exist in the selected plan.')
  return { plan: { id: plan.id, title: plan.title }, target, dependency: plan.dependency }
}
