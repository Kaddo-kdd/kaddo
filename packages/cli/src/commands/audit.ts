// WI-097 (EP-001 / INI-001, candidate AUD-C8) — `kaddo audit run`: the first user-facing audit command. It
// wires the whole engine end-to-end with real tools: Discover → resolveAuditScope → runAudit (real analyzers
// via execaRunner) → correlateFindings (inline) → renderAuditReport → writeAuditArtifacts (.kaddo/audits).
//
// The orchestration is a pure-ish function (performAuditRun) with INJECTED dependencies (command runner, cwd,
// confirm, clock, id) so the whole flow is testable without spawning processes or writing the real repo. The
// canonical report under knowledge/tech/audits is opt-in (--publish) and written ONLY after human confirmation
// — the default run writes derived artifacts only. Findings never fail the command; only a run that failed to
// execute (all tools failed) or a usage error does.

import fs from 'node:fs'
import path from 'node:path'
import {
  discoverProject,
  resolveAuditScope,
  createDependencyAnalyzer,
  createTypescriptAnalyzer,
  execaRunner,
  runAudit,
  correlateFindings,
  renderAuditReport,
  writeAuditArtifacts,
  serializeAuditRun,
  nextAuditRunId,
  readAuditRun,
  listAuditRuns,
  queryAuditFindings,
  getWorkItemForEdit,
  linkAuditFinding,
  previewAuditPlan,
  compareAuditRuns,
  type AuditRun,
  type AuditFinding,
  type AuditRunSummary,
  type AuditFindingFilters,
  type CommandRunner,
  type DiscoveredModuleRef,
  type FindingSeverity,
  type FindingConfidence,
} from '../core.js'

/** Explicit approval is required; the revision read before writing detects intervening edits. */
export function runAuditLinkCommand(runId: string, findingId: string, workItemId: string, opts: { yes?: boolean }): void {
  try {
    if (!opts.yes) throw new Error('Pass --yes to confirm this association.')
    const dir = cwd()
    const wi = getWorkItemForEdit(dir, workItemId)
    const result = linkAuditFinding(dir, { runId, findingId, workItemId, expectedRevision: wi.revision, confirmed: true })
    process.stdout.write(result.changed ? `Linked ${findingId} to ${workItemId}.\n` : `Already linked.\n`)
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 2
  }
}
import { discoverKnowledge } from '../services/knowledge-artifacts.js'
import { loadOwners } from '../services/owners.js'
import { cwd } from '../utils/fs.js'
import { confirm } from '../utils/ui.js'

export type AuditRunOptions = {
  module?: string[]
  paths?: string[]
  json?: boolean
  publish?: boolean
  yes?: boolean
}

export type AuditRunDeps = {
  dir: string
  /** Injected command runner for the analyzers (default: execaRunner). */
  run: CommandRunner
  /** Asked only for --publish without --yes, on a TTY. */
  confirm: () => Promise<boolean>
  /** ISO timestamp for the run (injected for determinism in tests). */
  createdAt: string
  /** Allocates the next run id (default: nextAuditRunId over .kaddo/audits). */
  idFor: (dir: string) => string
  /** Whether stdout is a TTY — gates the --publish prompt. */
  hasTty: boolean
  /** Package manager override; defaults to the one Discover detected. */
  packageManager?: string
}

export type AuditRunResult = {
  run: AuditRun
  jsonPath: string
  reportPath: string
  /** Set only when the canonical report was written (--publish, confirmed). */
  publishedPath?: string
  report: string
}

const CANONICAL_AUDITS_DIR = path.join('knowledge', 'tech', 'audits')

function writeCanonicalReport(dir: string, id: string, report: string): string {
  const d = path.join(dir, CANONICAL_AUDITS_DIR)
  fs.mkdirSync(d, { recursive: true })
  const file = path.join(d, `${id}.md`)
  fs.writeFileSync(file, report)
  return file
}

/**
 * Run the full audit pipeline with injected dependencies. Throws on a usage error (ambiguous scope / unknown
 * module, from resolveAuditScope) before running anything. The canonical report is written only when
 * `publish` is set AND confirmed (or `yes`); otherwise only derived artifacts under .kaddo/audits are written.
 */
export async function performAuditRun(opts: AuditRunOptions, deps: AuditRunDeps): Promise<AuditRunResult> {
  const dir = deps.dir
  const discovery = discoverProject(dir, { createdAt: deps.createdAt })
  const moduleRefs: DiscoveredModuleRef[] = discovery.modules.map((m) => ({ name: m.name, path: m.path }))

  // Resolve scope first — a bad selection throws before any tool runs.
  const scope = resolveAuditScope({ modules: opts.module, paths: opts.paths }, moduleRefs)

  const pm = deps.packageManager ?? discovery.stack.packageManager
  const analyzers = [
    createDependencyAnalyzer({ run: deps.run, packageManager: pm }),
    createTypescriptAnalyzer({ run: deps.run }),
  ]

  const id = deps.idFor(dir)
  const run = await runAudit({
    id,
    createdAt: deps.createdAt,
    scope,
    analyzers,
    context: { dir, scope, discovery },
  })

  // Correlate inline so the report ships enriched findings.
  const correlated = correlateFindings({
    findings: run.findings,
    artifacts: discoverKnowledge(dir),
    owners: loadOwners(dir),
    modules: moduleRefs,
  })
  const report = renderAuditReport(run, correlated)

  const { jsonPath, reportPath } = writeAuditArtifacts(dir, run, { report })

  let publishedPath: string | undefined
  if (opts.publish) {
    const approved = opts.yes ? true : deps.hasTty ? await deps.confirm() : false
    if (approved) publishedPath = writeCanonicalReport(dir, run.id, report)
  }

  return { run, jsonPath, reportPath, publishedPath, report }
}

