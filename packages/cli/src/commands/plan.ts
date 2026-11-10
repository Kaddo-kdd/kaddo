// kaddo plan / kaddo epic — CLI surface over Delivery Planning Core (WI-074).
//
// Thin presentation layer: every operation delegates to @kaddo/cli/core. No business logic here.
// Mutations are explicit, validated and confirmed; they never change another element's lifecycle.

import { cwd } from '../utils/fs.js'
import { loadConfig } from '../core/config.js'
import { intro, outro, log, text, confirm, cancel } from '../utils/ui.js'
import {
  discoverDeliveryPlans,
  discoverEpics,
  getPlan,
  getEpic,
  epicsInPlan,
  initiativesInEpic,
  computePlanProgress,
  computeEpicProgress,
  validatePlanningGraph,
} from '../core/delivery-planning.js'
import {
  createDeliveryPlan,
  createEpic,
  associateInitiativeWithEpic,
  transitionDeliveryPlan,
  transitionEpic,
  recordPlanOutcomeVerification,
  recordEpicOutcomeVerification,
  recordMilestoneExitVerification,
  completeDeliveryPlan,
  completeEpic,
  DeliveryPlanningWriteError,
  PlanningNotReadyError,
  type OutcomeEvidenceInput,
} from '../core/delivery-planning-write.js'
import {
  evaluatePlanCompletion,
  evaluateEpicCompletion,
  type EntityCompletionEvaluation,
} from '../core/delivery-verification.js'

function requireInit(dir: string): void {
  if (!loadConfig(dir)) {
    log.error('Kaddo is not initialized. Run `kaddo init` first.')
    process.exit(1)
  }
}

function planFindings(dir: string, subjectPrefix: string): void {
  const findings = validatePlanningGraph(dir).filter((f) => f.subject.toLowerCase().startsWith(subjectPrefix.toLowerCase()))
  for (const f of findings) log.warn(`  [${f.level}] ${f.message}`)
}

// --- Plans -----------------------------------------------------------------

export function runPlanList(): void {
  const dir = cwd()
  requireInit(dir)
  intro('kaddo plan list')
  const plans = discoverDeliveryPlans(dir)
  if (plans.length === 0) {
    log.info('No delivery plans yet. Create one with `kaddo plan create`.')
    outro('Nothing to show.')
    return
  }
  for (const p of plans) {
    const prog = computePlanProgress(dir, p)
    log.info(`${p.id} — ${p.title}  [${p.status}]  epics ${prog.epics.total} · delivery ${prog.delivery.completed}/${prog.delivery.total} completed · milestones ${p.milestones.length}`)
  }
  outro(`${plans.length} plan(s).`)
}

export function runPlanShow(id: string): void {
  const dir = cwd()
  requireInit(dir)
  intro(`kaddo plan show ${id}`)
  const plan = getPlan(dir, id)
  if (!plan) { log.error(`Plan ${id} not found.`); process.exit(1) }
  log.info(`  ${plan.id} — ${plan.title}`)
  log.info(`  Status: ${plan.status}`)
  if (plan.objective) log.info(`  Objective: ${plan.objective}`)
  log.info(`  Milestones: ${plan.milestones.length}`)
  for (const m of plan.milestones) log.info(`    - ${m.id}: ${m.title}${m.exitCriteria.length ? ` (${m.exitCriteria.length} exit criteria)` : ''}`)
  const epics = epicsInPlan(dir, plan.id)
  log.info(`  Epics: ${epics.length}`)
  for (const e of epics) log.info(`    - ${e.id}: ${e.title} [${e.status}]${e.milestone ? ` · ${e.milestone}` : ''}`)
  if (plan.dependsOn.length) log.info(`  Depends on: ${plan.dependsOn.join(', ')}`)
  planFindings(dir, 'PLAN')
  outro(`Plan ${plan.id}.`)
}

export function runPlanProgress(id: string): void {
  const dir = cwd()
  requireInit(dir)
  intro(`kaddo plan progress ${id}`)
  const plan = getPlan(dir, id)
  if (!plan) { log.error(`Plan ${id} not found.`); process.exit(1) }
  const p = computePlanProgress(dir, plan)
  log.info(`  Status: ${p.status}`)
  log.info('')
  log.info(`  Planning coverage: ${p.planning.initiatives} initiative(s) · ${p.planning.materialized}/${p.planning.candidates} candidates materialized`)
  log.info(`  Delivery progress: ${p.delivery.completed}/${p.delivery.total} Work Items completed · ${p.delivery.blocked} blocked`)
  for (const [state, n] of Object.entries(p.delivery.byState)) if (n > 0) log.info(`    ${state}: ${n}`)
  log.info('')
  log.info(`  Completion readiness: criteria ${p.readiness.successCriteria} · preconditions met: ${p.readiness.meetsCompletionPreconditions ? 'yes' : 'no'} · human approval required: yes`)
  if (p.readiness.blockingDependencies.length) log.warn(`  Blocking dependencies: ${p.readiness.blockingDependencies.join(', ')}`)
  outro(`Progress for ${plan.id}.`)
}

