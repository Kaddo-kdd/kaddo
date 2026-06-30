import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { buildOnboardingReport, renderOnboardingMarkdown } from '../src/core/onboarding.js'
import { runOnboarding, runOnboardingReport } from '../src/commands/onboarding.js'

let tmp: string
function write(rel: string, content: string) {
  const full = path.join(tmp, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content)
}
function config(state = 'pre-ai', name = 'todoApp') {
  write('.kaddo/config.yml', `version: 1\nproject:\n  name: ${name}\n  state: ${state}\n  structure: monorepo\n  language: es\nteam:\n  size: small\n`)
}
const realBody = 'This is a real, sufficiently long body describing the project state in detail.'

// Advance a pre-ai project to the point just before knowledge files (scan + understand present).
function scannedUnderstood() {
  config()
  write('.kaddo/scan.json', '{}')
  write('.kaddo/understand.md', '# understand\n')
}
function completeKnowledge() {
  for (const f of ['knowledge/tech/current-state.md', 'knowledge/tech/codebase.md', 'knowledge/product/capabilities.md', 'knowledge/product/product.md', 'knowledge/business/business.md']) {
    write(f, `---\ntype: x\n---\n# Title\n\n${realBody}\n`)
  }
}

beforeEach(() => { tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-onb-')) })
afterEach(() => fs.rmSync(tmp, { recursive: true, force: true }))

describe('Onboarding report — states (VS-072)', () => {
  it('AC10: not-initialized when no Kaddo config', () => {
    const r = buildOnboardingReport(tmp)
    expect(r.status).toBe('not-initialized')
    expect(r.recommended_next_step.command).toBe('kaddo init')
  })

  it('AC7/AC12: reads project_type; new → not-applicable', () => {
    config('new')
    const r = buildOnboardingReport(tmp)
    expect(r.project_type).toBe('new')
    expect(r.status).toBe('not-applicable')
  })

  it('AC13: legacy → legacy-project', () => {
    config('legacy')
    expect(buildOnboardingReport(tmp).status).toBe('legacy-project')
  })

  it('AC14: pre-ai with no scan → initialized', () => {
    config()
    const r = buildOnboardingReport(tmp)
    expect(r.status).toBe('initialized')
    expect(r.signals.scan).toBe('missing')
    expect(r.recommended_next_step.command).toBe('kaddo scan')
  })

  it('AC15/AC16: scan present, understand missing → scanned', () => {
    config()
    write('.kaddo/scan.json', '{}')
    const r = buildOnboardingReport(tmp)
    expect(r.status).toBe('scanned')
    expect(r.signals.scan).toBe('available')
    expect(r.recommended_next_step.command).toBe('kaddo understand')
  })

  it('AC17/AC18/AC19: understand present, knowledge missing/weak → knowledge-incomplete (prioritized)', () => {
    scannedUnderstood()
    let r = buildOnboardingReport(tmp)
    expect(r.status).toBe('knowledge-incomplete')
    expect(r.recommended_next_step.label).toContain('current-state.md')
    // A weak file (only a heading) still counts as incomplete and stays the priority.
    write('knowledge/tech/current-state.md', '---\ntype: x\n---\n# Only a heading\n')
    r = buildOnboardingReport(tmp)
    expect(r.signals.current_state).toBe('weak')
    expect(r.recommended_next_step.label).toContain('current-state.md')
    // Once current-state has a real body, the next missing file (codebase) becomes the priority.
    write('knowledge/tech/current-state.md', `---\ntype: x\n---\n# Title\n\n${realBody}\n`)
    r = buildOnboardingReport(tmp)
    expect(r.recommended_next_step.label).toContain('codebase.md')
  })

  it('AC20: blocking open question → needs-decisions', () => {
    scannedUnderstood()
    completeKnowledge()
    write('knowledge/delivery/roadmap.md', '---\ntype: roadmap\n---\n# R\n\n## Open Questions\n\n- Which architecture for the MVP?\n')
    const r = buildOnboardingReport(tmp)
    expect(r.status).toBe('needs-decisions')
    expect(r.signals.blocking_open_questions).toBe(1)
  })

  it('AC21-23: assumed/resolved/deferred do not block → ready-for-roadmap', () => {
    scannedUnderstood()
    completeKnowledge()
    write('knowledge/delivery/roadmap.md', '---\ntype: roadmap\n---\n# R\n\n## Open Questions\n\n- [assumed] MVP architecture assumed as a backend API.\n')
    const r = buildOnboardingReport(tmp)
    expect(r.status).toBe('ready-for-roadmap')
    expect(r.signals.assumed_questions).toBe(1)
    expect(r.recommended_next_step.command).toBe('kaddo roadmap')
  })

  it('AC24/AC25/AC26: roadmap candidates, no ready WI → ready-for-work-item', () => {
    scannedUnderstood()
    completeKnowledge()
    write('knowledge/delivery/roadmap.md', '---\ntype: roadmap\n---\n# Roadmap\n\n## Candidates\n\n- First capability to build\n- Second capability\n')
    const r = buildOnboardingReport(tmp)
    expect(r.signals.roadmap).toBe('has-candidates')
    expect(r.signals.work_items).toBe('none')
    expect(r.status).toBe('ready-for-work-item')
    expect(r.recommended_next_step.command).toBe('kaddo create --from roadmap')
  })

  it('AC27/AC28: ready Work Item + adapter installed → ready-for-implementation', () => {
    scannedUnderstood()
    completeKnowledge()
    write('knowledge/delivery/roadmap.md', '---\ntype: roadmap\n---\n# Roadmap\n\n- Candidate\n')
    write('knowledge/delivery/work-items/ready/wi-001-login.md', '---\ntype: feature\nid: WI-001\ntitle: Login\nstatus: ready\n---\n# Login\n')
    write('AGENTS.md', '<!-- Generated by `kaddo adapters install kiro`. -->\n# AGENTS.md\n')
    const r = buildOnboardingReport(tmp)
    expect(r.signals.work_items).toBe('ready')
    expect(r.signals.adapters).toContain('kiro')
    expect(r.status).toBe('ready-for-implementation')
  })
})

describe('Onboarding command (VS-072)', () => {
  let logSpy: ReturnType<typeof vi.spyOn>
  let errSpy: ReturnType<typeof vi.spyOn>
  const output = () => logSpy.mock.calls.map((c) => c.join(' ')).join('\n')
  beforeEach(() => {
    vi.spyOn(process, 'cwd').mockReturnValue(tmp)
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => vi.restoreAllMocks())

  it('AC33-36: --json includes project_type, status, signals, recommended_next_step', () => {
    config()
    runOnboarding({ json: true })
    const j = JSON.parse(output())
    expect(j.project_type).toBe('pre-ai')
    expect(j.status).toBe('initialized')
    expect(j.signals).toBeTypeOf('object')
    expect(j.recommended_next_step.command).toBe('kaddo scan')
  })

  it('AC42: kaddo onboarding writes no files', () => {
    config()
    runOnboarding({})
    expect(fs.existsSync(path.join(tmp, '.kaddo/reports'))).toBe(false)
  })

  it('AC5/AC6/AC43: report onboarding writes only under .kaddo/reports/', () => {
    config()
    write('.kaddo/scan.json', '{}')
    runOnboardingReport({})
    expect(fs.existsSync(path.join(tmp, '.kaddo/reports/onboarding-report.md'))).toBe(true)
    expect(fs.existsSync(path.join(tmp, '.kaddo/reports/onboarding-report.json'))).toBe(true)
    expect(JSON.parse(fs.readFileSync(path.join(tmp, '.kaddo/reports/onboarding-report.json'), 'utf-8')).status).toBe('scanned')
  })

  it('report onboarding on a non-initialized project writes nothing', () => {
    runOnboardingReport({})
    expect(errSpy.mock.calls.flat().join(' ')).toContain('not initialized')
    expect(fs.existsSync(path.join(tmp, '.kaddo/reports'))).toBe(false)
  })

  it('AC41: does not modify knowledge/', () => {
    config()
    write('.kaddo/scan.json', '{}')
    write('knowledge/tech/codebase.md', '# keep me\n')
    const before = fs.readFileSync(path.join(tmp, 'knowledge/tech/codebase.md'), 'utf-8')
    runOnboarding({})
    runOnboardingReport({})
    expect(fs.readFileSync(path.join(tmp, 'knowledge/tech/codebase.md'), 'utf-8')).toBe(before)
  })

  it('markdown report has summary/signals/questions/next-step sections', () => {
    config()
    write('.kaddo/scan.json', '{}')
    const md = renderOnboardingMarkdown(buildOnboardingReport(tmp))
    for (const s of ['# Pre-AI Onboarding Report', '## Summary', '## Signals', '## Questions', '## Recommended Next Step']) {
      expect(md).toContain(s)
    }
  })
})
