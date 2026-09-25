// Integration service (VS-102 + VS-103).
//
// The composition layer between the provider-agnostic @kaddo/integrations foundation and Kaddo Core.
// It loads integration configuration, resolves secret references at runtime only, drives adapters for
// read operations, and — on explicit human-confirmed import — materializes a canonical Draft Work Item
// through Core's existing createWorkItem (no duplicate creation logic, no Git, no secrets persisted).
//
// VS-103 adds CRUD operations for managing integrations from Admin/CLI: create, update, delete,
// enable/disable, and secret management through the SecretProvider abstraction.
//
// Adapters never write Kaddo artifacts; this service is the only place external reads cross into Core.

import matter from 'gray-matter'
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'
import { readFile, writeFile, exists, join } from '../utils/fs.js'
import { createWorkItem } from '../core/work-item-write.js'
import { parseWorkItemSource } from '../core/work-item-source.js'
import { discoverWorkItems } from './knowledge-artifacts.js'
import {
  createDefaultRegistry,
  parseIntegrationsConfig,
  resolveCredentials,
  resolveAllCredentials,
  serializeIntegrationsConfig,
  integrationConfigFromInput,
  buildImportPreview,
  integrationError,
  IntegrationError,
  createLocalSecretProvider,
  createEnvSecretProvider,
  createCompositeResolver,
  secretRefKey,
  type SecretProvider,
  type SecretResolver,
  type IntegrationRegistry,
  type IntegrationConfig,
  type IntegrationInput,
  type IntegrationContext,
  type IntegrationCapabilities,
  type IntegrationAdapterMetadata,
  type ConfigFieldSchema,
  type ConnectionResult,
  type ExternalWorkItem,
  type ExternalWorkItemPage,
  type ExternalWorkItemFilters,
  type FilterCapabilities,
  type ImportPreview,
  type IntegrationStatus,
  type IntegrationConfigFinding,
  type SchemaValidationFinding,
  mergeFilters,
  validateConfigAgainstSchema,
} from '../../../integrations/src/index.js'

export const INTEGRATIONS_FILE = '.kaddo/integrations.yml'
const DEFAULT_TIMEOUT_MS = 10_000

/** Shared registry with the reference adapter registered. Concrete providers register on top. */
const registry: IntegrationRegistry = createDefaultRegistry()
export function integrationRegistry(): IntegrationRegistry {
  return registry
}

export type IntegrationServiceErrorCode =
  | 'INTEGRATION_NOT_CONFIGURED'
  | 'INTEGRATION_DISABLED'
  | 'INTEGRATION_INVALID_CONFIG'
  | 'ADAPTER_NOT_FOUND'
  | 'INTEGRATION_ALREADY_EXISTS'
  | 'INTEGRATION_INVALID_INPUT'
export class IntegrationServiceError extends Error {
  readonly code: IntegrationServiceErrorCode
  constructor(code: IntegrationServiceErrorCode, message: string) {
    super(message)
    this.name = 'IntegrationServiceError'
    this.code = code
  }
}

export type IntegrationSummary = {
  id: string
  adapter: string
  enabled: boolean
  status: IntegrationStatus
  displayName: string
  capabilities: IntegrationCapabilities | null
  metadata: IntegrationAdapterMetadata | null
  credentialRefs: string[]
  secretRefs: string[]
  secretStatus: Record<string, boolean>
  filters?: ExternalWorkItemFilters
  findings: IntegrationConfigFinding[]
}

// --- Config loading + writing ------------------------------------------------

function loadRaw(dir: string): unknown {
  const abs = join(dir, INTEGRATIONS_FILE)
  if (!exists(abs)) return { integrations: [] }
  try {
    return parseYaml(readFile(abs)) ?? { integrations: [] }
  } catch {
    return { integrations: [] }
  }
}

export function loadIntegrations(dir: string): { integrations: IntegrationConfig[]; findings: IntegrationConfigFinding[] } {
  return parseIntegrationsConfig(loadRaw(dir), { adapterIds: registry.ids() })
}

