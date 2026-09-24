// Reference / mock integration adapter (VS-102).
//
// A deterministic, offline adapter that exercises the entire contract — registry, connection,
// listing, pagination, read, normalization, error simulation — with no network or credentials. It is
// the reference implementation a custom adapter can be checked against, and the fixture for tests.

import type {
  IntegrationAdapter,
  IntegrationContext,
  ConnectionResult,
  ExternalWorkItem,
  ExternalWorkItemPage,
  ListExternalWorkItemsRequest,
  GetExternalWorkItemRequest,
} from './contract.js'
import { integrationError } from './errors.js'

export type MockSimulation = 'available' | 'unauthorized' | 'rate-limited' | 'unavailable' | 'timeout'

export const MOCK_ADAPTER_ID = 'mock'

const DEFAULT_ITEMS: ExternalWorkItem[] = [
  {
    externalId: 'EXT-001',
    provider: MOCK_ADAPTER_ID,
    title: 'Open public registration to everyone',
    description: 'Open self-service registration to the public once the private beta ends.',
    type: 'Feature',
    status: 'Open',
    url: 'https://example.test/mock/EXT-001',
    labels: ['registration', 'beta'],
    assignees: [{ name: 'Alice' }],
    createdAt: '2026-01-05T10:00:00.000Z',
    updatedAt: '2026-02-01T09:30:00.000Z',
    rawMetadata: { board: 'delivery' },
  },
  {
    externalId: 'EXT-002',
    provider: MOCK_ADAPTER_ID,
    title: 'Personalize onboarding steps',
    description: 'The onboarding checklist should adapt to what the user has already completed.',
    type: 'Task',
    status: 'To Do',
    url: 'https://example.test/mock/EXT-002',
    labels: ['onboarding'],
    assignees: [{ name: 'Bob' }],
    createdAt: '2026-01-08T12:00:00.000Z',
    updatedAt: '2026-01-20T15:00:00.000Z',
  },
  {
    externalId: 'EXT-003',
    provider: MOCK_ADAPTER_ID,
    title: 'Fix authentication error on mobile',
    description: 'Users on iOS 17 see a blank screen after OAuth redirect.',
    type: 'Bug',
    status: 'In Progress',
    url: 'https://example.test/mock/EXT-003',
    labels: ['auth', 'mobile', 'critical'],
    assignees: [{ name: 'Alice' }],
    createdAt: '2026-02-10T08:00:00.000Z',
    updatedAt: '2026-03-01T14:00:00.000Z',
  },
  {
    externalId: 'EXT-004',
    provider: MOCK_ADAPTER_ID,
    title: 'Design system token audit',
    description: 'Review and consolidate design tokens across the component library.',
    type: 'Task',
    status: 'To Do',
    url: 'https://example.test/mock/EXT-004',
    labels: ['frontend', 'design-system'],
    createdAt: '2026-02-15T10:00:00.000Z',
    updatedAt: '2026-02-20T11:00:00.000Z',
  },
  {
    externalId: 'EXT-005',
    provider: MOCK_ADAPTER_ID,
    title: 'Migrate billing service to new payment gateway',
    description: 'Stripe v2 migration — switch from legacy Charges API to Payment Intents.',
    type: 'Epic',
    status: 'Open',
    url: 'https://example.test/mock/EXT-005',
    labels: ['billing', 'backend', 'migration'],
    assignees: [{ name: 'Carol' }],
    createdAt: '2026-01-20T09:00:00.000Z',
    updatedAt: '2026-03-05T16:00:00.000Z',
  },
  {
    externalId: 'EXT-006',
    provider: MOCK_ADAPTER_ID,
    title: 'Add CSV export to reports',
    description: 'Users need to export analytics reports as CSV for external tools.',
    type: 'Feature',
    status: 'In Progress',
    url: 'https://example.test/mock/EXT-006',
    labels: ['reports', 'backend'],
    assignees: [{ name: 'Bob' }],
    createdAt: '2026-02-25T13:00:00.000Z',
    updatedAt: '2026-03-10T10:00:00.000Z',
  },
  {
    externalId: 'EXT-007',
    provider: MOCK_ADAPTER_ID,
    title: 'Improve search relevance scoring',
    description: 'Tweak TF-IDF weights and add trigram matching for better search results.',
    type: 'Task',
    status: 'Done',
    url: 'https://example.test/mock/EXT-007',
    labels: ['search', 'backend'],
    assignees: [{ name: 'Alice' }],
    createdAt: '2026-01-12T07:00:00.000Z',
    updatedAt: '2026-02-28T17:00:00.000Z',
  },
  {
    externalId: 'EXT-008',
    provider: MOCK_ADAPTER_ID,
    title: 'Set up E2E test pipeline',
    description: 'Configure Playwright tests running on every PR via GitHub Actions.',
    type: 'Task',
    status: 'Done',
    url: 'https://example.test/mock/EXT-008',
    labels: ['testing', 'ci'],
    assignees: [{ name: 'Carol' }],
    createdAt: '2026-01-30T11:00:00.000Z',
    updatedAt: '2026-02-15T09:00:00.000Z',
  },
]

