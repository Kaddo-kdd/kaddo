import Fastify from 'fastify'
import fastifyCookie from '@fastify/cookie'
import fastifyCors from '@fastify/cors'
import fastifyStatic from '@fastify/static'
import path from 'node:path'
import { SessionManager } from './session.js'
import {
  getProjectOverview,
  getProjectSummary,
  getKnowledgeSummary,
  getModules,
  getProjectReadiness,
  getProjectRoute,
  getFindings,
  getKnowledgeInventory,
  getKnowledgeArtifactDetail,
  getWorkItemsList,
  getWorkItemDetail,
  createWorkItemAdmin,
  getWorkItemEdit,
  updateWorkItemAdmin,
  validateWorkItemAdmin,
  transitionWorkItemAdmin,
  getCaptureDefinition,
  getRefinementHandoff,
  getSystemMap,
  getTopologyHandoff,
  getIntegrations,
  getIntegrationDetail,
  getIntegrationSecretStatusAdmin,
  getAvailableIntegrationTypesAdmin,
  createIntegrationAdmin,
  updateIntegrationAdmin,
  deleteIntegrationAdmin,
  enableIntegrationAdmin,
  disableIntegrationAdmin,
  setIntegrationSecretAdmin,
  removeIntegrationSecretAdmin,
  getIntegrationStatus,
  getExternalWorkItems,
  getExternalWorkItemDetail,
  previewIntegrationImport,
  importIntegrationWorkItem,
  discoverExternalWorkItemsAdmin,
  getIntegrationFiltersAdmin,
  updateIntegrationFiltersAdmin,
  CoreError,
} from './core-adapter.js'
import {
  WorkItemCreateWithAnswersSchema,
  WorkItemUpdateSchema,
  WorkItemTransitionSchema,
} from './contracts/schemas.js'
import type { AdminStorage } from './storage/admin-storage.js'

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

function statusForCode(code: string): number {
  switch (code) {
    case 'WORK_ITEM_NOT_FOUND': return 404
    case 'WORK_ITEM_CONFLICT':
    case 'WORK_ITEM_NOT_EDITABLE': return 409
    case 'INVALID_INPUT':
    case 'INVALID_WORK_ITEM_ID':
    case 'INVALID_TRANSITION': return 400
    default: return 500
  }
}

export type AdminServerOptions = {
  projectDir: string
  storage: AdminStorage
  staticDir?: string
  host?: string
  port?: number
}

