import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { createAdminServer } from '../src/server.js'
import type { AdminStorage } from '../src/storage/admin-storage.js'

function storage(): AdminStorage {
  const sessions = new Map<string, any>()
  return { initialize: async () => {}, close: async () => {}, sessions: { create: (v: any) => sessions.set(v.id, v), findById: (id: string) => sessions.get(id), deleteById: () => {}, deleteExpired: () => {} }, preferences: { get: () => undefined, set: () => {}, delete: () => {}, all: () => [] }, cache: { get: () => undefined, set: () => {}, delete: () => {}, clear: () => {} } }
}

describe('Admin isolated audit E2E', () => {
  it.skipIf(process.env.KADDO_TEST_DOCKER_SANDBOX !== '1')('runs the actual Admin API, compiler container and isolated registry query', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-admin-isolated-'))
    let app: Awaited<ReturnType<typeof createAdminServer>>['app'] | undefined
    try {
      if (process.platform !== 'win32') fs.chmodSync(dir, 0o755)
      fs.mkdirSync(path.join(dir, '.kaddo'))
      fs.writeFileSync(path.join(dir, '.kaddo', 'config.yml'), 'project:\n  name: fixture\n  state: new\n  structure: monorepo\n  language: en\nteam:\n  size: small\n')
      fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'isolated-fixture', version: '1.0.0', dependencies: { lodash: '4.17.20' } }))
      fs.writeFileSync(path.join(dir, 'package-lock.json'), JSON.stringify({ lockfileVersion: 3, packages: { '': { name: 'isolated-fixture', version: '1.0.0' }, 'node_modules/lodash': { version: '4.17.20' } } }))
      fs.writeFileSync(path.join(dir, 'tsconfig.json'), JSON.stringify({ compilerOptions: { noEmit: true }, files: ['main.ts'] }))
      fs.writeFileSync(path.join(dir, 'main.ts'), 'const value: string = 42\n')
      fs.mkdirSync(path.join(dir, 'node_modules'))
      const require = createRequire(import.meta.url)
      fs.cpSync(path.dirname(require.resolve('typescript/package.json')), path.join(dir, 'node_modules', 'typescript'), { recursive: true })
      fs.mkdirSync(path.join(dir, 'static')); fs.writeFileSync(path.join(dir, 'static', 'index.html'), 'Admin')
      app = (await createAdminServer({ projectDir: dir, storage: storage(), staticDir: path.join(dir, 'static') })).app
      const cookie = String((await app.inject({ method: 'GET', url: '/api/v1/admin/session' })).headers['set-cookie']).split(';')[0]
      const payload = { requestId: '01aaa19d-e9e4-4604-a2ad-354c98b28955', confirmed: true }
      const headers = { cookie, origin: 'http://127.0.0.1:4173' }
      const response = await app.inject({ method: 'POST', url: '/api/v1/admin/audits/run', headers, payload })
      expect(response.statusCode, response.body).toBe(200)
      expect(response.json().run.findings.some((f: any) => f.category === 'types' && f.title.includes('TS2322'))).toBe(true)
      expect(response.json().run.findings.some((f: any) => f.category === 'dependency' && f.location?.symbol === 'lodash')).toBe(true)
      expect(response.json().run.coverage.complete).toBe(true)
      const replay = await app.inject({ method: 'POST', url: '/api/v1/admin/audits/run', headers, payload })
      expect(replay.json().reused).toBe(true)
      expect(replay.json().run.id).toBe(response.json().run.id)
    } finally { if (app) await app.close(); fs.rmSync(dir, { recursive: true, force: true }) }
  }, 180_000)
})