function saveIntegrations(dir: string, integrations: IntegrationConfig[]): void {
  const abs = join(dir, INTEGRATIONS_FILE)
  const data = serializeIntegrationsConfig(integrations)
  writeFile(abs, stringifyYaml(data, { lineWidth: 120 }))
}

/** Config-level status: never performs a network check (that is verifyIntegration's job). */
function configStatus(integration: IntegrationConfig, findings: IntegrationConfigFinding[]): IntegrationStatus {
  if (!integration.enabled) return 'disabled'
  const blocking = findings.some((f) => f.id === integration.id && f.level === 'blocking')
  if (blocking || !registry.has(integration.adapter)) return 'invalid-config'
  return 'configured'
}

function secretProvider(dir: string): SecretProvider {
  return createLocalSecretProvider(dir)
}

function secretResolver(dir: string, env: Record<string, string | undefined>): SecretResolver {
  return createCompositeResolver(createLocalSecretProvider(dir), createEnvSecretProvider(env))
}

// --- List / get integrations -------------------------------------------------

export function listIntegrations(dir: string): IntegrationSummary[] {
  const { integrations, findings } = loadIntegrations(dir)
  return integrations.map((integration) => {
    const adapter = registry.get(integration.adapter)
    return {
      id: integration.id,
      adapter: integration.adapter,
      enabled: integration.enabled,
      status: configStatus(integration, findings),
      displayName: adapter?.metadata.displayName ?? integration.adapter,
      capabilities: adapter?.capabilities ?? null,
      metadata: adapter?.metadata ?? null,
      credentialRefs: Object.values(integration.credentials).map((c) => c.env),
      secretRefs: Object.values(integration.secrets),
      secretStatus: {},
      filters: integration.filters,
      findings: findings.filter((f) => f.id === integration.id),
    }
  })
}

export function getIntegration(dir: string, id: string): IntegrationSummary {
  const { integrations, findings } = loadIntegrations(dir)
  const integration = integrations.find((i) => i.id === id)
  if (!integration) throw new IntegrationServiceError('INTEGRATION_NOT_CONFIGURED', `No integration "${id}" is configured in this project.`)
  const adapter = registry.get(integration.adapter)
  return {
    id: integration.id,
    adapter: integration.adapter,
    enabled: integration.enabled,
    status: configStatus(integration, findings),
    displayName: adapter?.metadata.displayName ?? integration.adapter,
    capabilities: adapter?.capabilities ?? null,
    metadata: adapter?.metadata ?? null,
    credentialRefs: Object.values(integration.credentials).map((c) => c.env),
    secretRefs: Object.values(integration.secrets),
    secretStatus: {},
    filters: integration.filters,
    findings: findings.filter((f) => f.id === integration.id),
  }
}

/** Resolve which secrets are configured (without revealing values). */
export async function getIntegrationSecretStatus(dir: string, id: string): Promise<Record<string, boolean>> {
  const { integrations } = loadIntegrations(dir)
  const integration = integrations.find((i) => i.id === id)
  if (!integration) throw new IntegrationServiceError('INTEGRATION_NOT_CONFIGURED', `No integration "${id}" is configured.`)
  const sp = secretProvider(dir)
  const status: Record<string, boolean> = {}
  for (const [name, ref] of Object.entries(integration.secrets)) {
    status[name] = await sp.exists(ref)
  }
  // Also check env-var credentials
  for (const [name, ref] of Object.entries(integration.credentials)) {
    const val = process.env[ref.env]
    status[name] = val !== undefined && val !== ''
  }
  return status
}

// --- Available adapter types -------------------------------------------------

export type AdapterTypeInfo = {
  id: string
  displayName: string
  description?: string
  icon?: string
  configSchema: Record<string, ConfigFieldSchema>
  secretSchema: Record<string, ConfigFieldSchema>
  filterCapabilities?: FilterCapabilities
  capabilities: IntegrationCapabilities
}

