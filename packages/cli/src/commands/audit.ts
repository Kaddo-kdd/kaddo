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
  type AuditRun,
  type CommandRunner,
  type DiscoveredModuleRef,
} from '../core.js'
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
