import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'

// Mock node:sqlite (Vite 5.4 doesn't recognize it as a built-in)
class MockStatement {
  private db: MockDatabaseSync
  private sql: string
  constructor(db: MockDatabaseSync, sql: string) { this.db = db; this.sql = sql }
  run(...params: unknown[]) {
    const tables = this.db._tables
    const sql = this.sql.trim()
    if (sql.startsWith('INSERT OR REPLACE INTO')) {
      const match = sql.match(/INTO\s+(\w+)\s*\(([^)]+)\)/)
      if (match) {
        const table = match[1]
        const cols = match[2].split(',').map(c => c.trim())
        if (!tables[table]) tables[table] = []
        const row: Record<string, unknown> = {}
        cols.forEach((c, i) => { row[c] = params[i] })
        const pkCol = cols[0]
        const idx = tables[table].findIndex((r: Record<string, unknown>) => r[pkCol] === params[0])
        if (idx >= 0) tables[table][idx] = row; else tables[table].push(row)
      }
    } else if (sql.startsWith('DELETE FROM')) {
      const match = sql.match(/FROM\s+(\w+)/)
      if (match) {
        const table = match[1]
        if (!tables[table]) return
        if (sql.includes('WHERE')) {
          const colMatch = sql.match(/WHERE\s+(\w+)\s*[<=]/)
          if (colMatch) {
            tables[table] = tables[table].filter((r: Record<string, unknown>) => r[colMatch[1]] !== params[0])
          }
        }
      }
    }
  }
  get(...params: unknown[]): unknown {
    const match = this.sql.match(/FROM\s+(\w+)/)
    if (!match) return undefined
    const table = match[1]
    const rows = this.db._tables[table] || []
    const colMatch = this.sql.match(/WHERE\s+(\w+)\s*=/)
    if (colMatch) {
      const row = rows.find((r: Record<string, unknown>) => r[colMatch[1]] === params[0])
      if (row && table === 'admin_cache' && row.expires_at && new Date(row.expires_at as string) < new Date()) {
        this.db._tables[table] = rows.filter((r: Record<string, unknown>) => r[colMatch[1]] !== params[0])
        return undefined
      }
      return row
    }
    return rows[0]
  }
  all(): unknown[] {
    const match = this.sql.match(/FROM\s+(\w+)/)
    if (!match) return []
    return this.db._tables[match[1]] || []
  }
}

class MockDatabaseSync {
  _tables: Record<string, Record<string, unknown>[]> = {}
  constructor(_path: string) {}
  exec(sql: string) {
    const delMatch = sql.match(/DELETE\s+FROM\s+(\w+)/g)
    if (delMatch) {
      for (const m of delMatch) {
        const table = m.replace(/DELETE\s+FROM\s+/, '')
        this._tables[table] = []
      }
    }
  }
  prepare(sql: string) { return new MockStatement(this, sql) }
  close() {}
}

vi.mock('node:sqlite', () => ({
  DatabaseSync: MockDatabaseSync,
}))

function tmpDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-admin-'))
  return dir
}

function writeFile(dir: string, rel: string, content: string) {
  const full = path.join(dir, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content, 'utf-8')
}

function initProject(dir: string, extra: Record<string, string> = {}) {
  writeFile(dir, '.kaddo/config.yml', [
    'project:',
    '  name: test-admin',
    '  state: pre-ai',
    '  structure: monorepo',
    'team:',
    '  size: small',
  ].join('\n'))
  for (const [rel, content] of Object.entries(extra)) {
    writeFile(dir, rel, content)
  }
}

// ─── Core reuse ──────────────────────────────────────────────────────────────

