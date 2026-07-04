import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { parseRoadmapCandidateQuality, buildRoadmapQuality } from '../src/core/roadmap-quality.js'
import { buildProjectExplanation, renderExplanationHuman } from '../src/core/project-explain.js'
import { buildContextPack } from '../src/core/context-pack.js'
import { loadConfig } from '../src/core/config.js'
import { normalizeCapabilityList, domainsFromRelated, countRoadmapInitiatives } from '../src/core/roadmap.js'

let dir: string
function write(rel: string, c: string) {
  const f = path.join(dir, rel)
  fs.mkdirSync(path.dirname(f), { recursive: true })
  fs.writeFileSync(f, c)
}
function config() {
  write('.kaddo/config.yml', 'version: 1\nproject:\n  name: d\n  state: pre-ai\n  structure: monorepo\n  language: en\nteam:\n  size: small\n')
}

const GROUNDED = `---
type: roadmap
---
# Roadmap

## Candidate Initiatives

### RM-001 — Stabilize PRO Subscription Launch

- Status: candidate
- Related domain: Billing & Subscriptions
- Related capabilities:
  - Payment Webhook Processing
- Source signals:
  - Capability Gap: webhook hardening
`

const WEAK = `---
type: roadmap
---
# Roadmap

## Candidate Initiatives

### RM-001 — Improve the system
`

// A roadmap with 1 initiative but 2 Work Item candidates carrying inherited metadata.
const WITH_WI_CANDIDATES = `---
type: roadmap
---
# Roadmap

### RM-001 — Stabilize PRO Subscription Launch

**Related domain:** Billing & Subscriptions
**Related capabilities:**
- Payment Webhook Processing
- Trial Management
**Source signals:**
- Capability Gap: webhook hardening
- Tech Decision Candidate: INTERNAL_CRON_SECRET
**Expected value:** Reduces payment activation risk
**Risk:** Medium
**Dependencies:**
- Edge Function deploy
**Candidate Work Items:**
- WI-CANDIDATE-001: Validate webhook idempotency
  - Suggested Knowledge Level: K2
- WI-CANDIDATE-002: Harden internal cron secret
  - Suggested Knowledge Level: K3
`

beforeEach(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-rq-')) })
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }))

describe('roadmap quality parser (VS-077)', () => {
  it('AC10-13: detects candidates + related domain / capability / source signals', () => {
    const items = parseRoadmapCandidateQuality(GROUNDED)
    expect(items).toHaveLength(1)
    expect(items[0].id).toBe('RM-001')
    expect(items[0].hasRelatedDomain).toBe(true)
    expect(items[0].hasRelatedCapability).toBe(true)
    expect(items[0].hasSourceSignals).toBe(true)
    expect(items[0].grounded).toBe(true)
  })

  it('AC7: buildRoadmapQuality evaluates initiatives', () => {
    config()
    write('knowledge/delivery/roadmap.md', GROUNDED)
    const rq = buildRoadmapQuality(dir)
    expect(rq.initiatives.total).toBe(1)
    expect(rq.initiatives.grounded).toBe(1)
    expect(rq.initiatives.with_related_domain).toBe(1)
    expect(rq.initiatives.with_related_capability).toBe(1)
    expect(rq.initiatives.with_source_signals).toBe(1)
    expect(rq.initiatives.needs_refinement).toBe(false)
  })

  it('a weak initiative is not grounded and needs refinement', () => {
    config()
    write('knowledge/delivery/roadmap.md', WEAK)
    const rq = buildRoadmapQuality(dir)
    expect(rq.initiatives.total).toBe(1)
    expect(rq.initiatives.grounded).toBe(0)
    expect(rq.initiatives.with_related_domain).toBe(0)
    expect(rq.initiatives.needs_refinement).toBe(true)
  })

  it('AC8: buildRoadmapQuality evaluates Work Item candidates separately', () => {
    config()
    write('knowledge/delivery/roadmap.md', WITH_WI_CANDIDATES)
    const rq = buildRoadmapQuality(dir)
    // One initiative, two Work Item candidates — the two levels are distinct.
    expect(rq.initiatives.total).toBe(1)
    expect(rq.work_item_candidates.total).toBe(2)
    expect(rq.work_item_candidates.with_source_initiative).toBe(2)
    expect(rq.work_item_candidates.with_related_domain).toBe(2)
    expect(rq.work_item_candidates.with_related_capability).toBe(2)
  })

  it('AC1/AC2: counts initiatives distinct from Work Item candidates', () => {
    expect(countRoadmapInitiatives(WITH_WI_CANDIDATES)).toBe(1)
  })
})

