import { describe, it, expect, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { generateSavingsReport } from '../src/generate.js'
import { RESOURCES } from '../src/resources.js'
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
    '---\nid: WI-1\ntype: feature\ntitle: A\nstatus: completed\nknowledge_level: K2\nsource: roadmap\nsource_id: C1\ninitiative: cli\ncode:\n  - src/cli/program.ts\n---\n# x\n\n## Acceptance Criteria\n- a\n'
  )
}

describe('MCP savings report (VS-062)', () => {
  it('AC31: kaddo://savings-report builds the report in memory when none is saved', () => {
    project()
    const res = RESOURCES.find((r) => r.uri === 'kaddo://savings-report')!
    const out = res.read(root)[0].text
    expect(out).toContain('# Kaddo Estimated Savings Report')
    expect(out).toContain('## Disclaimer')
  })

  it('AC32/AC33: kaddo_generate_savings_report writes only under .kaddo/reports/, default scope all', () => {
    project()
    const r = generateSavingsReport(root, { format: 'markdown' })
    expect(r.files_written[0]).toBe('.kaddo/reports/savings-report.md')
    expect(fs.readFileSync(path.join(root, '.kaddo/reports/savings-report.md'), 'utf-8')).toContain('Estimated Savings Report')

    const j = generateSavingsReport(root, { format: 'json' })
    expect(j.files_written[0]).toBe('.kaddo/reports/savings-report.json')
    const json = JSON.parse(fs.readFileSync(path.join(root, '.kaddo/reports/savings-report.json'), 'utf-8'))
    expect(json.scope).toBe('all')
    expect(json).toHaveProperty('total.estimated_value')
  })

  it('a saved savings report is returned as-is by the resource', () => {
    project()
    write(root, '.kaddo/reports/savings-report.md', '# Saved savings\n\nstatic')
    const res = RESOURCES.find((r) => r.uri === 'kaddo://savings-report')!
    expect(res.read(root)[0].text).toContain('# Saved savings')
  })
})
