// Integration configuration + secret references (VS-102 + VS-103).
//
// A project declares integrations WITHOUT storing secrets. Config carries only how to FIND a
// credential — an environment-variable reference (VS-102) or a logical secret-provider reference
// (VS-103) — never the credential itself. Validation is deterministic and distinguishes
// missing/invalid config from missing/invalid credentials.

import type { SecretResolver } from './secrets.js'
import type { ExternalWorkItemFilters } from './contract.js'

/** A pointer to where a secret lives at runtime — never the secret value. */
export type SecretReference = { env: string }

export type IntegrationConfig = {
  id: string
  adapter: string
  enabled: boolean
  config: Record<string, unknown>
  /** name → env-var secret reference (VS-102 format). Values are references only. */
  credentials: Record<string, SecretReference>
  /** name → logical secret reference resolved via SecretProvider (VS-103 format). Values are reference keys only. */
  secrets: Record<string, string>
  /** Persistent discovery filters — determines the scope of what Kaddo queries from this integration. */
  filters?: ExternalWorkItemFilters
  timeoutMs?: number
}

export type IntegrationConfigFinding = { level: 'blocking' | 'warning'; id?: string; message: string }

export type IntegrationsConfigResult = {
  integrations: IntegrationConfig[]
  findings: IntegrationConfigFinding[]
}

/** A config key that ends in `_env` declares a secret reference; a literal secret value is rejected. */
const ENV_SUFFIX = '_env'
const SECRET_KEY = /(token|secret|password|key|pat|apikey|api_key)/i

function parseCredentials(raw: unknown, id: string, findings: IntegrationConfigFinding[]): Record<string, SecretReference> {
  const creds: Record<string, SecretReference> = {}
  if (raw == null) return creds
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    findings.push({ level: 'blocking', id, message: `Integration "${id}": credentials must be a mapping of secret references.` })
    return creds
  }
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (key.endsWith(ENV_SUFFIX)) {
      const name = key.slice(0, -ENV_SUFFIX.length)
      if (typeof value === 'string' && value.trim()) creds[name] = { env: value.trim() }
      else findings.push({ level: 'blocking', id, message: `Integration "${id}": credential "${key}" must name an environment variable.` })
      continue
    }
    // A bare secret-looking key with an inline value is a stored secret — never allowed.
    if (SECRET_KEY.test(key) && typeof value === 'string') {
      findings.push({ level: 'blocking', id, message: `Integration "${id}": secret "${key}" must not be stored in config. Use "${key}${ENV_SUFFIX}: <ENV_VAR_NAME>".` })
      continue
    }
    if (value && typeof value === 'object' && typeof (value as Record<string, unknown>).env === 'string') {
      creds[key] = { env: String((value as Record<string, unknown>).env) }
      continue
    }
    findings.push({ level: 'warning', id, message: `Integration "${id}": ignoring unrecognized credential entry "${key}".` })
  }
  return creds
}

function parseSecrets(raw: unknown, id: string, findings: IntegrationConfigFinding[]): Record<string, string> {
  const secrets: Record<string, string> = {}
  if (raw == null) return secrets
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    findings.push({ level: 'blocking', id, message: `Integration "${id}": secrets must be a mapping of logical references.` })
    return secrets
  }
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === 'string' && value.trim()) {
      // Reject anything that looks like an actual secret value rather than a reference name.
      if (value.length > 100 || /^(ghp_|sk-|xox[bpsa]-|glpat-|ey[A-Za-z0-9])/i.test(value)) {
        findings.push({ level: 'blocking', id, message: `Integration "${id}": secret "${key}" appears to contain an actual credential, not a reference name.` })
        continue
      }
      secrets[key] = value.trim()
    } else {
      findings.push({ level: 'warning', id, message: `Integration "${id}": ignoring non-string secret entry "${key}".` })
    }
  }
  return secrets
}

function toStringArray(raw: unknown): string[] | undefined {
  if (raw == null) return undefined
  if (Array.isArray(raw)) return raw.filter((v): v is string => typeof v === 'string' && v.trim() !== '').map((v) => v.trim())
  if (typeof raw === 'string' && raw.trim()) return [raw.trim()]
  return undefined
}

