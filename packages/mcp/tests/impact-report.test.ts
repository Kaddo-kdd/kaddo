import { describe, it, expect, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { generateImpactReport } from '../src/generate.js'
import { RESOURCES } from '../src/resources.js'
import { assertMcpDerivedWritePath, KaddoMcpError } from '../src/project.js'
import { makeProject, write, config, cleanup } from './helpers.js'

let root: string
afterEach(() => root && cleanup(root))

function project() {
  root = makeProject()
  config(root, 'todoApp')
  write(root, 'knowledge/business/business.md', '---\ntype: business\n---\n# B\n\nManages tasks.')
  write(
    root,
    'knowledge/delivery/work-items/completed/WI-1.md',
    '---\nid: WI-1\ntype: feature\ntitle: A\nstatus: completed\ncode:\n  - src/cli/**\n---\n# x'
  )
}

describe('MCP impact report (VS-061)', () => {
  it('AC23: kaddo://impact-report builds the report in memory when none is saved', () => {
    project()
    const res = RESOURCES.find((r) => r.uri === 'kaddo://impact-report')!
    const out = res.read(root)[0].text
    expect(out).toContain('# Kaddo Knowledge Impact Report')
    expect(out).toContain('## Impact Signals')
  })

  it('AC15/AC24/AC25: kaddo_generate_impact_report writes only under .kaddo/reports/ and includes actionable gaps', () => {
    project()
    const r = generateImpactReport(root, { format: 'markdown' })
    expect(r.status).toBe('ok')
    expect(r.files_written[0]).toBe('.kaddo/reports/impact-report.md')
    expect(fs.readFileSync(path.join(root, '.kaddo/reports/impact-report.md'), 'utf-8')).toContain('## Actionable Gaps')

    const j = generateImpactReport(root, { format: 'json' })
    expect(j.files_written[0]).toBe('.kaddo/reports/impact-report.json')
    const json = JSON.parse(fs.readFileSync(path.join(root, '.kaddo/reports/impact-report.json'), 'utf-8'))
    expect(json).toHaveProperty('knowledge_health')
    expect(json).toHaveProperty('actionable_gaps.missing_initiative')
  })

  it('VS-061.2 AC12/AC13/AC14: tool defaults to scope all and accepts active', () => {
    project()
    generateImpactReport(root, { format: 'json' }) // default
    const def = JSON.parse(fs.readFileSync(path.join(root, '.kaddo/reports/impact-report.json'), 'utf-8'))
    expect(def.scope).toBe('all')
    expect(def.scope_source).toBe('default')

    generateImpactReport(root, { format: 'json', scope: 'active' })
    const act = JSON.parse(fs.readFileSync(path.join(root, '.kaddo/reports/impact-report.json'), 'utf-8'))
    expect(act.scope).toBe('active')
    expect(act.scope_source).toBe('explicit')
  })

  it('AC25: the reports allowlist blocks writes outside .kaddo/reports/', () => {
    expect(assertMcpDerivedWritePath('.kaddo/reports/impact-report.md')).toBe('.kaddo/reports/impact-report.md')
    expect(() => assertMcpDerivedWritePath('knowledge/reports/x.md')).toThrow(KaddoMcpError)
  })

  it('AC23: a saved report is returned as-is by the resource', () => {
    project()
    write(root, '.kaddo/reports/impact-report.md', '# Saved report\n\nstatic content')
    const res = RESOURCES.find((r) => r.uri === 'kaddo://impact-report')!
    expect(res.read(root)[0].text).toContain('# Saved report')
  })
})