function printSummary(result: AuditRunResult): void {
  const { run } = result
  const confirmed = run.findings.filter((f) => f.confidence === 'confirmed').length
  const inferences = run.findings.length - confirmed
  const statusLabel = run.status === 'completed' ? run.status : `${run.status} (coverage incomplete)`
  process.stdout.write(
    [
      `Audit ${run.id} — ${statusLabel}`,
      `Findings: ${run.findings.length} (confirmed: ${confirmed}, inferences: ${inferences})`,
      run.coverage.notEvaluated.length ? `Not evaluated: ${run.coverage.notEvaluated.join(', ')}` : 'Coverage: complete',
      `Report: ${result.reportPath}`,
      result.publishedPath ? `Published: ${result.publishedPath}` : 'Canonical report: not published (use --publish)',
      '',
    ].join('\n'),
  )
}

/** CLI action for `kaddo audit run`. Builds real deps and prints; findings never set a non-zero exit. */
export async function runAuditRunCommand(opts: AuditRunOptions): Promise<void> {
  const deps: AuditRunDeps = {
    dir: cwd(),
    run: execaRunner,
    confirm: async () => {
      const answer = await confirm({ message: 'Write the canonical report under knowledge/tech/audits/?', initialValue: false })
      return answer === true
    },
    createdAt: new Date().toISOString(),
    idFor: nextAuditRunId,
    hasTty: Boolean(process.stdout.isTTY),
  }

  try {
    const result = await performAuditRun(opts, deps)
    if (opts.json) {
      process.stdout.write(serializeAuditRun(result.run))
    } else {
      printSummary(result)
    }
    process.exitCode = result.run.status === 'failed' ? 1 : 0
  } catch (err) {
    process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`)
    process.exitCode = 2
  }
}

// ── kaddo audit report (WI-098, AUD-C9) — read-only query over persisted runs ─────────────────────────────

export type AuditReportOptions = {
  id?: string
  list?: boolean
  severity?: string
  category?: string
  confidence?: string
  module?: string[]
  json?: boolean
}

export type AuditReportDeps = { dir: string }

export type AuditReportResult =
  | { kind: 'list'; runs: AuditRunSummary[] }
  | { kind: 'run'; run: AuditRun; findings: AuditFinding[] }

const SEVERITIES: FindingSeverity[] = ['critical', 'high', 'medium', 'low', 'info']
const CONFIDENCES: FindingConfidence[] = ['confirmed', 'likely', 'inferred']

function parseList(value: string | undefined): string[] | undefined {
  if (!value) return undefined
  const parts = value.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
  return parts.length ? parts : undefined
}

function validateEnum<T extends string>(values: string[] | undefined, allowed: readonly T[], label: string): T[] | undefined {
  if (!values) return undefined
  for (const v of values) {
    if (!allowed.includes(v as T)) {
      throw new Error(`Invalid ${label} "${v}". Valid values: ${allowed.join(', ')}.`)
    }
  }
  return values as T[]
}

/**
 * Read-only query over persisted audit runs. With `list`, returns run summaries. Otherwise reads one run (by
 * id, or the latest) and returns its filtered findings. Throws on a missing id/no audits; never writes.
 */
export function performAuditReport(opts: AuditReportOptions, deps: AuditReportDeps): AuditReportResult {
  const dir = deps.dir
  const runs = listAuditRuns(dir)

  if (opts.list) return { kind: 'list', runs }

  const id = opts.id ?? runs.at(-1)?.id
  if (!id) throw new Error('No audits found. Run `kaddo audit run` first.')
  if (!/^AUD-\d+$/.test(id)) throw new Error('Invalid audit id.')

  const run = readAuditRun(dir, id)
  if (!run) throw new Error(`Audit "${id}" not found in .kaddo/audits/.`)

  // Resolve --module to path prefixes via the Discover inventory.
  let pathPrefix: string[] | undefined
  if (opts.module?.length) {
    const modules = discoverProject(dir, { createdAt: run.createdAt }).modules
    pathPrefix = opts.module.map((m) => {
      const match = modules.find((x) => x.name === m || x.path.split('/').pop() === m || x.name.split('/').pop() === m)
      return match ? match.path : m
    })
  }

  const filters: AuditFindingFilters = {
    severity: validateEnum(parseList(opts.severity), SEVERITIES, 'severity'),
    confidence: validateEnum(parseList(opts.confidence), CONFIDENCES, 'confidence'),
    category: parseList(opts.category),
    ...(pathPrefix ? { pathPrefix } : {}),
  }

  const correlated = correlateFindings({ findings: run.findings, artifacts: discoverKnowledge(dir), owners: loadOwners(dir), modules: discoverProject(dir, { createdAt: run.createdAt }).modules.map(m => ({ name: m.name, path: m.path })) })
  return { kind: 'run', run, findings: queryAuditFindings(correlated, filters) }
}

function printRunList(runs: AuditRunSummary[]): void {
  if (runs.length === 0) {
    process.stdout.write('No audits found.\n')
    return
  }
  for (const r of runs) {
    process.stdout.write(`${r.id}  ${r.createdAt}  ${r.status}  findings: ${r.total} (confirmed: ${r.confirmed}, inferences: ${r.inferences})\n`)
  }
}

function printFindings(run: AuditRun, findings: AuditFinding[]): void {
  process.stdout.write(`Audit ${run.id} — ${run.status} — showing ${findings.length} of ${run.findings.length} finding(s)\n`)
  for (const f of findings) {
    const loc = f.location?.file ? ` ${f.location.file}${typeof f.location.line === 'number' ? `:${f.location.line}` : ''}` : ''
    process.stdout.write(`  ${f.id} [${f.severity}/${f.confidence}] ${f.category}: ${f.title}${loc}\n`)
    const approved = (f as import('../core/audit-correlation.js').CorrelatedFinding).correlation?.confirmedWorkItems
    if (approved?.length) process.stdout.write(`    Approved Work Item links: ${approved.join(', ')}\n`)
  }
}

/** CLI action for `kaddo audit report`. Read-only; a usage error (bad id/filter) sets a non-zero exit. */
export function runAuditReportCommand(idArg: string | undefined, opts: Omit<AuditReportOptions, 'id'>): void {
  try {
    const result = performAuditReport({ ...opts, id: idArg }, { dir: cwd() })
    if (opts.json) {
      if (result.kind === 'list') process.stdout.write(JSON.stringify(result.runs, null, 2) + '\n')
      else process.stdout.write(JSON.stringify(result.findings, null, 2) + '\n')
    } else if (result.kind === 'list') {
      printRunList(result.runs)
    } else {
      printFindings(result.run, result.findings)
    }
    process.exitCode = 0
  } catch (err) {
    process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`)
    process.exitCode = 2
  }
}

