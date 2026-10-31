import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import {
  buildConsolidationPlan,
  consolidationPlanStaleness,
  renderConsolidationMarkdown,
  serializeConsolidationJson,
  type ConsolidationPlan,
} from '../src/core/knowledge-consolidation.js'

let tmp: string

function write(rel: string, content: string) {
  const full = path.join(tmp, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content)
}

function config(name = 'kc', extra = '') {
  write(
    '.kaddo/config.yml',
    `version: 1\nproject:\n  name: ${name}\n  state: new\n  structure: monorepo\n  language: en\nteam:\n  size: small\n${extra}`
  )
}

const FIXED_NOW = new Date('2026-01-01T00:00:00.000Z')

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-kc-'))
})
afterEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true })
})

describe('Knowledge Consolidation — deterministic analysis (WI-070)', () => {
  it('Scenario 5: a consistent project yields no invented opportunities', () => {
    config()
    const business = [
      '---', 'type: business', 'title: Business', '---',
      '# Business',
      '',
      '## Problem',
      '',
      'Teams lose hours every week reconciling payment settlements by hand because the current spreadsheet process cannot keep up with the growing transaction volume across regions and currencies. Mistakes slip through, exceptions pile up, and nobody has a reliable audit trail of what was decided or why, which makes month-end close slow and stressful for the whole finance team.',
      '',
      '## Users',
      '',
      'Finance operators run the daily reconciliation and resolve unmatched items, while regional managers review exceptions and sign off on settlement reports before they are sent to the accounting system each morning. Auditors occasionally need to trace a specific settlement back to the originating order and the person who approved it.',
      '',
    ].join('\n')
    const product = [
      '---', 'type: product', 'title: Product', '---',
      '# Product',
      '',
      '## Scope',
      '',
      'The product ingests settlement files, matches them against internal orders, and surfaces unmatched items so operators can resolve exceptions quickly without touching a spreadsheet. It routes each exception to the right reviewer and records the resolution so the next person always sees the current state of every item.',
      '',
      '## Value',
      '',
      'By automating matching and exception routing the product cuts reconciliation time dramatically and gives managers a reliable, auditable trail of every settlement decision taken during the day. Auditors can reconstruct any settlement from the original file to the final sign-off without asking the finance team to dig through spreadsheets.',
      '',
    ].join('\n')
    write('knowledge/business/business.md', business)
    write('knowledge/product/product.md', product)

    const plan = buildConsolidationPlan(tmp, { now: FIXED_NOW })
    expect(plan.summary.total).toBe(0)
    expect(plan.coverage.artifacts_evaluated).toBeGreaterThan(0)
    // The markdown must not claim perfection.
    const md = renderConsolidationMarkdown(plan)
    expect(md).toContain('not a claim that the knowledge is perfect')
  })

  it('Scenario 1: a completed Work Item with a rule-like learning becomes a SUGGESTED candidate', () => {
    config()
    write(
      'knowledge/delivery/work-items/completed/WI-001.md',
      '---\nid: WI-001\ntype: feature\ntitle: Retry handling\nstatus: completed\n---\n# Retry handling\n\n## Learning\n\nThe payment integration **must** always use idempotency keys on retries; this is a hard constraint.\n'
    )
    const plan = buildConsolidationPlan(tmp, { now: FIXED_NOW })
    const learnings = plan.opportunities.filter((o) => o.category === 'unincorporated_learning')
    expect(learnings).toHaveLength(1)
    expect(learnings[0].classification).toBe('suggested')
    expect(learnings[0].requires_semantic_review).toBe(true)
    expect(learnings[0].source_artifacts).toContain('WI-001')
  })

  it('does NOT flag a completed Work Item whose learning is not rule-like', () => {
    config()
    write(
      'knowledge/delivery/work-items/completed/WI-002.md',
      '---\nid: WI-002\ntype: feature\ntitle: Small tweak\nstatus: completed\n---\n# Small tweak\n\n## Learning\n\nWe renamed a button label and shipped it.\n'
    )
    const plan = buildConsolidationPlan(tmp, { now: FIXED_NOW })
    expect(plan.opportunities.filter((o) => o.category === 'unincorporated_learning')).toHaveLength(0)
  })

  it('Scenario 4: a dangling decision reference is an OBSERVED potential inconsistency', () => {
    config()
    write(
      'knowledge/delivery/work-items/in-progress/WI-003.md',
      '---\nid: WI-003\ntype: feature\ntitle: Uses a missing decision\nstatus: in-progress\ndecisions:\n  - ADR-999\n---\n# WI-003\n\nBody.\n'
    )
    const plan = buildConsolidationPlan(tmp, { now: FIXED_NOW })
    const outdated = plan.opportunities.filter((o) => o.category === 'potentially_outdated')
    expect(outdated).toHaveLength(1)
    expect(outdated[0].classification).toBe('observed')
    expect(outdated[0].evidence.join(' ')).toContain('ADR-999')
  })

  it('Scenario 2: two canonical artifacts sharing distinctive sections are a SUGGESTED candidate, never auto-merged', () => {
    config()
    const shared = '## Pricing engine\n\nText.\n\n## Settlement window\n\nText.\n'
    write('knowledge/tech/current-state.md', `---\ntype: current-state\ntitle: Current state\n---\n# Current state\n\n${shared}`)
    write('knowledge/product/capabilities.md', `---\ntype: capabilities\ntitle: Capabilities\n---\n# Capabilities\n\n${shared}`)
    const plan = buildConsolidationPlan(tmp, { now: FIXED_NOW })
    const red = plan.opportunities.filter((o) => o.category === 'knowledge_redundancy')
    expect(red).toHaveLength(1)
    expect(red[0].classification).toBe('suggested')
    expect(red[0].requires_semantic_review).toBe(true)
    // Preserve layer separation — the action must not propose a silent merge.
    expect(red[0].suggested_action.toLowerCase()).toContain('preserve layer separation')
  })

  it('does NOT treat Work Items that share a template as redundancy', () => {
    config()
    const tpl = '## Acceptance Criteria\n\n- [ ] AC-01\n\n## Validation\n\nx\n\n## Definition of Done\n\nx\n'
    for (const id of ['WI-010', 'WI-011', 'WI-012']) {
      write(
        `knowledge/delivery/work-items/completed/${id}.md`,
        `---\nid: ${id}\ntype: feature\ntitle: ${id}\nstatus: completed\n---\n# ${id}\n\n${tpl}`
      )
    }
    const plan = buildConsolidationPlan(tmp, { now: FIXED_NOW })
    expect(plan.opportunities.filter((o) => o.category === 'knowledge_redundancy')).toHaveLength(0)
  })

  it('AC-17: the analysis is idempotent across runs (opportunities are stable)', () => {
    config()
    write(
      'knowledge/delivery/work-items/completed/WI-020.md',
      '---\nid: WI-020\ntype: feature\ntitle: Rule\nstatus: completed\n---\n# Rule\n\n## Learning\n\nThe system must never log secrets; this is an invariant.\n'
    )
    const a = buildConsolidationPlan(tmp, { now: FIXED_NOW })
    const b = buildConsolidationPlan(tmp, { now: new Date('2027-05-05T10:00:00.000Z') })
    // generated_at differs, but the opportunities themselves are identical and stably ordered.
    expect(b.opportunities).toEqual(a.opportunities)
    expect(b.opportunities.map((o) => o.id)).toEqual(a.opportunities.map((o) => o.id))
  })

  it('AC-14: a plan is detected as stale after a source file changes', () => {
    config()
    write('knowledge/tech/codebase.md', '---\ntype: codebase\ntitle: Codebase\n---\n# Codebase\n\nOriginal content that is long enough to be considered useful knowledge with several concrete sentences about the stack and structure.\n')
    const plan = buildConsolidationPlan(tmp, { now: FIXED_NOW })
    expect(consolidationPlanStaleness(tmp, plan).stale).toBe(false)
    write('knowledge/tech/codebase.md', '---\ntype: codebase\ntitle: Codebase\n---\n# Codebase\n\nChanged content, now different, still long enough to be considered useful knowledge with several concrete sentences about the stack and structure.\n')
    const staleness = consolidationPlanStaleness(tmp, plan)
    expect(staleness.stale).toBe(true)
    expect(staleness.changed).toContain('knowledge/tech/codebase.md')
  })

  it('AC-16: evidence never echoes a secret-looking value from a learning', () => {
    config()
    write(
      'knowledge/delivery/work-items/completed/WI-030.md',
      '---\nid: WI-030\ntype: feature\ntitle: Secret in learning\nstatus: completed\n---\n# Secret\n\n## Learning\n\nThe token ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 must be rotated; always rotate it.\n'
    )
    const plan = buildConsolidationPlan(tmp, { now: FIXED_NOW })
    const json = serializeConsolidationJson(plan)
    // firstSentence caps at the first sentence; the rule keyword that triggers is "must"/"always".
    // Whatever surfaces, the plan must never contain the secret-looking token.
    expect(json).not.toContain('ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789')
  })

  it('scope: --layer restricts coverage and reports exclusions', () => {
    config()
    write('knowledge/business/business.md', '---\ntype: business\ntitle: Business\n---\n# Business\n\nUseful business knowledge with enough detail to not be a placeholder across several concrete sentences here.\n')
    write(
      'knowledge/delivery/work-items/in-progress/WI-040.md',
      '---\nid: WI-040\ntype: feature\ntitle: Dangling\nstatus: in-progress\ndecisions:\n  - ADR-404\n---\n# WI-040\n\nBody.\n'
    )
    const all = buildConsolidationPlan(tmp, { now: FIXED_NOW })
    expect(all.opportunities.some((o) => o.category === 'potentially_outdated')).toBe(true)

    const business = buildConsolidationPlan(tmp, { scope: { kind: 'layer', layer: 'Business' }, now: FIXED_NOW })
    // The Delivery WI is out of scope, so its dangling-decision finding is gone.
    expect(business.opportunities.some((o) => o.category === 'potentially_outdated')).toBe(false)
    expect(business.coverage.excluded_sources.length).toBeGreaterThan(0)
  })
})
