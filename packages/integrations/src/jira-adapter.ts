// Jira Cloud adapter (VS-106).
//
// Connects Kaddo to Jira Cloud via REST API v3 using email + API Token (Basic Auth).
// Translates normalized filters to JQL, normalizes Jira issues to ExternalWorkItem,
// converts Atlassian Document Format (ADF) descriptions to Markdown. All Jira-specific
// logic is encapsulated here — Core, Admin and the refinement pipeline never see JQL,
// ADF or Jira issue shapes.

import type {
  IntegrationAdapter,
  IntegrationContext,
  ConnectionResult,
  ExternalWorkItem,
  ExternalWorkItemPage,
  ListExternalWorkItemsRequest,
  GetExternalWorkItemRequest,
  IntegrationAdapterMetadata,
  IntegrationCapabilities,
} from './contract.js'
import { integrationError, normalizeProviderError } from './errors.js'

export const JIRA_ADAPTER_ID = 'jira'

// ---------------------------------------------------------------------------
// ADF → Markdown
// ---------------------------------------------------------------------------

type AdfNode = { type: string; text?: string; content?: AdfNode[]; attrs?: Record<string, unknown>; marks?: { type: string }[] }

function adfToMarkdown(node: AdfNode | undefined): string {
  if (!node) return ''
  if (node.type === 'text') {
    let t = node.text ?? ''
    for (const m of node.marks ?? []) {
      if (m.type === 'strong') t = `**${t}**`
      else if (m.type === 'em') t = `*${t}*`
      else if (m.type === 'code') t = `\`${t}\``
      else if (m.type === 'strike') t = `~~${t}~~`
    }
    return t
  }
  const children = (node.content ?? []).map(adfToMarkdown).join('')
  switch (node.type) {
    case 'doc': return children.trim()
    case 'paragraph': return children + '\n\n'
    case 'heading': {
      const level = Math.min(Number(node.attrs?.level) || 1, 6)
      return '#'.repeat(level) + ' ' + children.trim() + '\n\n'
    }
    case 'bulletList': return children
    case 'orderedList': return children
    case 'listItem': return '- ' + children.trim() + '\n'
    case 'blockquote': return children.split('\n').filter(Boolean).map((l) => '> ' + l).join('\n') + '\n\n'
    case 'codeBlock': return '```\n' + children + '```\n\n'
    case 'rule': return '---\n\n'
    case 'hardBreak': return '\n'
    case 'mediaGroup':
    case 'mediaSingle':
    case 'media': return ''
    default: return children
  }
}

function normalizeDescription(field: unknown): string | undefined {
  if (!field) return undefined
  if (typeof field === 'string') return field || undefined
  if (typeof field === 'object' && (field as AdfNode).type === 'doc') {
    const md = adfToMarkdown(field as AdfNode)
    return md || undefined
  }
  return undefined
}

// ---------------------------------------------------------------------------
// JQL builder
// ---------------------------------------------------------------------------

function escapeJql(value: string): string {
  return '"' + value.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"'
}

function buildJql(filters?: import('./contract.js').ExternalWorkItemFilters): string {
  const clauses: string[] = []
  if (filters?.projects?.length) clauses.push(`project IN (${filters.projects.map(escapeJql).join(', ')})`)
  if (filters?.types?.length) clauses.push(`issuetype IN (${filters.types.map(escapeJql).join(', ')})`)
  if (filters?.statuses?.length) clauses.push(`status IN (${filters.statuses.map(escapeJql).join(', ')})`)
  if (filters?.labels?.length) clauses.push(`labels IN (${filters.labels.map(escapeJql).join(', ')})`)
  if (filters?.assignees?.length) clauses.push(`assignee IN (${filters.assignees.map(escapeJql).join(', ')})`)
  if (filters?.updatedAfter) clauses.push(`updated >= ${escapeJql(filters.updatedAfter)}`)
  if (filters?.search) clauses.push(`(summary ~ ${escapeJql(filters.search)} OR description ~ ${escapeJql(filters.search)})`)
  if (filters?.providerQuery) clauses.push(`(${filters.providerQuery})`)
  return clauses.join(' AND ')
}

// ---------------------------------------------------------------------------
// Jira HTTP client
// ---------------------------------------------------------------------------

type JiraIssue = {
  id: string
  key: string
  fields: Record<string, unknown>
}

type JiraSearchResponse = {
  issues: JiraIssue[]
  total: number
  startAt: number
  maxResults: number
}

function normalizeBaseUrl(raw: string): string {
  let url = raw.trim()
  if (url.endsWith('/')) url = url.slice(0, -1)
  return url
}

function authHeader(email: string, token: string): string {
  const encoded = typeof Buffer !== 'undefined'
    ? Buffer.from(`${email}:${token}`).toString('base64')
    : btoa(`${email}:${token}`)
  return `Basic ${encoded}`
}

