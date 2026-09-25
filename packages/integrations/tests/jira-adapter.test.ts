import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  createJiraAdapter,
  JIRA_ADAPTER_ID,
  createDefaultRegistry,
  type IntegrationContext,
  type ExternalWorkItemFilters,
} from '../src/index.js'
import {
  _buildJql,
  _normalizeIssue,
  _normalizeDescription,
  _normalizeBaseUrl,
  _adfToMarkdown,
} from '../src/jira-adapter.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ctx(overrides: Partial<IntegrationContext> = {}): IntegrationContext {
  return {
    integrationId: 'company-jira',
    config: { baseUrl: 'https://company.atlassian.net', email: 'user@company.com', ...overrides.config },
    credentials: { apiToken: 'test-token', ...overrides.credentials },
    timeoutMs: 5000,
    ...overrides,
  }
}

function jiraIssue(overrides: Record<string, unknown> = {}) {
  return {
    id: '10042',
    key: 'KAD-142',
    fields: {
      summary: 'Enable SSO authentication',
      description: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Enterprise customers need SSO support.' }] }] },
      issuetype: { name: 'Story' },
      status: { name: 'In Progress' },
      assignee: { displayName: 'John Doe', emailAddress: 'john@company.com', accountId: 'acc-123' },
      reporter: { displayName: 'Jane Smith', emailAddress: 'jane@company.com', accountId: 'acc-456' },
      priority: { name: 'High' },
      labels: ['security', 'authentication'],
      project: { key: 'KAD', name: 'Kaddo', id: '10001' },
      parent: { key: 'KAD-100', fields: { summary: 'Auth Epic' } },
      components: [{ name: 'Backend' }, { name: 'Auth' }],
      created: '2026-01-15T10:00:00.000Z',
      updated: '2026-03-01T14:30:00.000Z',
      ...overrides,
    },
  }
}

function searchResponse(issues: unknown[], opts?: { isLast?: boolean; nextPageToken?: string }) {
  return {
    issues,
    isLast: opts?.isLast ?? true,
    ...(opts?.nextPageToken ? { nextPageToken: opts.nextPageToken } : {}),
  }
}

// ---------------------------------------------------------------------------
// Mock fetch
// ---------------------------------------------------------------------------

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.restoreAllMocks()
})

function mockFetchOk(body: unknown) {
  fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(body) })
}

function mockFetchStatus(status: number) {
  fetchMock.mockResolvedValueOnce({ ok: false, status, json: () => Promise.resolve({}) })
}

// ---------------------------------------------------------------------------
// VS-106 — Jira Adapter
// ---------------------------------------------------------------------------

describe('VS-106 — Jira Adapter registration', () => {
  it('registers in the default registry', () => {
    const registry = createDefaultRegistry()
    expect(registry.has(JIRA_ADAPTER_ID)).toBe(true)
  })

  it('appears in the provider catalog (sorted list)', () => {
    const adapters = createDefaultRegistry().list()
    const jira = adapters.find((a) => a.id === JIRA_ADAPTER_ID)
    expect(jira).toBeDefined()
    expect(jira!.metadata.displayName).toBe('Jira')
    expect(jira!.metadata.icon).toBe('jira')
  })

  it('declares required capabilities', () => {
    const adapter = createJiraAdapter()
    expect(adapter.capabilities.workItems.list).toBe(true)
    expect(adapter.capabilities.workItems.read).toBe(true)
    expect(adapter.capabilities.workItems.import).toBe(true)
    expect(adapter.capabilities.workItems.write).toBe(false)
  })
})

