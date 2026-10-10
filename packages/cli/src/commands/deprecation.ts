import { cwd } from '../utils/fs.js'
import { getDeprecationPlans, getDeprecationPlan } from '../core/deprecation.js'
import { deriveRemovalWaves, planIntelligence, proposeWorkItemCandidates } from '../core/deprecation-intelligence.js'
import {
  createPlan,
  addTarget,
  updateTarget,
  removeTarget,
  DeprecationWriteError,
  type PlanInput,
  type TargetInput,
  type DepFinding,
} from '../core/deprecation-write.js'
import { intro, outro, log, text, confirm } from '../utils/ui.js'

// Read + mutation surfaces for Controlled Deprecation (WI-049). Reads consume the Core read model;
// mutations go through the Core contract (proposal → preview → confirm) and never write Markdown here.

function printFindings(findings: DepFinding[]): void {
  for (const f of findings) (f.level === 'error' ? log.error : log.warn)(f.message)
}

export function runDeprecationList(dir: string = cwd(), opts: { json?: boolean } = {}): void {
  const plans = getDeprecationPlans(dir)
  if (opts.json) { console.log(JSON.stringify(plans, null, 2)); return }
  if (plans.length === 0) {
    console.log('\nNo Deprecation Plans are defined for this project.\n')
    console.log('Add one with:  kaddo deprecation create --title "<name>"\n')
    return
  }
  console.log('\nDeprecation Plans:')
  for (const p of plans) {
    console.log(`  ${p.id.padEnd(10)} ${String(p.status ?? '—').padEnd(10)} ${p.targetCount} target(s)  ${p.title}`)
  }
  console.log('')
}

export function runDeprecationShow(id: string, dir: string = cwd(), opts: { json?: boolean } = {}): void {
  const plan = getDeprecationPlan(dir, id)
  if (!plan) {
    if (opts.json) console.log(JSON.stringify({ error: `Deprecation Plan "${id}" not found.` }, null, 2))
    else console.error(`Deprecation Plan "${id}" not found under knowledge/legacy/deprecations/.`)
    process.exit(1)
  }
  if (opts.json) { console.log(JSON.stringify(plan, null, 2)); return }
  const p = plan!
  console.log(`\n${p.id} — ${p.title}`)
  console.log(`  Status: ${p.status ?? '—'}   Targets: ${p.targetCount}`)
  if (p.purpose) console.log(`  Purpose: ${p.purpose}`)
  if (p.targets.length > 0) {
    console.log('\n  Targets:')
    for (const t of p.targets) {
      const envs = Object.entries(t.environments).map(([e, s]) => `${e}=${s}`).join(' ')
      console.log(`    - ${t.id} [${t.type}] ${t.lifecycle}${envs ? '  (' + envs + ')' : ''}`)
      if (t.locator) console.log(`        locator: ${t.locator}`)
      if (t.dependsOnRemoval.length > 0) console.log(`        depends_on_removal: ${t.dependsOnRemoval.join(', ')}`)
      if (t.resource) console.log(`        resource: ${t.resource}`)
    }
  }
  console.log('')
}

export function runDeprecationStatus(id: string, dir: string = cwd(), opts: { json?: boolean } = {}): void {
  const plan = getDeprecationPlan(dir, id)
  if (!plan) { console.error(`Deprecation Plan "${id}" not found.`); process.exit(1) }
  const p = plan!
  const intel = planIntelligence(p)
  const payload = {
    id: p.id,
    status: p.status,
    targetCount: p.targetCount,
    lifecycleCounts: p.lifecycleCounts,
    eligibleForRemovalReview: intel.eligible,
  }
  if (opts.json) { console.log(JSON.stringify(payload, null, 2)); return }
  console.log(`\n${p.id} — pipeline`)
  for (const [state, n] of Object.entries(p.lifecycleCounts)) console.log(`  ${String(state).padEnd(20)} ${n}`)
  console.log(`\n  Eligible for removal review: ${intel.eligible.length > 0 ? intel.eligible.join(', ') : '—'}\n`)
}

