import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import {
  getConsolidationPlanAdmin,
  generateConsolidationPlanAdmin,
  exportConsolidationAdmin,
  CoreError,
} from '../src/core-adapter.js'
import { ConsolidationGenerateSchema } from '../src/contracts/schemas.js'

function tmpProject(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-consol-'))
  const cfg = ['project:', '  name: t', '  state: new', '  structure: monorepo', '  language: en', 'team:', '  size: small'].join('\n')
  fs.mkdirSync(path.join(dir, '.kaddo'), { recursive: true })
  fs.writeFileSync(path.join(dir, '.kaddo/config.yml'), cfg, 'utf-8')
  // A completed Work Item with a durable-rule learning → one unincorporated_learning opportunity.
  const wiDir = path.join(dir, 'knowledge/delivery/work-items/completed')
  fs.mkdirSync(wiDir, { recursive: true })
  fs.writeFileSync(
    path.join(wiDir, 'WI-001.md'),
    '---\nid: WI-001\ntype: feature\ntitle: Rule\nstatus: completed\n---\n# Rule\n\n## Learning\n\nThe importer must always validate the schema before writing.\n',
    'utf-8'
  )
  return dir
}

let dir: string
beforeEach(() => { dir = tmpProject() })
afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

function knowledgeSnapshot(d: string): Record<string, string> {
  const root = path.join(d, 'knowledge')
  const out: Record<string, string> = {}
  const walk = (p: string) => {
    for (const e of fs.readdirSync(p)) {
      const full = path.join(p, e)
      if (fs.statSync(full).isDirectory()) walk(full)
      else out[path.relative(root, full)] = fs.readFileSync(full, 'utf-8')
    }
  }
  walk(root)
  return out
}

describe('admin-server — Knowledge Consolidation Explorer (WI-073)', () => {
  it('VS-02: reports not-generated when no plan exists, without recomputing', () => {
    const res = getConsolidationPlanAdmin(dir)
    expect(res.availability).toBe('not-generated')
    expect(res.plan).toBeNull()
    expect(fs.existsSync(path.join(dir, '.kaddo/consolidation-plan.json'))).toBe(false)
  })

  it('VS-03/AC-08/AC-09: generate persists both projections and never writes knowledge/', () => {
    const before = knowledgeSnapshot(dir)
    const res = generateConsolidationPlanAdmin(dir, { kind: 'all' })
    expect(res.availability).toBe('current')
    expect(res.plan).not.toBeNull()
    expect(fs.existsSync(path.join(dir, '.kaddo/consolidation-plan.json'))).toBe(true)
    expect(fs.existsSync(path.join(dir, '.kaddo/consolidation-plan.md'))).toBe(true)
    expect(res.plan!.opportunities.some((o) => o.category === 'unincorporated_learning')).toBe(true)
    // knowledge/ is byte-for-byte unchanged (AC-19).
    expect(knowledgeSnapshot(dir)).toEqual(before)
  })

  it('AC-03: reads a previously generated plan without recomputing', () => {
    generateConsolidationPlanAdmin(dir, { kind: 'all' })
    const mtime = fs.statSync(path.join(dir, '.kaddo/consolidation-plan.json')).mtimeMs
    const res = getConsolidationPlanAdmin(dir)
    expect(res.availability).toBe('current')
    expect(res.plan).not.toBeNull()
    // Reading did not rewrite the file.
    expect(fs.statSync(path.join(dir, '.kaddo/consolidation-plan.json')).mtimeMs).toBe(mtime)
  })

  it('AC-10/VS-04: a changed source makes the plan stale and lists the affected source', () => {
    generateConsolidationPlanAdmin(dir, { kind: 'all' })
    fs.writeFileSync(
      path.join(dir, 'knowledge/delivery/work-items/completed/WI-001.md'),
      '---\nid: WI-001\ntype: feature\ntitle: Rule\nstatus: completed\n---\n# Rule\n\n## Learning\n\nThe importer must always validate the schema before writing, and must reject unknown fields.\n',
      'utf-8'
    )
    const res = getConsolidationPlanAdmin(dir)
    expect(res.availability).toBe('stale')
    expect(res.staleness!.stale).toBe(true)
    expect(res.staleness!.changed).toContain('knowledge/delivery/work-items/completed/WI-001.md')
  })

  it('AC-15: a corrupt persisted plan is reported as unavailable, not crashing', () => {
    fs.mkdirSync(path.join(dir, '.kaddo'), { recursive: true })
    fs.writeFileSync(path.join(dir, '.kaddo/consolidation-plan.json'), '{ not valid json', 'utf-8')
    const res = getConsolidationPlanAdmin(dir)
    expect(res.availability).toBe('unavailable')
    expect(res.plan).toBeNull()
    expect(res.reason).toBeTruthy()
  })

  it('AC-11/VS-08: export returns the persisted snapshot and never recomputes', () => {
    generateConsolidationPlanAdmin(dir, { kind: 'all' })
    const json = exportConsolidationAdmin(dir, 'json')
    const md = exportConsolidationAdmin(dir, 'markdown')
    expect(json).toBe(fs.readFileSync(path.join(dir, '.kaddo/consolidation-plan.json'), 'utf-8'))
    expect(md).toBe(fs.readFileSync(path.join(dir, '.kaddo/consolidation-plan.md'), 'utf-8'))
    expect(JSON.parse(json).generated_at).toBe(getConsolidationPlanAdmin(dir).plan!.generated_at)
  })

  it('export before generation throws a recoverable CoreError', () => {
    expect(() => exportConsolidationAdmin(dir, 'json')).toThrow(CoreError)
  })

  it('VS-09: the scope schema rejects invalid input and accepts valid scopes', () => {
    expect(ConsolidationGenerateSchema.safeParse({ scope: { kind: 'all' } }).success).toBe(true)
    expect(ConsolidationGenerateSchema.safeParse({ scope: { kind: 'layer', layer: 'Tech' } }).success).toBe(true)
    expect(ConsolidationGenerateSchema.safeParse({ scope: { kind: 'layer', layer: 'Nope' } }).success).toBe(false)
    expect(ConsolidationGenerateSchema.safeParse({ scope: { kind: 'module', module: '../etc/passwd' } }).success).toBe(false)
    expect(ConsolidationGenerateSchema.safeParse({ scope: { kind: 'evil' } }).success).toBe(false)
  })

  it('VS-09: a failed generation does not overwrite a valid existing plan', () => {
    const ok = generateConsolidationPlanAdmin(dir, { kind: 'all' })
    const good = fs.readFileSync(path.join(dir, '.kaddo/consolidation-plan.json'), 'utf-8')
    // Point the project at a non-existent dir to force a build failure without touching the good plan.
    expect(() => generateConsolidationPlanAdmin(path.join(dir, 'does-not-exist'), { kind: 'all' })).toThrow(CoreError)
    expect(fs.readFileSync(path.join(dir, '.kaddo/consolidation-plan.json'), 'utf-8')).toBe(good)
    expect(ok.plan).not.toBeNull()
  })
})
