// Controlled Deprecation — Production Runbooks (WI-052).
//
// Runbooks are versioned knowledge artifacts. They describe a proposed production change but never
// execute it: production commands remain a human-operated step with explicit approval and evidence.

import matter from 'gray-matter'
import { exists, join, readFile, readDir, writeFile } from '../utils/fs.js'
import { getResource, type ResourceDetail } from './resources.js'
import { environmentSummary, observationStatus } from './deprecation-observation.js'
import { getDeprecationPlan, type DeprecationPlanDetail, type DeprecationTarget } from './deprecation.js'

export const PRODUCTION_RUNBOOK_ARTIFACT_TYPE = 'production-runbook'
export const PRODUCTION_RUNBOOKS_DIR = 'knowledge/delivery/runbooks'
export const RUNBOOK_SECTIONS = [
  'Purpose', 'Preconditions', 'Dependencies', 'Backup/Recovery', 'Impact', 'Execution Order',
  'Commands', 'Expected Results', 'Validation', 'Rollback', 'Abort Conditions',
  'Observation Window', 'Evidence', 'Approval',
] as const

export type RunbookApproval = {
  required: boolean
  status: 'pending' | 'approved'
  approvedBy: string | null
  approvedAt: string | null
}

export type ProductionRunbookContext = {
  eligible: boolean
  plan: Pick<DeprecationPlanDetail, 'id' | 'title' | 'purpose'>
  target: DeprecationTarget
  resource: ResourceDetail | null
  dependencies: DeprecationTarget[]
  blockers: string[]
  nextPath: string
  nextStep: string
}

export type ProductionRunbook = {
  id: string
  title: string
  path: string
  planId: string
  targetId: string
  approval: RunbookApproval
  markdownBody: string
}

export type RunbookFinding = { level: 'error' | 'warning'; message: string }

export class ProductionRunbookError extends Error {
  constructor(message: string) { super(message); this.name = 'ProductionRunbookError' }
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'production-change'
}

function nextRunbookNumber(dir: string): number {
  const root = join(dir, PRODUCTION_RUNBOOKS_DIR)
  return readDir(root).reduce((highest, name) => {
    const match = name.match(/^RB-(\d+)-.+\.md$/i)
    return match ? Math.max(highest, Number(match[1])) : highest
  }, 0) + 1
}

function runbookPath(dir: string, target: DeprecationTarget): string {
  const id = `RB-${String(nextRunbookNumber(dir)).padStart(3, '0')}`
  return `${PRODUCTION_RUNBOOKS_DIR}/${id}-${slug(target.title ?? target.id)}.md`
}

function parseApproval(value: unknown): RunbookApproval {
  const data = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
  const status = data.status === 'approved' ? 'approved' : 'pending'
  return {
    required: data.required === true,
    status,
    approvedBy: stringValue(data.approved_by),
    approvedAt: stringValue(data.approved_at),
  }
}

function sectionPresent(body: string, section: string): boolean {
  const escaped = section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace('/', '\\/')
  return new RegExp(`^##\\s+${escaped}\\s*$`, 'mi').test(body)
}

function destructiveCommands(body: string): string[] {
  const lines = body.split(/\r?\n/)
  return lines.filter((line) => /\b(drop|truncate|delete\s+from|alter\s+(table|database|schema)|create\s+or\s+replace)\b/i.test(line))
}

function relatedTargets(plan: DeprecationPlanDetail, target: DeprecationTarget): DeprecationTarget[] {
  const ids = new Set(target.dependsOnRemoval)
  return plan.targets.filter((candidate) => ids.has(candidate.id))
}

