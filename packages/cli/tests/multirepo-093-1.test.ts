import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

// Helpers
let root: string
beforeEach(() => { root = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-093-1-')) })
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

const CORE_CONFIG = `version: 1
project:
  name: acme-platform
  state: pre-ai
  structure: multirepo
  role: core
  language: en
team:
  size: small
system:
  name: acme-platform
multirepo:
  role: core
  modules_file: .kaddo/modules.yml
  workspace_roots:
    - '..'
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

function setupModule(mcQuality: 'useful' | 'placeholder' | 'missing' = 'useful') {
  write('.kaddo/config.yml', MODULE_CONFIG)
  if (mcQuality === 'useful') {
    write('knowledge/tech/module/module-context.md', USEFUL_MD)
  } else if (mcQuality === 'placeholder') {
    write('knowledge/tech/module/module-context.md', '---\ntype: module-context\n---\n\n# Module Context\n\nTODO\n')
  }
  write('knowledge/tech/current-state.md', `---
type: current-state
---

## Architecture

The billing module is a Fastify-based REST API backed by PostgreSQL. It uses a layered architecture with controllers, services, and repositories. The service layer handles all business logic including subscription lifecycle management, invoice generation, and payment processing through the Stripe SDK integration.

## Runtime

Deployed on AWS ECS with Fargate launch type. The container runs Node.js 20 with TypeScript compiled to ESM. Health checks are exposed on /health and /ready endpoints. Logging uses structured JSON output to CloudWatch.

## Infrastructure

PostgreSQL 15 on RDS with read replicas for reporting queries. Redis 7 on ElastiCache for session caching and rate limiting. The module connects to the core event bus via SQS queues for async communication.
`)
  write('knowledge/tech/codebase.md', `---
type: codebase
---

## Codebase

TypeScript monolith organized under src/ with the following structure: controllers/ for HTTP handlers, services/ for business logic, repositories/ for data access, and models/ for domain types. The project uses Vitest for testing with integration tests against a local PostgreSQL instance.

## Entry

src/index.ts bootstraps the Fastify server, registers plugins, and starts listening on the configured port. Configuration is loaded from environment variables validated with Zod schemas at startup time.

## Build

The project uses tsup for building, producing ESM output in dist/. The Dockerfile uses a multi-stage build to minimize the production image size.
`)
}

function setupCore() {
  write('.kaddo/config.yml', CORE_CONFIG)
  write('knowledge/business/business.md', '---\ntype: business\n---\n\n## Business\n\nAcme handles payments for SMBs.\n\n## Market\n\nSMB segment in Latin America.\n')
  write('knowledge/product/product.md', '---\ntype: product\n---\n\n## Product\n\nBilling platform for SMBs.\n\n## Users\n\nSMB owners managing subscriptions.\n')
  write('knowledge/product/capabilities.md', '---\ntype: capabilities\n---\n\n## Capabilities\n\nSubscription management, invoicing, payment processing.\n\n## Domains\n\nBilling, invoicing.\n')
  write('knowledge/tech/current-state.md', '---\ntype: current-state\n---\n\n## Architecture\n\nMicroservices.\n\n## Runtime\n\nKubernetes.\n')
  write('knowledge/tech/codebase.md', '---\ntype: codebase\n---\n\n## Codebase\n\nMonorepo with packages/.\n\n## Entry\n\npackages/api/src/index.ts.\n')
}

// --- VS-093.1: Project Route for modules ---

describe('VS-093.1 — module project route', () => {
  it('AC: module repos get 7-step route', async () => {
    setupModule()
    const { buildProjectRoute } = await import('../src/core/project-route.js')
    const route = buildProjectRoute(root)
    expect(route.total).toBe(7)
    const ids = route.steps.map((s) => s.id)
    expect(ids).toContain('enable-kaddo')
    expect(ids).toContain('scan-repository')
    expect(ids).toContain('refine-module-context')
    expect(ids).toContain('describe-current-state')
    expect(ids).toContain('map-codebase')
    expect(ids).toContain('validate-module-knowledge')
    expect(ids).toContain('ready-for-core-orchestration')
    // Must NOT contain core steps
    expect(ids).not.toContain('define-business')
    expect(ids).not.toContain('define-product')
    expect(ids).not.toContain('prepare-implementation')
  })

  it('AC: core repos get the full route (not module route)', async () => {
    setupCore()
    const { buildProjectRoute } = await import('../src/core/project-route.js')
    const route = buildProjectRoute(root)
    expect(route.total).toBeGreaterThan(7)
    const ids = route.steps.map((s) => s.id)
    expect(ids).not.toContain('refine-module-context')
  })
})

// --- VS-093.1: Knowledge layers for modules ---

describe('VS-093.1 — module knowledge layers', () => {
  it('AC: Business/Product = Not applicable, Delivery = Managed by core', async () => {
    setupModule()
    const { knowledgeLayers } = await import('../src/core/layers.js')
    const layers = knowledgeLayers(root)
    const biz = layers.find((l) => l.layer === 'Business')
    const prod = layers.find((l) => l.layer === 'Product')
    const del = layers.find((l) => l.layer === 'Delivery')
    expect(biz?.status).toBe('Not applicable')
    expect(prod?.status).toBe('Not applicable')
    expect(del?.status).toBe('Managed by core')
  })

  it('AC: Tech layer still evaluates normally for modules', async () => {
    setupModule()
    const { knowledgeLayers } = await import('../src/core/layers.js')
    const layers = knowledgeLayers(root)
    const tech = layers.find((l) => l.layer === 'Tech')
    expect(tech).toBeTruthy()
    expect(tech?.status).not.toBe('Not applicable')
    expect(tech?.status).not.toBe('Managed by core')
  })

  it('AC: core repos get normal layers', async () => {
    setupCore()
    const { knowledgeLayers } = await import('../src/core/layers.js')
    const layers = knowledgeLayers(root)
    const biz = layers.find((l) => l.layer === 'Business')
    expect(biz?.status).not.toBe('Not applicable')
  })
})

// --- VS-093.1: delivery-phase module awareness ---

describe('VS-093.1 — module delivery phase', () => {
  it('AC: module with incomplete tech → Knowledge Refinement + module-context-agent', async () => {
    const { assessPhase } = await import('../src/core/delivery-phase.js')
    const result = assessPhase({
      layers: [
        { layer: 'Business', status: 'Not applicable' as any, detected: [] },
        { layer: 'Product', status: 'Not applicable' as any, detected: [] },
        { layer: 'Tech', status: 'Placeholder' as any, detected: [] },
        { layer: 'Delivery', status: 'Managed by core' as any, detected: [] },
      ],
      roadmap: { present: false, candidates: 0, materialized: 0, remaining: 0 },
      workItems: { total: 0, byState: { draft: 0, ready: 0, 'in-progress': 0, blocked: 0, completed: 0, archived: 0 }, items: [] },
      ownership: { workItemsTotal: 0, workItemsWithOwnership: 0, workItemsMissingOwnership: 0 },
      isModuleRepo: true,
    })
    expect(result.phase).toBe('Knowledge Refinement')
    expect(result.recommendedAgents).toContain('module-context-agent')
    expect(result.recommendedAgents).not.toContain('business-agent')
    expect(result.recommendedAgents).not.toContain('capability-agent')
    expect(result.nextStep).toContain('module-context-agent')
    expect(result.nextStep).toContain('knowledge/tech/module/module-context.md')
  })

  it('AC: module with complete tech → ready, no business/product agents', async () => {
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
    expect(result.recommendedAgents).not.toContain('business-agent')
    expect(result.recommendedAgents).not.toContain('roadmap-agent')
    expect(result.llmInstructions.some((i) => i.includes('Do not create business'))).toBe(true)
  })
})

// --- VS-093.1: next-step canonical paths and instructions ---

describe('VS-093.1 — next-step module handoff', () => {
  it('AC: refine-module-context uses canonical path and prohibits business/product/roadmap/WI', async () => {
    setupModule('placeholder')
    write('.kaddo/scan.json', '{}')
    write('.kaddo/context-pack.md', '# Context')
    const { resolveNextStep } = await import('../src/core/next-step.js')
    const rec = resolveNextStep(root)
    expect(rec.id).toBe('refine-module-context')
    expect(rec.label).toContain('knowledge/tech/module/module-context.md')
    expect(rec.agent).toBe('module-context-agent')
    expect(rec.skill).toBe('module-context-refinement')
    expect(rec.instructions).toBeDefined()
    expect(rec.instructions!.some((i: string) => i.includes('business'))).toBe(true)
    expect(rec.instructions!.some((i: string) => i.includes('agents or skills'))).toBe(true)
    expect(rec.instructions!.some((i: string) => i.includes('application code'))).toBe(true)
  })

  it('AC: module-ready phase = Ready for Core Orchestration', async () => {
    setupModule('useful')
    write('.kaddo/scan.json', '{"language":"typescript","framework":"fastify","packageManager":"pnpm","sourceDirectories":["src"],"migrationDirectories":[],"contractFiles":[],"infrastructureFiles":[]}')
    write('.kaddo/context-pack.md', '# Context')
    write('.kaddo/understand.md', '# Understand')
    const { resolveNextStep } = await import('../src/core/next-step.js')
    const rec = resolveNextStep(root)
    expect(rec.id).toBe('module-ready')
    expect(rec.phase).toBe('Ready for Core Orchestration')
  })

  it('AC: module next-step never recommends business-agent or capability-agent', async () => {
    setupModule('placeholder')
    const { resolveNextStep } = await import('../src/core/next-step.js')
    const rec = resolveNextStep(root)
    expect(rec.agent).not.toBe('business-agent')
    expect(rec.agent).not.toBe('capability-agent')
  })
})

// --- VS-093.1: add agents/skills guard for modules ---

describe('VS-093.1 — add agents/skills guard', () => {
  it('AC: kaddo add agents exits with error on module repos', async () => {
    setupModule()
    const { runAdd } = await import('../src/commands/add.js')
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => { throw new Error('exit') }) as any)
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      runAdd('agents', {}, root)
    } catch (e: any) {
      expect(e.message).toBe('exit')
    }
    expect(exitSpy).toHaveBeenCalledWith(1)
    expect(errSpy.mock.calls.some((c) => String(c[0]).includes('Module repos'))).toBe(true)
    exitSpy.mockRestore()
    errSpy.mockRestore()
  })

  it('AC: kaddo add skills exits with error on module repos', async () => {
    setupModule()
    const { runAdd } = await import('../src/commands/add.js')
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => { throw new Error('exit') }) as any)
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      runAdd('skills', {}, root)
    } catch (e: any) {
      expect(e.message).toBe('exit')
    }
    expect(exitSpy).toHaveBeenCalledWith(1)
    expect(errSpy.mock.calls.some((c) => String(c[0]).includes('Module repos'))).toBe(true)
    exitSpy.mockRestore()
    errSpy.mockRestore()
  })
})

// --- VS-093.1: module-context-agent in RECOMMENDED_BY_STATE ---

describe('VS-093.1 — module-context-agent in recommended agents', () => {
  it('AC: module-context-agent.md in pre-ai recommended set', async () => {
    const { recommendedAgents } = await import('../src/agents/groups.js')
    const agents = recommendedAgents('pre-ai')
    expect(agents).toContain('module-context-agent.md')
  })

  it('AC: module-context-agent.md in new recommended set', async () => {
    const { recommendedAgents } = await import('../src/agents/groups.js')
    const agents = recommendedAgents('new')
    expect(agents).toContain('module-context-agent.md')
  })
})

// --- VS-093.1: understand plan for modules ---

describe('VS-093.1 — understand plan for modules', () => {
  it('AC: module repos get empty steps and no missing agents', async () => {
    setupModule()
    const { loadConfig } = await import('../src/core/config.js')
    const { buildUnderstandPlan } = await import('../src/core/understand.js')
    const config = loadConfig(root)!
    const plan = buildUnderstandPlan(root, config)
    expect(plan.steps).toHaveLength(0)
    expect(plan.missingAgents).toHaveLength(0)
    expect(plan.agentsInstalled).toBe(true)
  })
})

// --- VS-093.1: mapNextStepId for module IDs ---

describe('VS-093.1 — mapNextStepId module mappings', () => {
  it('AC: module route step IDs are correctly mapped', async () => {
    setupModule()
    const { buildProjectRoute } = await import('../src/core/project-route.js')
    const route = buildProjectRoute(root)
    const ids = route.steps.map((s) => s.id)
    expect(ids).toContain('refine-module-context')
    expect(ids).toContain('ready-for-core-orchestration')
    expect(ids).not.toContain('refine-work-item')
    expect(ids).not.toContain('prepare-implementation')
  })
})

// --- VS-093.1: safety ---

describe('VS-093.1 — safety', () => {
  it('modified files do not import child_process or LLM SDKs', () => {
    const files = [
      'packages/cli/src/core/project-route.ts',
      'packages/cli/src/core/layers.ts',
      'packages/cli/src/core/delivery-phase.ts',
      'packages/cli/src/core/understand.ts',
      'packages/cli/src/commands/add.ts',
      'packages/cli/src/agents/groups.ts',
      'packages/cli/src/core/project-explain.ts',
    ]
    for (const f of files) {
      const src = fs.readFileSync(path.resolve(__dirname, '..', '..', '..', f), 'utf-8')
      expect(src).not.toContain('execSync')
      expect(src).not.toContain('child_process')
      expect(src).not.toContain('openai')
      expect(src).not.toContain('anthropic')
    }
  })
})

// --- VS-093.1: project-explain includes isModuleRepo ---

describe('VS-093.1 — project explain module awareness', () => {
  it('AC: module repo explanation has isModuleRepo=true', async () => {
    setupModule()
    const { buildProjectExplanation } = await import('../src/core/project-explain.js')
    const exp = buildProjectExplanation(root)
    expect(exp.isModuleRepo).toBe(true)
  })

  it('AC: core repo explanation has isModuleRepo=false', async () => {
    setupCore()
    const { buildProjectExplanation } = await import('../src/core/project-explain.js')
    const exp = buildProjectExplanation(root)
    expect(exp.isModuleRepo).toBe(false)
  })
})
