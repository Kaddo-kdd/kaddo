import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { recordGuardRun, buildGuardHistory, loadGuardRuns, type GuardWarning } from '../src/core/guard-history.js'
import { buildDriftReport, renderDriftMarkdown, serializeDriftJson } from '../src/core/drift-report.js'

let tmp: string
function config() {
  fs.mkdirSync(path.join(tmp, '.kaddo'), { recursive: true })
  fs.writeFileSync(path.join(tmp, '.kaddo/config.yml'), 'version: 1\nproject:\n  name: todoApp\n  state: pre-ai\n  structure: monorepo\n  language: en\nteam:\n  size: small\n')
}
const warn = (code_path: string, related: string[], updated: string[]): GuardWarning => ({
  type: 'possible-knowledge-drift', code_path, related_artifacts: related, updated_artifacts: updated, status: 'open',
})

beforeEach(() => { tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-gh-')); config() })
afterEach(() => fs.rmSync(tmp, { recursive: true, force: true }))

describe('Guard history (VS-063)', () => {
  it('AC2/AC3/AC4/AC5/AC39/AC40: records JSONL + summary with the expected fields', () => {
    recordGuardRun(tmp, {
      project: 'todoApp', scope: 'active-and-completed',
      touched_files: ['src/cli/program.ts'], matched_artifacts: ['WI-1'], updated_artifacts: [],
      warnings: [warn('src/cli/program.ts', ['WI-1'], [])],
    }, new Date('2026-06-20T10:00:00.000Z'))

    const runsPath = path.join(tmp, '.kaddo/history/guard-runs.jsonl')
    expect(fs.existsSync(runsPath)).toBe(true)
    const run = loadGuardRuns(tmp)[0]
    for (const k of ['run_id', 'generated_at', 'project', 'touched_files', 'matched_artifacts', 'updated_artifacts', 'warnings', 'summary']) {
      expect(run).toHaveProperty(k)
    }
    expect(JSON.stringify(run)).not.toMatch(/author|email|git/i) // AC6: no personal data
    const summary = JSON.parse(fs.readFileSync(path.join(tmp, '.kaddo/history/guard-summary.json'), 'utf-8'))
    expect(summary.total_runs).toBe(1)
    expect(summary.open_warnings).toBe(1)
  })

  it('AC39: appends one line per run', () => {
    recordGuardRun(tmp, { project: 'p', scope: 's', touched_files: [], matched_artifacts: [], updated_artifacts: [], warnings: [] })
    recordGuardRun(tmp, { project: 'p', scope: 's', touched_files: [], matched_artifacts: [], updated_artifacts: [], warnings: [] })
    expect(loadGuardRuns(tmp)).toHaveLength(2)
  })

  it('detects resolution deterministically across runs', () => {
    // Run 1: drift on the repo file; WI-4 not updated.
    recordGuardRun(tmp, {
      project: 'p', scope: 's', touched_files: ['src/modules/tasks/task.repository.ts'],
      matched_artifacts: ['WI-3', 'WI-4'], updated_artifacts: [],
      warnings: [warn('src/modules/tasks/task.repository.ts', ['WI-3', 'WI-4'], [])],
    }, new Date('2026-06-21T23:10:00.000Z'))
    // Run 2: same path touched, WI-4 updated, no warning → resolved.
    recordGuardRun(tmp, {
      project: 'p', scope: 's', touched_files: ['src/modules/tasks/task.repository.ts'],
      matched_artifacts: ['WI-3', 'WI-4'], updated_artifacts: ['WI-4'], warnings: [],
    }, new Date('2026-06-22T01:10:00.000Z'))

    const h = buildGuardHistory(tmp)
    expect(h.total_runs).toBe(2)
    expect(h.detected).toBe(1)
    expect(h.resolved).toBe(1)
    expect(h.open).toBe(0)
    expect(h.resolution_rate).toBe(100)
  })
})

describe('kaddo drift report (VS-063)', () => {
  it('AC16/AC41: clear report when no history', () => {
    const r = buildDriftReport(tmp)
    expect(r.guard_history.available).toBe(false)
    expect(renderDriftMarkdown(r)).toContain('No guard history recorded yet.')
  })

  it('AC17-AC23/AC42/AC43: full report + JSON with history', () => {
    recordGuardRun(tmp, {
      project: 'todoApp', scope: 's', touched_files: ['src/cli/program.ts'],
      matched_artifacts: ['WI-1'], updated_artifacts: [], warnings: [warn('src/cli/program.ts', ['WI-1'], [])],
    })
    const r = buildDriftReport(tmp)
    expect(r.guard_history.total_runs).toBe(1)
    expect(r.drift_warnings.detected).toBe(1)
    expect(r.drift_warnings.open).toBe(1)
    expect(r.hotspots[0].path).toBe('src/cli/')
    expect(['improving', 'stable', 'worsening', 'unknown']).toContain(r.trend.direction)
    const md = renderDriftMarkdown(r)
    for (const sec of ['## Executive Summary', '## Guard History', '## Drift Warnings', '## Hotspots', '## Trend', '## Suggested Actions']) {
      expect(md).toContain(sec)
    }
    const json = JSON.parse(serializeDriftJson(r))
    expect(json).toHaveProperty('drift_warnings.resolution_rate')
    expect(json).toHaveProperty('hotspots')
  })
})