/** Derive bounded, evidence-preserving context for a proposed production runbook. */
export function buildProductionRunbookContext(dir: string, planId: string, targetId: string): ProductionRunbookContext {
  const plan = getDeprecationPlan(dir, planId)
  if (!plan) throw new ProductionRunbookError(`Deprecation Plan "${planId}" not found.`)
  const target = plan.targets.find((candidate) => candidate.id === targetId)
  if (!target) throw new ProductionRunbookError(`Target "${targetId}" not found in ${plan.id}.`)

  const environment = environmentSummary(target)
  const dependencies = relatedTargets(plan, target)
  const blockers: string[] = []
  if (!environment.removedInDevTest) blockers.push('Development and test must both be removed before preparing a production runbook.')
  if (target.lifecycle !== 'production-ready') blockers.push(`Target lifecycle must be production-ready (current: ${target.lifecycle}).`)
  for (const dependency of dependencies) {
    if (!['completed', 'deprecated-retained'].includes(String(dependency.lifecycle))) {
      blockers.push(`Dependency ${dependency.id} is not retired (current: ${dependency.lifecycle}).`)
    }
  }

  const path = runbookPath(dir, target)
  return {
    eligible: blockers.length === 0,
    plan: { id: plan.id, title: plan.title, purpose: plan.purpose },
    target,
    resource: target.resource ? getResource(dir, target.resource) : null,
    dependencies,
    blockers,
    nextPath: path,
    nextStep: blockers.length > 0
      ? 'Resolve the listed safeguards; no production proposal can be persisted yet.'
      : 'Review the generated proposal, obtain human approval, execute manually, then record evidence and validate the observation window.',
  }
}

function renderRunbook(context: ProductionRunbookContext): string {
  const target = context.target
  const resource = context.resource
  const dependencies = context.dependencies.length > 0 ? context.dependencies.map((item) => `- ${item.id}: ${item.title ?? item.locator ?? item.id}`).join('\n') : '- None declared.'
  const evidence = Object.entries(target.usageEvidence)
    .map(([signal, value]) => `- ${signal}: ${value.status} (${value.quality})${value.detail ? ` — ${value.detail}` : ''}`)
    .join('\n') || '- No usage evidence declared. Do not infer no usage.'
  const observation = observationStatus(target)
  const resourceBoundary = resource
    ? `- Resource: ${resource.id} (${resource.title})\n- Production boundary: ${(resource.boundaries.production ?? []).join(', ') || 'not declared'}\n- Interfaces: ${resource.interfaces.map((item) => item.type).join(', ') || 'not declared'}`
    : '- No Project Resource is linked to this target.'

  return [
    '# Production Runbook', '',
    '## Purpose', '', `Safely apply the approved production change for ${target.id} (${target.title ?? target.locator ?? target.id}) in ${context.plan.id}.`, '',
    '## Preconditions', '', '- [ ] Development and test are removed and verified.', '- [ ] A human has reviewed this proposal and explicitly approved the production window.', '- [ ] Required backups/recovery points are verified before any change.', '',
    '## Dependencies', '', dependencies, '',
    '## Backup/Recovery', '', '- [ ] Record the backup, snapshot, export, or recovery point identifier before execution.', '- [ ] Confirm the restoration owner and recovery procedure.', '',
    '## Impact', '', `- Target: ${target.type} at ${target.locator ?? 'not declared'}.`, `- Assessment: blast radius=${target.assessment.blastRadius ?? 'not evaluated'}; reversibility=${target.assessment.reversibility ?? 'not evaluated'}.`, resourceBoundary, '',
    '## Execution Order', '', '1. Confirm approval and the production change window.', '2. Verify the backup/recovery point.', '3. Execute the reviewed command manually.', '4. Capture actual results and validate before continuing.', '',
    '## Commands', '', '> Kaddo never executes production commands. Add only human-reviewed commands here after approval; do not place unattended automation in this runbook.', '',
    '## Expected Results', '', '- The approved target changes only in production.', '- No unrelated dependency or resource boundary is changed.', '',
    '## Validation', '', '- [ ] Validate the expected result using the linked resource/interface.', '- [ ] Confirm no unexpected errors or consumer regressions.', '',
    '## Rollback', '', '- [ ] Stop the change and apply the documented recovery procedure if validation fails.', '- [ ] Record the rollback result in Evidence.', '',
    '## Abort Conditions', '', '- Abort if the backup/recovery point is missing or cannot be restored.', '- Abort if approval is absent, the production window changes, or validation reveals unexpected impact.', '',
    '## Observation Window', '', `- ${observation.declared ? `Existing observation: ${observation.reasons.join(' ')}` : 'After the production change, declare the observation window and exit criteria.'}`, '- After manual validation, progress the target through production-changed → observing → completed only when the declared criteria are met. Kaddo never advances this lifecycle automatically.', '',
    '## Evidence', '', evidence, '',
    '## Approval', '', '- Required: human approval before manual execution.', '- Status: pending.', '- Approved by: not recorded.', '- Approved at: not recorded.', '',
  ].join('\n')
}

