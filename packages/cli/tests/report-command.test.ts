import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { runReportImpact } from '../src/commands/report.js'

let tmp: string
let logSpy: ReturnType<typeof vi.spyOn>

function write(rel: string, content: string) {
  const full = path.join(tmp, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content)
}
function setup() {
  write('.kaddo/config.yml', 'version: 1\nproject:\n  name: todoApp\n  state: pre-ai\n  structure: monorepo\n  language: en\nteam:\n  size: small\n')
  write('knowledge/business/business.md', '---\ntype: business\n---\n# B\n\nManages tasks.')
  write('knowledge/delivery/work-items/completed/WI-1.md', '---\nid: WI-1\ntype: feature\ntitle: A\nstatus: completed\ncode:\n  - src/cli/**\n---\n# x')
}
function output(): string {
  return logSpy.mock.calls.map((c) => c.join(' ')).join('\n')
}

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-report-cmd-'))
  vi.spyOn(process, 'cwd').mockReturnValue(tmp)
  logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
})
afterEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true })
  vi.restoreAllMocks()
})

describe('kaddo report impact command (VS-061)', () => {
  it('AC2: prints a Markdown report to stdout and writes nothing (AC17)', () => {
    setup()
    runReportImpact({})
    expect(output()).toContain('# Kaddo Knowledge Impact Report')
    expect(fs.existsSync(path.join(tmp, '.kaddo/reports'))).toBe(false)
  })

  it('AC13: --json prints JSON', () => {
    setup()
    runReportImpact({ json: true })
    const parsed = JSON.parse(output())
    expect(parsed.project).toBe('todoApp')
    expect(parsed).toHaveProperty('impact_signals')
  })

  it('AC15/AC31: --output writes a Markdown file', () => {
    setup()
    runReportImpact({ output: '.kaddo/reports/impact-report.md' })
    const written = fs.readFileSync(path.join(tmp, '.kaddo/reports/impact-report.md'), 'utf-8')
    expect(written).toContain('# Kaddo Knowledge Impact Report')
  })

  it('AC16/AC32: --json --output writes a JSON file', () => {
    setup()
    runReportImpact({ json: true, output: '.kaddo/reports/impact-report.json' })
    const written = JSON.parse(fs.readFileSync(path.join(tmp, '.kaddo/reports/impact-report.json'), 'utf-8'))
    expect(written).toHaveProperty('knowledge_health')
  })
})
