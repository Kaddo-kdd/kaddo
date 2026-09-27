import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createAdminServer } from '../src/server.js'
import type { AdminStorage, SessionRecord, PreferenceRecord } from '../src/storage/admin-storage.js'

function fakeStorage(): AdminStorage {
  const sessions = new Map<string, SessionRecord>()
  const prefs = new Map<string, string>()
  const cache = new Map<string, string>()
  return {
    initialize: async () => {},
    close: async () => {},
    sessions: {
      create: (s) => { sessions.set(s.id, s) },
      findById: (id) => sessions.get(id),
      deleteById: (id) => { sessions.delete(id) },
      deleteExpired: () => {},
    },
    preferences: {
      get: (k) => prefs.get(k),
      set: (k, v) => { prefs.set(k, v) },
      delete: (k) => { prefs.delete(k) },
      all: () => [...prefs.entries()].map(([key, value]) => ({ key, value } as PreferenceRecord)),
    },
    cache: {
      get: (k) => cache.get(k),
      set: (k, v) => { cache.set(k, v) },
      delete: (k) => { cache.delete(k) },
      clear: () => cache.clear(),
    },
  }
}

describe('admin-server security: input validation', () => {
  let app: Awaited<ReturnType<typeof createAdminServer>>['app']
  let sessionCookie: string

  beforeAll(async () => {
    const server = await createAdminServer({
      projectDir: process.cwd(),
      storage: fakeStorage(),
    })
    app = server.app

    const sessionRes = await app.inject({ method: 'GET', url: '/api/v1/admin/session' })
    const setCookie = sessionRes.headers['set-cookie'] as string
    sessionCookie = setCookie.split(';')[0]
  })

  afterAll(async () => {
    await app.close()
  })

  function inject(method: string, url: string, body?: unknown) {
    const headers: Record<string, string> = { cookie: sessionCookie }
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      headers.origin = 'http://127.0.0.1:4173'
    }
    if (body) headers['content-type'] = 'application/json'
    return app.inject({ method: method as any, url, headers, payload: body ? JSON.stringify(body) : undefined })
  }

  describe('integration ID validation', () => {
    const INVALID_IDS = [
      'my..int',
      '.hidden',
      'a/b',
      'a\\b',
      ' spaces ',
      'café',
      'a@b',
    ]

    for (const id of INVALID_IDS) {
      it(`rejects integration ID "${id}"`, async () => {
        const res = await inject('GET', `/api/v1/admin/integrations/${encodeURIComponent(id)}/status`)
        const body = JSON.parse(res.body)
        expect(body.error?.code).toBe('INVALID_INTEGRATION_ID')
      })
    }

    it('accepts valid integration IDs', async () => {
      for (const id of ['my-jira', 'jira.prod', 'test_1', 'A1']) {
        const res = await inject('GET', `/api/v1/admin/integrations/${id}/status`)
        const body = JSON.parse(res.body)
        expect(body.error?.code).not.toBe('INVALID_INTEGRATION_ID')
      }
    })
  })

  describe('secret name validation', () => {
    const INVALID_NAMES = [
      'my..key',
      'a/b',
      'a\\b',
      'key with spaces',
      'key@val',
    ]

    for (const name of INVALID_NAMES) {
      it(`rejects secret name "${name}" on set`, async () => {
        const url = `/api/v1/admin/integrations/valid-id/secrets/${encodeURIComponent(name)}`
        const res = await inject('POST', url, { value: 'test' })
        const body = JSON.parse(res.body)
        expect(body.error?.code).toBe('INVALID_SECRET_NAME')
      })

      it(`rejects secret name "${name}" on delete`, async () => {
        const url = `/api/v1/admin/integrations/valid-id/secrets/${encodeURIComponent(name)}`
        const res = await inject('DELETE', url)
        const body = JSON.parse(res.body)
        expect(body.error?.code).toBe('INVALID_SECRET_NAME')
      })
    }

    it('accepts valid secret names', async () => {
      for (const name of ['API_TOKEN', 'my-key', 'secret_1']) {
        const url = `/api/v1/admin/integrations/valid-id/secrets/${name}`
        const res = await inject('POST', url, { value: 'test' })
        const body = JSON.parse(res.body)
        expect(body.error?.code).not.toBe('INVALID_SECRET_NAME')
      }
    })
  })

  describe('session & CSRF protection', () => {
    it('rejects API requests without session cookie', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/admin/overview' })
      expect(res.statusCode).toBe(401)
      const body = JSON.parse(res.body)
      expect(body.error.code).toBe('SESSION_INVALID')
    })

    it('rejects write requests without Origin header', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/admin/integrations/test/enable',
        headers: { cookie: sessionCookie },
      })
      expect(res.statusCode).toBe(403)
      const body = JSON.parse(res.body)
      expect(body.error.code).toBe('FORBIDDEN_ORIGIN')
    })

    it('rejects write requests with wrong Origin', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/admin/integrations/test/enable',
        headers: { cookie: sessionCookie, origin: 'http://evil.com' },
      })
      expect(res.statusCode).toBe(403)
    })

    it('allows health check without session', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/admin/health' })
      expect(res.statusCode).toBe(200)
      expect(JSON.parse(res.body)).toEqual({ status: 'ok' })
    })

    it('allows session endpoint without cookie', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/admin/session' })
      expect(res.statusCode).toBe(200)
      expect(res.headers['set-cookie']).toBeTruthy()
    })
  })

  describe('error response shape', () => {
    it('returns structured error envelope', async () => {
      const res = await inject('GET', '/api/v1/admin/integrations/.hidden/status')
      const body = JSON.parse(res.body)
      expect(body).toHaveProperty('error')
      expect(body.error).toHaveProperty('code')
      expect(body.error).toHaveProperty('message')
      expect(typeof body.error.message).toBe('string')
    })
  })
})
