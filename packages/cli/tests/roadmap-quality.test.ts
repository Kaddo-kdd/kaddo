import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { parseRoadmapCandidateQuality, buildRoadmapQuality } from '../src/core/roadmap-quality.js'
import { buildProjectExplanation, renderExplanationHuman } from '../src/core/project-explain.js'
import { buildContextPack } from '../src/core/context-pack.js'
import { loadConfig } from '../src/core/config.js'

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

  it('AC14-18: buildRoadmapQuality counts grounded vs weak', () => {
    config()
    write('knowledge/delivery/roadmap.md', GROUNDED)
    const rq = buildRoadmapQuality(dir)
    expect(rq.candidates).toBe(1)
    expect(rq.grounded).toBe(1)
    expect(rq.with_related_domain).toBe(1)
    expect(rq.with_related_capability).toBe(1)
    expect(rq.with_source_signals).toBe(1)
    expect(rq.needs_refinement).toBe(false)
  })

  it('AC15/AC16: a weak candidate is not grounded and needs refinement', () => {
    config()
    write('knowledge/delivery/roadmap.md', WEAK)
    const rq = buildRoadmapQuality(dir)
    expect(rq.candidates).toBe(1)
    expect(rq.grounded).toBe(0)
    expect(rq.with_related_domain).toBe(0)
    expect(rq.needs_refinement).toBe(true)
  })
})

describe('roadmap quality surfaced (VS-077)', () => {
  it('AC19: explain shows a Roadmap Quality section', () => {
    config()
    write('knowledge/delivery/roadmap.md', WEAK)
    const md = renderExplanationHuman(buildProjectExplanation(dir))
    expect(md).toContain('## Roadmap Quality')
    expect(md).toContain('needs refinement')
  })

  it('AC20/AC21: context-pack carries roadmapQuality (json) and renders it (md)', async () => {
    config()
    write('knowledge/delivery/roadmap.md', GROUNDED)
    const pack = buildContextPack(dir, loadConfig(dir)!)
    expect(pack.roadmapQuality.grounded).toBe(1)
    const { renderContextPack } = await import('../src/templates/context-pack-template.js')
    expect(renderContextPack(pack)).toContain('## Roadmap Quality')
  })
})

describe('create --from roadmap preserves capability metadata (VS-077)', () => {
  it('AC24-AC30: front matter carries source_roadmap_candidate + related metadata', async () => {
    const { buildRoadmapFrontMatter } = await import('../src/commands/create.js')
    const candidate = {
      id: 'WI-CANDIDATE-001',
      title: 'Validate webhook idempotency',
      suggestedKnowledgeLevel: 'K2',
      expectedValue: 'Reduces payment activation risk',
      domain: 'Billing & Subscriptions',
      risk: 'Mercado Pago webhook failures',
      relatedCapabilities: ['Payment Webhook Processing', 'Trial Management'],
      dependencies: ['ADR for internal endpoint protection'],
      initiative: { id: 'RM-001', title: 'Stabilize PRO Subscription Launch' },
      rawMarkdown: '',
    }
    const fm = buildRoadmapFrontMatter('WI-014', 'feature', 'K2', 'Validate webhook idempotency', candidate, {})
    expect(fm).toContain('source_roadmap_candidate: RM-001')
    expect(fm).toContain('related_domain: "Billing & Subscriptions"')
    expect(fm).toContain('related_capability: "Payment Webhook Processing"')
    expect(fm).toContain('knowledge_level: K2')
    expect(fm).toContain('expected_value: "Reduces payment activation risk"')
    expect(fm).toContain('risks: "Mercado Pago webhook failures"')
    expect(fm).toContain('dependencies: ["ADR for internal endpoint protection"]')
  })
})