export function runDeprecationPlan(id: string, dir: string = cwd(), opts: { json?: boolean } = {}): void {
  const plan = getDeprecationPlan(dir, id)
  if (!plan) { console.error(`Deprecation Plan "${id}" not found.`); process.exit(1) }
  const { waves, blocked } = deriveRemovalWaves(plan!)
  if (opts.json) { console.log(JSON.stringify({ waves, blocked }, null, 2)); return }
  console.log(`\n${plan!.id} — removal waves (dependents first)`)
  waves.forEach((wave, i) => console.log(`  Wave ${i + 1}: ${wave.join(', ')}`))
  if (blocked.length > 0) {
    console.log('\n  Blocked:')
    for (const b of blocked) console.log(`    - ${b.target}: ${b.reason}`)
  }
  console.log('')
}

export function runDeprecationAnalyze(id: string, dir: string = cwd(), opts: { json?: boolean } = {}): void {
  const plan = getDeprecationPlan(dir, id)
  if (!plan) { console.error(`Deprecation Plan "${id}" not found.`); process.exit(1) }
  const intel = planIntelligence(plan!)
  if (opts.json) { console.log(JSON.stringify(intel, null, 2)); return }
  console.log(`\n${plan!.id} — analysis`)
  for (const t of intel.targets) {
    console.log(`  ${t.id}: unused=${t.unused.confidence}${t.unused.requiresHumanConfirmation ? ' (human confirmation required)' : ''}`)
    for (const r of t.unused.rationale) console.log(`      · ${r}`)
    if (t.blockedBy.length > 0) console.log(`      blocked by: ${t.blockedBy.join(', ')}`)
    if (t.observation.declared) {
      const o = t.observation
      console.log(`      observation: ${o.eligibleForRemovalReview ? 'eligible for removal REVIEW' : 'pending'} — criteria ${o.criteriaMet}/${o.criteriaTotal}${o.windowEndsAt ? `, window ends ${o.windowEndsAt}` : ''}`)
    }
  }
  console.log('')
}

export function runDeprecationCandidates(id: string, dir: string = cwd(), opts: { json?: boolean } = {}): void {
  const plan = getDeprecationPlan(dir, id)
  if (!plan) { console.error(`Deprecation Plan "${id}" not found.`); process.exit(1) }
  const candidates = proposeWorkItemCandidates(plan!)
  if (opts.json) { console.log(JSON.stringify(candidates, null, 2)); return }
  console.log(`\n${plan!.id} — proposed Work Item candidates (one WI per wave/module; references targets, not copies)`)
  if (candidates.length === 0) { console.log('  (no targets yet)\n'); return }
  for (const c of candidates) {
    console.log(`  Wave ${c.wave}${c.module ? ` · ${c.module}` : ''}: ${c.deprecationTargets.join(', ')}`)
    if (c.resources.length > 0) console.log(`      resources: ${c.resources.join(', ')}`)
  }
  console.log('\n  Materialize each as a Work Item with deprecation_targets referencing these ids.\n')
}

type CreateOpts = { title?: string; purpose?: string; status?: string; json?: boolean }

export async function runDeprecationCreate(opts: CreateOpts = {}, dir: string = cwd()): Promise<void> {
  let title = opts.title?.trim()
  const interactive = !opts.json && process.stdin.isTTY && !title
  if (interactive) {
    intro('kaddo deprecation create')
    if (!title) title = (await text({ message: 'Plan title', placeholder: 'Retire legacy credit scoring' })).trim()
  }
  if (!title) { console.error('A plan title is required. Use --title (or run interactively).'); process.exit(1) }

  const input: PlanInput = { title }
  if (opts.purpose != null) input.purpose = opts.purpose
  if (opts.status != null) input.status = opts.status
  try {
    const res = createPlan(dir, input)
    if (opts.json) { console.log(JSON.stringify(res, null, 2)); return }
    log.success(`Created ${res.id}`)
    console.log(`  ${res.path}`)
    console.log(`  Add targets with: kaddo deprecation add-target ${res.id} --type <type> --locator <locator>`)
    if (interactive) outro('Plan created.')
  } catch (err) {
    console.error(err instanceof DeprecationWriteError ? err.message : String(err))
    process.exit(1)
  }
}