describe('roadmap status + quality surfaced (VS-077.1)', () => {
  it('AC3-AC6: explain shows a Roadmap Status with separated counts', () => {
    config()
    write('knowledge/delivery/roadmap.md', WITH_WI_CANDIDATES)
    const md = renderExplanationHuman(buildProjectExplanation(dir))
    expect(md).toContain('## Roadmap Status')
    expect(md).toContain('- Initiatives: 1')
    expect(md).toContain('- Work Item candidates: 2')
    expect(md).toContain('- Materialized Work Items: 0')
    expect(md).toContain('- Remaining Work Item candidates: 2')
  })

  it('AC7/AC8: explain Roadmap Quality separates initiatives and WI candidates', () => {
    config()
    write('knowledge/delivery/roadmap.md', WITH_WI_CANDIDATES)
    const md = renderExplanationHuman(buildProjectExplanation(dir))
    expect(md).toContain('## Roadmap Quality')
    expect(md).toContain('Initiatives:')
    expect(md).toContain('Work Item Candidates:')
    expect(md).toContain('- With source initiative: 2/2')
  })

  it('AC9/AC10: context-pack separates initiatives and WI candidates (json + md)', async () => {
    config()
    write('knowledge/delivery/roadmap.md', WITH_WI_CANDIDATES)
    const pack = buildContextPack(dir, loadConfig(dir)!)
    expect(pack.roadmap.initiatives).toBe(1)
    expect(pack.roadmap.work_item_candidates).toBe(2)
    expect(pack.roadmapQuality.initiatives.total).toBe(1)
    expect(pack.roadmapQuality.work_item_candidates.total).toBe(2)
    const { renderContextPack } = await import('../src/templates/context-pack-template.js')
    const md = renderContextPack(pack)
    expect(md).toContain('## Roadmap Status')
    expect(md).toContain('- Initiatives: 1')
    expect(md).toContain('- Work Item candidates: 2')
    expect(md).toContain('Work Item Candidates:')
  })
})

describe('normalization helpers (VS-078)', () => {
  it('AC14: domains derives from related_domain', () => {
    expect(domainsFromRelated('Billing & Subscriptions')).toEqual(['Billing & Subscriptions'])
    expect(domainsFromRelated(undefined)).toEqual([])
  })

  it('AC16: normalizeCapabilityList splits a comma-joined string into a real list', () => {
    expect(
      normalizeCapabilityList(['Payment Webhook Processing, Trial Management, Plan Limits.'])
    ).toEqual(['Payment Webhook Processing', 'Trial Management', 'Plan Limits'])
  })

  it('does not split Spanish "y" inside a single capability', () => {
    expect(normalizeCapabilityList(['Degradación y Control de Trials'])).toEqual([
      'Degradación y Control de Trials',
    ])
  })
})

