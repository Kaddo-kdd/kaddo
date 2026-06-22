import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { runDrift } from '../src/commands/drift.js'
import { recordGuardRun } from '../src/core/guard-history.js'

let tmp: string
let logSpy: ReturnType<typeof vi.spyOn>
const output = () => logSpy.mock.calls.map((c) => c.join(' ')).join('\n')

function config() {
  fs.mkdirSync(path.join(tmp, '.kaddo'), { recursive: true })
  fs.writeFileSync(path.join(tmp, '.kaddo/config.yml'), 'version: 1\nproject:\n  name: todoApp\n  state: pre-ai\n  structure: monorepo\n  language: en\nteam:\n  size: small\n')
}
function record() {
  recordGuardRun(tmp, {
    project: 'todoApp', scope: 's', touched_files: ['src/cli/program.ts'],
    matched_artifacts: ['WI-1'], updated_artifacts: [],
    warnings: [{ type: 'possible-knowledge-drift', code_path: 'src/cli/program.ts', related_artifacts: ['WI-1'], updated_artifacts: [], status: 'open' }],
  })
}

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-drift-cmd-'))
  config()
  vi.spyOn(process, 'cwd').mockReturnValue(tmp)
  logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
})
afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }); vi.restoreAllMocks() })

describe('kaddo drift command (VS-063)', () => {
  it('AC9/AC16: prints a clear report with no history, writes nothing', () => {
    runDrift({})
    expect(output()).toContain('No guard history recorded yet.')
    expect(fs.existsSync(path.join(tmp, '.kaddo/reports'))).toBe(false)
  })

  it('AC9/AC42: prints Markdown with history', () => {
    record()
    runDrift({})
    expect(output()).toContain('# Kaddo Drift Trend Report')
    expect(output()).toContain('Drift warnings detected: 1')
  })

  it('AC10/AC43: --json prints JSON', () => {
    record()
    runDrift({ json: true })
    const parsed = JSON.parse(output())
    expect(parsed.project).toBe('todoApp')
    expect(parsed).toHaveProperty('drift_warnings.resolution_rate')
  })

  it('AC11/AC44: --output writes Markdown to .kaddo/reports/', () => {
    record()
    runDrift({ output: '.kaddo/reports/drift-report.md' })
    expect(fs.readFileSync(path.join(tmp, '.kaddo/reports/drift-report.md'), 'utf-8')).toContain('Drift Trend Report')
  })
})