function simulationOf(context: IntegrationContext, fallback: MockSimulation): MockSimulation {
  const fromConfig = context.config?.simulate
  return typeof fromConfig === 'string' ? (fromConfig as MockSimulation) : fallback
}

/** Throw the normalized error a given simulation implies for read operations (or null when available). */
function readFailure(sim: MockSimulation): void {
  switch (sim) {
    case 'unauthorized': throw integrationError('INTEGRATION_UNAUTHORIZED')
    case 'rate-limited': throw integrationError('INTEGRATION_RATE_LIMITED')
    case 'unavailable': throw integrationError('INTEGRATION_UNAVAILABLE')
    case 'timeout': throw integrationError('INTEGRATION_TIMEOUT')
    case 'available': break
  }
}

export function createMockAdapter(opts: { items?: ExternalWorkItem[]; simulate?: MockSimulation; pageSize?: number } = {}): IntegrationAdapter {
  const items = opts.items ?? DEFAULT_ITEMS
  const defaultSim = opts.simulate ?? 'available'
  const defaultPageSize = opts.pageSize ?? 50

  return {
    id: MOCK_ADAPTER_ID,
    metadata: {
      id: MOCK_ADAPTER_ID,
      displayName: 'Mock Work Source',
      version: '1.0.0',
      description: 'Deterministic offline reference adapter for validating the integration foundation.',
      icon: 'mock',
      filterCapabilities: {
        types: { supported: true, multiple: true },
        statuses: { supported: true, multiple: true },
        labels: { supported: true, multiple: true },
        assignees: { supported: true, multiple: true },
        updatedAfter: { supported: true },
        search: { supported: true },
        providerQuery: { supported: false },
      },
      configSchema: {
        simulate: {
          type: 'select',
          required: false,
          label: 'Simulation mode',
          description: 'Controls what the mock adapter simulates during verify/read operations.',
          options: [
            { value: 'available', label: 'Available' },
            { value: 'unauthorized', label: 'Unauthorized' },
            { value: 'rate-limited', label: 'Rate Limited' },
            { value: 'unavailable', label: 'Unavailable' },
            { value: 'timeout', label: 'Timeout' },
          ],
          defaultValue: 'available',
        },
      },
      secretSchema: {
        token: {
          type: 'password',
          required: false,
          label: 'API Token',
          description: 'Optional token for testing secret handling (not used by the mock adapter).',
        },
      },
    },
    capabilities: {
      workItems: { list: true, read: true, import: true, write: false, statusSync: false, comments: false, webhooks: false },
    },

    async verifyConnection(context: IntegrationContext): Promise<ConnectionResult> {
      const sim = simulationOf(context, defaultSim)
      const checkedAt = new Date().toISOString()
      switch (sim) {
        case 'available': return { status: 'available', checkedAt }
        case 'unauthorized': return { status: 'unauthorized', message: 'Check the configured credentials.', checkedAt }
        case 'rate-limited':
        case 'unavailable':
        case 'timeout': return { status: 'unavailable', message: 'The mock provider is temporarily unavailable.', checkedAt }
      }
    },

    async listWorkItems(request: ListExternalWorkItemsRequest): Promise<ExternalWorkItemPage> {
      readFailure(simulationOf(request.context, defaultSim))
      let pool = items
      const f = request.filters
      if (f?.statuses?.length) {
        const lower = f.statuses.map((s) => s.toLowerCase())
        pool = pool.filter((i) => lower.includes((i.status ?? '').toLowerCase()))
      }
      if (f?.types?.length) {
        const lower = f.types.map((t) => t.toLowerCase())
        pool = pool.filter((i) => lower.includes((i.type ?? '').toLowerCase()))
      }
      if (f?.labels?.length) {
        const lower = f.labels.map((l) => l.toLowerCase())
        pool = pool.filter((i) => i.labels?.some((il) => lower.includes(il.toLowerCase())))
      }
      if (f?.assignees?.length) {
        const lower = f.assignees.map((a) => a.toLowerCase())
        pool = pool.filter((i) => i.assignees?.some((a) => lower.includes((a.name ?? '').toLowerCase())))
      }
      if (f?.search) pool = pool.filter((i) => `${i.title} ${i.description ?? ''}`.toLowerCase().includes(f.search!.toLowerCase()))
      if (f?.updatedAfter) pool = pool.filter((i) => (i.updatedAt ?? '') >= f.updatedAfter!)

      const size = Math.max(1, request.pageSize ?? defaultPageSize)
      const start = request.cursor ? Math.max(0, Number.parseInt(request.cursor, 10) || 0) : 0
      const slice = pool.slice(start, start + size)
      const end = start + slice.length
      const hasMore = end < pool.length
      return { items: slice, hasMore, ...(hasMore ? { nextCursor: String(end) } : {}) }
    },

    async getWorkItem(request: GetExternalWorkItemRequest): Promise<ExternalWorkItem | null> {
      readFailure(simulationOf(request.context, defaultSim))
      return items.find((i) => i.externalId === request.externalId) ?? null
    },
  }
}