describe('VS-106 — provider metadata', () => {
  const adapter = createJiraAdapter()

  it('exposes config schema with baseUrl and email', () => {
    const cs = adapter.metadata.configSchema!
    expect(cs.baseUrl).toBeDefined()
    expect(cs.baseUrl.type).toBe('url')
    expect(cs.baseUrl.required).toBe(true)
    expect(cs.email).toBeDefined()
    expect(cs.email.type).toBe('string')
    expect(cs.email.required).toBe(true)
  })

  it('exposes secret schema with apiToken', () => {
    const ss = adapter.metadata.secretSchema!
    expect(ss.apiToken).toBeDefined()
    expect(ss.apiToken.type).toBe('password')
    expect(ss.apiToken.required).toBe(true)
  })

  it('declares filter capabilities including projects and JQL', () => {
    const fc = adapter.metadata.filterCapabilities!
    expect(fc.projects).toEqual({ supported: true, multiple: true })
    expect(fc.types).toEqual({ supported: true, multiple: true })
    expect(fc.statuses).toEqual({ supported: true, multiple: true })
    expect(fc.labels).toEqual({ supported: true, multiple: true })
    expect(fc.assignees).toEqual({ supported: true, multiple: true })
    expect(fc.updatedAfter).toEqual({ supported: true })
    expect(fc.search).toEqual({ supported: true })
    expect(fc.providerQuery).toEqual({ supported: true, label: 'JQL' })
  })
})

describe('VS-106 — JQL generation', () => {
  it('returns empty string when no filters', () => {
    expect(_buildJql(undefined)).toBe('')
    expect(_buildJql({})).toBe('')
  })

  it('generates project filter', () => {
    expect(_buildJql({ projects: ['KAD'] })).toBe('project IN ("KAD")')
  })

  it('generates type filter', () => {
    expect(_buildJql({ types: ['Story', 'Epic'] })).toBe('issuetype IN ("Story", "Epic")')
  })

  it('generates status filter', () => {
    expect(_buildJql({ statuses: ['To Do', 'In Progress'] })).toBe('status IN ("To Do", "In Progress")')
  })

  it('generates label filter', () => {
    expect(_buildJql({ labels: ['backend'] })).toBe('labels IN ("backend")')
  })

  it('generates assignee filter', () => {
    expect(_buildJql({ assignees: ['john'] })).toBe('assignee IN ("john")')
  })

  it('generates updatedAfter', () => {
    expect(_buildJql({ updatedAfter: '2026-01-01' })).toBe('updated >= "2026-01-01"')
  })

  it('generates search with OR for summary and description', () => {
    expect(_buildJql({ search: 'SSO' })).toBe('(summary ~ "SSO" OR description ~ "SSO")')
  })

  it('wraps providerQuery in parens', () => {
    expect(_buildJql({ providerQuery: 'project = KAD AND status != Done' })).toBe('(project = KAD AND status != Done)')
  })

  it('combines multiple filters with AND', () => {
    const jql = _buildJql({ projects: ['KAD'], statuses: ['To Do'], types: ['Story'] })
    expect(jql).toBe('project IN ("KAD") AND issuetype IN ("Story") AND status IN ("To Do")')
  })

  it('combines normalized + providerQuery', () => {
    const jql = _buildJql({ projects: ['KAD'], providerQuery: 'labels = architecture' })
    expect(jql).toBe('project IN ("KAD") AND (labels = architecture)')
  })

  it('escapes quotes in values', () => {
    expect(_buildJql({ types: ['Story "special"'] })).toBe('issuetype IN ("Story \\"special\\"")')
  })
})

describe('VS-106 — URL normalization', () => {
  it('strips trailing slash', () => {
    expect(_normalizeBaseUrl('https://company.atlassian.net/')).toBe('https://company.atlassian.net')
  })

  it('preserves URL without trailing slash', () => {
    expect(_normalizeBaseUrl('https://company.atlassian.net')).toBe('https://company.atlassian.net')
  })

  it('trims whitespace', () => {
    expect(_normalizeBaseUrl('  https://company.atlassian.net  ')).toBe('https://company.atlassian.net')
  })
})

