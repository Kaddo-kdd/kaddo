import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { loadAssumptions, buildSavingsReport, renderSavingsMarkdown, serializeSavingsJson, DEFAULT_ASSUMPTIONS } from '../src/core/savings.js'
import { runSavings, runSavingsInit } from '../src/commands/savings.js'

let tmp: string
function write(rel: string, content: string) {
  const full = path.join(tmp, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content)
}
function setup() {
  write('.kaddo/config.yml', 'version: 1\nproject:\n  name: todoApp\n  state: pre-ai\n  structure: monorepo\n  language: en\nteam:\n  size: small\n')
  write('knowledge/business/business.md', '---\ntype: business\n---\n# B\n\nManages tasks.')
  write(
    'knowledge/delivery/work-items/completed/WI-1.md',
    '---\nid: WI-1\ntype: feature\ntitle: Done\nstatus: completed\nknowledge_level: K2\nsource: roadmap\nsource_id: C1\ninitiative: cli\ncode:\n  - src/cli/program.ts\n---\n# x\n\n## Acceptance Criteria\n- a\n\n## Definition of Done\n- d\n\n## How to test it\n- run\n'
  )
}

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-savings-'))
})
afterEach(() => fs.rmSync(tmp, { recursive: true, force: true }))

describe('Estimated Savings Model (VS-062)', () => {
  it('AC35: uses default assumptions when .kaddo/savings.yml is absent', () => {
    setup()
    const { assumptions, source } = loadAssumptions(tmp)
    expect(source).toBe('default')
    expect(assumptions).toEqual(DEFAULT_ASSUMPTIONS)
    const r = buildSavingsReport(tmp)
    expect(r.assumptions_source).toBe('default')
  })

  it('AC36: reads custom assumptions from .kaddo/savings.yml', () => {
    setup()
    write('.kaddo/savings.yml', 'currency: EUR\nhourly_cost: 100\nassumptions:\n  onboarding_hours_saved_per_new_contributor: 10\nteam:\n  expected_new_contributors_per_month: 2\n')
    const { assumptions, source } = loadAssumptions(tmp)
    expect(source).toBe('file')
    expect(assumptions.currency).toBe('EUR')
    expect(assumptions.hourly_cost).toBe(100)
    expect(assumptions.onboarding_hours_saved_per_new_contributor).toBe(10)
    expect(assumptions.expected_new_contributors_per_month).toBe(2)
    const r = buildSavingsReport(tmp)
    expect(r.currency).toBe('EUR')
    expect(r.total.estimated_value).toBe(Math.round(r.total.estimated_hours_saved * 100))
  })

  it('AC11/AC14-AC26: report has all sections, totals, confidence and drift not-available', () => {
    setup()
    const r = buildSavingsReport(tmp)
    expect(r.scope).toBe('all') // default
    expect(r.disclaimer).toContain('not exact ROI')
    expect(r.estimated_savings.context_preparation.hours).toBeGreaterThan(0)
    expect(r.estimated_savings.drift_prevention.available).toBe(false)
    expect(r.total.estimated_hours_saved).toBeGreaterThan(0)
    expect(r.total.estimated_value).toBe(Math.round(r.total.estimated_hours_saved * DEFAULT_ASSUMPTIONS.hourly_cost))
    expect(['Low', 'Medium', 'High']).toContain(r.confidence.level)
    expect(r.suggested_actions.length).toBeGreaterThan(0)

    const md = renderSavingsMarkdown(r)
    for (const sec of ['## Disclaimer', '## Assumptions', '## Evidence Used', '## Estimated Savings', '### Context Preparation', '### Review Effort', '### Clarification Reduction', '### Onboarding', '### Architecture Discovery', '### Drift Prevention', '## Total', '## Confidence', '## Suggested Actions']) {
      expect(md).toContain(sec)
    }
    expect(md).toContain('Not available yet.') // drift
  })

  it('AC22: confidence stays at most Medium without Guard history', () => {
    setup()
    expect(buildSavingsReport(tmp).confidence.level).not.toBe('High')
  })

  it('AC40: JSON shape is stable', () => {
    setup()
    const json = JSON.parse(serializeSavingsJson(buildSavingsReport(tmp)))
    expect(json).toHaveProperty('disclaimer')
    expect(json).toHaveProperty('assumptions.hourly_cost')
    expect(json).toHaveProperty('evidence.completed_work_items')
    expect(json).toHaveProperty('estimated_savings.onboarding.hours')
    expect(json).toHaveProperty('total.estimated_value')
    expect(json).toHaveProperty('confidence.level')
  })
})

describe('kaddo savings command (VS-062)', () => {
  let logSpy: ReturnType<typeof vi.spyOn>
  const output = () => logSpy.mock.calls.map((c) => c.join(' ')).join('\n')
  beforeEach(() => {
    vi.spyOn(process, 'cwd').mockReturnValue(tmp)
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })
  afterEach(() => vi.restoreAllMocks())

  it('AC7/AC28: prints Markdown and writes nothing without --output', () => {
    setup()
    runSavings({})
    expect(output()).toContain('# Kaddo Estimated Savings Report')
    expect(fs.existsSync(path.join(tmp, '.kaddo/reports'))).toBe(false)
  })

  it('AC8: --json prints stable JSON', () => {
    setup()
    runSavings({ json: true })
    const parsed = JSON.parse(output())
    expect(parsed.project).toBe('todoApp')
    expect(parsed).toHaveProperty('total.estimated_value')
  })

  it('AC9/AC41: --output writes a file', () => {
    setup()
    runSavings({ output: '.kaddo/reports/savings-report.md' })
    expect(fs.readFileSync(path.join(tmp, '.kaddo/reports/savings-report.md'), 'utf-8')).toContain('Estimated Savings Report')
  })

  it('AC3/AC4/AC5/AC6: savings init creates the file, never overwrites without --force', () => {
    setup()
    runSavingsInit({})
    const p = path.join(tmp, '.kaddo/savings.yml')
    expect(fs.existsSync(p)).toBe(true)
    fs.writeFileSync(p, 'currency: ZZZ\n')
    runSavingsInit({}) // no force → keep
    expect(fs.readFileSync(p, 'utf-8')).toContain('ZZZ')
    runSavingsInit({ force: true }) // force → overwrite
    expect(fs.readFileSync(p, 'utf-8')).toContain('hourly_cost: 40')
  })
})
