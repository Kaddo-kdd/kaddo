import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { scan } from '../src/services/scanner.js'
import {
  buildBaseline,
  serializeBaseline,
  readProjectContext,
  SCAN_BASELINE_VERSION,
} from '../src/core/scan-baseline.js'
import { renderInventory } from '../src/templates/inventory-template.js'

let tmpDir: string

function touch(rel: string, content = '') {
  const full = path.join(tmpDir, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content)
}
function mkdir(rel: string) {
  fs.mkdirSync(path.join(tmpDir, rel), { recursive: true })
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-baseline-'))
})
afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

const FIXED_DATE = new Date('2026-01-01T00:00:00.000Z')

describe('scan-baseline — buildBaseline', () => {
  it('produces a stable, versioned baseline for a full project', () => {
    touch('tsconfig.json', '{}')
    touch('package.json', '{"dependencies":{"next":"14.0.0"}}')
    touch('pnpm-lock.yaml', '')
    mkdir('src/payments')
    mkdir('src/auth')
    mkdir('supabase/migrations')
    mkdir('tests')
    touch('docker-compose.yml', '')

    const result = scan(tmpDir)
    const baseline = buildBaseline(result, { state: 'pre-ai', structure: 'monorepo', teamSize: 'small' }, FIXED_DATE)

    expect(baseline.version).toBe(SCAN_BASELINE_VERSION)
    expect(baseline.generatedAt).toBe('2026-01-01T00:00:00.000Z')
    expect(baseline.project).toEqual({ state: 'pre-ai', structure: 'monorepo', teamSize: 'small' })
    expect(baseline.detected.languages).toEqual(['typescript'])
    expect(baseline.detected.frameworks).toEqual(['next'])
    expect(baseline.detected.packageManagers).toEqual(['pnpm'])
    expect(baseline.detected.sourceDirectories).toContain('src')
    expect(baseline.detected.migrationDirectories).toContain('supabase/migrations')
    expect(baseline.detected.testDirectories).toContain('tests')
    expect(baseline.detected.infrastructureFiles).toContain('docker-compose.yml')
    expect(baseline.suggestions.possibleDomains).toEqual(expect.arrayContaining(['payments', 'auth']))
  })

  it('drops unknown/none noise values from detected arrays', () => {
    const result = scan(tmpDir) // empty dir → unknown everything
    const baseline = buildBaseline(result, { state: 'unknown', structure: 'unknown', teamSize: 'unknown' }, FIXED_DATE)

    expect(baseline.detected.languages).toEqual([])
    expect(baseline.detected.frameworks).toEqual([])
    expect(baseline.detected.packageManagers).toEqual([])
    expect(baseline.detected.sourceDirectories).toEqual([])
  })

  it('emits an open question when no test directory exists', () => {
    touch('package.json', '{}')
    const result = scan(tmpDir)
    const baseline = buildBaseline(result, { state: 'unknown', structure: 'unknown', teamSize: 'unknown' }, FIXED_DATE)
    expect(baseline.suggestions.openQuestions.some((q) => q.includes('test'))).toBe(true)
  })

  it('adds a legacy-specific open question for legacy projects', () => {
    const result = scan(tmpDir)
    const baseline = buildBaseline(result, { state: 'legacy', structure: 'unknown', teamSize: 'unknown' }, FIXED_DATE)
    expect(baseline.suggestions.openQuestions.some((q) => q.toLowerCase().includes('legacy'))).toBe(true)
  })
})

describe('scan-baseline — serializeBaseline', () => {
  it('produces valid, parseable JSON ending in a newline', () => {
    const result = scan(tmpDir)
    const baseline = buildBaseline(result, { state: 'new', structure: 'monorepo', teamSize: 'indie' }, FIXED_DATE)
    const json = serializeBaseline(baseline)
    expect(json.endsWith('\n')).toBe(true)
    expect(JSON.parse(json)).toEqual(baseline)
  })
})

describe('scan-baseline — readProjectContext', () => {
  it('returns unknown defaults when config is missing', () => {
    expect(readProjectContext(tmpDir)).toEqual({ state: 'unknown', structure: 'unknown', teamSize: 'unknown' })
  })

  it('reads state/structure/teamSize from .kaddo/config.yml', () => {
    touch(
      '.kaddo/config.yml',
      ['version: 1', 'project:', '  state: legacy', '  structure: multirepo', 'team:', '  size: enterprise'].join('\n')
    )
    expect(readProjectContext(tmpDir)).toEqual({ state: 'legacy', structure: 'multirepo', teamSize: 'enterprise' })
  })
})

describe('inventory-template — renderInventory', () => {
  it('renders a readable markdown inventory with all sections', () => {
    touch('tsconfig.json', '{}')
    touch('pnpm-lock.yaml', '')
    mkdir('src/payments')
    const result = scan(tmpDir)
    const baseline = buildBaseline(result, { state: 'pre-ai', structure: 'monorepo', teamSize: 'small' }, FIXED_DATE)
    const md = renderInventory(baseline)

    expect(md).toContain('# Project Inventory')
    expect(md).toContain('## Project Context')
    expect(md).toContain('## Detected Stack')
    expect(md).toContain('## Possible Domains')
    expect(md).toContain('## Open Questions')
    expect(md).toContain('Language: typescript')
    expect(md).toContain('- payments')
  })
})