describe('VS-106 — ADF to Markdown', () => {
  it('converts paragraphs', () => {
    expect(_adfToMarkdown({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] }] })).toBe('Hello')
  })

  it('converts headings', () => {
    expect(_adfToMarkdown({ type: 'doc', content: [{ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Title' }] }] })).toBe('## Title')
  })

  it('converts bold and italic', () => {
    const adf = {
      type: 'doc', content: [{ type: 'paragraph', content: [
        { type: 'text', text: 'bold', marks: [{ type: 'strong' }] },
        { type: 'text', text: ' and ' },
        { type: 'text', text: 'italic', marks: [{ type: 'em' }] },
      ] }],
    }
    expect(_adfToMarkdown(adf)).toBe('**bold** and *italic*')
  })

  it('converts inline code', () => {
    const adf = {
      type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'foo()', marks: [{ type: 'code' }] }] }],
    }
    expect(_adfToMarkdown(adf)).toBe('`foo()`')
  })

  it('converts bullet lists', () => {
    const adf = {
      type: 'doc', content: [{ type: 'bulletList', content: [
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'item 1' }] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'item 2' }] }] },
      ] }],
    }
    expect(_adfToMarkdown(adf)).toBe('- item 1\n- item 2')
  })

  it('converts code blocks', () => {
    const adf = {
      type: 'doc', content: [{ type: 'codeBlock', content: [{ type: 'text', text: 'const x = 1' }] }],
    }
    expect(_adfToMarkdown(adf)).toBe('```\nconst x = 1```')
  })

  it('converts horizontal rule', () => {
    expect(_adfToMarkdown({ type: 'doc', content: [{ type: 'rule' }] })).toBe('---')
  })

  it('returns empty for undefined', () => {
    expect(_adfToMarkdown(undefined as any)).toBe('')
  })
})

describe('VS-106 — description normalization', () => {
  it('converts ADF to markdown', () => {
    const adf = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello world' }] }] }
    expect(_normalizeDescription(adf)).toBe('Hello world')
  })

  it('passes through plain strings', () => {
    expect(_normalizeDescription('Plain text description')).toBe('Plain text description')
  })

  it('returns undefined for null', () => {
    expect(_normalizeDescription(null)).toBeUndefined()
  })

  it('returns undefined for empty string', () => {
    expect(_normalizeDescription('')).toBeUndefined()
  })
})

describe('VS-106 — issue normalization', () => {
  it('normalizes a full Jira issue', () => {
    const issue = jiraIssue()
    const item = _normalizeIssue(issue as any, 'https://company.atlassian.net', 'company-jira')
    expect(item.externalId).toBe('KAD-142')
    expect(item.provider).toBe('jira')
    expect(item.title).toBe('Enable SSO authentication')
    expect(item.description).toBe('Enterprise customers need SSO support.')
    expect(item.type).toBe('Story')
    expect(item.status).toBe('In Progress')
    expect(item.url).toBe('https://company.atlassian.net/browse/KAD-142')
    expect(item.assignees).toEqual([{ name: 'John Doe', email: 'john@company.com', id: 'acc-123' }])
    expect(item.author).toEqual({ name: 'Jane Smith', email: 'jane@company.com', id: 'acc-456' })
    expect(item.labels).toEqual(['security', 'authentication'])
    expect(item.createdAt).toBe('2026-01-15T10:00:00.000Z')
    expect(item.updatedAt).toBe('2026-03-01T14:30:00.000Z')
    expect(item.project).toEqual({ key: 'KAD', name: 'Kaddo', id: '10001' })
    expect(item.rawMetadata).toEqual({ priority: 'High', parent: 'KAD-100', components: ['Backend', 'Auth'] })
  })

  it('handles missing optional fields', () => {
    const issue = { id: '10099', key: 'MIN-1', fields: { summary: 'Minimal issue' } }
    const item = _normalizeIssue(issue as any, 'https://co.atlassian.net', 'co-jira')
    expect(item.externalId).toBe('MIN-1')
    expect(item.title).toBe('Minimal issue')
    expect(item.assignees).toBeUndefined()
    expect(item.author).toBeUndefined()
    expect(item.labels).toBeUndefined()
    expect(item.description).toBeUndefined()
    expect(item.type).toBeUndefined()
    expect(item.status).toBeUndefined()
    expect(item.rawMetadata).toEqual({})
  })

  it('generates correct browse URL', () => {
    const item = _normalizeIssue(jiraIssue() as any, 'https://test.atlassian.net', 'test')
    expect(item.url).toBe('https://test.atlassian.net/browse/KAD-142')
  })
})