function parseFilters(raw: unknown): ExternalWorkItemFilters | undefined {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const o = raw as Record<string, unknown>
  const filters: ExternalWorkItemFilters = {}
  let hasAny = false
  const projects = toStringArray(o.projects)
  if (projects?.length) { filters.projects = projects; hasAny = true }
  const types = toStringArray(o.types)
  if (types?.length) { filters.types = types; hasAny = true }
  const statuses = toStringArray(o.statuses)
  if (statuses?.length) { filters.statuses = statuses; hasAny = true }
  const labels = toStringArray(o.labels)
  if (labels?.length) { filters.labels = labels; hasAny = true }
  const assignees = toStringArray(o.assignees)
  if (assignees?.length) { filters.assignees = assignees; hasAny = true }
  if (typeof o.updatedAfter === 'string' && o.updatedAfter.trim()) { filters.updatedAfter = o.updatedAfter.trim(); hasAny = true }
  if (typeof o.search === 'string' && o.search.trim()) { filters.search = o.search.trim(); hasAny = true }
  if (typeof o.providerQuery === 'string' && o.providerQuery.trim()) { filters.providerQuery = o.providerQuery.trim(); hasAny = true }
  return hasAny ? filters : undefined
}

/**
 * Parse and validate the raw `integrations` config against the set of known adapter ids. Unknown
 * adapters, duplicate ids and missing ids are findings, not exceptions — the caller decides.
 */
export function parseIntegrationsConfig(raw: unknown, opts: { adapterIds: Set<string> }): IntegrationsConfigResult {
  const findings: IntegrationConfigFinding[] = []
  const integrations: IntegrationConfig[] = []
  const list = raw && typeof raw === 'object' && Array.isArray((raw as Record<string, unknown>).integrations)
    ? ((raw as Record<string, unknown>).integrations as unknown[])
    : Array.isArray(raw) ? (raw as unknown[]) : []

  const seen = new Set<string>()
  for (const entry of list) {
    if (!entry || typeof entry !== 'object') { findings.push({ level: 'blocking', message: 'Each integration must be a mapping.' }); continue }
    const o = entry as Record<string, unknown>
    const id = typeof o.id === 'string' ? o.id.trim() : ''
    const adapter = typeof o.adapter === 'string' ? o.adapter.trim() : ''
    if (!id) { findings.push({ level: 'blocking', message: 'An integration is missing a required "id".' }); continue }
    if (seen.has(id)) { findings.push({ level: 'blocking', id, message: `Duplicate integration id "${id}".` }); continue }
    seen.add(id)
    if (!adapter) { findings.push({ level: 'blocking', id, message: `Integration "${id}" is missing a required "adapter".` }); continue }
    if (!opts.adapterIds.has(adapter)) {
      findings.push({ level: 'blocking', id, message: `Integration "${id}" references unknown adapter "${adapter}".` })
    }
    const enabled = o.enabled === undefined ? true : o.enabled === true || o.enabled === 'true'
    const config = o.config && typeof o.config === 'object' && !Array.isArray(o.config) ? (o.config as Record<string, unknown>) : {}
    const credentials = parseCredentials(o.credentials, id, findings)
    const secrets = parseSecrets(o.secrets, id, findings)
    const filters = parseFilters(o.filters)
    const timeoutMs = typeof o.timeout_ms === 'number' ? o.timeout_ms : typeof o.timeoutMs === 'number' ? o.timeoutMs : undefined
    integrations.push({ id, adapter, enabled, config, credentials, secrets, filters, timeoutMs })
  }
  return { integrations, findings }
}

/**
 * Resolve secret references against a runtime environment. Returns the resolved values (used only for
 * the duration of a call) and the names of any references whose environment variable is unset.
 */
export function resolveCredentials(
  integration: IntegrationConfig,
  env: Record<string, string | undefined>,
): { credentials: Record<string, string>; missing: string[] } {
  const credentials: Record<string, string> = {}
  const missing: string[] = []
  for (const [name, ref] of Object.entries(integration.credentials)) {
    const value = env[ref.env]
    if (value && value.length > 0) credentials[name] = value
    else missing.push(ref.env)
  }
  return { credentials, missing }
}

/**
 * Resolve both env-var credentials (VS-102) and secret-provider references (VS-103) into a single
 * credentials map for the adapter. The SecretResolver handles local + env fallback chain.
 */
export async function resolveAllCredentials(
  integration: IntegrationConfig,
  resolver: SecretResolver,
  env: Record<string, string | undefined>,
): Promise<{ credentials: Record<string, string>; missing: string[] }> {
  const credentials: Record<string, string> = {}
  const missing: string[] = []
  // VS-102 env-var credentials
  for (const [name, ref] of Object.entries(integration.credentials)) {
    const value = env[ref.env]
    if (value && value.length > 0) credentials[name] = value
    else missing.push(ref.env)
  }
  // VS-103 secret-provider references
  for (const [name, ref] of Object.entries(integration.secrets)) {
    if (credentials[name]) continue
    const value = await resolver.resolve(ref)
    if (value !== undefined) credentials[name] = value
    else missing.push(ref)
  }
  return { credentials, missing }
}

// --- YAML serialization (VS-103) --------------------------------------------