export async function runPlanCreate(): Promise<void> {
  const dir = cwd()
  requireInit(dir)
  intro('kaddo plan create')
  const title = await text({ message: 'Plan title', placeholder: 'Technical Roadmap' })
  if (typeof title !== 'string' || !title.trim()) { cancel('Cancelled.'); return }
  const ok = await confirm({ message: `Create delivery plan "${title.trim()}"?` })
  if (ok !== true) { cancel('Cancelled.'); return }
  try {
    const plan = createDeliveryPlan(dir, { title })
    log.success(`Created ${plan.id} — ${plan.title}.`)
    outro(`Edit ${plan.relPath} to add milestones, dependencies and success criteria.`)
  } catch (err) {
    log.error(err instanceof DeliveryPlanningWriteError ? err.message : String(err))
    process.exit(1)
  }
}

// --- Epics -----------------------------------------------------------------

export function runEpicList(): void {
  const dir = cwd()
  requireInit(dir)
  intro('kaddo epic list')
  const epics = discoverEpics(dir)
  if (epics.length === 0) {
    log.info('No epics yet. Create one with `kaddo epic create`.')
    outro('Nothing to show.')
    return
  }
  for (const e of epics) {
    const prog = computeEpicProgress(dir, e)
    log.info(`${e.id} — ${e.title}  [${e.status}]  ${e.plan ? `${e.plan}${e.milestone ? `/${e.milestone}` : ''} · ` : ''}delivery ${prog.delivery.completed}/${prog.delivery.total} completed`)
  }
  outro(`${epics.length} epic(s).`)
}

export function runEpicShow(id: string): void {
  const dir = cwd()
  requireInit(dir)
  intro(`kaddo epic show ${id}`)
  const epic = getEpic(dir, id)
  if (!epic) { log.error(`Epic ${id} not found.`); process.exit(1) }
  log.info(`  ${epic.id} — ${epic.title}`)
  log.info(`  Status: ${epic.status}`)
  if (epic.outcome) log.info(`  Outcome: ${epic.outcome}`)
  if (epic.plan) log.info(`  Plan: ${epic.plan}${epic.milestone ? ` · milestone ${epic.milestone}` : ''}`)
  if (epic.relatedCapabilities.length) log.info(`  Capabilities: ${epic.relatedCapabilities.join(', ')}`)
  if (epic.dependsOn.length) log.info(`  Depends on: ${epic.dependsOn.join(', ')}`)
  const inis = initiativesInEpic(dir, epic.id)
  log.info(`  Initiatives: ${inis.length}`)
  for (const i of inis) log.info(`    - ${i.id}: ${i.title} [${i.status}]${i.owners.length ? ` · owners ${i.owners.join(', ')}` : ''}`)
  planFindings(dir, epic.id)
  outro(`Epic ${epic.id}.`)
}

export function runEpicProgress(id: string): void {
  const dir = cwd()
  requireInit(dir)
  intro(`kaddo epic progress ${id}`)
  const epic = getEpic(dir, id)
  if (!epic) { log.error(`Epic ${id} not found.`); process.exit(1) }
  const p = computeEpicProgress(dir, epic)
  log.info(`  Status: ${p.status}`)
  log.info('')
  log.info(`  Planning coverage: ${p.planning.initiatives} initiative(s) · ${p.planning.materialized}/${p.planning.candidates} candidates materialized`)
  log.info(`  Delivery progress: ${p.delivery.completed}/${p.delivery.total} Work Items completed · ${p.delivery.blocked} blocked`)
  for (const [state, n] of Object.entries(p.delivery.byState)) if (n > 0) log.info(`    ${state}: ${n}`)
  log.info('')
  log.info(`  Completion readiness: criteria ${p.readiness.successCriteria} · preconditions met: ${p.readiness.meetsCompletionPreconditions ? 'yes' : 'no'} · human approval required: yes`)
  if (p.readiness.blockingDependencies.length) log.warn(`  Blocking dependencies: ${p.readiness.blockingDependencies.join(', ')}`)
  outro(`Progress for ${epic.id}.`)
}

