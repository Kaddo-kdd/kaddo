import {
  buildProjectExplanation,
  buildReadinessReport,
  buildProjectRoute,
  knowledgeLayers,
  loadConfig,
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
  exists,
  join,
  readFile,
  type WorkItemFilters,
  type WorkItemInput as CoreWorkItemInput,
  type ExternalWorkItemFilters,
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
    structure: config.project.structure ?? 'unknown',
    language: (config.project as { language?: string }).language ?? 'en',
    teamSize: config.team.size ?? 'unknown',
  }
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

export function getProjectOverview(dir: string): ProjectOverview {
  return {
    project: getProjectSummary(dir),
    knowledge: getKnowledgeSummary(dir),
    workItems: getWorkItemSummary(dir),
    modules: getModules(dir),
    readiness: getProjectReadiness(dir),
    route: getProjectRoute(dir),
    findings: getFindings(dir),
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

export function getIntegrations(dir: string): ReturnType<typeof coreListIntegrations> {
  return coreListIntegrations(dir)
}

export async function getIntegrationStatus(dir: string, id: string): Promise<Awaited<ReturnType<typeof coreVerifyIntegration>>> {
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
  try {
    return await coreListExternalWorkItems(dir, id, { cursor: opts.cursor, pageSize: opts.pageSize, filters: opts.filters })
  } catch (err) {
    mapIntegrationError(err)
  }
}

export async function getExternalWorkItemDetail(dir: string, id: string, externalId: string): Promise<Awaited<ReturnType<typeof coreGetExternalWorkItem>>> {
  assertExternalId(externalId)
  try {
    return await coreGetExternalWorkItem(dir, id, externalId)
  } catch (err) {
    mapIntegrationError(err)
  }
}

export async function previewIntegrationImport(dir: string, id: string, externalId: string, opts: { type?: string }): Promise<Awaited<ReturnType<typeof corePreviewImport>>> {
  assertExternalId(externalId)
  try {
    return await corePreviewImport(dir, id, externalId, { type: opts.type })
  } catch (err) {
    mapIntegrationError(err)
  }
}

/** Mutating, human-confirmed (the UI confirm) import into a canonical Draft. Requires an explicit type. */
export async function importIntegrationWorkItem(dir: string, id: string, externalId: string, opts: { type: string }): Promise<Awaited<ReturnType<typeof coreImportExternalWorkItem>>> {
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
  try { return coreGetIntegration(dir, id) } catch (err) { mapIntegrationError(err) }
}

export async function getIntegrationSecretStatusAdmin(dir: string, id: string): Promise<Awaited<ReturnType<typeof coreGetIntegrationSecretStatus>>> {
  try { return await coreGetIntegrationSecretStatus(dir, id) } catch (err) { mapIntegrationError(err) }
}

export function getAvailableIntegrationTypesAdmin(): ReturnType<typeof coreGetAvailableIntegrationTypes> {
  return coreGetAvailableIntegrationTypes()
}

export function createIntegrationAdmin(dir: string, body: { id: string; adapter: string; enabled?: boolean; config?: Record<string, unknown>; secrets?: Record<string, string> }): ReturnType<typeof coreCreateIntegration> {
  try { return coreCreateIntegration(dir, body) } catch (err) { mapIntegrationError(err) }
}

export function updateIntegrationAdmin(dir: string, id: string, body: { enabled?: boolean; config?: Record<string, unknown>; secrets?: Record<string, string> }): ReturnType<typeof coreUpdateIntegration> {
  try { return coreUpdateIntegration(dir, id, body) } catch (err) { mapIntegrationError(err) }
}

export function deleteIntegrationAdmin(dir: string, id: string): void {
  try { coreDeleteIntegration(dir, id) } catch (err) { mapIntegrationError(err) }
}

export function enableIntegrationAdmin(dir: string, id: string): ReturnType<typeof coreEnableIntegration> {
  try { return coreEnableIntegration(dir, id) } catch (err) { mapIntegrationError(err) }
}

export function disableIntegrationAdmin(dir: string, id: string): ReturnType<typeof coreDisableIntegration> {
  try { return coreDisableIntegration(dir, id) } catch (err) { mapIntegrationError(err) }
}

export async function setIntegrationSecretAdmin(dir: string, id: string, secretName: string, value: string): Promise<void> {
  try { await coreSetIntegrationSecret(dir, id, secretName, value) } catch (err) { mapIntegrationError(err) }
}

export async function removeIntegrationSecretAdmin(dir: string, id: string, secretName: string): Promise<void> {
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

export function getIntegrationFiltersAdmin(dir: string, id: string): ReturnType<typeof coreGetIntegrationFilters> {
  try { return coreGetIntegrationFilters(dir, id) } catch (err) { mapIntegrationError(err) }
}

export function updateIntegrationFiltersAdmin(dir: string, id: string, filters: ExternalWorkItemFilters): ReturnType<typeof coreUpdateIntegrationFilters> {
  try { return coreUpdateIntegrationFilters(dir, id, filters) } catch (err) { mapIntegrationError(err) }
}
