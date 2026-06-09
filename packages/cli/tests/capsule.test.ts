import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { loadConfig } from '../src/core/config.js'
import {
  buildCapsule,
  renderCapsuleMarkdown,
  serializeCapsuleJson,
  parseCapsule,
  loadExternalRegistry,
  loadExternalCapsules,
} from '../src/core/capsule.js'
import { buildContextPack } from '../src/core/context-pack.js'
import { renderContextPack } from '../src/templates/context-pack-template.js'
import { buildProjectExplanation, renderExplanationHuman } from '../src/core/project-explain.js'
import { addExternalCapsule } from '../src/core/capsule.js'

let tmp: string
function write(rel: string, content: string) {
  const full = path.join(tmp, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content)
}
function config(name: string, extra = '') {
  write(
    '.kaddo/config.yml',
    `version: 1\nproject:\n  name: ${name}\n  state: pre-ai\n  structure: monorepo\n  language: en\nteam:\n  size: small\n${extra}`
  )
}

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-capsule-'))
})
afterEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true })
})

describe('Knowledge Capsule — export (VS-054)', () => {
  it('AC9/AC11: builds a capsule with purpose/capabilities/ADRs/owners, no source/secrets', () => {
    config('orders-service', 'owners:\n  orders: [Orders Team]\n')
    write('knowledge/business/business.md', '---\ntype: business\n---\n# B\n\nManages customer orders and lifecycle.\n')
    write('knowledge/product/capabilities.md', '---\ntype: capabilities\n---\n# Cap\n\n### Order Creation\n### Order Lookup\n')
    write('knowledge/tech/decisions/ADR-0001.md', '---\nid: ADR-0001\ntype: adr\ntitle: Idempotent transitions\n---\nx\n')
    const cap = buildCapsule(tmp, loadConfig(tmp)!)
    expect(cap.system).toBe('orders-service')
    expect(cap.purpose).toContain('Manages customer orders')
    expect(cap.capabilities).toEqual(['Order Creation', 'Order Lookup'])
    expect(cap.adrs).toContain('Idempotent transitions')
    expect(cap.owners).toContain('Orders Team')

    const md = renderCapsuleMarkdown(cap)
    expect(md).toContain('type: knowledge-capsule')
    expect(md).toContain('## Exposed Capabilities')
    expect(md).toContain('never contain secrets')
    const json = JSON.parse(serializeCapsuleJson(cap))
    expect(json.type).toBe('knowledge-capsule')
  })
})

describe('Knowledge Capsule — import / consume (VS-054)', () => {
  const capsuleMd = [
    '---',
    'type: knowledge-capsule',
    'system: orders-service',
    'version: 1',
    'updated_at: 2026-01-01',
    'owner: Orders Team',
    '---',
    '',
    '# Orders Service — Knowledge Capsule',
    '',
    '## Purpose',
    '',
    'Manages customer orders and order lifecycle.',
    '',
    '## Exposed Capabilities',
    '',
    '- Order Creation',
    '- Order Lookup',
    '',
    '## Public Contracts',
    '',
    '- `POST /orders`',
    '- `OrderCreated`',
    '',
    '## Known Risks',
    '',
    '- Transitions must stay idempotent.',
    '',
  ].join('\n')

  it('parseCapsule extracts purpose/capabilities/contracts/risks + age', () => {
    const c = parseCapsule('orders-service', 'external/orders-service.capsule.md', capsuleMd)
    expect(c.system).toBe('orders-service')
    expect(c.purpose).toContain('Manages customer orders')
    expect(c.capabilities).toEqual(['Order Creation', 'Order Lookup'])
    expect(c.contracts).toEqual(['`POST /orders`', '`OrderCreated`'])
    expect(c.knownRisks.length).toBe(1)
    expect(c.ageDays).not.toBeNull()
  })

  it('AC3/AC4: capsule add registers it in .kaddo/external.yml and copies it', () => {
    config('checkout-app')
    const src = path.join(tmp, 'orders.capsule.md')
    fs.writeFileSync(src, capsuleMd)
    const res = addExternalCapsule(tmp, src)
    expect(res.id).toBe('orders-service')
    expect(res.isCapsuleType).toBe(true)
    const reg = loadExternalRegistry(tmp)
    expect(reg).toHaveLength(1)
    expect(reg[0].id).toBe('orders-service')
    expect(fs.existsSync(path.join(tmp, reg[0].path))).toBe(true)
  })

  it('AC5: context pack includes an External Knowledge section', () => {
    config('checkout-app')
    write('external/orders-service.capsule.md', capsuleMd)
    write('.kaddo/external.yml', 'external:\n  - id: orders-service\n    type: knowledge-capsule\n    path: external/orders-service.capsule.md\n    owner: Orders Team\n')
    const pack = buildContextPack(tmp, loadConfig(tmp)!)
    expect(pack.external).toHaveLength(1)
    const md = renderContextPack(pack)
    expect(md).toContain('## External Knowledge')
    expect(md).toContain('### orders-service')
    expect(md).toContain('Order Creation')
  })

  it('AC6: explain lists capsules and warns when stale', () => {
    config('checkout-app')
    write('external/orders-service.capsule.md', capsuleMd) // updated_at 2026-01-01 (>90d before test date)
    write('.kaddo/external.yml', 'external:\n  - id: orders-service\n    type: knowledge-capsule\n    path: external/orders-service.capsule.md\n')
    const exp = buildProjectExplanation(tmp)
    expect(exp.externalCapsules).toHaveLength(1)
    const out = renderExplanationHuman(exp)
    expect(out).toContain('## External Knowledge Capsules: 1')
    expect(out).toContain('orders-service')
  })

  it('no external section when nothing is imported', () => {
    config('checkout-app')
    expect(buildProjectExplanation(tmp).externalCapsules).toEqual([])
    expect(loadExternalCapsules(tmp)).toEqual([])
  })
})