export function runAuditPlanCommand(id: string | undefined, opts: { json?: boolean }): void {
  try {
    const result = performAuditReport({ id }, { dir: cwd() })
    if (result.kind !== 'run') throw new Error('An audit run is required.')
    const plan = previewAuditPlan(result.run, result.findings as import('../core/audit-correlation.js').CorrelatedFinding[])
    if (opts.json) process.stdout.write(JSON.stringify(plan, null, 2) + '\n')
    else {
      process.stdout.write(`Audit ${plan.auditId} — ${plan.status}${plan.coverage.complete ? '' : ' (coverage incomplete)'}\n`)
      if (plan.coverage.notEvaluated.length) process.stdout.write(`Not evaluated: ${plan.coverage.notEvaluated.join(', ')}\n`)
      for (const action of plan.actions) process.stdout.write(`  ${action.findingId} [${action.severity}/${action.confidence}] ${action.title} — ${action.action}\n    Evidence: ${action.evidence}\n    Recommendation: ${action.recommendation}\n    Approved: ${action.confirmedWorkItems.join(', ') || '—'}; suggested: ${action.suggestedWorkItems.join(', ') || '—'}\n`)
    }
  } catch (error) { process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`); process.exitCode = 2 }
}

export function runAuditCompareCommand(beforeId: string, afterId: string, opts: { json?: boolean }): void {
  try {
    if (!/^AUD-\d+$/.test(beforeId) || !/^AUD-\d+$/.test(afterId)) throw new Error('Invalid audit id.')
    const before = readAuditRun(cwd(), beforeId), after = readAuditRun(cwd(), afterId)
    if (!before || !after) throw new Error('Audit not found or unreadable.')
    const comparison = compareAuditRuns(before, after)
    if (opts.json) process.stdout.write(JSON.stringify(comparison, null, 2) + '\n')
    else {
      process.stdout.write(`Audit comparison: ${beforeId} → ${afterId}\n`)
      for (const warning of comparison.warnings) process.stdout.write(`Warning: ${warning}\n`)
      for (const entry of comparison.entries) {
        process.stdout.write(`  ${entry.id}: ${entry.classification}${entry.reason ? ` — ${entry.reason}` : ''}\n`)
        for (const field of entry.changes ?? []) {
          const key = field as 'severity' | 'confidence' | 'status' | 'evidence'
          process.stdout.write(`    ${field}: ${entry.before?.[key]} → ${entry.after?.[key]}\n`)
        }
      }
    }
  } catch (error) { process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`); process.exitCode = 2 }
}