/** Persist a runbook proposal. This is a knowledge write only; it never performs the described change. */
export function createProductionRunbook(dir: string, planId: string, targetId: string): ProductionRunbook {
  const context = buildProductionRunbookContext(dir, planId, targetId)
  if (!context.eligible) throw new ProductionRunbookError(context.blockers.join(' '))
  const path = context.nextPath
  const id = path.split('/').pop()?.match(/^(RB-\d+)-/)?.[1] ?? ''
  const content = matter.stringify(renderRunbook(context), {
    id,
    type: PRODUCTION_RUNBOOK_ARTIFACT_TYPE,
    title: `Production runbook — ${context.target.title ?? context.target.id}`,
    deprecation_plan: context.plan.id,
    deprecation_target: context.target.id,
    resource: context.target.resource,
    approval: { required: true, status: 'pending', approved_by: null, approved_at: null },
  })
  const absolute = join(dir, path)
  if (exists(absolute)) throw new ProductionRunbookError(`Runbook already exists: ${path}`)
  writeFile(absolute, content)
  return {
    id,
    title: `Production runbook — ${context.target.title ?? context.target.id}`,
    path,
    planId: context.plan.id,
    targetId: context.target.id,
    approval: { required: true, status: 'pending', approvedBy: null, approvedAt: null },
    markdownBody: renderRunbook(context),
  }
}

export function getProductionRunbook(dir: string, id: string): ProductionRunbook | null {
  const root = join(dir, PRODUCTION_RUNBOOKS_DIR)
  for (const name of readDir(root)) {
    if (!name.toLowerCase().startsWith(`${id.toLowerCase()}-`) || !name.endsWith('.md')) continue
    const path = `${PRODUCTION_RUNBOOKS_DIR}/${name}`
    const parsed = matter(readFile(join(dir, path)))
    const data = parsed.data as Record<string, unknown>
    if (data.type !== PRODUCTION_RUNBOOK_ARTIFACT_TYPE) continue
    return {
      id: stringValue(data.id) ?? id,
      title: stringValue(data.title) ?? id,
      path,
      planId: stringValue(data.deprecation_plan) ?? '',
      targetId: stringValue(data.deprecation_target) ?? '',
      approval: parseApproval(data.approval),
      markdownBody: parsed.content.trim(),
    }
  }
  return null
}

/** Validate structure and the explicit human-approval boundary of a runbook. */
export function validateProductionRunbook(runbook: ProductionRunbook): RunbookFinding[] {
  const findings: RunbookFinding[] = []
  for (const section of RUNBOOK_SECTIONS) {
    if (!sectionPresent(runbook.markdownBody, section)) findings.push({ level: 'error', message: `Missing required section: ${section}.` })
  }
  if (!runbook.approval.required) findings.push({ level: 'error', message: 'Human approval must be required for a production runbook.' })
  const destructive = destructiveCommands(runbook.markdownBody)
  if (destructive.length > 0 && (runbook.approval.status !== 'approved' || !runbook.approval.approvedBy || !runbook.approval.approvedAt)) {
    findings.push({ level: 'error', message: 'Destructive production commands require explicit human approval with approver and timestamp.' })
  }
  if (destructive.length > 0) findings.push({ level: 'warning', message: 'Destructive commands are documentation only; Kaddo will never execute them.' })
  return findings
}
