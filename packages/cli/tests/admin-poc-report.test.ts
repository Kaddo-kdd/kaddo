import { describe, expect, it, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { persistPocReport } from '../src/core/poc-report.js'
import { getProjectOverview } from '../../admin-server/src/core-adapter.js'

const dirs: string[] = []

function fixture(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-admin-poc-report-'))
  dirs.push(dir)
  fs.mkdirSync(path.join(dir, 'knowledge/delivery/work-items/completed'), { recursive: true })
  fs.mkdirSync(path.join(dir, '.kaddo'), { recursive: true })
  fs.writeFileSync(path.join(dir, '.kaddo/config.yml'), 'project:\n  name: admin-poc\n  state: pre-ai\n  structure: monorepo\n  mode: poc\nteam:\n  size: small\n')
  fs.writeFileSync(path.join(dir, 'knowledge/delivery/poc.md'), '# Proof of Concept\n\n## Evidence\n\nWI-001\n\n## Conclusion\n\nStatus: validated\n')
  fs.writeFileSync(path.join(dir, 'knowledge/delivery/work-items/completed/WI-001.md'), '---\ntype: spike\nid: WI-001\nstatus: completed\n---\n# Experiment\n\nAPI_KEY=do-not-leak\n')
  return dir
}

afterEach(() => dirs.splice(0).forEach((dir) => fs.rmSync(dir, { recursive: true, force: true })))

describe('Admin POC final report projection', () => {
  it('projects missing, current, and stale reports without writing a new version', () => {
    const dir = fixture()
    expect(getProjectOverview(dir).pocReport).toMatchObject({ status: 'missing', reportContent: null })

    persistPocReport(dir, '# Final POC Report\n\n## Conclusion\n\nValidated.', { confirm: true })
    const current = getProjectOverview(dir).pocReport
    expect(current).toMatchObject({ status: 'current', latestReport: { version: 1 } })
    expect(current?.reportContent).toContain('Final POC Report')
    expect(current?.sources.find((source) => source.path.endsWith('WI-001.md'))).toBeDefined()
    expect(JSON.stringify(current)).not.toContain('do-not-leak')

    fs.appendFileSync(path.join(dir, 'knowledge/delivery/poc.md'), '\nNew evidence.\n')
    const stale = getProjectOverview(dir).pocReport
    expect(stale?.status).toBe('stale')
    expect(stale?.changesSinceLatest).toContain('knowledge/delivery/poc.md')
    expect(fs.existsSync(path.join(dir, 'knowledge/delivery/poc-report-v002.md'))).toBe(false)
  })

  it('keeps the overview contract unchanged for standard projects', () => {
    const dir = fixture()
    fs.writeFileSync(path.join(dir, '.kaddo/config.yml'), 'project:\n  name: standard\n  state: pre-ai\n  structure: monorepo\nteam:\n  size: small\n')
    expect(getProjectOverview(dir).pocReport).toBeUndefined()
  })
})