export async function runEpicCreate(): Promise<void> {
  const dir = cwd()
  requireInit(dir)
  intro('kaddo epic create')
  const title = await text({ message: 'Epic title', placeholder: 'Runtime Performance & Concurrency' })
  if (typeof title !== 'string' || !title.trim()) { cancel('Cancelled.'); return }
  const plan = await text({ message: 'Related plan id (optional, Enter to skip)', placeholder: 'PLAN-001' })
  const planId = typeof plan === 'string' && plan.trim() ? plan.trim() : undefined
  const ok = await confirm({ message: `Create epic "${title.trim()}"${planId ? ` in ${planId}` : ''}?` })
  if (ok !== true) { cancel('Cancelled.'); return }
  try {
    const epic = createEpic(dir, { title, plan: planId })
    log.success(`Created ${epic.id} — ${epic.title}.`)
    outro(`Edit ${epic.relPath} to add the expected outcome, success criteria and dependencies.`)
  } catch (err) {
    log.error(err instanceof DeliveryPlanningWriteError ? err.message : String(err))
    process.exit(1)
  }
}

export async function runEpicAssociate(epicId: string, initiativeId: string): Promise<void> {
  const dir = cwd()
  requireInit(dir)
  intro(`kaddo epic associate ${epicId} ${initiativeId}`)
  const ok = await confirm({ message: `Associate Initiative ${initiativeId} with Epic ${epicId}?` })
  if (ok !== true) { cancel('Cancelled.'); return }
  try {
    const ini = associateInitiativeWithEpic(dir, initiativeId, epicId)
    log.success(`${ini.id} is now part of ${epicId}.`)
    outro('Association recorded on the Initiative.')
  } catch (err) {
    log.error(err instanceof DeliveryPlanningWriteError ? err.message : String(err))
    process.exit(1)
  }
}

// --- Lifecycle, outcome verification and evidence-based completion (WI-078) ---

const EVIDENCE_STATUSES = ['passed', 'failed', 'not-verified', 'manual-review-required'] as const

function printEvaluation(ev: EntityCompletionEvaluation): void {
  log.info(`  Readiness: ${ev.readiness}`)
  const o = ev.outcome
  log.info(`  Outcome criteria: ${o.passed}/${o.total} passed${o.failed ? ` · ${o.failed} failed` : ''}${o.notVerified ? ` · ${o.notVerified} unverified` : ''}${o.ambiguous ? ` · ${o.ambiguous} ambiguous` : ''}`)
  for (const c of o.criteria) log.info(`    [${c.status}${c.waived ? '/waived' : ''}${c.ambiguous ? '/ambiguous' : ''}] ${c.criterion}`)
  if (o.stale.length) log.warn(`  Stale evidence (criterion changed): ${o.stale.map((s) => s.criterion).join('; ')}`)
  if (ev.milestones) for (const m of ev.milestones) log.info(`  Milestone ${m.id}: ${m.outcome.passed}/${m.outcome.total} exit criteria verified`)
  if (ev.blockingDependencies.length) log.warn(`  Blocking dependencies: ${ev.blockingDependencies.join(', ')}`)
  for (const b of ev.blockers) log.warn(`  Blocker: ${b}`)
  for (const w of ev.warnings) log.warn(`  Warning: ${w}`)
  for (const r of ev.reasons) log.info(`  ${r}`)
  log.info('  Completion is never automatic — it always requires an explicit human decision.')
}

function evidenceInput(opts: { criterion?: string; status?: string; evidence?: string; reference?: string; method?: string; by?: string }): OutcomeEvidenceInput {
  if (!opts.criterion?.trim()) { log.error('A --criterion is required.'); process.exit(1) }
  const status = opts.status ?? 'passed'
  if (!(EVIDENCE_STATUSES as readonly string[]).includes(status)) { log.error(`--status must be one of: ${EVIDENCE_STATUSES.join(', ')}.`); process.exit(1) }
  const method = opts.method === 'automated' || opts.method === 'manual' ? opts.method : undefined
  return { criterion: opts.criterion.trim(), status: status as OutcomeEvidenceInput['status'], evidence: opts.evidence, reference: opts.reference, method, verifiedBy: opts.by }
}

export function runPlanStart(id: string): void {
  const dir = cwd(); requireInit(dir)
  intro(`kaddo plan start ${id}`)
  try { const p = transitionDeliveryPlan(dir, id, 'in-progress'); log.success(`Plan ${p.id} is now ${p.status}.`); outro('Started.') }
  catch (err) { log.error(err instanceof DeliveryPlanningWriteError ? err.message : String(err)); process.exit(1) }
}

export function runPlanVerify(id: string, opts: { json?: boolean } = {}): void {
  const dir = cwd(); requireInit(dir)
  const plan = getPlan(dir, id)
  if (!plan) { if (opts.json) console.log(JSON.stringify({ error: `Plan ${id} not found.` })); else log.error(`Plan ${id} not found.`); process.exit(1) }
  const ev = evaluatePlanCompletion(dir, plan!)
  if (opts.json) { console.log(JSON.stringify(ev, null, 2)); return }
  intro(`kaddo plan verify ${id}`); printEvaluation(ev); outro(`Plan ${id} — ${ev.readiness}.`)
}