describe('VS-106 — verifyConnection', () => {
  const adapter = createJiraAdapter()

  it('returns available on successful /myself call', async () => {
    mockFetchOk({ accountId: 'acc', displayName: 'User' })
    const result = await adapter.verifyConnection(ctx())
    expect(result.status).toBe('available')
    expect(fetchMock).toHaveBeenCalledOnce()
    const url = fetchMock.mock.calls[0][0] as string
    expect(url).toContain('/rest/api/3/myself')
  })

  it('returns unauthorized on 401', async () => {
    mockFetchStatus(401)
    const result = await adapter.verifyConnection(ctx())
    expect(result.status).toBe('unauthorized')
  })

  it('returns unavailable on 500', async () => {
    mockFetchStatus(500)
    const result = await adapter.verifyConnection(ctx())
    expect(result.status).toBe('unavailable')
  })

  it('returns invalid-config when baseUrl missing', async () => {
    const result = await adapter.verifyConnection(ctx({ config: { baseUrl: '', email: 'u@c.com' } }))
    expect(result.status).toBe('invalid-config')
  })

  it('returns invalid-config when email missing', async () => {
    const result = await adapter.verifyConnection(ctx({ config: { baseUrl: 'https://x.atlassian.net', email: '' } }))
    expect(result.status).toBe('invalid-config')
  })

  it('returns invalid-config when apiToken missing', async () => {
    const result = await adapter.verifyConnection(ctx({ credentials: { apiToken: '' } }))
    expect(result.status).toBe('invalid-config')
  })

  it('sends Basic auth header', async () => {
    mockFetchOk({})
    await adapter.verifyConnection(ctx())
    const headers = fetchMock.mock.calls[0][1].headers
    expect(headers.Authorization).toMatch(/^Basic /)
  })
})

describe('VS-106 — listWorkItems', () => {
  const adapter = createJiraAdapter()

  it('searches with JQL and normalizes results', async () => {
    mockFetchOk(searchResponse([jiraIssue()]))
    const page = await adapter.listWorkItems({ context: ctx(), filters: { projects: ['KAD'] } })
    expect(page.items).toHaveLength(1)
    expect(page.items[0].externalId).toBe('KAD-142')
    expect(page.items[0].provider).toBe('jira')
    expect(page.hasMore).toBe(false)
    const body = JSON.parse(fetchMock.mock.calls[0][1]?.body as string)
    expect(body.jql).toContain('project')
  })

  it('applies pagination cursor via nextPageToken', async () => {
    mockFetchOk({ issues: [], isLast: true })
    await adapter.listWorkItems({ context: ctx(), cursor: 'eyJhIjoiMTAifQ==', pageSize: 10 })
    const body = JSON.parse(fetchMock.mock.calls[0][1]?.body as string)
    expect(body.nextPageToken).toBe('eyJhIjoiMTAifQ==')
    expect(body.maxResults).toBe(10)
  })

  it('returns nextCursor when hasMore', async () => {
    mockFetchOk({ issues: [jiraIssue()], isLast: false, nextPageToken: 'eyJhIjoiMSJ9' })
    const page = await adapter.listWorkItems({ context: ctx(), pageSize: 1 })
    expect(page.hasMore).toBe(true)
    expect(page.nextCursor).toBe('eyJhIjoiMSJ9')
  })

  it('defaults to last-30d bounded JQL when no filters', async () => {
    mockFetchOk(searchResponse([]))
    await adapter.listWorkItems({ context: ctx() })
    const body = JSON.parse(fetchMock.mock.calls[0][1]?.body as string)
    expect(body.jql).toBe('updated >= -30d ORDER BY updated DESC')
  })

  it('throws normalized error on 401', async () => {
    mockFetchStatus(401)
    await expect(adapter.listWorkItems({ context: ctx() })).rejects.toThrow()
  })

  it('throws normalized error on 429 rate limit', async () => {
    mockFetchStatus(429)
    await expect(adapter.listWorkItems({ context: ctx() })).rejects.toThrow()
  })
})

