import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { bootstrap } from '../src/commands/bootstrap.js'
import { loadConfig, projectMode, setProjectMode } from '../src/core/config.js'
import { ensurePocArtifact, readPocSummary } from '../src/core/poc.js'
import { resolveNextStep } from '../src/core/next-step.js'
import { buildProjectRoute } from '../src/core/project-route.js'
import { buildContextPack } from '../src/core/context-pack.js'
import { renderContextPack } from '../src/templates/context-pack-template.js'

let dir: string

function config(mode?: 'standard' | 'poc') {
  fs.mkdirSync(path.join(dir, '.kaddo'), { recursive: true })
  fs.writeFileSync(path.join(dir, '.kaddo', 'config.yml'), [
    'version: 1', 'project:', '  name: demo', '  state: pre-ai',
    ...(mode ? [`  mode: ${mode}`] : []), '  structure: monorepo', 'team:', '  size: indie', '',
  ].join('\n'))
}

beforeEach(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-poc-')) })
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }))

describe('Project Mode POC', () => {
  it('keeps existing configurations in standard mode and persists a mode change', () => {
    config()
    expect(projectMode(loadConfig(dir)!)).toBe('standard')
    setProjectMode(dir, 'poc')
    expect(projectMode(loadConfig(dir)!)).toBe('poc')
  })

  it('keeps bootstrap isolated from POC mode', () => {
    config('poc')
    ensurePocArtifact(dir, 'demo')
    const result = bootstrap(dir)
    expect(result.mode).toBe('poc')
    expect(result.written).toEqual([])
    expect(fs.existsSync(path.join(dir, 'knowledge/business/business.md'))).toBe(false)
    expect(fs.existsSync(path.join(dir, 'knowledge/product/product.md'))).toBe(false)
    expect(fs.existsSync(path.join(dir, 'knowledge/tech/codebase.md'))).toBe(false)
    expect(fs.existsSync(path.join(dir, 'knowledge/product/capabilities.md'))).toBe(false)
    expect(fs.existsSync(path.join(dir, 'knowledge/delivery/roadmap.md'))).toBe(false)
    expect(fs.readFileSync(path.join(dir, 'knowledge/delivery/poc.md'), 'utf8')).toContain('## Conclusion')
  })

  it('creates a complete POC artifact when an existing project switches mode', () => {
    config()
    setProjectMode(dir, 'poc')
    expect(ensurePocArtifact(dir, loadConfig(dir)!.project.name)).toBe(true)
    expect(ensurePocArtifact(dir, loadConfig(dir)!.project.name)).toBe(false)
    const poc = fs.readFileSync(path.join(dir, 'knowledge/delivery/poc.md'), 'utf8')
    expect(poc).toContain('## Problem')
    expect(poc).toContain('## Expected Value')
    expect(poc).toContain('## Scenario')
  })

  it('routes a POC from hypothesis to success criteria and exposes it in context', () => {
    config('poc')
    ensurePocArtifact(dir, 'demo')
    expect(resolveNextStep(dir).id).toBe('poc-hypothesis')
    const poc = path.join(dir, 'knowledge/delivery/poc.md')
    fs.writeFileSync(poc, `# Proof of Concept\n\n## Hypothesis\n\nA real team can validate a useful assumption through a bounded experiment.\n\n## Success Criteria\n\n- [ ] The experiment produces an observable result.\n\n## Constraints\n\nThe experiment must run within one day.\n\n## Non-goals\n\nIt does not deliver a production feature.\n\n## Evidence\n\nPending experiment execution.\n\n## Conclusion\n\nStatus: pending\n`)
    expect(readPocSummary(dir).successCriteriaCount).toBe(1)
    expect(resolveNextStep(dir).id).toBe('poc-create-experiment')
    const route = buildProjectRoute(dir)
    expect(route.steps.map((step) => step.id)).toContain('poc-evaluate')
    const pack = buildContextPack(dir, loadConfig(dir)!)
    expect(pack.project.mode).toBe('poc')
    expect(renderContextPack(pack)).toContain('## Proof of Concept')
    expect(renderContextPack(pack)).not.toContain('## Roadmap Status')
  })

  it('accepts only evidence-backed conclusion states from the POC artifact', () => {
    config('poc')
    fs.mkdirSync(path.join(dir, 'knowledge/delivery'), { recursive: true })
    fs.writeFileSync(path.join(dir, 'knowledge/delivery/poc.md'), '# Proof of Concept\n\n## Conclusion\n\nStatus: validated\n')
    expect(readPocSummary(dir).conclusion).toBe('validated')
  })

  it('keeps the standard bootstrap baseline unchanged', () => {
    config('standard')
    bootstrap(dir)
    expect(fs.existsSync(path.join(dir, 'knowledge/business/business.md'))).toBe(true)
    expect(fs.existsSync(path.join(dir, 'knowledge/product/product.md'))).toBe(true)
    expect(fs.existsSync(path.join(dir, 'knowledge/delivery/roadmap.md'))).toBe(true)
  })
})
