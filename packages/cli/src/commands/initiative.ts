// kaddo initiative — CLI surface over Initiative Core (WI-019).
//
// Thin presentation layer: every operation delegates to @kaddo/cli/core (WI-018). No business logic
// lives here. Mutations are explicit CLI actions; no silent strategic changes.

import { cwd } from '../utils/fs.js'
import { loadConfig } from '../core/config.js'
import { intro, outro, log, text, select } from '../utils/ui.js'
import {
  discoverInitiatives,
  getInitiative,
  computeInitiativeProgress,
  type InitiativeStatus,
} from '../core/initiative.js'
import {
  createInitiative,
  transitionInitiative,
  materializeCandidate,
  InitiativeWriteError,
} from '../core/initiative-write.js'

function requireInit(dir: string): void {
  if (!loadConfig(dir)) {
    log.error('Kaddo is not initialized. Run `kaddo init` first.')
    process.exit(1)
  }
}

export function runInitiativeList(): void {
  const dir = cwd()
  requireInit(dir)
  intro('kaddo initiative list')
  const all = discoverInitiatives(dir)
  if (all.length === 0) {
    log.info('No initiatives yet. Create one with `kaddo initiative create`.')
    outro('Nothing to show.')
    return
  }
  for (const ini of all) {
    const p = computeInitiativeProgress(dir, ini)
    log.info(
      `${ini.id} — ${ini.title}  [${ini.status}]  ` +
        `planning ${p.planning.materialized}/${p.planning.totalCandidates} · ` +
        `delivery ${p.delivery.byState.completed}/${p.delivery.total} completed`,
    )
  }
  outro(`${all.length} initiative(s).`)
}

export function runInitiativeShow(id: string): void {
  const dir = cwd()
  requireInit(dir)
  intro(`kaddo initiative show ${id}`)
  const ini = getInitiative(dir, id)
  if (!ini) {
    log.error(`Initiative ${id} not found.`)
    process.exit(1)
  }
  log.info(`  ${ini.id} — ${ini.title}`)
  log.info(`  Status: ${ini.status}`)
  if (ini.horizon) log.info(`  Horizon: ${ini.horizon}`)
  if (ini.priority) log.info(`  Priority: ${ini.priority}`)
  if (ini.domains.length) log.info(`  Domains: ${ini.domains.join(', ')}`)
  if (ini.relatedCapabilities.length) log.info(`  Capabilities: ${ini.relatedCapabilities.join(', ')}`)
  if (ini.source) log.info(`  Source: ${ini.source}${ini.sourceId ? ` (${ini.sourceId})` : ''}`)
  log.info(`  Candidates: ${ini.candidates.length}`)
  for (const c of ini.candidates) {
    log.info(`    - ${c.id}: ${c.title}${c.materializedAs ? ` → ${c.materializedAs}` : ' (pending)'}`)
  }
  outro(`Initiative ${ini.id}.`)
}

export function runInitiativeProgress(id: string): void {
  const dir = cwd()
  requireInit(dir)
  intro(`kaddo initiative progress ${id}`)
  const ini = getInitiative(dir, id)
  if (!ini) {
    log.error(`Initiative ${id} not found.`)
    process.exit(1)
  }
  const p = computeInitiativeProgress(dir, ini)
  log.info(`  Status: ${p.status}`)
  log.info('')
  log.info(`  Planning: ${p.planning.materialized}/${p.planning.totalCandidates} candidates materialized (${p.planning.remaining} remaining)`)
  log.info('')
  log.info(`  Delivery: ${p.delivery.total} associated Work Items`)
  for (const [state, n] of Object.entries(p.delivery.byState)) {
    if (n > 0) log.info(`    ${state}: ${n}`)
  }
  outro(`Progress for ${ini.id}.`)
}

export function runInitiativeCandidates(id: string): void {
  const dir = cwd()
  requireInit(dir)
  intro(`kaddo initiative candidates ${id}`)
  const ini = getInitiative(dir, id)
  if (!ini) {
    log.error(`Initiative ${id} not found.`)
    process.exit(1)
  }
  if (ini.candidates.length === 0) {
    log.info('No candidates on this initiative.')
    outro('Nothing to show.')
    return
  }
  for (const c of ini.candidates) {
    log.info(`  ${c.id}: ${c.title}${c.materializedAs ? ` → ${c.materializedAs}` : ' (pending)'}`)
    if (c.expectedValue) log.info(`    value: ${c.expectedValue}`)
  }
  outro(`${ini.candidates.length} candidate(s).`)
}

export async function runInitiativeCreate(opts: { title?: string }): Promise<void> {
  const dir = cwd()
  requireInit(dir)
  intro('kaddo initiative create')
  const title =
    opts.title?.trim() ||
    (await text({
      message: 'Initiative title',
      validate: (v) => (v.trim().length === 0 ? 'Title is required.' : undefined),
    })).trim()
  try {
    const ini = createInitiative(dir, { title })
    log.success(`Created ${ini.id} — ${ini.title}`)
    log.info(`  knowledge/delivery/initiatives/`)
    outro(`Initiative ${ini.id} created.`)
  } catch (err) {
    log.error(err instanceof InitiativeWriteError ? err.message : String(err))
    process.exit(1)
  }
}

export async function runInitiativeUpdate(id: string, opts: { status?: string }): Promise<void> {
  const dir = cwd()
  requireInit(dir)
  intro(`kaddo initiative update ${id}`)
  const ini = getInitiative(dir, id)
  if (!ini) {
    log.error(`Initiative ${id} not found.`)
    process.exit(1)
  }
  const to =
    (opts.status as InitiativeStatus | undefined) ??
    (await select<InitiativeStatus>({
      message: 'New status',
      options: [
        { value: 'planned', label: 'planned' },
        { value: 'in-progress', label: 'in-progress' },
        { value: 'completed', label: 'completed' },
        { value: 'deferred', label: 'deferred' },
        { value: 'cancelled', label: 'cancelled' },
      ],
    }))
  try {
    const updated = transitionInitiative(dir, id, to)
    log.success(`Status: ${updated.status}`)
    outro(`Initiative ${updated.id} updated.`)
  } catch (err) {
    log.error(err instanceof InitiativeWriteError ? err.message : String(err))
    process.exit(1)
  }
}

export function runInitiativeMaterialize(id: string, candidateId: string): void {
  const dir = cwd()
  requireInit(dir)
  intro(`kaddo initiative materialize ${id} ${candidateId}`)
  try {
    const result = materializeCandidate(dir, id, candidateId)
    log.success(`Materialized ${candidateId} → ${result.workItemId}`)
    log.info(`  knowledge/delivery/work-items/draft/${result.fileName}`)
    log.info(`  Associated to ${id} via \`initiative: ${id}\`.`)
    outro(`Work Item ${result.workItemId} created from candidate.`)
  } catch (err) {
    log.error(err instanceof InitiativeWriteError ? err.message : String(err))
    process.exit(1)
  }
}
