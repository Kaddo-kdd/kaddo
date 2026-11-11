import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createAdminServer } from '../src/server.js'
import type { AdminStorage, SessionRecord, PreferenceRecord } from '../src/storage/admin-storage.js'

function fakeStorage(): AdminStorage {
  const sessions = new Map<string, SessionRecord>(); const prefs = new Map<string, string>(); const cache = new Map<string, string>()
  return {
    initialize: async () => {}, close: async () => {},
    sessions: { create: (s) => { sessions.set(s.id, s) }, findById: (id) => sessions.get(id), deleteById: (id) => { sessions.delete(id) }, deleteExpired: () => {} },
    preferences: { get: (k) => prefs.get(k), set: (k, v) => { prefs.set(k, v) }, delete: (k) => { prefs.delete(k) }, all: () => [...prefs.entries()].map(([key, value]) => ({ key, value } as PreferenceRecord)) },
    cache: { get: (k) => cache.get(k), set: (k, v) => { cache.set(k, v) }, delete: (k) => { cache.delete(k) }, clear: () => cache.clear() },
  }
}

function tmpProject(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-ini-mgmt-api-'))
  const w = (rel: string, c: string) => { fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true }); fs.writeFileSync(path.join(dir, rel), c) }
  w('.kaddo/config.yml', 'version: 1\nproject:\n  name: t\n  state: new\n  structure: monorepo\n  language: en\nteam:\n  size: small\n')
  // Initiative with one declared success criterion and one pending candidate.
  w(
    'knowledge/delivery/initiatives/INI-001.md',
    [
      '---', 'type: initiative', 'id: INI-001', 'title: Auth', 'status: in-progress',
      'candidates:', '  - id: WI-CANDIDATE-001', '    title: SSO',
      '---', '# Auth', '', '## Success Criteria', '', '- SSO works end to end', '',
    ].join('\n'),
  )
  return dir
}