describe('create --from roadmap materialization quality (VS-078)', () => {
  const candidate = {
    id: 'WI-CANDIDATE-001',
    title: 'Validate webhook idempotency',
    suggestedKnowledgeLevel: 'K2',
    expectedValue: 'Reduces payment activation risk',
    domain: 'Facturación y Suscripciones (Billing & Subscriptions)',
    risk: 'Medium',
    relatedCapabilities: ['Integración con Pasarela de Pagos, Control de Límites por Plan, Degradación y Control de Trials.'],
    dependencies: ['Edge Function deploy'],
    sourceSignals: ['Capability Gap: webhook hardening', 'Tech Decision Candidate: INTERNAL_CRON_SECRET'],
    decisionCandidates: ['INTERNAL_CRON_SECRET'],
    initiative: { id: 'RM-001', title: 'Estabilización y Despliegue de Suscripciones PRO' },
    rawMarkdown: '',
  }

  it('AC11-AC22: front matter preserves + normalizes roadmap metadata', async () => {
    const { buildRoadmapFrontMatter } = await import('../src/commands/create.js')
    const fm = buildRoadmapFrontMatter('WI-014', 'feature', 'K2', 'Validate webhook idempotency', candidate as any, {})
    // AC11/AC12: source initiative + work item candidate
    expect(fm).toContain('source_roadmap_initiative: RM-001')
    expect(fm).toContain('source_work_item_candidate: WI-CANDIDATE-001')
    expect(fm).toContain('source_initiative_title: "Estabilización y Despliegue de Suscripciones PRO"')
    // AC13/AC14: related_domain + domains filled from it
    expect(fm).toContain('related_domain: "Facturación y Suscripciones (Billing & Subscriptions)"')
    expect(fm).toMatch(/domains:\n  - "Facturación y Suscripciones \(Billing & Subscriptions\)"/)
    // AC15/AC16: capabilities as a real, comma-split list
    expect(fm).toMatch(/related_capabilities:\n  - "Integración con Pasarela de Pagos"\n  - "Control de Límites por Plan"\n  - "Degradación y Control de Trials"/)
    expect(fm).not.toContain('Integración con Pasarela de Pagos, Control de Límites por Plan')
    // AC17-AC19
    expect(fm).toContain('expected_value: "Reduces payment activation risk"')
    expect(fm).toMatch(/risks:\n  - "Medium"/)
    expect(fm).toMatch(/dependencies:\n  - "Edge Function deploy"/)
    // AC20/AC21: source_signals + decision_candidates preserved
    expect(fm).toMatch(/source_signals:\n  - "Capability Gap: webhook hardening"/)
    expect(fm).toMatch(/decision_candidates:\n  - "INTERNAL_CRON_SECRET"/)
    expect(fm).toContain('related_decisions: []')
  })

  it('AC22: does not invent source signals when the candidate has none', async () => {
    const { buildRoadmapFrontMatter } = await import('../src/commands/create.js')
    const bare = { ...candidate, sourceSignals: undefined, decisionCandidates: undefined }
    const fm = buildRoadmapFrontMatter('WI-014', 'feature', 'K2', 'x', bare as any, {})
    expect(fm).not.toContain('source_signals:')
    expect(fm).not.toContain('decision_candidates:')
  })

  it('AC23-AC25: body shows improved Source + Context From Roadmap + ADR warning', async () => {
    const { buildRoadmapWorkItem } = await import('../src/commands/create.js')
    const { content: body } = buildRoadmapWorkItem({
      id: 'WI-014',
      type: 'feature',
      level: 'K2',
      candidate: candidate as any,
    })
    expect(body).toContain('## Source')
    expect(body).toContain('- Roadmap Initiative: RM-001 — Estabilización y Despliegue de Suscripciones PRO')
    expect(body).toContain('- Work Item Candidate: WI-CANDIDATE-001')
    expect(body).toContain('- Related capabilities:')
    expect(body).toContain('## Context From Roadmap')
    expect(body).toContain('**Expected value:**')
    expect(body).toContain('**Source signals:**')
    expect(body).toContain('This Work Item is related to technical decision candidates')
  })

  it('AC24: Context From Roadmap says source signals not provided when absent', async () => {
    const { buildRoadmapWorkItem } = await import('../src/commands/create.js')
    const bare = { ...candidate, title: 'x', sourceSignals: undefined, decisionCandidates: undefined }
    const { content: body } = buildRoadmapWorkItem({
      id: 'WI-014',
      type: 'feature',
      level: 'K2',
      candidate: bare as any,
    })
    expect(body).toContain('**Source signals:** _Not provided in roadmap._')
  })
})