async function handleJiraResponse(res: Response): Promise<unknown> {
  if (res.status === 401) throw integrationError('INTEGRATION_UNAUTHORIZED')
  if (res.status === 403) throw integrationError('INTEGRATION_FORBIDDEN')
  if (res.status === 404) throw integrationError('INTEGRATION_NOT_FOUND')
  if (res.status === 410) throw integrationError('INTEGRATION_UNAVAILABLE', 'Jira API endpoint deprecated (410 Gone).')
  if (res.status === 429) throw integrationError('INTEGRATION_RATE_LIMITED')
  if (res.status >= 500) throw integrationError('INTEGRATION_UNAVAILABLE')
  if (!res.ok) {
    let detail = ''
    try { const body = await res.json(); detail = (body as { errorMessages?: string[] }).errorMessages?.[0] ?? '' } catch {}
    throw integrationError('INTEGRATION_PROVIDER_ERROR', detail || `Jira responded with status ${res.status}.`)
  }
  return await res.json()
}

async function jiraFetch(
  baseUrl: string,
  path: string,
  auth: string,
  timeoutMs: number,
  params?: Record<string, string>,
): Promise<unknown> {
  const url = new URL(path, baseUrl + '/')
  if (params) for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: { Authorization: auth, Accept: 'application/json' },
      signal: controller.signal,
    })
    return await handleJiraResponse(res)
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') throw integrationError('INTEGRATION_TIMEOUT')
    throw normalizeProviderError(err)
  } finally {
    clearTimeout(timer)
  }
}

async function jiraPost(
  baseUrl: string,
  path: string,
  auth: string,
  timeoutMs: number,
  body: unknown,
): Promise<unknown> {
  const url = new URL(path, baseUrl + '/')
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: { Authorization: auth, Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    return await handleJiraResponse(res)
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') throw integrationError('INTEGRATION_TIMEOUT')
    throw normalizeProviderError(err)
  } finally {
    clearTimeout(timer)
  }
}

// ---------------------------------------------------------------------------
// Issue normalization
// ---------------------------------------------------------------------------

function normalizeIssue(issue: JiraIssue, baseUrl: string, integrationId: string): ExternalWorkItem {
  const f = issue.fields
  const issueType = f.issuetype as { name?: string } | undefined
  const status = f.status as { name?: string } | undefined
  const assignee = f.assignee as { displayName?: string; emailAddress?: string; accountId?: string } | undefined
  const reporter = f.reporter as { displayName?: string; emailAddress?: string; accountId?: string } | undefined
  const priority = f.priority as { name?: string } | undefined
  const project = f.project as { key?: string; name?: string; id?: string } | undefined
  const parent = f.parent as { key?: string; fields?: { summary?: string } } | undefined
  const components = f.components as { name?: string }[] | undefined
  const labels = f.labels as string[] | undefined

  return {
    externalId: issue.key,
    provider: JIRA_ADAPTER_ID,
    title: (f.summary as string) ?? issue.key,
    description: normalizeDescription(f.description),
    type: issueType?.name,
    status: status?.name,
    url: `${baseUrl}/browse/${issue.key}`,
    author: reporter ? { name: reporter.displayName, email: reporter.emailAddress, id: reporter.accountId } : undefined,
    assignees: assignee ? [{ name: assignee.displayName, email: assignee.emailAddress, id: assignee.accountId }] : undefined,
    labels,
    createdAt: f.created as string | undefined,
    updatedAt: f.updated as string | undefined,
    project: project ? { key: project.key, name: project.name, id: project.id } : undefined,
    rawMetadata: {
      ...(priority?.name ? { priority: priority.name } : {}),
      ...(parent?.key ? { parent: parent.key } : {}),
      ...(components?.length ? { components: components.map((c) => c.name).filter(Boolean) } : {}),
    },
  }
}

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

const SEARCH_FIELDS = 'summary,description,issuetype,status,assignee,reporter,priority,labels,project,parent,components,created,updated'
const DEFAULT_PAGE_SIZE = 50

const metadata: IntegrationAdapterMetadata = {
  id: JIRA_ADAPTER_ID,
  displayName: 'Jira',
  version: '1.0.0',
  description: 'Connect Jira Cloud work items to Kaddo for discovery, import and refinement.',
  icon: 'jira',
  configSchema: {
    baseUrl: {
      type: 'url',
      required: true,
      label: 'Jira Site URL',
      description: 'The URL of the Jira Cloud site.',
      placeholder: 'https://company.atlassian.net',
    },
    email: {
      type: 'string',
      required: true,
      label: 'Email',
      description: 'Email associated with the Jira API token.',
      placeholder: 'user@company.com',
    },
  },
  secretSchema: {
    apiToken: {
      type: 'password',
      required: true,
      label: 'API Token',
      description: 'Jira API token for authentication. Generate one at id.atlassian.com.',
    },
  },
  filterCapabilities: {
    projects: { supported: true, multiple: true },
    types: { supported: true, multiple: true },
    statuses: { supported: true, multiple: true },
    labels: { supported: true, multiple: true },
    assignees: { supported: true, multiple: true },
    updatedAfter: { supported: true },
    search: { supported: true },
    providerQuery: { supported: true, label: 'JQL' },
  },
}