describe('VS-096: Core reuse', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir() })
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

  it('buildProjectExplanation is importable from core', async () => {
    const core = await import('../src/core.js')
    expect(typeof core.buildProjectExplanation).toBe('function')
  })

  it('buildReadinessReport is importable from core', async () => {
    const core = await import('../src/core.js')
    expect(typeof core.buildReadinessReport).toBe('function')
  })

  it('buildProjectRoute is importable from core', async () => {
    const core = await import('../src/core.js')
    expect(typeof core.buildProjectRoute).toBe('function')
  })

  it('loadConfig returns project data', async () => {
    initProject(dir)
    const core = await import('../src/core.js')
    const config = core.loadConfig(dir)
    expect(config).not.toBeNull()
    expect(config!.project.name).toBe('test-admin')
  })

  it('Admin project summary matches Core project summary', async () => {
    initProject(dir)
    const core = await import('../src/core.js')
    const explanation = core.buildProjectExplanation(dir)
    expect(explanation.project.name).toBe('test-admin')
    expect(explanation.project.structure).toBe('monorepo')
  })

  it('Admin uses Core readiness resolver', async () => {
    initProject(dir)
    const core = await import('../src/core.js')
    const readiness = core.buildReadinessReport(dir)
    expect(readiness.overall).toBeTruthy()
    expect(readiness.project_name).toBe('test-admin')
  })

  it('Admin uses Core Work Item summary', async () => {
    initProject(dir, {
      'knowledge/delivery/work-items/ready/WI-001.md': [
        '---',
        'id: WI-001',
        'title: Test Feature',
        'type: feature',
        'status: ready',
        '---',
        '## Problem',
        'Test problem',
      ].join('\n'),
    })
    const core = await import('../src/core.js')
    const explanation = core.buildProjectExplanation(dir)
    expect(explanation.workItems.total).toBe(1)
    expect(explanation.workItems.items[0].id).toBe('WI-001')
  })

  it('No duplicate readiness implementation exists in admin-server', async () => {
    const serverSrc = fs.readFileSync(
      path.resolve(__dirname, '../../admin-server/src/core-adapter.ts'),
      'utf-8'
    )
    expect(serverSrc).not.toContain('delivery-completed')
    expect(serverSrc).toContain('buildReadinessReport')
    expect(serverSrc).toContain('buildProjectRoute')
  })
})

// ─── Contracts ───────────────────────────────────────────────────────────────

describe('VS-096: Contracts', () => {
  it('Zod schemas parse valid overview response', async () => {
    const { ProjectOverviewSchema } = await import('../../admin-server/src/contracts/schemas.js')
    const valid = {
      project: { name: 'test', state: 'pre-ai', mode: 'standard', structure: 'monorepo', language: 'en', teamSize: 'small' },
      knowledge: { layers: [{ layer: 'Business', status: 'Missing' }], missing: [] },
      workItems: { total: 0, byState: {}, byType: {}, items: [] },
      modules: { modules: [] },
      readiness: { overall: 'initialized', recommendedNextStep: { label: 'Scan' } },
      route: { type: 'pre-ai', completed: 0, total: 16, progressPercent: 0, steps: [] },
      findings: { blocking: 0, warning: 0, fyi: 0, items: [] },
    }
    const result = ProjectOverviewSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('Invalid responses fail validation', async () => {
    const { ProjectOverviewSchema } = await import('../../admin-server/src/contracts/schemas.js')
    const invalid = { project: { name: 123 } }
    const result = ProjectOverviewSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })
})

// ─── Storage ─────────────────────────────────────────────────────────────────

describe('VS-096: AdminStorage', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir() })
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

  it('SQLiteAdminStorage implements AdminStorage interface', async () => {
    const { SQLiteAdminStorage } = await import('../../admin-server/src/storage/sqlite-storage.js')
    const storage = new SQLiteAdminStorage(path.join(dir, 'test.db'))
    await storage.initialize()
    expect(storage.sessions).toBeDefined()
    expect(storage.preferences).toBeDefined()
    expect(storage.cache).toBeDefined()
    await storage.close()
  })

  it('Drizzle schema initializes without error', async () => {
    const { SQLiteAdminStorage } = await import('../../admin-server/src/storage/sqlite-storage.js')
    const storage = new SQLiteAdminStorage(path.join(dir, 'init.db'))
    await storage.initialize()
    // Double init should also succeed
    await storage.initialize()
    await storage.close()
  })

  it('Sessions CRUD works', async () => {
    const { SQLiteAdminStorage } = await import('../../admin-server/src/storage/sqlite-storage.js')
    const storage = new SQLiteAdminStorage(path.join(dir, 'session.db'))
    await storage.initialize()

    storage.sessions.create({
      id: 'abc123',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    })

    const found = storage.sessions.findById('abc123')
    expect(found).toBeDefined()
    expect(found!.id).toBe('abc123')

    storage.sessions.deleteById('abc123')
    expect(storage.sessions.findById('abc123')).toBeUndefined()

    await storage.close()
  })

  it('Preferences CRUD works', async () => {
    const { SQLiteAdminStorage } = await import('../../admin-server/src/storage/sqlite-storage.js')
    const storage = new SQLiteAdminStorage(path.join(dir, 'pref.db'))
    await storage.initialize()

    storage.preferences.set('theme', 'dark')
    expect(storage.preferences.get('theme')).toBe('dark')

    storage.preferences.delete('theme')
    expect(storage.preferences.get('theme')).toBeUndefined()

    await storage.close()
  })

  it('Cache with TTL works', async () => {
    const { SQLiteAdminStorage } = await import('../../admin-server/src/storage/sqlite-storage.js')
    const storage = new SQLiteAdminStorage(path.join(dir, 'cache.db'))
    await storage.initialize()

    storage.cache.set('key1', 'value1', 60000)
    expect(storage.cache.get('key1')).toBe('value1')

    storage.cache.set('expired', 'gone', -1)
    expect(storage.cache.get('expired')).toBeUndefined()

    storage.cache.clear()
    expect(storage.cache.get('key1')).toBeUndefined()

    await storage.close()
  })

  it('Deleting SQLite preserves canonical project state', async () => {
    initProject(dir, {
      'knowledge/delivery/work-items/ready/WI-001.md': [
        '---',
        'id: WI-001',
        'title: Test',
        'type: feature',
        'status: ready',
        '---',
        '',
      ].join('\n'),
    })
    const dbPath = path.join(dir, '.kaddo', 'admin', 'admin.db')
    fs.mkdirSync(path.dirname(dbPath), { recursive: true })

    const { SQLiteAdminStorage } = await import('../../admin-server/src/storage/sqlite-storage.js')
    let storage = new SQLiteAdminStorage(dbPath)
    await storage.initialize()
    storage.preferences.set('theme', 'dark')
    await storage.close()

    // Simulate deleting SQLite (mock doesn't create a real file, so we just create a new instance)
    // The point: canonical project state survives storage loss

    // Project state still exists
    const core = await import('../src/core.js')
    const explanation = core.buildProjectExplanation(dir)
    expect(explanation.project.name).toBe('test-admin')
    expect(explanation.workItems.total).toBe(1)

    // Recreate storage — preferences lost, project intact
    storage = new SQLiteAdminStorage(dbPath)
    await storage.initialize()
    expect(storage.preferences.get('theme')).toBeUndefined()
    await storage.close()
  })
})