export async function runPlanComplete(id: string, opts: { yes?: boolean; by?: string } = {}): Promise<void> {
  const dir = cwd(); requireInit(dir)
  intro(`kaddo plan complete ${id}`)
  const plan = getPlan(dir, id)
  if (!plan) { log.error(`Plan ${id} not found.`); process.exit(1) }
  const ev = evaluatePlanCompletion(dir, plan!)
  printEvaluation(ev)
  if (ev.readiness !== 'READY_TO_COMPLETE' && ev.readiness !== 'READY_WITH_EXCEPTIONS') { log.error(`Plan ${id} is not ready to complete (${ev.readiness}).`); process.exit(1) }
  const ok = opts.yes === true || (await confirm({ message: `Complete Plan ${id}? This records a human completion decision.` })) === true
  if (!ok) { cancel('Cancelled.'); return }
  try { const done = completeDeliveryPlan(dir, id, { decidedBy: opts.by }); log.success(`Plan ${done.id} completed (${ev.readiness}).`); outro('Completion decision recorded.') }
  catch (err) { log.error(err instanceof DeliveryPlanningWriteError ? err.message : String(err)); process.exit(1) }
}

export function runPlanEvidence(id: string, opts: { criterion?: string; status?: string; evidence?: string; reference?: string; method?: string; milestone?: string; by?: string } = {}): void {
  const dir = cwd(); requireInit(dir)
  intro(`kaddo plan evidence ${id}`)
  const input = evidenceInput(opts)
  try {
    if (opts.milestone) { recordMilestoneExitVerification(dir, id, opts.milestone, input); log.success(`Recorded evidence for milestone ${opts.milestone} criterion.`) }
    else { recordPlanOutcomeVerification(dir, id, input); log.success('Recorded Plan outcome evidence.') }
    outro(`[${input.status}] ${input.criterion}`)
  } catch (err) { log.error(err instanceof DeliveryPlanningWriteError ? err.message : String(err)); process.exit(1) }
}

export function runEpicStart(id: string): void {
  const dir = cwd(); requireInit(dir)
  intro(`kaddo epic start ${id}`)
  try { const e = transitionEpic(dir, id, 'in-progress'); log.success(`Epic ${e.id} is now ${e.status}.`); outro('Started.') }
  catch (err) { log.error(err instanceof DeliveryPlanningWriteError ? err.message : String(err)); process.exit(1) }
}

export function runEpicVerify(id: string, opts: { json?: boolean } = {}): void {
  const dir = cwd(); requireInit(dir)
  const epic = getEpic(dir, id)
  if (!epic) { if (opts.json) console.log(JSON.stringify({ error: `Epic ${id} not found.` })); else log.error(`Epic ${id} not found.`); process.exit(1) }
  const ev = evaluateEpicCompletion(dir, epic!)
  if (opts.json) { console.log(JSON.stringify(ev, null, 2)); return }
  intro(`kaddo epic verify ${id}`); printEvaluation(ev); outro(`Epic ${id} — ${ev.readiness}.`)
}

export async function runEpicComplete(id: string, opts: { yes?: boolean; by?: string } = {}): Promise<void> {
  const dir = cwd(); requireInit(dir)
  intro(`kaddo epic complete ${id}`)
  const epic = getEpic(dir, id)
  if (!epic) { log.error(`Epic ${id} not found.`); process.exit(1) }
  const ev = evaluateEpicCompletion(dir, epic!)
  printEvaluation(ev)
  if (ev.readiness !== 'READY_TO_COMPLETE' && ev.readiness !== 'READY_WITH_EXCEPTIONS') { log.error(`Epic ${id} is not ready to complete (${ev.readiness}).`); process.exit(1) }
  const ok = opts.yes === true || (await confirm({ message: `Complete Epic ${id}? This records a human completion decision.` })) === true
  if (!ok) { cancel('Cancelled.'); return }
  try { const done = completeEpic(dir, id, { decidedBy: opts.by }); log.success(`Epic ${done.id} completed (${ev.readiness}).`); outro('Completion decision recorded.') }
  catch (err) { log.error(err instanceof PlanningNotReadyError || err instanceof DeliveryPlanningWriteError ? err.message : String(err)); process.exit(1) }
}

export function runEpicEvidence(id: string, opts: { criterion?: string; status?: string; evidence?: string; reference?: string; method?: string; by?: string } = {}): void {
  const dir = cwd(); requireInit(dir)
  intro(`kaddo epic evidence ${id}`)
  const input = evidenceInput(opts)
  try { recordEpicOutcomeVerification(dir, id, input); log.success('Recorded Epic outcome evidence.'); outro(`[${input.status}] ${input.criterion}`) }
  catch (err) { log.error(err instanceof DeliveryPlanningWriteError ? err.message : String(err)); process.exit(1) }
}