const capabilities: IntegrationCapabilities = {
  workItems: { list: true, read: true, import: true, write: false, statusSync: false, comments: false, webhooks: false },
}

function resolveConfig(context: IntegrationContext): { baseUrl: string; email: string; apiToken: string } {
  const baseUrl = context.config.baseUrl
  const email = context.config.email
  const apiToken = context.credentials.apiToken
  if (typeof baseUrl !== 'string' || !baseUrl) throw integrationError('INTEGRATION_CONFIG_INVALID', 'Jira Site URL is required.')
  if (typeof email !== 'string' || !email) throw integrationError('INTEGRATION_CONFIG_INVALID', 'Email is required.')
  if (!apiToken) throw integrationError('INTEGRATION_CONFIG_INVALID', 'API Token is required.')
  return { baseUrl: normalizeBaseUrl(baseUrl), email, apiToken }
}

export function createJiraAdapter(): IntegrationAdapter {
  return {
    id: JIRA_ADAPTER_ID,
    metadata,
    capabilities,

    async verifyConnection(context: IntegrationContext): Promise<ConnectionResult> {
      const checkedAt = new Date().toISOString()
      try {
        const { baseUrl, email, apiToken } = resolveConfig(context)
        const auth = authHeader(email, apiToken)
        await jiraFetch(baseUrl, '/rest/api/3/myself', auth, context.timeoutMs)
        return { status: 'available', checkedAt }
      } catch (err) {
        const ie = normalizeProviderError(err)
        if (ie.code === 'INTEGRATION_UNAUTHORIZED') return { status: 'unauthorized', message: 'Check the configured email and API token.', checkedAt }
        if (ie.code === 'INTEGRATION_CONFIG_INVALID') return { status: 'invalid-config', message: ie.safeMessage, checkedAt }
        return { status: 'unavailable', message: ie.safeMessage, checkedAt }
      }
    },

    async listWorkItems(request: ListExternalWorkItemsRequest): Promise<ExternalWorkItemPage> {
      const { baseUrl, email, apiToken } = resolveConfig(request.context)
      const auth = authHeader(email, apiToken)

      // Build JQL: integration-level + runtime filters are already merged by the service
      const jql = buildJql(request.filters)
      const pageSize = Math.min(Math.max(1, request.pageSize ?? DEFAULT_PAGE_SIZE), 100)
      const startAt = request.cursor ? Math.max(0, Number.parseInt(request.cursor, 10) || 0) : 0

      try {
        const fullJql = jql ? jql + ' ORDER BY updated DESC' : 'ORDER BY updated DESC'
        const data = await jiraPost(baseUrl, '/rest/api/3/search/jql', auth, request.context.timeoutMs, {
          jql: fullJql,
          startAt,
          maxResults: pageSize,
          fields: SEARCH_FIELDS.split(','),
        }) as JiraSearchResponse

        const items = data.issues.map((issue) => normalizeIssue(issue, baseUrl, request.context.integrationId))
        const nextStart = data.startAt + data.issues.length
        const hasMore = nextStart < data.total
        return { items, hasMore, ...(hasMore ? { nextCursor: String(nextStart) } : {}) }
      } catch (err) {
        throw normalizeProviderError(err)
      }
    },

    async getWorkItem(request: GetExternalWorkItemRequest): Promise<ExternalWorkItem | null> {
      const { baseUrl, email, apiToken } = resolveConfig(request.context)
      const auth = authHeader(email, apiToken)
      try {
        const issue = await jiraFetch(baseUrl, `/rest/api/3/issue/${encodeURIComponent(request.externalId)}`, auth, request.context.timeoutMs, {
          fields: SEARCH_FIELDS,
        }) as JiraIssue
        return normalizeIssue(issue, baseUrl, request.context.integrationId)
      } catch (err) {
        const ie = normalizeProviderError(err)
        if (ie.code === 'INTEGRATION_NOT_FOUND') return null
        throw ie
      }
    },
  }
}

// Exported for testing
export { buildJql as _buildJql, normalizeIssue as _normalizeIssue, normalizeDescription as _normalizeDescription, normalizeBaseUrl as _normalizeBaseUrl, adfToMarkdown as _adfToMarkdown }