type TargetOpts = {
  id?: string; type?: string; locator?: string; title?: string; lifecycle?: string
  resource?: string; module?: string; dependsOn?: string; json?: boolean
}

function toTargetInput(opts: TargetOpts): TargetInput {
  const input: TargetInput = {}
  if (opts.id != null) input.id = opts.id
  if (opts.type != null) input.type = opts.type
  if (opts.locator != null) input.locator = opts.locator
  if (opts.title != null) input.title = opts.title
  if (opts.lifecycle != null) input.lifecycle = opts.lifecycle
  if (opts.resource != null) input.resource = opts.resource
  if (opts.module != null) input.module = opts.module
  if (opts.dependsOn != null) input.dependsOnRemoval = opts.dependsOn.split(',').map((s) => s.trim()).filter(Boolean)
  return input
}

export function runDeprecationAddTarget(planId: string, opts: TargetOpts = {}, dir: string = cwd()): void {
  try {
    const res = addTarget(dir, planId, toTargetInput(opts))
    if (opts.json) { console.log(JSON.stringify(res, null, 2)); return }
    printFindings(res.findings)
    log.success(`Added ${res.targetId} to ${res.planId} (${res.path}).`)
  } catch (err) {
    console.error(err instanceof DeprecationWriteError ? err.message : String(err))
    process.exit(1)
  }
}

export function runDeprecationUpdateTarget(planId: string, targetId: string, opts: TargetOpts = {}, dir: string = cwd()): void {
  const input = toTargetInput(opts)
  delete input.id
  if (Object.keys(input).length === 0) {
    console.error('Nothing to update. Pass at least one field (e.g. --lifecycle, --locator, --resource).')
    process.exit(1)
  }
  try {
    const res = updateTarget(dir, planId, targetId, input)
    if (opts.json) { console.log(JSON.stringify(res, null, 2)); return }
    printFindings(res.findings)
    log.success(`Updated ${res.targetId} in ${res.planId} (${res.path}).`)
  } catch (err) {
    console.error(err instanceof DeprecationWriteError ? err.message : String(err))
    process.exit(1)
  }
}

type RemoveOpts = { yes?: boolean; json?: boolean }

export async function runDeprecationRemoveTarget(planId: string, targetId: string, opts: RemoveOpts = {}, dir: string = cwd()): Promise<void> {
  let preview
  try { preview = removeTarget(dir, planId, targetId) } catch (err) {
    console.error(err instanceof DeprecationWriteError ? err.message : String(err)); process.exit(1)
  }
  const dependents = preview.preview?.dependents ?? []
  if (opts.json && !opts.yes) { console.log(JSON.stringify(preview.preview, null, 2)); return }
  if (dependents.length > 0) {
    console.log(`\nTarget "${targetId}" is depended on by: ${dependents.join(', ')}`)
    console.log('Removing it will NOT rewrite their depends_on_removal.\n')
  }
  let proceed = opts.yes === true
  if (!proceed) {
    if (process.stdin.isTTY) proceed = await confirm({ message: `Remove target "${targetId}" from ${planId}?`, initialValue: false })
    else { console.error(`Refusing to remove without confirmation. Re-run with --yes.`); process.exit(1) }
  }
  if (!proceed) { console.log('Aborted.'); return }
  try {
    const done = removeTarget(dir, planId, targetId, { confirm: true })
    if (opts.json) { console.log(JSON.stringify(done, null, 2)); return }
    log.success(`Removed ${targetId} from ${planId} (${done.path}).`)
  } catch (err) {
    console.error(err instanceof DeprecationWriteError ? err.message : String(err)); process.exit(1)
  }
}