export function getAvailableIntegrationTypes(): AdapterTypeInfo[] {
  return registry.list().map((a) => ({
    id: a.id,
    displayName: a.metadata.displayName,
    description: a.metadata.description,
    icon: a.metadata.icon,
    configSchema: a.metadata.configSchema ?? {},
    secretSchema: a.metadata.secretSchema ?? {},
    filterCapabilities: a.metadata.filterCapabilities,
    capabilities: a.capabilities,
  }))
}

// --- Internal helpers --------------------------------------------------------

function requireIntegration(dir: string, id: string): { integration: IntegrationConfig; findings: IntegrationConfigFinding[]; all: IntegrationConfig[] } {
  const { integrations, findings } = loadIntegrations(dir)
  const integration = integrations.find((i) => i.id === id)
  if (!integration) throw new IntegrationServiceError('INTEGRATION_NOT_CONFIGURED', `No integration "${id}" is configured in this project.`)
  return { integration, findings, all: integrations }
}

function resolveAdapter(integration: IntegrationConfig) {
  const adapter = registry.get(integration.adapter)
  if (!adapter) throw new IntegrationServiceError('ADAPTER_NOT_FOUND', `Unknown integration adapter "${integration.adapter}".`)
  return adapter
}

function buildContext(integration: IntegrationConfig, env: Record<string, string | undefined>): { context: IntegrationContext; missing: string[] } {
  const { credentials, missing } = resolveCredentials(integration, env)
  return {
    context: { integrationId: integration.id, config: integration.config, credentials, timeoutMs: integration.timeoutMs ?? DEFAULT_TIMEOUT_MS },
    missing,
  }
}

async function buildContextWithSecrets(
  dir: string,
  integration: IntegrationConfig,
  env: Record<string, string | undefined>,
): Promise<{ context: IntegrationContext; missing: string[] }> {
  const resolver = secretResolver(dir, env)
  const { credentials, missing } = await resolveAllCredentials(integration, resolver, env)
  return {
    context: { integrationId: integration.id, config: integration.config, credentials, timeoutMs: integration.timeoutMs ?? DEFAULT_TIMEOUT_MS },
    missing,
  }
}