describe('admin-server — Initiative candidate & completion API (WI-079)', () => {
  let dir: string
  let app: Awaited<ReturnType<typeof createAdminServer>>['app']
  let cookie: string

  beforeEach(async () => {
    dir = tmpProject()
    const server = await createAdminServer({ projectDir: dir, storage: fakeStorage() })
    app = server.app
    const res = await app.inject({ method: 'GET', url: '/api/v1/admin/session' })
    cookie = (res.headers['set-cookie'] as string).split(';')[0]
  })
  afterEach(async () => { await app.close(); fs.rmSync(dir, { recursive: true, force: true }) })

  function send(method: string, url: string, body?: unknown) {
    const headers: Record<string, string> = { cookie }
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) headers.origin = 'http://127.0.0.1:4173'
    if (body) headers['content-type'] = 'application/json'
    return app.inject({ method: method as never, url, headers, payload: body ? JSON.stringify(body) : undefined })
  }

  it('edits a pending candidate and keeps its id (AC-07)', async () => {
    const res = await send('PUT', '/api/v1/admin/initiatives/INI-001/candidates/WI-CANDIDATE-001', { title: 'SSO refined', expectedValue: 'high' })
    expect(res.statusCode).toBe(200)
    const c = res.json().candidates[0]
    expect(c.id).toBe('WI-CANDIDATE-001')
    expect(c.title).toBe('SSO refined')
    expect(c.expectedValue).toBe('high')
  })

  it('removing a candidate requires a justification; a blank one is rejected (AC-07)', async () => {
    const bad = await send('DELETE', '/api/v1/admin/initiatives/INI-001/candidates/WI-CANDIDATE-001', { reason: '  ' })
    expect(bad.statusCode).toBe(400)
    const ok = await send('DELETE', '/api/v1/admin/initiatives/INI-001/candidates/WI-CANDIDATE-001', { reason: 'out of scope for v1' })
    expect(ok.statusCode).toBe(200)
    expect(ok.json().candidates).toHaveLength(0)
  })

  it('materialization is idempotent (AC-08, D3)', async () => {
    const first = await send('POST', '/api/v1/admin/initiatives/INI-001/candidates/WI-CANDIDATE-001/materialize')
    expect(first.statusCode).toBe(200)
    expect(first.json().alreadyMaterialized).toBe(false)
    const second = await send('POST', '/api/v1/admin/initiatives/INI-001/candidates/WI-CANDIDATE-001/materialize')
    expect(second.statusCode).toBe(200)
    expect(second.json().alreadyMaterialized).toBe(true)
    expect(second.json().workItemId).toBe(first.json().workItemId)
  })

  it('readiness → evidence → readiness reflects evidence-based completion (AC-19, AC-22)', async () => {
    // Materialize + complete the only candidate so delivery is done; outcome is still unverified.
    const m = await send('POST', '/api/v1/admin/initiatives/INI-001/candidates/WI-CANDIDATE-001/materialize')
    const wiId = m.json().workItemId as string
    completeWorkItem(dir, wiId)

    expect((await send('GET', '/api/v1/admin/initiatives/INI-001/completion')).json().readiness).toBe('NEEDS_WORK')
    const ev = await send('POST', '/api/v1/admin/initiatives/INI-001/evidence', { criterion: 'SSO works end to end', status: 'passed', evidence: 'verified', reference: 'sso.spec.ts' })
    expect(ev.statusCode).toBe(200)
    expect(ev.json().completion.readiness).toBe('READY_TO_COMPLETE')
  })

  it('completion is evidence-gated: blocked (409) until verified, then records the decision (AC-20, AC-22)', async () => {
    const m = await send('POST', '/api/v1/admin/initiatives/INI-001/candidates/WI-CANDIDATE-001/materialize')
    completeWorkItem(dir, m.json().workItemId as string)

    const blocked = await send('POST', '/api/v1/admin/initiatives/INI-001/complete', { decidedBy: 'lead' })
    expect(blocked.statusCode).toBe(409)
    expect(blocked.json().error.code).toBe('INITIATIVE_NOT_READY')

    await send('POST', '/api/v1/admin/initiatives/INI-001/evidence', { criterion: 'SSO works end to end', status: 'passed', evidence: 'ok' })
    const done = await send('POST', '/api/v1/admin/initiatives/INI-001/complete', { decidedBy: 'lead', notes: 'Reviewed' })
    expect(done.statusCode).toBe(200)
    expect(done.json().status).toBe('completed')
  })

  it('rejects evidence for an undeclared criterion (AC-19)', async () => {
    const res = await send('POST', '/api/v1/admin/initiatives/INI-001/evidence', { criterion: 'not a declared criterion', status: 'passed' })
    expect(res.statusCode).toBeGreaterThanOrEqual(400)
  })

  it('edits intention sections + attributes without destroying other content (AC-02, AC-03)', async () => {
    const detail = (await send('GET', '/api/v1/admin/initiatives/INI-001')).json()
    const res = await send('PUT', '/api/v1/admin/initiatives/INI-001', {
      title: 'Auth (refined)', sections: { Goal: 'Ship SSO for all tenants.' }, expectedRevision: detail.revision,
    })
    expect(res.statusCode).toBe(200)
    const md = fs.readFileSync(path.join(dir, 'knowledge/delivery/initiatives/INI-001.md'), 'utf8')
    expect(md).toContain('Ship SSO for all tenants.')
    expect(md).toContain('SSO works end to end') // the Success Criteria section is preserved
    expect(md).toContain('title: Auth (refined)')
  })

  it('rejects a stale form on edit (AC-04, 409 INITIATIVE_CONFLICT)', async () => {
    const detail = (await send('GET', '/api/v1/admin/initiatives/INI-001')).json()
    await send('PUT', '/api/v1/admin/initiatives/INI-001', { priority: 'high' }) // advances the revision
    const conflict = await send('PUT', '/api/v1/admin/initiatives/INI-001', { title: 'x', expectedRevision: detail.revision })
    expect(conflict.statusCode).toBe(409)
    expect(conflict.json().error.code).toBe('INITIATIVE_CONFLICT')
  })

  it('security: a completion without the same-origin header is rejected', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/v1/admin/initiatives/INI-001/complete', headers: { cookie, 'content-type': 'application/json' }, payload: '{}' })
    expect(res.statusCode).toBeGreaterThanOrEqual(400)
    expect(fs.readFileSync(path.join(dir, 'knowledge/delivery/initiatives/INI-001.md'), 'utf8')).toContain('status: in-progress')
  })
})

/** Move a draft Work Item to completed/ with status: completed (keeps provenance frontmatter). */
function completeWorkItem(dir: string, wiId: string): void {
  const draftDir = path.join(dir, 'knowledge', 'delivery', 'work-items', 'draft')
  const file = fs.readdirSync(draftDir).find((f) => f.startsWith(wiId))
  if (!file) throw new Error(`WI ${wiId} not found in draft`)
  const raw = fs.readFileSync(path.join(draftDir, file), 'utf8').replace(/^status:.*$/m, 'status: completed')
  const destDir = path.join(dir, 'knowledge', 'delivery', 'work-items', 'completed')
  fs.mkdirSync(destDir, { recursive: true })
  fs.writeFileSync(path.join(destDir, file), raw)
  fs.unlinkSync(path.join(draftDir, file))
}