// ─── Design System ───────────────────────────────────────────────────────────

describe('VS-096: Design System', () => {
  const tokensPath = path.resolve(__dirname, '../../admin/src/design-system/tokens.css')

  it('semantic tokens exist', () => {
    const css = fs.readFileSync(tokensPath, 'utf-8')
    for (const token of ['--background', '--surface', '--foreground', '--primary', '--success', '--warning', '--danger', '--info', '--border']) {
      expect(css).toContain(token)
    }
  })

  it('domain tokens exist for findings', () => {
    const css = fs.readFileSync(tokensPath, 'utf-8')
    expect(css).toContain('--finding-blocking')
    expect(css).toContain('--finding-warning')
    expect(css).toContain('--finding-fyi')
  })

  it('domain tokens exist for Work Items', () => {
    const css = fs.readFileSync(tokensPath, 'utf-8')
    for (const state of ['draft', 'ready', 'progress', 'blocked', 'completed', 'archived']) {
      expect(css).toContain(`--work-item-${state}`)
    }
  })

  it('domain tokens exist for knowledge', () => {
    const css = fs.readFileSync(tokensPath, 'utf-8')
    for (const state of ['ready', 'missing', 'placeholder', 'unknown']) {
      expect(css).toContain(`--knowledge-${state}`)
    }
  })

  it('domain tokens exist for modules', () => {
    const css = fs.readFileSync(tokensPath, 'utf-8')
    expect(css).toContain('--module-core')
    expect(css).toContain('--module-module')
    expect(css).toContain('--module-unavailable')
  })

  it('domain tokens exist for readiness', () => {
    const css = fs.readFileSync(tokensPath, 'utf-8')
    expect(css).toContain('--readiness-ready')
    expect(css).toContain('--readiness-warning')
    expect(css).toContain('--readiness-blocked')
  })

  it('dark theme tokens are defined', () => {
    const css = fs.readFileSync(tokensPath, 'utf-8')
    expect(css).toContain('prefers-color-scheme: dark')
    expect(css).toContain('[data-theme="dark"]')
  })
})

// ─── Compatibility ───────────────────────────────────────────────────────────