async function withTimeout<T>(op: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => { timer = setTimeout(() => reject(integrationError('INTEGRATION_TIMEOUT')), ms) })
  try {
    return await Promise.race([op, timeout])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

// --- CRUD operations (VS-103) ------------------------------------------------

function validateId(id: string): void {
  if (!id || !id.trim()) throw new IntegrationServiceError('INTEGRATION_INVALID_INPUT', 'Integration id is required.')
  if (!/^[a-z0-9][a-z0-9._-]*$/i.test(id)) throw new IntegrationServiceError('INTEGRATION_INVALID_INPUT', 'Integration id must be alphanumeric with dashes, dots or underscores.')
  if (id.length > 64) throw new IntegrationServiceError('INTEGRATION_INVALID_INPUT', 'Integration id must be 64 characters or fewer.')
}

export function createIntegration(dir: string, input: IntegrationInput): IntegrationSummary {
  validateId(input.id)
  if (!input.adapter || !input.adapter.trim()) throw new IntegrationServiceError('INTEGRATION_INVALID_INPUT', 'An adapter type is required.')
  const adapter = registry.get(input.adapter)
  if (!adapter) throw new IntegrationServiceError('ADAPTER_NOT_FOUND', `Unknown integration adapter "${input.adapter}".`)
  const { integrations } = loadIntegrations(dir)
  if (integrations.find((i) => i.id === input.id)) {
    throw new IntegrationServiceError('INTEGRATION_ALREADY_EXISTS', `An integration with id "${input.id}" already exists.`)
  }
  if (adapter.metadata.configSchema && input.config) {
    const findings = validateConfigAgainstSchema(input.config, adapter.metadata.configSchema)
    if (findings.length) {
      throw new IntegrationServiceError('INTEGRATION_INVALID_INPUT', findings.map((f) => f.message).join(' '))
    }
  }
  const newConfig = integrationConfigFromInput(input)
  integrations.push(newConfig)
  saveIntegrations(dir, integrations)
  return getIntegration(dir, input.id)
}

export type UpdateIntegrationInput = {
  enabled?: boolean
  config?: Record<string, unknown>
  secrets?: Record<string, string>
  timeoutMs?: number
}

export function updateIntegration(dir: string, id: string, input: UpdateIntegrationInput): IntegrationSummary {
  const { integrations } = loadIntegrations(dir)
  const idx = integrations.findIndex((i) => i.id === id)
  if (idx < 0) throw new IntegrationServiceError('INTEGRATION_NOT_CONFIGURED', `No integration "${id}" is configured.`)
  const existing = integrations[idx]
  if (input.config !== undefined) {
    const adapter = registry.get(existing.adapter)
    if (adapter?.metadata.configSchema) {
      const findings = validateConfigAgainstSchema(input.config, adapter.metadata.configSchema)
      if (findings.length) {
        throw new IntegrationServiceError('INTEGRATION_INVALID_INPUT', findings.map((f) => f.message).join(' '))
      }
    }
    existing.config = input.config
  }
  if (input.enabled !== undefined) existing.enabled = input.enabled
  if (input.secrets !== undefined) existing.secrets = input.secrets
  if (input.timeoutMs !== undefined) existing.timeoutMs = input.timeoutMs
  integrations[idx] = existing
  saveIntegrations(dir, integrations)
  return getIntegration(dir, id)
}

export function deleteIntegration(dir: string, id: string): void {
  const { integrations } = loadIntegrations(dir)
  const idx = integrations.findIndex((i) => i.id === id)
  if (idx < 0) throw new IntegrationServiceError('INTEGRATION_NOT_CONFIGURED', `No integration "${id}" is configured.`)
  const removed = integrations[idx]
  integrations.splice(idx, 1)
  saveIntegrations(dir, integrations)
  // Clean up secrets from the local provider
  const sp = secretProvider(dir)
  for (const ref of Object.values(removed.secrets)) {
    sp.delete(ref).catch(() => {})
  }
}

export function enableIntegration(dir: string, id: string): IntegrationSummary {
  return updateIntegration(dir, id, { enabled: true })
}

export function disableIntegration(dir: string, id: string): IntegrationSummary {
  return updateIntegration(dir, id, { enabled: false })
}

// --- Secret management (VS-103) ----------------------------------------------

export async function setIntegrationSecret(dir: string, id: string, secretName: string, value: string): Promise<void> {
  const { integration } = requireIntegration(dir, id)
  const refKey = secretRefKey(id, secretName)
  // Store the value via the local provider
  const sp = secretProvider(dir)
  await sp.set(refKey, value)
  // Ensure the YAML references this secret
  if (!integration.secrets[secretName] || integration.secrets[secretName] !== refKey) {
    const { integrations } = loadIntegrations(dir)
    const idx = integrations.findIndex((i) => i.id === id)
    if (idx >= 0) {
      integrations[idx].secrets[secretName] = refKey
      saveIntegrations(dir, integrations)
    }
  }
}

export async function removeIntegrationSecret(dir: string, id: string, secretName: string): Promise<void> {
  const { integration } = requireIntegration(dir, id)
  const refKey = integration.secrets[secretName]
  if (refKey) {
    const sp = secretProvider(dir)
    await sp.delete(refKey)
  }
  // Remove from YAML
  const { integrations } = loadIntegrations(dir)
  const idx = integrations.findIndex((i) => i.id === id)
  if (idx >= 0 && integrations[idx].secrets[secretName]) {
    delete integrations[idx].secrets[secretName]
    saveIntegrations(dir, integrations)
  }
}

// --- Connection --------------------------------------------------------------

export type VerifyResult = {
  id: string
  status: IntegrationStatus
  connection: ConnectionResult | null
  missingCredentials: string[]
  message?: string
}

export async function verifyIntegration(dir: string, id: string, env: Record<string, string | undefined> = process.env): Promise<VerifyResult> {
  const { integration, findings } = requireIntegration(dir, id)
  const cfgStatus = configStatus(integration, findings)
  if (cfgStatus === 'disabled') return { id, status: 'disabled', connection: null, missingCredentials: [] }
  if (cfgStatus === 'invalid-config') return { id, status: 'invalid-config', connection: null, missingCredentials: [] }
  const adapter = resolveAdapter(integration)
  const { context, missing } = await buildContextWithSecrets(dir, integration, env)
  try {
    const connection = await withTimeout(adapter.verifyConnection(context), context.timeoutMs)
    return { id, status: statusOf(connection), connection, missingCredentials: missing, message: connection.message }
  } catch (err) {
    const e = err instanceof IntegrationError ? err : integrationError('INTEGRATION_PROVIDER_ERROR')
    return { id, status: e.code === 'INTEGRATION_UNAUTHORIZED' ? 'unauthorized' : 'unavailable', connection: null, missingCredentials: missing, message: e.safeMessage }
  }
}

function statusOf(connection: ConnectionResult): IntegrationStatus {
  switch (connection.status) {
    case 'available': return 'available'
    case 'unauthorized': return 'unauthorized'
    case 'unavailable': return 'unavailable'
    case 'invalid-config': return 'invalid-config'
  }
}

// --- Filter management (VS-104) ----------------------------------------------

export function getIntegrationFilters(dir: string, id: string): ExternalWorkItemFilters {
  const { integration } = requireIntegration(dir, id)
  return integration.filters ?? {}
}

export function updateIntegrationFilters(dir: string, id: string, filters: ExternalWorkItemFilters): IntegrationSummary {
  const { integrations } = loadIntegrations(dir)
  const idx = integrations.findIndex((i) => i.id === id)
  if (idx < 0) throw new IntegrationServiceError('INTEGRATION_NOT_CONFIGURED', `No integration "${id}" is configured.`)
  const clean: ExternalWorkItemFilters = {}
  let hasAny = false
  if (filters.projects?.length) { clean.projects = filters.projects; hasAny = true }
  if (filters.types?.length) { clean.types = filters.types; hasAny = true }
  if (filters.statuses?.length) { clean.statuses = filters.statuses; hasAny = true }
  if (filters.labels?.length) { clean.labels = filters.labels; hasAny = true }
  if (filters.assignees?.length) { clean.assignees = filters.assignees; hasAny = true }
  if (filters.updatedAfter) { clean.updatedAfter = filters.updatedAfter; hasAny = true }
  if (filters.search) { clean.search = filters.search; hasAny = true }
  if (filters.providerQuery) { clean.providerQuery = filters.providerQuery; hasAny = true }
  integrations[idx].filters = hasAny ? clean : undefined
  saveIntegrations(dir, integrations)
  return getIntegration(dir, id)
}

// --- Discovery (VS-104) ------------------------------------------------------

export type DiscoveryItemImportState = { imported: true; workItemId: string; title: string } | { imported: false }

export type EnrichedExternalWorkItem = ExternalWorkItem & { importState: DiscoveryItemImportState }

export type DiscoveryIntegrationResult = {
  integrationId: string
  adapter: string
  displayName: string
  icon?: string
  items: EnrichedExternalWorkItem[]
  hasMore: boolean
  nextCursor?: string
  error?: string
}

export type DiscoveryResult = {
  results: DiscoveryIntegrationResult[]
  totalItems: number
}

export async function discoverExternalWorkItems(
  dir: string,
  opts: { filters?: ExternalWorkItemFilters; pageSize?: number; integrationIds?: string[]; cursors?: Record<string, string> } = {},
  env: Record<string, string | undefined> = process.env,
): Promise<DiscoveryResult> {
  const { integrations, findings } = loadIntegrations(dir)
  const importIdx = buildImportIndex(dir)
  const candidates = integrations.filter((i) => {
    if (!i.enabled) return false
    if (configStatus(i, findings) === 'invalid-config') return false
    if (opts.integrationIds?.length && !opts.integrationIds.includes(i.id)) return false
    const adapter = registry.get(i.adapter)
    return adapter?.capabilities.workItems.list === true
  })

  function enrichItems(integrationId: string, items: ExternalWorkItem[]): EnrichedExternalWorkItem[] {
    return items.map((item) => {
      const linked = importIdx.get(`${integrationId}#${item.externalId}`)
      const importState: DiscoveryItemImportState = linked
        ? { imported: true, workItemId: linked.workItemId, title: linked.title }
        : { imported: false }
      return { ...item, importState }
    })
  }

  const settled = await Promise.allSettled(
    candidates.map(async (integration): Promise<DiscoveryIntegrationResult> => {
      const adapter = resolveAdapter(integration)
      const { context } = await buildContextWithSecrets(dir, integration, env)
      const filters = mergeFilters(integration.filters, opts.filters)
      const cursor = opts.cursors?.[integration.id]
      const page = await withTimeout(
        adapter.listWorkItems({ context, cursor, pageSize: opts.pageSize, filters }),
        context.timeoutMs,
      )
      return {
        integrationId: integration.id,
        adapter: integration.adapter,
        displayName: adapter.metadata.displayName,
        icon: adapter.metadata.icon,
        items: enrichItems(integration.id, page.items),
        hasMore: page.hasMore,
        nextCursor: page.nextCursor,
      }
    }),
  )

  const results: DiscoveryIntegrationResult[] = settled.map((s, i) => {
    if (s.status === 'fulfilled') return s.value
    const integration = candidates[i]
    const adapter = registry.get(integration.adapter)
    const msg = s.reason instanceof IntegrationError ? s.reason.safeMessage : 'An unexpected error occurred.'
    return {
      integrationId: integration.id,
      adapter: integration.adapter,
      displayName: adapter?.metadata.displayName ?? integration.adapter,
      icon: adapter?.metadata.icon,
      items: [],
      hasMore: false,
      error: msg,
    }
  })

  return { results, totalItems: results.reduce((sum, r) => sum + r.items.length, 0) }
}

// --- Reading -----------------------------------------------------------------

export async function listExternalWorkItems(
  dir: string,
  id: string,
  opts: { cursor?: string; pageSize?: number; filters?: ExternalWorkItemFilters } = {},
  env: Record<string, string | undefined> = process.env,
): Promise<ExternalWorkItemPage> {
  const { integration } = requireIntegration(dir, id)
  const adapter = resolveAdapter(integration)
  if (!adapter.capabilities.workItems.list) throw integrationError('UNSUPPORTED_CAPABILITY', `Adapter "${adapter.id}" cannot list work items.`)
  const { context } = await buildContextWithSecrets(dir, integration, env)
  const filters = mergeFilters(integration.filters, opts.filters)
  return withTimeout(adapter.listWorkItems({ context, cursor: opts.cursor, pageSize: opts.pageSize, filters }), context.timeoutMs)
}

export async function getExternalWorkItem(
  dir: string,
  id: string,
  externalId: string,
  env: Record<string, string | undefined> = process.env,
): Promise<ExternalWorkItem | null> {
  const { integration } = requireIntegration(dir, id)
  const adapter = resolveAdapter(integration)
  if (!adapter.capabilities.workItems.read) throw integrationError('UNSUPPORTED_CAPABILITY', `Adapter "${adapter.id}" cannot read work items.`)
  const { context } = await buildContextWithSecrets(dir, integration, env)
  return withTimeout(adapter.getWorkItem({ context, externalId }), context.timeoutMs)
}

// --- Duplicate detection -----------------------------------------------------

export type LinkedWorkItem = { workItemId: string; title: string }

/** Find an existing Work Item already linked to this external identity (integration + externalId). */
export function findLinkedWorkItem(dir: string, integrationId: string, externalId: string): LinkedWorkItem | null {
  for (const art of discoverWorkItems(dir)) {
    let data: Record<string, unknown>
    try {
      data = matter(readFile(art.filePath)).data as Record<string, unknown>
    } catch {
      continue
    }
    const source = parseWorkItemSource(data)
    if (source.integration === integrationId && source.id === externalId) {
      return { workItemId: String(data.id ?? ''), title: String(data.title ?? '') }
    }
  }
  return null
}

export type ImportIndex = Map<string, LinkedWorkItem>

export function buildImportIndex(dir: string): ImportIndex {
  const index: ImportIndex = new Map()
  for (const art of discoverWorkItems(dir)) {
    let data: Record<string, unknown>
    try {
      data = matter(readFile(art.filePath)).data as Record<string, unknown>
    } catch {
      continue
    }
    const source = parseWorkItemSource(data)
    if (source.type === 'external' && source.integration && source.id) {
      index.set(`${source.integration}#${source.id}`, { workItemId: String(data.id ?? ''), title: String(data.title ?? '') })
    }
  }
  return index
}

// --- Import preview + materialization ----------------------------------------

const importLocks = new Set<string>()

export type ImportPreviewResult = { preview: ImportPreview; duplicate: LinkedWorkItem | null }

export async function previewImport(
  dir: string,
  id: string,
  externalId: string,
  opts: { type?: string } = {},
  env: Record<string, string | undefined> = process.env,
): Promise<ImportPreviewResult> {
  const { integration } = requireIntegration(dir, id)
  if (!integration.enabled) throw new IntegrationServiceError('INTEGRATION_DISABLED', `Integration "${id}" is disabled. Enable it before previewing imports.`)
  const item = await getExternalWorkItem(dir, id, externalId, env)
  if (!item) throw integrationError('INTEGRATION_NOT_FOUND', `External work item "${externalId}" was not found.`)
  const preview = buildImportPreview(item, { integrationId: id, type: opts.type })
  return { preview, duplicate: findLinkedWorkItem(dir, id, externalId) }
}

export type ImportResult = { workItemId: string; created: boolean; duplicateOf?: string; preview: ImportPreview; path?: string }

/**
 * Materialize a Draft Work Item from an external item. Requires an explicit Kaddo type (never inferred
 * from the external type) and is only ever called after human confirmation at the CLI/Admin layer.
 * Reuses Core createWorkItem; the external origin is recorded as provenance, not as the source of truth.
 */
export async function importExternalWorkItem(
  dir: string,
  id: string,
  externalId: string,
  opts: { type: string },
  env: Record<string, string | undefined> = process.env,
): Promise<ImportResult> {
  const { integration } = requireIntegration(dir, id)
  if (!integration.enabled) throw new IntegrationServiceError('INTEGRATION_DISABLED', `Integration "${id}" is disabled. Enable it before importing.`)

  const lockKey = `${id}#${externalId}`
  if (importLocks.has(lockKey)) throw new IntegrationServiceError('INTEGRATION_INVALID_INPUT', 'Import already in progress for this item.')
  importLocks.add(lockKey)
  try {
    const item = await getExternalWorkItem(dir, id, externalId, env)
    if (!item) throw integrationError('INTEGRATION_NOT_FOUND', `External work item "${externalId}" was not found.`)
    const preview = buildImportPreview(item, { integrationId: id, type: opts.type })

    const existing = findLinkedWorkItem(dir, id, externalId)
    if (existing) return { workItemId: existing.workItemId, created: false, duplicateOf: existing.workItemId, preview }

    const intent = item.description ? `${item.title}\n\n${item.description}` : item.title
    const created = createWorkItem(dir, {
      intent,
      type: opts.type,
      source: {
        type: 'external',
        provider: item.provider,
        integration: id,
        id: externalId,
        url: item.url,
        imported_at: new Date().toISOString(),
        external_updated_at: item.updatedAt,
      },
      originalSnapshot: {
        title: item.title,
        description: item.description,
        type: item.type,
        status: item.status,
        labels: item.labels,
        assignee: item.assignees?.[0]?.name,
        created_at: item.createdAt,
        updated_at: item.updatedAt,
      },
    })
    return { workItemId: created.id, created: true, preview, path: created.path }
  } finally {
    importLocks.delete(lockKey)
  }
}