export async function createAdminServer(opts: AdminServerOptions) {
  const { projectDir, storage, staticDir, host = '127.0.0.1', port = 4173 } = opts

  const app = Fastify({ logger: false })
  const sessionManager = new SessionManager(storage)

  await app.register(fastifyCookie)
  await app.register(fastifyCors, {
    origin: `http://${host}:${port}`,
    credentials: true,
  })

  if (staticDir) {
    await app.register(fastifyStatic, {
      root: path.resolve(staticDir),
      prefix: '/',
      wildcard: false,
    })
  }

  // Create session on server start
  const sessionId = sessionManager.createSession()

  // Session validation hook for API routes (skip session + health endpoints)
  app.addHook('onRequest', async (request, reply) => {
    if (!request.url.startsWith('/api/')) return
    if (request.url.startsWith('/api/v1/admin/session')) return
    if (request.url.startsWith('/api/v1/admin/health')) return
    const cookieSession = request.cookies['kaddo-session']
    if (!sessionManager.validateSession(cookieSession)) {
      reply.code(401).send({ error: { code: 'SESSION_INVALID', message: 'Invalid or expired session.' } })
    }
  })

  // CSRF / origin protection for state-changing requests (VS-099).
  // Combined with the SameSite=strict session cookie, requiring a same-origin Origin header on
  // every write blocks cross-site request forgery. The browser sends Origin on POST/PUT/PATCH/DELETE.
  const allowedOrigin = `http://${host}:${port}`
  app.addHook('onRequest', async (request, reply) => {
    if (!request.url.startsWith('/api/')) return
    if (!WRITE_METHODS.has(request.method)) return
    const origin = request.headers.origin
    if (!origin || origin !== allowedOrigin) {
      reply.code(403).send({ error: { code: 'FORBIDDEN_ORIGIN', message: 'Cross-origin write requests are not allowed.' } })
    }
  })

  // Health check (not protected)
  app.get('/api/v1/admin/health', async () => ({ status: 'ok' }))

  // Session endpoint — sets the cookie
  app.get('/api/v1/admin/session', async (_request, reply) => {
    reply.setCookie('kaddo-session', sessionId, {
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 86400,
    })
    return { status: 'active' }
  })

  // Core domain endpoints
  const coreRoute = <T>(handler: (dir: string) => T) => {
    return async () => {
      try {
        return handler(projectDir)
      } catch (err) {
        if (err instanceof CoreError) {
          return { error: { code: err.code, message: err.message } }
        }
        throw err
      }
    }
  }

  app.get('/api/v1/admin/overview', coreRoute(getProjectOverview))
  app.get('/api/v1/admin/project', coreRoute(getProjectSummary))
  app.get('/api/v1/admin/knowledge', coreRoute(getKnowledgeSummary))
  app.get<{ Querystring: { status?: string; module?: string; query?: string } }>(
    '/api/v1/admin/work-items',
    async (request) => {
      try {
        const { status, module, query } = request.query
        return getWorkItemsList(projectDir, { status, module, query })
      } catch (err) {
        if (err instanceof CoreError) {
          return { error: { code: err.code, message: err.message } }
        }
        throw err
      }
    },
  )
  // Write operations (VS-099). Each maps CoreError codes to the right HTTP status; a failed write
  // never returns a partial artifact (Core writes atomically).
  const writeHandler = <T>(reply: import('fastify').FastifyReply, fn: () => T) => {
    try {
      return fn()
    } catch (err) {
      if (err instanceof CoreError) {
        return reply.code(statusForCode(err.code)).send({ error: { code: err.code, message: err.message } })
      }
      throw err
    }
  }

  app.get('/api/v1/admin/work-items-capture', coreRoute(() => getCaptureDefinition()))

  app.post('/api/v1/admin/work-items', async (request, reply) => {
    const parsed = WorkItemCreateWithAnswersSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: { code: 'INVALID_INPUT', message: 'Intent and type are required.' } })
    return writeHandler(reply, () => createWorkItemAdmin(projectDir, parsed.data))
  })

  app.get<{ Params: { workItemId: string } }>('/api/v1/admin/work-items/:workItemId/edit', async (request, reply) => {
    return writeHandler(reply, () => getWorkItemEdit(projectDir, request.params.workItemId))
  })

  app.put<{ Params: { workItemId: string } }>('/api/v1/admin/work-items/:workItemId', async (request, reply) => {
    const parsed = WorkItemUpdateSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: { code: 'INVALID_INPUT', message: 'A Work Item model and expectedRevision are required.' } })
    return writeHandler(reply, () => updateWorkItemAdmin(projectDir, request.params.workItemId, parsed.data))
  })

  app.post<{ Params: { workItemId: string } }>('/api/v1/admin/work-items/:workItemId/validate', async (request, reply) => {
    return writeHandler(reply, () => validateWorkItemAdmin(projectDir, request.params.workItemId))
  })

  app.post<{ Params: { workItemId: string } }>('/api/v1/admin/work-items/:workItemId/transitions/ready', async (request, reply) => {
    const parsed = WorkItemTransitionSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: { code: 'INVALID_INPUT', message: 'expectedRevision is required.' } })
    return writeHandler(reply, () => transitionWorkItemAdmin(projectDir, request.params.workItemId, 'ready', parsed.data.expectedRevision))
  })

  app.post<{ Params: { workItemId: string } }>('/api/v1/admin/work-items/:workItemId/transitions/draft', async (request, reply) => {
    const parsed = WorkItemTransitionSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: { code: 'INVALID_INPUT', message: 'expectedRevision is required.' } })
    return writeHandler(reply, () => transitionWorkItemAdmin(projectDir, request.params.workItemId, 'draft', parsed.data.expectedRevision))
  })

  // Refinement handoff (VS-099.1). Read-only: refinement happens externally, next to the
  // repository, in a Kaddo-enabled agent. Admin only produces the copyable instructions.
  app.get<{ Params: { workItemId: string } }>('/api/v1/admin/work-items/:workItemId/refinement-handoff', async (request, reply) => {
    try {
      return getRefinementHandoff(projectDir, request.params.workItemId)
    } catch (err) {
      if (err instanceof CoreError) {
        return reply.code(statusForCode(err.code)).send({ error: { code: err.code, message: err.message } })
      }
      throw err
    }
  })

  app.get<{ Params: { workItemId: string } }>('/api/v1/admin/work-items/:workItemId', async (request, reply) => {
    try {
      return getWorkItemDetail(projectDir, request.params.workItemId)
    } catch (err) {
      if (err instanceof CoreError) {
        const code = err.code === 'WORK_ITEM_NOT_FOUND' ? 404 : err.code === 'INVALID_WORK_ITEM_ID' ? 400 : 500
        return reply.code(code).send({ error: { code: err.code, message: err.message } })
      }
      throw err
    }
  })
  app.get('/api/v1/admin/modules', coreRoute(getModules))
  app.get('/api/v1/admin/readiness', coreRoute(getProjectReadiness))
  app.get('/api/v1/admin/route', coreRoute(getProjectRoute))
  app.get('/api/v1/admin/findings', coreRoute(getFindings))
  app.get('/api/v1/admin/system', coreRoute(getSystemMap))
  app.get('/api/v1/admin/system/topology-handoff', coreRoute(getTopologyHandoff))

  // Integrations (VS-102 + VS-103). Reads are safe; writes are covered by the same-origin guard.
  // No secrets ever cross this boundary — only configured/not-configured status.
  const asyncCore = async <T>(reply: import('fastify').FastifyReply, fn: () => Promise<T>) => {
    try {
      return await fn()
    } catch (err) {
      if (err instanceof CoreError) return reply.code(statusForCode(err.code)).send({ error: { code: err.code, message: err.message } })
      throw err
    }
  }
  app.get('/api/v1/admin/integrations', coreRoute(getIntegrations))
  app.get('/api/v1/admin/integrations/types', coreRoute(() => getAvailableIntegrationTypesAdmin()))
  app.get<{ Params: { id: string } }>('/api/v1/admin/integrations/:id', async (request, reply) => {
    try { return getIntegrationDetail(projectDir, request.params.id) }
    catch (err) { if (err instanceof CoreError) return reply.code(statusForCode(err.code)).send({ error: { code: err.code, message: err.message } }); throw err }
  })
  app.get<{ Params: { id: string } }>('/api/v1/admin/integrations/:id/secrets', async (request, reply) =>
    asyncCore(reply, () => getIntegrationSecretStatusAdmin(projectDir, request.params.id)),
  )
  app.get<{ Params: { id: string } }>('/api/v1/admin/integrations/:id/status', async (request, reply) =>
    asyncCore(reply, () => getIntegrationStatus(projectDir, request.params.id)),
  )
  // VS-103 write operations
  app.post<{ Body: { id: string; adapter: string; enabled?: boolean; config?: Record<string, unknown>; secrets?: Record<string, string> } }>(
    '/api/v1/admin/integrations',
    async (request, reply) => {
      const { id, adapter, enabled, config, secrets } = request.body ?? {} as Record<string, unknown>
      if (!id || !adapter) return reply.code(400).send({ error: { code: 'INVALID_INPUT', message: 'id and adapter are required.' } })
      return writeHandler(reply, () => createIntegrationAdmin(projectDir, { id, adapter, enabled, config, secrets }))
    },
  )
  app.put<{ Params: { id: string }; Body: { enabled?: boolean; config?: Record<string, unknown>; secrets?: Record<string, string> } }>(
    '/api/v1/admin/integrations/:id',
    async (request, reply) => writeHandler(reply, () => updateIntegrationAdmin(projectDir, request.params.id, request.body ?? {})),
  )
  app.delete<{ Params: { id: string } }>('/api/v1/admin/integrations/:id', async (request, reply) => {
    try {
      deleteIntegrationAdmin(projectDir, request.params.id)
      return { ok: true }
    } catch (err) {
      if (err instanceof CoreError) return reply.code(statusForCode(err.code)).send({ error: { code: err.code, message: err.message } })
      throw err
    }
  })
  app.post<{ Params: { id: string } }>('/api/v1/admin/integrations/:id/enable', async (request, reply) =>
    writeHandler(reply, () => enableIntegrationAdmin(projectDir, request.params.id)),
  )
  app.post<{ Params: { id: string } }>('/api/v1/admin/integrations/:id/disable', async (request, reply) =>
    writeHandler(reply, () => disableIntegrationAdmin(projectDir, request.params.id)),
  )
  app.post<{ Params: { id: string; name: string }; Body: { value: string } }>(
    '/api/v1/admin/integrations/:id/secrets/:name',
    async (request, reply) => {
      const { value } = request.body ?? {} as Record<string, unknown>
      if (!value || typeof value !== 'string') return reply.code(400).send({ error: { code: 'INVALID_INPUT', message: 'A secret value is required.' } })
      return asyncCore(reply, async () => {
        await setIntegrationSecretAdmin(projectDir, request.params.id, request.params.name, value)
        return { ok: true }
      })
    },
  )
  app.delete<{ Params: { id: string; name: string } }>('/api/v1/admin/integrations/:id/secrets/:name', async (request, reply) =>
    asyncCore(reply, async () => {
      await removeIntegrationSecretAdmin(projectDir, request.params.id, request.params.name)
      return { ok: true }
    }),
  )
  app.get<{ Params: { id: string }; Querystring: { cursor?: string; pageSize?: string; projects?: string; statuses?: string; types?: string; labels?: string; assignees?: string; search?: string } }>(
    '/api/v1/admin/integrations/:id/work-items',
    async (request, reply) => {
      const q = request.query
      const filters: Record<string, unknown> = {}
      if (q.projects) filters.projects = q.projects.split(',')
      if (q.statuses) filters.statuses = q.statuses.split(',')
      if (q.types) filters.types = q.types.split(',')
      if (q.labels) filters.labels = q.labels.split(',')
      if (q.assignees) filters.assignees = q.assignees.split(',')
      if (q.search) filters.search = q.search
      return asyncCore(reply, () => getExternalWorkItems(projectDir, request.params.id, {
        cursor: q.cursor,
        pageSize: q.pageSize ? Number.parseInt(q.pageSize, 10) : undefined,
        filters: Object.keys(filters).length ? filters as import('@kaddo/cli/core').ExternalWorkItemFilters : undefined,
      }))
    },
  )
  app.get<{ Params: { id: string; externalId: string }; Querystring: { type?: string } }>(
    '/api/v1/admin/integrations/:id/work-items/:externalId',
    async (request, reply) => asyncCore(reply, () => getExternalWorkItemDetail(projectDir, request.params.id, request.params.externalId)),
  )
  app.get<{ Params: { id: string; externalId: string }; Querystring: { type?: string } }>(
    '/api/v1/admin/integrations/:id/work-items/:externalId/import-preview',
    async (request, reply) => asyncCore(reply, () => previewIntegrationImport(projectDir, request.params.id, request.params.externalId, { type: request.query.type })),
  )
  app.post<{ Params: { id: string; externalId: string }; Body: { type?: string } }>(
    '/api/v1/admin/integrations/:id/work-items/:externalId/import',
    async (request, reply) => {
      const type = request.body?.type
      if (!type) return reply.code(400).send({ error: { code: 'INVALID_INPUT', message: 'A Kaddo Work Item type is required to import.' } })
      return asyncCore(reply, () => importIntegrationWorkItem(projectDir, request.params.id, request.params.externalId, { type }))
    },
  )
  // VS-104: Discovery — query all enabled integrations in parallel
  app.get<{ Querystring: { projects?: string; statuses?: string; types?: string; labels?: string; assignees?: string; search?: string; pageSize?: string; integrationIds?: string; cursors?: string } }>(
    '/api/v1/admin/integrations/discover',
    async (request, reply) => {
      const q = request.query
      const filters: Record<string, unknown> = {}
      if (q.projects) filters.projects = q.projects.split(',')
      if (q.statuses) filters.statuses = q.statuses.split(',')
      if (q.types) filters.types = q.types.split(',')
      if (q.labels) filters.labels = q.labels.split(',')
      if (q.assignees) filters.assignees = q.assignees.split(',')
      if (q.search) filters.search = q.search
      let cursors: Record<string, string> | undefined
      if (q.cursors) { try { cursors = JSON.parse(q.cursors) } catch {} }
      return asyncCore(reply, () => discoverExternalWorkItemsAdmin(projectDir, {
        filters: Object.keys(filters).length ? filters as import('@kaddo/cli/core').ExternalWorkItemFilters : undefined,
        pageSize: q.pageSize ? Number.parseInt(q.pageSize, 10) : undefined,
        integrationIds: q.integrationIds ? q.integrationIds.split(',') : undefined,
        cursors,
      }))
    },
  )
  // VS-104: Integration filter management
  app.get<{ Params: { id: string } }>('/api/v1/admin/integrations/:id/filters', async (request, reply) => {
    try { return getIntegrationFiltersAdmin(projectDir, request.params.id) }
    catch (err) { if (err instanceof CoreError) return reply.code(statusForCode(err.code)).send({ error: { code: err.code, message: err.message } }); throw err }
  })
  app.put<{ Params: { id: string }; Body: import('@kaddo/cli/core').ExternalWorkItemFilters }>(
    '/api/v1/admin/integrations/:id/filters',
    async (request, reply) => writeHandler(reply, () => updateIntegrationFiltersAdmin(projectDir, request.params.id, request.body ?? {})),
  )

  app.get('/api/v1/admin/knowledge/inventory', coreRoute(getKnowledgeInventory))
  app.get<{ Params: { artifactId: string } }>('/api/v1/admin/knowledge/artifact/:artifactId', async (request) => {
    try {
      return getKnowledgeArtifactDetail(projectDir, request.params.artifactId)
    } catch (err) {
      if (err instanceof CoreError) {
        return { error: { code: err.code, message: err.message } }
      }
      throw err
    }
  })

  // SPA fallback: serve index.html for non-API, non-static routes
  if (staticDir) {
    app.setNotFoundHandler(async (_request, reply) => {
      return reply.sendFile('index.html')
    })
  }

  return {
    app,
    sessionId,
    sessionManager,
    start: async () => {
      await app.listen({ host, port })
      return `http://${host}:${port}`
    },
    stop: async () => {
      sessionManager.invalidateAll()
      await app.close()
      await storage.close()
    },
  }
}