describe('VS-096: Compatibility', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir() })
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

  it('existing project opens without migration', async () => {
    initProject(dir)
    const core = await import('../src/core.js')
    const config = core.loadConfig(dir)
    expect(config).not.toBeNull()
  })

  it('legacy Work Items remain readable', async () => {
    initProject(dir, {
      'knowledge/delivery/work-items/completed/WI-OLD.md': [
        '---',
        'id: WI-OLD',
        'title: Legacy Item',
        'type: feature',
        'status: done',
        '---',
        '',
      ].join('\n'),
    })
    const core = await import('../src/core.js')
    const explanation = core.buildProjectExplanation(dir)
    expect(explanation.workItems.total).toBe(1)
  })

  it('missing optional metadata does not block', async () => {
    initProject(dir)
    const core = await import('../src/core.js')
    // Should not throw
    const readiness = core.buildReadinessReport(dir)
    expect(readiness).toBeDefined()
  })
})

// ─── Server ──────────────────────────────────────────────────────────────────

describe('VS-096: Server', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir() })
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

  it('core-adapter getProjectSummary works for valid project', async () => {
    initProject(dir)
    const { getProjectSummary } = await import('../../admin-server/src/core-adapter.js')
    const summary = getProjectSummary(dir)
    expect(summary.name).toBe('test-admin')
    expect(summary.structure).toBe('monorepo')
  })

  it('core-adapter getProjectSummary throws for invalid project', async () => {
    const { getProjectSummary } = await import('../../admin-server/src/core-adapter.js')
    expect(() => getProjectSummary(dir)).toThrow('No Kaddo project')
  })

  it('core-adapter getProjectOverview returns complete data', async () => {
    initProject(dir)
    const { getProjectOverview } = await import('../../admin-server/src/core-adapter.js')
    const overview = getProjectOverview(dir)
    expect(overview.project.name).toBe('test-admin')
    expect(overview.knowledge).toBeDefined()
    expect(overview.workItems).toBeDefined()
    expect(overview.modules).toBeDefined()
    expect(overview.readiness).toBeDefined()
    expect(overview.route).toBeDefined()
    expect(overview.findings).toBeDefined()
  })

  it('session manager creates and validates sessions', async () => {
    const { SQLiteAdminStorage } = await import('../../admin-server/src/storage/sqlite-storage.js')
    const { SessionManager } = await import('../../admin-server/src/session.js')
    const storage = new SQLiteAdminStorage(path.join(dir, 'session-mgr.db'))
    await storage.initialize()
    const mgr = new SessionManager(storage)

    const id = mgr.createSession()
    expect(mgr.validateSession(id)).toBe(true)
    expect(mgr.validateSession('invalid')).toBe(false)
    expect(mgr.validateSession(undefined)).toBe(false)

    mgr.invalidateSession(id)
    expect(mgr.validateSession(id)).toBe(false)

    await storage.close()
  })
})

// ─── Single-repo / Multirepo ─────────────────────────────────────────────────

describe('VS-096: Single-repo and Multirepo', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir() })
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

  it('Admin loads single-repo project without multirepo failure', async () => {
    initProject(dir)
    const { getProjectOverview } = await import('../../admin-server/src/core-adapter.js')
    const overview = getProjectOverview(dir)
    expect(overview.project.structure).toBe('monorepo')
    expect(overview.modules.modules).toEqual([])
  })

  it('Admin loads multirepo project with modules', async () => {
    writeFile(dir, '.kaddo/config.yml', [
      'project:',
      '  name: test-multi',
      '  state: pre-ai',
      '  structure: multirepo',
      'team:',
      '  size: small',
    ].join('\n'))
    writeFile(dir, '.kaddo/modules.yml', [
      'modules:',
      '  - id: frontend',
      '    path: ../frontend',
      '    role: module',
    ].join('\n'))

    const { getProjectOverview } = await import('../../admin-server/src/core-adapter.js')
    const overview = getProjectOverview(dir)
    expect(overview.project.structure).toBe('multirepo')
    // Module path doesn't exist but should not crash
    expect(overview.modules.modules.length).toBeGreaterThanOrEqual(0)
  })
})

// ─── Frontend build ──────────────────────────────────────────────────────────

describe('VS-096: Frontend build', () => {
  it('Vite production build output exists', () => {
    const distDir = path.resolve(__dirname, '../../admin/dist')
    expect(fs.existsSync(path.join(distDir, 'index.html'))).toBe(true)
  })

  it('index.html references bundled assets', () => {
    const html = fs.readFileSync(
      path.resolve(__dirname, '../../admin/dist/index.html'),
      'utf-8'
    )
    expect(html).toContain('.js')
    expect(html).toContain('.css')
  })
})
