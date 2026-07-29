import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

let root: string
beforeEach(() => { root = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-093-2-')) })
afterEach(() => { fs.rmSync(root, { recursive: true, force: true }) })

function write(rel: string, content: string) {
  const abs = path.join(root, rel)
  fs.mkdirSync(path.dirname(abs), { recursive: true })
  fs.writeFileSync(abs, content)
}

const MODULE_CONFIG = `version: 1
project:
  name: acme-billing
  state: pre-ai
  structure: multirepo
  role: module
  language: en
team:
  size: small
multirepo:
  role: module
  parent_system: acme-platform
module:
  id: billing
`

const USEFUL_MD = `---
type: module-context
scope: module
module_id: billing
parent_system: acme-platform
---

# Module Context

## Module identity

The billing module handles subscription management and payment processing for the acme-platform system. It is the sole owner of all financial transaction logic within the platform.

## Responsibility

Owns the full lifecycle of subscriptions — creates, upgrades, downgrades, and cancels subscriptions for customers. Handles invoice generation, payment collection, and refund processing. Emits billing events to the core event bus for downstream consumption by other modules.

## Boundaries

Only billing logic; no user management, no authentication, no product catalog. Accepts events from core via webhook. Does not directly interact with end users.

## Exposed interfaces

REST API at /api/billing for internal service calls, webhook receiver at /webhooks/core for event-driven communication with the core orchestrator.

## Dependencies

PostgreSQL for persistent storage, Stripe SDK for payment processing, core event bus for inter-module messaging, Redis for caching subscription state.

## Consumers

The core orchestrator consumes billing events to update customer status and trigger notifications. The analytics module reads billing data for revenue reporting and forecasting dashboards.

## Local rules

All monetary values use integer cents to avoid floating point issues. Currency is always USD. Idempotency keys are required on all mutation endpoints to prevent duplicate charges.

## Risks

Stripe API rate limits could throttle high-volume billing operations during peak periods. The PostgreSQL connection pool is sized for current load but may need scaling.

## Open questions

Should we support multi-currency billing in the next quarter? How do we handle partial refunds for bundled subscriptions?
`

const USEFUL_CURRENT_STATE = `---
type: current-state
---

## Architecture

The billing module is a Fastify-based REST API backed by PostgreSQL. It uses a layered architecture with controllers, services, and repositories. The service layer handles all business logic including subscription lifecycle management, invoice generation, and payment processing through the Stripe SDK integration.

## Runtime

Deployed on AWS ECS with Fargate launch type. The container runs Node.js 20 with TypeScript compiled to ESM. Health checks are exposed on /health and /ready endpoints. Logging uses structured JSON output to CloudWatch.

## Infrastructure

PostgreSQL 15 on RDS with read replicas for reporting queries. Redis 7 on ElastiCache for session caching and rate limiting. The module connects to the core event bus via SQS queues for async communication.
`

const USEFUL_CODEBASE = `---
type: codebase
---

## Codebase

TypeScript monolith organized under src/ with the following structure: controllers/ for HTTP handlers, services/ for business logic, repositories/ for data access, and models/ for domain types. The project uses Vitest for testing with integration tests against a local PostgreSQL instance.

## Entry

src/index.ts bootstraps the Fastify server, registers plugins, and starts listening on the configured port. Configuration is loaded from environment variables validated with Zod schemas at startup time.

## Build

The project uses tsup for building, producing ESM output in dist/. The Dockerfile uses a multi-stage build to minimize the production image size.
`

function setupModule(ready: boolean = true) {
  write('.kaddo/config.yml', MODULE_CONFIG)
  if (ready) {
    write('knowledge/tech/module/module-context.md', USEFUL_MD)
    write('knowledge/tech/current-state.md', USEFUL_CURRENT_STATE)
    write('knowledge/tech/codebase.md', USEFUL_CODEBASE)
  }
}

// --- Readiness ---

describe('VS-093.2 — readiness alignment', () => {
  it('AC: ready module → ready-for-core-orchestration, not bootstrap-incomplete', async () => {
    setupModule(true)
    write('.kaddo/scan.json', '{}')
    const { buildReadinessReport } = await import('../src/core/readiness.js')
    const r = buildReadinessReport(root)
    expect(r.overall).toBe('ready-for-core-orchestration')
    expect(r.project_role).toBe('module')
  })

  it('AC: ready module signals: agents/skills = managed-by-core, business/product = not-applicable', async () => {
    setupModule(true)
    write('.kaddo/scan.json', '{}')
    const { buildReadinessReport } = await import('../src/core/readiness.js')
    const r = buildReadinessReport(root)
    expect(r.signals.agents).toBe('managed-by-core')
    expect(r.signals.skills).toBe('managed-by-core')
    expect(r.signals.product).toBe('not-applicable')
    expect(r.signals.business).toBe('not-applicable')
    expect(r.signals.roadmap).toBe('managed-by-core')
    expect(r.signals.work_items).toBe('managed-by-core')
  })

  it('AC: ready module has module_context signal = useful', async () => {
    setupModule(true)
    write('.kaddo/scan.json', '{}')
    const { buildReadinessReport } = await import('../src/core/readiness.js')
    const r = buildReadinessReport(root)
    expect(r.signals.module_context).toBe('useful')
  })

  it('AC: incomplete module → bootstrap-incomplete or knowledge-incomplete', async () => {
    write('.kaddo/config.yml', MODULE_CONFIG)
    write('.kaddo/scan.json', '{}')
    const { buildReadinessReport } = await import('../src/core/readiness.js')
    const r = buildReadinessReport(root)
    expect(r.overall).toBe('bootstrap-incomplete')
    expect(r.project_role).toBe('module')
  })
})

// --- Delivery phase ---

describe('VS-093.2 — delivery phase alignment', () => {
  it('AC: module-ready phase = Ready for Core Orchestration, no agents', async () => {
    const { assessPhase } = await import('../src/core/delivery-phase.js')
    const result = assessPhase({
      layers: [
        { layer: 'Business', status: 'Not applicable' as any, detected: [] },
        { layer: 'Product', status: 'Not applicable' as any, detected: [] },
        { layer: 'Tech', status: 'Consolidated' as any, detected: ['current-state', 'codebase'] },
        { layer: 'Delivery', status: 'Managed by core' as any, detected: [] },
      ],
      roadmap: { present: false, candidates: 0, materialized: 0, remaining: 0 },
      workItems: { total: 0, byState: { draft: 0, ready: 0, 'in-progress': 0, blocked: 0, completed: 0, archived: 0 }, items: [] },
      ownership: { workItemsTotal: 0, workItemsWithOwnership: 0, workItemsMissingOwnership: 0 },
      isModuleRepo: true,
    })
    expect(result.phase).toBe('Ready for Core Orchestration')
    expect(result.recommendedAgents).toEqual([])
    expect(result.llmInstructions.some((i) => i.includes('Do not create business'))).toBe(true)
  })

  it('AC: module with incomplete tech → Knowledge Refinement + module-context-agent', async () => {
    const { assessPhase } = await import('../src/core/delivery-phase.js')
    const result = assessPhase({
      layers: [
        { layer: 'Business', status: 'Not applicable' as any, detected: [] },
        { layer: 'Product', status: 'Not applicable' as any, detected: [] },
        { layer: 'Tech', status: 'Missing' as any, detected: [] },
        { layer: 'Delivery', status: 'Managed by core' as any, detected: [] },
      ],
      roadmap: { present: false, candidates: 0, materialized: 0, remaining: 0 },
      workItems: { total: 0, byState: { draft: 0, ready: 0, 'in-progress': 0, blocked: 0, completed: 0, archived: 0 }, items: [] },
      ownership: { workItemsTotal: 0, workItemsWithOwnership: 0, workItemsMissingOwnership: 0 },
      isModuleRepo: true,
    })
    expect(result.phase).toBe('Knowledge Refinement')
    expect(result.recommendedAgents).toEqual(['module-context-agent'])
  })
})

// --- Context pack ---

describe('VS-093.2 — context pack cleanup', () => {
  it('AC: ready module context pack has empty recommendedAgents (no core agents)', async () => {
    setupModule(true)
    write('.kaddo/scan.json', '{}')
    const { buildContextPack } = await import('../src/core/context-pack.js')
    const { loadConfig } = await import('../src/core/config.js')
    const config = loadConfig(root)
    const pack = buildContextPack(root, config)
    expect(pack.handoff.recommendedAgents).toEqual([])
    expect(pack.isModuleRepo).toBe(true)
  })

  it('AC: module context pack does not include "No project knowledge summary" warning', async () => {
    setupModule(true)
    write('.kaddo/scan.json', '{}')
    const { buildContextPack } = await import('../src/core/context-pack.js')
    const { loadConfig } = await import('../src/core/config.js')
    const config = loadConfig(root)
    const pack = buildContextPack(root, config)
    expect(pack.missing.some((m) => m.includes('No project knowledge summary'))).toBe(false)
  })

  it('AC: module context pack template renders "No local agent action is required"', async () => {
    setupModule(true)
    write('.kaddo/scan.json', '{}')
    const { buildContextPack } = await import('../src/core/context-pack.js')
    const { renderContextPack } = await import('../src/templates/context-pack-template.js')
    const { loadConfig } = await import('../src/core/config.js')
    const config = loadConfig(root)
    const pack = buildContextPack(root, config)
    const md = renderContextPack(pack)
    expect(md).toContain('No local agent action is required')
    expect(md).toContain('managed by the core repository')
  })
})

// --- Explain ---

describe('VS-093.2 — explain cleanup', () => {
  it('AC: module explain missingKnowledge excludes agents/skills/business/product/roadmap/WI', async () => {
    setupModule(true)
    write('.kaddo/scan.json', '{}')
    const { buildProjectExplanation } = await import('../src/core/project-explain.js')
    const exp = buildProjectExplanation(root)
    for (const m of exp.missingKnowledge) {
      expect(m).not.toMatch(/Agents|knowledge\/agents/)
      expect(m).not.toMatch(/Work items/)
      expect(m).not.toMatch(/Roadmap/)
      expect(m).not.toMatch(/Product knowledge/)
    }
  })

  it('AC: module explain suggestedNextSteps: no bootstrap, no add agents/skills', async () => {
    setupModule(true)
    write('.kaddo/scan.json', '{}')
    const { buildProjectExplanation } = await import('../src/core/project-explain.js')
    const exp = buildProjectExplanation(root)
    for (const s of exp.suggestedNextSteps) {
      expect(s).not.toMatch(/kaddo bootstrap/)
      expect(s).not.toMatch(/kaddo add agents/)
      expect(s).not.toMatch(/kaddo add skills/)
    }
  })

  it('AC: module explain suggestedNextSteps direct to core repository', async () => {
    setupModule(true)
    write('.kaddo/scan.json', '{}')
    write('.kaddo/context-pack.md', '# pack')
    const { buildProjectExplanation } = await import('../src/core/project-explain.js')
    const exp = buildProjectExplanation(root)
    expect(exp.suggestedNextSteps.some((s) => s.includes('core repository'))).toBe(true)
  })

  it('AC: module explain render shows Agents/Delivery as "Managed by core"', async () => {
    setupModule(true)
    write('.kaddo/scan.json', '{}')
    const { buildProjectExplanation, renderExplanationHuman } = await import('../src/core/project-explain.js')
    const exp = buildProjectExplanation(root)
    const md = renderExplanationHuman(exp)
    expect(md).toContain('Agents: Managed by core')
    expect(md).toContain('Delivery: Managed by core')
    expect(md).toContain('Business: Not applicable')
    expect(md).toContain('Product: Not applicable')
  })

  it('AC: module explain readiness section shows module-context signal', async () => {
    setupModule(true)
    write('.kaddo/scan.json', '{}')
    const { buildProjectExplanation, renderExplanationHuman } = await import('../src/core/project-explain.js')
    const exp = buildProjectExplanation(root)
    const md = renderExplanationHuman(exp)
    expect(md).toContain('module-context: useful')
    expect(md).toContain('roadmap: managed-by-core')
    expect(md).toContain('work-items: managed-by-core')
  })

  it('AC: module explain readiness overall = ready-for-core-orchestration', async () => {
    setupModule(true)
    write('.kaddo/scan.json', '{}')
    const { buildProjectExplanation, renderExplanationHuman } = await import('../src/core/project-explain.js')
    const exp = buildProjectExplanation(root)
    const md = renderExplanationHuman(exp)
    expect(md).toContain('overall: ready-for-core-orchestration')
  })
})

// --- Understand alignment ---

describe('VS-093.2 — understand alignment', () => {
  it('AC: module understand returns empty steps, agentsInstalled=true', async () => {
    setupModule(true)
    write('.kaddo/scan.json', '{}')
    const { buildUnderstandPlan } = await import('../src/core/understand.js')
    const { loadConfig } = await import('../src/core/config.js')
    const config = loadConfig(root)!
    const plan = buildUnderstandPlan(root, config)
    expect(plan.steps).toEqual([])
    expect(plan.agentsInstalled).toBe(true)
  })
})

// --- MCP exposure ---

describe('VS-093.2 — MCP module readiness', () => {
  it('AC: projectStatus exposes isModuleRepo and readiness for module repos', async () => {
    setupModule(true)
    write('.kaddo/scan.json', '{}')
    const { buildProjectExplanation, renderExplanationAgent } = await import('../src/core/project-explain.js')
    const exp = buildProjectExplanation(root)
    const json = JSON.parse(renderExplanationAgent(exp))
    expect(json.isModuleRepo).toBe(true)
    expect(json.readiness.overall).toBe('ready-for-core-orchestration')
    expect(json.readiness.project_role).toBe('module')
    expect(json.readiness.signals.agents).toBe('managed-by-core')
    expect(json.readiness.signals.skills).toBe('managed-by-core')
  })
})
