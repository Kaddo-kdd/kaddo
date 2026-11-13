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
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-insights-api-'))
  const w = (rel: string, c: string) => { fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true }); fs.writeFileSync(path.join(dir, rel), c) }
  w('.kaddo/config.yml', 'version: 1\nproject:\n  name: t\n  state: new\n  structure: monorepo\n  language: en\nteam:\n  size: small\n')
  w('knowledge/delivery/epics/EP-001.md', '---\ntype: epic\nid: EP-001\ntitle: Auth\nstatus: in-progress\noutcome: SSO\nsuccess_criteria:\n  - SSO works\n---\n# E\n')
  w('knowledge/delivery/initiatives/INI-001.md', [
    '---', 'type: initiative', 'id: INI-001', 'title: Auth', 'status: in-progress', 'epic: EP-001',
    'candidates:', '  - id: WI-CANDIDATE-001', '    title: Pending',
    '---', '# Auth', '', '## Success Criteria', '', '- SSO works end to end', '',
  ].join('\n'))
  return dir
}

describe('admin-server — Planning Insights API (WI-081)', () => {
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

  it('returns the read-only insights projection with separated dimensions', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/admin/planning/insights', headers: { cookie } })
    expect(res.statusCode).toBe(200)
    const j = res.json()
    // Three dimensions present and distinct.
    expect(j.coverage).toEqual({ totalCandidates: 1, materialized: 0, pending: 1, validated: 0, unresolved: 0 })
    expect(j.delivery.associated.total).toBe(0)
    expect(j.outcome.notVerified).toBeGreaterThanOrEqual(2) // EP-001 + INI-001 criteria
    expect(j.indicators.outcomeNeedsVerification).toBeGreaterThan(0)
    // Attention has the pending candidate as an info coverage signal with a navigable link.
    const pend = (j.attention as Array<Record<string, unknown>>).find((a) => a.type === 'pending-candidates')
    expect(pend).toMatchObject({ severity: 'info', artifactId: 'INI-001', link: '/initiatives/INI-001' })
  })

  it('does not mutate any artifact (AC-18, AC-23)', async () => {
    const before = fs.readFileSync(path.join(dir, 'knowledge/delivery/initiatives/INI-001.md'), 'utf8')
    await app.inject({ method: 'GET', url: '/api/v1/admin/planning/insights', headers: { cookie } })
    await app.inject({ method: 'GET', url: '/api/v1/admin/planning/insights', headers: { cookie } })
    const after = fs.readFileSync(path.join(dir, 'knowledge/delivery/initiatives/INI-001.md'), 'utf8')
    expect(after).toBe(before)
  })

  it('does not shadow the plan detail route', async () => {
    // /planning/insights must not be captured by /planning/plans/:id or similar.
    const res = await app.inject({ method: 'GET', url: '/api/v1/admin/planning/insights', headers: { cookie } })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toHaveProperty('milestones')
  })
})
