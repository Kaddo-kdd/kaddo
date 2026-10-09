import { describe, it, expect, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { buildPocReportContext, persistPocReport } from '../src/core/poc-report.js'

const dirs: string[] = []
function fixture(conclusion = 'validated') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-poc-report-')); dirs.push(dir)
  fs.mkdirSync(path.join(dir, 'knowledge/delivery/work-items/completed'), { recursive: true })
  fs.writeFileSync(path.join(dir, 'knowledge/delivery/poc.md'), `# Proof of Concept\n\n## Evidence\n\nWI-001\n\n## Conclusion\n\nStatus: ${conclusion}\n`)
  fs.writeFileSync(path.join(dir, 'knowledge/delivery/work-items/completed/WI-001.md'), '---\ntype: spike\nid: WI-001\nstatus: completed\nresources:\n  - id: RES-test\n    role: validation\n---\n# Experiment\n\n## Evidence\n\nAPI_KEY=do-not-leak\n')
  return dir
}
afterEach(() => dirs.splice(0).forEach((dir) => fs.rmSync(dir, { recursive: true, force: true })))

describe('POC final reports', () => {
  it('requires a concluded POC', () => {
    const context = buildPocReportContext(fixture('pending'))
    expect(context.eligible).toBe(false)
    expect(context.handoff).toMatch(/pending/)
  })
  it('builds bounded, redacted context and persists immutable versions after confirmation', () => {
    const dir = fixture()
    const context = buildPocReportContext(dir)
    expect(context.status).toBe('missing')
    expect(context.sources.map((source) => source.path)).toContain('knowledge/delivery/work-items/completed/WI-001.md')
    expect(context.sources.find((source) => source.kind === 'work-item')?.content).not.toContain('do-not-leak')
    expect(context.handoff).toContain('Markdown tables for structured comparisons')
    expect(context.handoff).toContain('Mermaid for grounded architecture')
    expect(context.handoff).toContain('Do not use ASCII diagrams')
    expect(context.handoff).toContain('repository-relative Markdown links')
    expect(context.handoff).toContain('file:///')
    const preview = persistPocReport(dir, '# POC Final Report\n\n## Conclusion\n\nValidated.', {})
    expect(preview.status).toBe('needs_confirmation')
    expect(fs.existsSync(path.join(dir, preview.path))).toBe(false)
    const saved = persistPocReport(dir, '# POC Final Report\n\n## Conclusion\n\nValidated.', { confirm: true })
    expect(saved.status).toBe('persisted')
    expect(saved.path).toBe('knowledge/delivery/poc-report-v001.md')
    expect(buildPocReportContext(dir).status).toBe('current')
  })
  it('marks a report stale and creates a later version only by explicit confirmation', () => {
    const dir = fixture()
    persistPocReport(dir, '# POC Final Report', { confirm: true })
    fs.appendFileSync(path.join(dir, 'knowledge/delivery/poc.md'), '\nMore evidence.\n')
    expect(buildPocReportContext(dir).status).toBe('stale')
    expect(persistPocReport(dir, '# POC Final Report').status).toBe('needs_confirmation')
    expect(persistPocReport(dir, '# POC Final Report', { confirm: true }).path).toBe('knowledge/delivery/poc-report-v002.md')
  })
})
