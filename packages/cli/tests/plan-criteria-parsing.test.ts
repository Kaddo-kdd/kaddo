import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { parseDeliveryPlan } from '../src/core/delivery-planning.js'

// WI-085 — success_criteria / exit_criteria are canonically strings. A historical artifact may hold a YAML
// map; it must NOT surface as the literal "[object Object]" criterion. We recover a text field when present
// and skip (count) an otherwise unreadable element, never coercing an arbitrary object into a criterion.

let tmp: string
beforeEach(() => { tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-crit-')) })
afterEach(() => fs.rmSync(tmp, { recursive: true, force: true }))

function plan(body: string) {
  const f = path.join(tmp, 'PLAN-001.md')
  fs.writeFileSync(f, body)
  return parseDeliveryPlan(tmp, f, body)!
}

describe('criteria parsing (WI-085 AC-18)', () => {
  it('never produces the literal "[object Object]" from a mapped criterion', () => {
    const p = plan(['---', 'type: delivery-plan', 'id: PLAN-001', 'title: P', 'status: planned',
      'success_criteria:', '  - A plain criterion', '  - unexpected: value', // a YAML map with no text field
      '---', '# P'].join('\n'))
    expect(p.successCriteria).not.toContain('[object Object]')
    expect(p.successCriteria).toEqual(['A plain criterion'])
    expect(p.unreadableCriteria).toBe(1)
  })

  it('recovers a text-like field from a structured criterion without inventing content', () => {
    const p = plan(['---', 'type: delivery-plan', 'id: PLAN-001', 'title: P', 'status: planned',
      'success_criteria:', '  - text: SSO works end to end', '  - criterion: Invoices reconcile',
      '---', '# P'].join('\n'))
    expect(p.successCriteria).toEqual(['SSO works end to end', 'Invoices reconcile'])
    expect(p.unreadableCriteria).toBe(0)
  })

  it('counts unreadable exit criteria on a milestone and keeps the readable ones', () => {
    const p = plan(['---', 'type: delivery-plan', 'id: PLAN-001', 'title: P', 'status: planned',
      'milestones:', '  - id: RM-01', '    title: M1', '    exit_criteria:',
      '      - Checklist signed', '      - {}',
      '---', '# P'].join('\n'))
    const m = p.milestones.find((x) => x.id === 'RM-01')!
    expect(m.exitCriteria).toEqual(['Checklist signed'])
    expect(m.unreadableExitCriteria).toBe(1)
  })

  it('plain string criteria parse unchanged with zero unreadable', () => {
    const p = plan(['---', 'type: delivery-plan', 'id: PLAN-001', 'title: P', 'status: planned',
      'success_criteria:', '  - One', '  - Two', '---', '# P'].join('\n'))
    expect(p.successCriteria).toEqual(['One', 'Two'])
    expect(p.unreadableCriteria).toBe(0)
  })
})
