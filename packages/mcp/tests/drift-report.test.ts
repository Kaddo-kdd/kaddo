import { describe, it, expect, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { generateDriftReport } from '../src/generate.js'
import { RESOURCES } from '../src/resources.js'
import { recordGuardRun } from '../../cli/src/core/guard-history.js'
import { makeProject, write, config, cleanup } from './helpers.js'

let root: string
afterEach(() => root && cleanup(root))

function project() {
  root = makeProject()
  config(root, 'todoApp')
}
function record() {
  recordGuardRun(root, {
    project: 'todoApp', scope: 's', touched_files: ['src/cli/program.ts'],
    matched_artifacts: ['WI-1'], updated_artifacts: [],
    warnings: [{ type: 'possible-knowledge-drift', code_path: 'src/cli/program.ts', related_artifacts: ['WI-1'], updated_artifacts: [], status: 'open' }],
  })
}

describe('MCP drift report + guard history (VS-063)', () => {
  it('AC30: kaddo://drift-report builds the report in memory', () => {
    project()
    record()
    const res = RESOURCES.find((r) => r.uri === 'kaddo://drift-report')!
    expect(res.read(root)[0].text).toContain('# Kaddo Drift Trend Report')
  })

  it('AC31: kaddo://guard-history returns recorded runs (or a clear message)', () => {
    project()
    const res = RESOURCES.find((r) => r.uri === 'kaddo://guard-history')!
    expect(res.read(root)[0].text).toContain('No guard history recorded yet.')
    record()
    expect(res.read(root)[0].text).toContain('possible-knowledge-drift')
  })

  it('AC32/AC33/AC44: kaddo_generate_drift_report writes only under .kaddo/reports/', () => {
    project()
    record()
    const r = generateDriftReport(root, { format: 'markdown' })
    expect(r.files_written[0]).toBe('.kaddo/reports/drift-report.md')
    expect(fs.readFileSync(path.join(root, '.kaddo/reports/drift-report.md'), 'utf-8')).toContain('Drift Trend Report')
    const j = generateDriftReport(root, { format: 'json' })
    expect(j.files_written[0]).toBe('.kaddo/reports/drift-report.json')
    expect(JSON.parse(fs.readFileSync(path.join(root, '.kaddo/reports/drift-report.json'), 'utf-8'))).toHaveProperty('drift_warnings')
  })

  it('AC34/AC48: generating the drift report never writes guard history', () => {
    project()
    record()
    const before = fs.readFileSync(path.join(root, '.kaddo/history/guard-runs.jsonl'), 'utf-8')
    generateDriftReport(root, { format: 'markdown' })
    expect(fs.readFileSync(path.join(root, '.kaddo/history/guard-runs.jsonl'), 'utf-8')).toBe(before)
  })
})
