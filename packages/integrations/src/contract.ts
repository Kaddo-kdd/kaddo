// Integration Adapter contract (VS-102).
//
// The single boundary between Kaddo and external work systems (GitHub Issues, Jira, Azure DevOps,
// Linear, …). An adapter translates a provider-specific model into Kaddo's NORMALIZED external model
// and answers read requests. It NEVER writes Kaddo artifacts, runs Git, or persists secrets. Import
// materialization and all domain rules live above this boundary, in the integration service + Core.
//
// This is deliberately distinct from Kaddo's *Agent* Adapters (Claude/Codex/Kiro/…), which project
// project context into agent-native files. Integration Adapters connect to *external systems*.

/** A field definition for dynamic form generation. Admin renders forms from these — no hardcoded provider forms. */
export type ConfigFieldSchema = {
  type: 'string' | 'url' | 'password' | 'number' | 'boolean' | 'select' | 'multi-select'
  required: boolean
  label: string
  description?: string
  placeholder?: string
  options?: { value: string; label: string }[]
  defaultValue?: unknown
}

/** Declares which normalized filter fields an adapter supports. Admin uses this to render the filter configuration UI. */
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

/** Stable identity + presentation for an adapter (e.g. `github`, `jira`). */
export type IntegrationAdapterMetadata = {
  id: string
  displayName: string
  version: string
  description?: string
  documentationUrl?: string
  icon?: string
  /** Config field definitions — Admin uses these to render a dynamic configuration form. */
  configSchema?: Record<string, ConfigFieldSchema>
  /** Secret field definitions — Admin uses these to render credential inputs. Values are never stored in YAML. */
  secretSchema?: Record<string, ConfigFieldSchema>
  /** Which normalized filter fields this adapter supports. */
  filterCapabilities?: FilterCapabilities
}

/**
 * What an adapter can do. Adapters are not assumed equivalent — the UI asks "what can this adapter
 * do?" rather than assuming everything is supported. VS-102 requires the read/import baseline; write,
 * status sync, comments and webhooks are future capabilities.
 */
export type IntegrationCapabilities = {
  workItems: {
    list: boolean
    read: boolean
    /** Whether Kaddo can materialize a canonical Work Item from this adapter's items. */
    import: boolean
    write?: boolean
    statusSync?: boolean
    comments?: boolean
    webhooks?: boolean
  }
}

export type ExternalActor = { id?: string; name?: string; email?: string; url?: string }
export type ExternalProjectRef = { id?: string; key?: string; name?: string }

/**
 * The neutral external work item — "what Kaddo needs", not a faithful reproduction of every provider
 * field. Provider-specific detail may ride along in `rawMetadata` but must never dominate the model.
 */
export type ExternalWorkItem = {
  externalId: string
  provider: string
  title: string
  description?: string
  type?: string
  status?: string
  url?: string
  author?: ExternalActor
  assignees?: ExternalActor[]
  labels?: string[]
  createdAt?: string
  updatedAt?: string
  project?: ExternalProjectRef
  /** Opaque provider payload retained for provenance/debugging. Never Kaddo domain data. */
  rawMetadata?: Record<string, unknown>
}

/**
 * Neutral filters for external work item queries. A provider implements only what it can; unsupported
 * filters are ignored, not faked. Integration-level filters (persisted in YAML) and UI-level filters
 * (temporary) share this same shape — the service merges them before calling the adapter.
 */
export type ExternalWorkItemFilters = {
  projects?: string[]
  types?: string[]
  statuses?: string[]
  labels?: string[]
  assignees?: string[]
  updatedAfter?: string
  search?: string
  providerQuery?: string
}

export type ListExternalWorkItemsRequest = {
  context: IntegrationContext
  cursor?: string
  pageSize?: number
  filters?: ExternalWorkItemFilters
}

/** Pagination is a first-class part of the contract — never assume all items fit in one request. */
export type ExternalWorkItemPage = {
  items: ExternalWorkItem[]
  nextCursor?: string
  hasMore: boolean
}

export type GetExternalWorkItemRequest = { context: IntegrationContext; externalId: string }

export type ConnectionStatus = 'available' | 'unauthorized' | 'unavailable' | 'invalid-config'
/** The outcome of verifyConnection — distinguishes "adapter installed" from "integration usable". */
export type ConnectionResult = { status: ConnectionStatus; message?: string; checkedAt: string }

/**
 * Everything an adapter needs to perform one operation, assembled by the integration service at
 * runtime. `credentials` are resolved from secret references only for the duration of the call and
 * must never be persisted, logged, or returned in any Kaddo output.
 */
export type IntegrationContext = {
  integrationId: string
  config: Record<string, unknown>
  credentials: Record<string, string>
  timeoutMs: number
}

export interface IntegrationAdapter {
  readonly id: string
  readonly metadata: IntegrationAdapterMetadata
  readonly capabilities: IntegrationCapabilities
  /** Distinguish "configured" from "actually usable". Must not surface raw provider errors. */
  verifyConnection(context: IntegrationContext): Promise<ConnectionResult>
  listWorkItems(request: ListExternalWorkItemsRequest): Promise<ExternalWorkItemPage>
  getWorkItem(request: GetExternalWorkItemRequest): Promise<ExternalWorkItem | null>
}
