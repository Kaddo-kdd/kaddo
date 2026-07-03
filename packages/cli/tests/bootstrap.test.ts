import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { bootstrap } from '../src/commands/bootstrap.js'

let dir: string

function initProject(state = 'new') {
  fs.mkdirSync(path.join(dir, '.kaddo'), { recursive: true })
  fs.writeFileSync(
    path.join(dir, '.kaddo', 'config.yml'),
    `version: 1\nproject:\n  name: demo\n  state: ${state}\n  structure: monorepo\nteam:\n  size: indie\n`
  )
}
function read(rel: string): string {
  return fs.readFileSync(path.join(dir, rel), 'utf8')
}
const BASELINE_FILES = [
  'knowledge/business/business.md',
  'knowledge/product/product.md',
  'knowledge/product/capabilities.md',
  'knowledge/tech/codebase.md',
  'knowledge/tech/current-state.md',
  'knowledge/delivery/roadmap.md',
]

beforeEach(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-bootstrap-')) })
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }))

describe('bootstrap — state-aware knowledge baseline (VS-073)', () => {
  it('AC1/AC9-AC17: new project creates the full baseline + directories', () => {
    initProject('new')
    const res = bootstrap(dir)
    for (const f of BASELINE_FILES) expect(fs.existsSync(path.join(dir, f)), f).toBe(true)
    expect(fs.existsSync(path.join(dir, 'knowledge/tech/decisions'))).toBe(true)
    expect(fs.existsSync(path.join(dir, 'knowledge/delivery/work-items'))).toBe(true)
    expect(res.written).toEqual(expect.arrayContaining(BASELINE_FILES))
    expect(res.createdDirs).toEqual(['knowledge/tech/decisions/', 'knowledge/tech/discovery/', 'knowledge/delivery/work-items/'])
  })

  it('AC2/AC22: pre-ai templates carry project_state and discovery-oriented sections', () => {
    initProject('pre-ai')
    bootstrap(dir)
    const cs = read('knowledge/tech/current-state.md')
    expect(cs).toContain('project_state: pre-ai')
    expect(cs).toContain('Observed technical signals')
    expect(cs).toContain('Risks of interpretation')
    expect(read('knowledge/product/capabilities.md')).toContain('Capability Domains')
    expect(read('knowledge/product/capabilities.md')).toContain('Roadmap Candidate Signals')
  })

  it('AC3/AC23: legacy templates carry project_state and risk-oriented sections', () => {
    initProject('legacy')
    bootstrap(dir)
    const cs = read('knowledge/tech/current-state.md')
    expect(cs).toContain('project_state: legacy')
    expect(cs).toContain('Critical dependencies')
    expect(cs).toContain('Modernization notes')
    expect(read('knowledge/product/capabilities.md')).toContain('Capability Domains')
    expect(read('knowledge/product/capabilities.md')).toContain('Criticality')
    expect(read('knowledge/product/capabilities.md')).toContain('Modernization notes')
  })

  it('AC21: new templates are intent-oriented', () => {
    initProject('new')
    bootstrap(dir)
    expect(read('knowledge/product/product.md')).toContain('Product vision')
    expect(read('knowledge/product/capabilities.md')).toContain('Planned capabilities')
  })

  it('AC18: does not overwrite existing files (skipped)', () => {
    initProject('pre-ai')
    fs.mkdirSync(path.join(dir, 'knowledge/business'), { recursive: true })
    fs.writeFileSync(path.join(dir, 'knowledge/business/business.md'), 'CUSTOM')
    const res = bootstrap(dir)
    expect(read('knowledge/business/business.md')).toBe('CUSTOM')
    expect(res.skipped).toContain('knowledge/business/business.md')
    expect(res.written).toContain('knowledge/product/product.md')
  })

  it('AC19: idempotent — a second run writes nothing new', () => {
    initProject('pre-ai')
    bootstrap(dir)
    const res2 = bootstrap(dir)
    expect(res2.written).toEqual([])
    expect(res2.createdDirs).toEqual([])
    expect(res2.skipped.length).toBeGreaterThan(0)
  })

  it('AC20: keeps an existing knowledge/knowledge.md', () => {
    initProject('pre-ai')
    fs.mkdirSync(path.join(dir, 'knowledge'), { recursive: true })
    fs.writeFileSync(path.join(dir, 'knowledge/knowledge.md'), '# legacy general knowledge')
    bootstrap(dir)
    expect(read('knowledge/knowledge.md')).toBe('# legacy general knowledge')
  })

  it('AC16/AC17: keeps existing roadmap.md and work-items/', () => {
    initProject('pre-ai')
    fs.mkdirSync(path.join(dir, 'knowledge/delivery/work-items'), { recursive: true })
    fs.writeFileSync(path.join(dir, 'knowledge/delivery/roadmap.md'), 'EXISTING ROADMAP')
    const res = bootstrap(dir)
    expect(read('knowledge/delivery/roadmap.md')).toBe('EXISTING ROADMAP')
    expect(res.skipped).toContain('knowledge/delivery/roadmap.md')
    expect(res.skipped).toContain('knowledge/delivery/work-items/')
  })

  it('AC24/AC25/AC31: does not install agents/skills or interpret code', () => {
    initProject('legacy')
    bootstrap(dir)
    expect(fs.existsSync(path.join(dir, 'knowledge/agents'))).toBe(false)
    expect(fs.existsSync(path.join(dir, 'knowledge/skills'))).toBe(false)
  })
})