export type IntegrationInput = {
  id: string
  adapter: string
  enabled?: boolean
  config?: Record<string, unknown>
  secrets?: Record<string, string>
  filters?: ExternalWorkItemFilters
  timeoutMs?: number
}

/**
 * Serialize an array of integration configs to the YAML-ready object structure.
 * Never includes actual secret values — only references.
 */
export function serializeIntegrationsConfig(integrations: IntegrationConfig[]): { integrations: Record<string, unknown>[] } {
  return {
    integrations: integrations.map((i) => {
      const entry: Record<string, unknown> = {
        id: i.id,
        adapter: i.adapter,
        enabled: i.enabled,
      }
      if (Object.keys(i.config).length > 0) entry.config = i.config
      // Serialize VS-102 credentials
      if (Object.keys(i.credentials).length > 0) {
        const creds: Record<string, string> = {}
        for (const [name, ref] of Object.entries(i.credentials)) {
          creds[`${name}${ENV_SUFFIX}`] = ref.env
        }
        entry.credentials = creds
      }
      // Serialize VS-103 secrets
      if (Object.keys(i.secrets).length > 0) entry.secrets = i.secrets
      // Serialize VS-104 filters
      if (i.filters && Object.keys(i.filters).length > 0) entry.filters = i.filters
      if (i.timeoutMs !== undefined) entry.timeout_ms = i.timeoutMs
      return entry
    }),
  }
}

/** Build a new IntegrationConfig from an input, filling defaults. */
export function integrationConfigFromInput(input: IntegrationInput): IntegrationConfig {
  return {
    id: input.id,
    adapter: input.adapter,
    enabled: input.enabled ?? true,
    config: input.config ?? {},
    credentials: {},
    secrets: input.secrets ?? {},
    filters: input.filters,
    timeoutMs: input.timeoutMs,
  }
}

// --- Schema validation (VS-103A) ---------------------------------------------

export type SchemaValidationFinding = { field: string; message: string }

/**
 * Validate a config object against an adapter's config or secret schema. Returns an array of
 * findings for required-but-missing fields and type mismatches. An empty array means valid.
 */
export function validateConfigAgainstSchema(
  config: Record<string, unknown>,
  schema: Record<string, import('./contract.js').ConfigFieldSchema>,
): SchemaValidationFinding[] {
  const findings: SchemaValidationFinding[] = []
  for (const [key, field] of Object.entries(schema)) {
    const value = config[key]
    const missing = value === undefined || value === null || (typeof value === 'string' && !value.trim())
    if (field.required && missing) {
      findings.push({ field: key, message: `${field.label} is required.` })
      continue
    }
    if (missing) continue
    switch (field.type) {
      case 'url':
        if (typeof value !== 'string' || !/^https?:\/\/.+/.test(value)) {
          findings.push({ field: key, message: `${field.label} must be a valid URL.` })
        }
        break
      case 'number':
        if (typeof value !== 'number' || Number.isNaN(value)) {
          findings.push({ field: key, message: `${field.label} must be a number.` })
        }
        break
      case 'boolean':
        if (typeof value !== 'boolean') {
          findings.push({ field: key, message: `${field.label} must be a boolean.` })
        }
        break
      case 'select':
        if (field.options && !field.options.some((o) => o.value === value)) {
          findings.push({ field: key, message: `${field.label} must be one of the available options.` })
        }
        break
      case 'multi-select':
        if (!Array.isArray(value)) {
          findings.push({ field: key, message: `${field.label} must be an array.` })
        } else if (field.options) {
          const valid = new Set(field.options.map((o) => o.value))
          const invalid = (value as unknown[]).filter((v) => !valid.has(String(v)))
          if (invalid.length) findings.push({ field: key, message: `${field.label} contains invalid options.` })
        }
        break
    }
  }
  return findings
}

/** Merge two filter sets — the overlay fields take priority when present. */
export function mergeFilters(base?: ExternalWorkItemFilters, overlay?: ExternalWorkItemFilters): ExternalWorkItemFilters {
  if (!base && !overlay) return {}
  if (!base) return { ...overlay }
  if (!overlay) return { ...base }
  return {
    projects: overlay.projects?.length ? overlay.projects : base.projects,
    types: overlay.types?.length ? overlay.types : base.types,
    statuses: overlay.statuses?.length ? overlay.statuses : base.statuses,
    labels: overlay.labels?.length ? overlay.labels : base.labels,
    assignees: overlay.assignees?.length ? overlay.assignees : base.assignees,
    updatedAfter: overlay.updatedAfter ?? base.updatedAfter,
    search: overlay.search ?? base.search,
    providerQuery: overlay.providerQuery ?? base.providerQuery,
  }
}