describe('VS-106 — getWorkItem', () => {
  const adapter = createJiraAdapter()

  it('reads a single issue by key', async () => {
    mockFetchOk(jiraIssue())
    const item = await adapter.getWorkItem({ context: ctx(), externalId: 'KAD-142' })
    expect(item).not.toBeNull()
    expect(item!.externalId).toBe('KAD-142')
    expect(item!.title).toBe('Enable SSO authentication')
    const url = fetchMock.mock.calls[0][0] as string
    expect(url).toContain('/rest/api/3/issue/KAD-142')
  })

  it('returns null on 404', async () => {
    mockFetchStatus(404)
    const item = await adapter.getWorkItem({ context: ctx(), externalId: 'KAD-999' })
    expect(item).toBeNull()
  })

  it('throws on auth failure', async () => {
    mockFetchStatus(401)
    await expect(adapter.getWorkItem({ context: ctx(), externalId: 'KAD-142' })).rejects.toThrow()
  })
})

describe('VS-106 — error normalization', () => {
  const adapter = createJiraAdapter()

  it('maps HTTP 403 to FORBIDDEN', async () => {
    mockFetchStatus(403)
    try {
      await adapter.listWorkItems({ context: ctx() })
      expect.fail('should throw')
    } catch (e: any) {
      expect(e.code).toBe('INTEGRATION_FORBIDDEN')
    }
  })

  it('maps HTTP 429 to RATE_LIMITED', async () => {
    mockFetchStatus(429)
    try {
      await adapter.listWorkItems({ context: ctx() })
      expect.fail('should throw')
    } catch (e: any) {
      expect(e.code).toBe('INTEGRATION_RATE_LIMITED')
    }
  })

  it('maps HTTP 500 to UNAVAILABLE', async () => {
    mockFetchStatus(500)
    try {
      await adapter.listWorkItems({ context: ctx() })
      expect.fail('should throw')
    } catch (e: any) {
      expect(e.code).toBe('INTEGRATION_UNAVAILABLE')
    }
  })

  it('maps network failure to PROVIDER_ERROR', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'))
    try {
      await adapter.listWorkItems({ context: ctx() })
      expect.fail('should throw')
    } catch (e: any) {
      expect(e.code).toBe('INTEGRATION_PROVIDER_ERROR')
    }
  })
})

describe('VS-106 — security', () => {
  const adapter = createJiraAdapter()

  it('never includes credentials in ExternalWorkItem', async () => {
    mockFetchOk(searchResponse([jiraIssue()]))
    const page = await adapter.listWorkItems({ context: ctx() })
    const json = JSON.stringify(page.items[0])
    expect(json).not.toContain('test-token')
    expect(json).not.toContain('apiToken')
    expect(json).not.toContain('Authorization')
  })

  it('never includes credentials in verify result', async () => {
    mockFetchStatus(401)
    const result = await adapter.verifyConnection(ctx())
    const json = JSON.stringify(result)
    expect(json).not.toContain('test-token')
    expect(json).not.toContain('apiToken')
  })
})

describe('VS-106 — projects filter', () => {
  it('parseFilters handles projects field', async () => {
    const { parseIntegrationsConfig } = await import('../src/config.js')
    const result = parseIntegrationsConfig(
      { integrations: [{ id: 'j', adapter: 'jira', filters: { projects: ['KAD', 'PLAT'] } }] },
      { adapterIds: new Set(['jira']) },
    )
    expect(result.integrations[0].filters?.projects).toEqual(['KAD', 'PLAT'])
  })

  it('mergeFilters includes projects', async () => {
    const { mergeFilters } = await import('../src/config.js')
    const merged = mergeFilters({ projects: ['A'] }, { projects: ['B'] })
    expect(merged.projects).toEqual(['B'])
  })

  it('mergeFilters falls back to base projects', async () => {
    const { mergeFilters } = await import('../src/config.js')
    const merged = mergeFilters({ projects: ['A'] }, {})
    expect(merged.projects).toEqual(['A'])
  })
})
