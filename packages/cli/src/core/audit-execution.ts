import { discoverProject, type ProjectDiscovery } from './discovery.js'
import { resolveAuditScope } from './audit-scope.js'
import { createDependencyAnalyzer, createTypescriptAnalyzer, type CommandRunner } from './audit-analyzers.js'
import { runAudit } from './audit-orchestrator.js'
import { correlateFindings } from './audit-correlation.js'
import { renderAuditReport, writeAuditArtifacts } from './audit-report.js'
import { nextAuditRunId, type AuditRun } from './audit.js'
import { discoverKnowledge, type KnowledgeArtifact } from '../services/knowledge-artifacts.js'
import { loadOwners, type DomainOwners } from '../services/owners.js'
import fs from 'node:fs'
import path from 'node:path'

/** Shared audit pipeline; no prompts or canonical publication. Dependencies are explicit. */
export type AuditDiscoverySnapshot = { discovery: ProjectDiscovery; artifacts: KnowledgeArtifact[]; owners: DomainOwners }
export async function executeAudit(dir: string, opts: { module?: string[]; paths?: string[] }, deps: { run: CommandRunner; createdAt: string; idFor?: (dir: string) => string; packageManager?: string; snapshot?: AuditDiscoverySnapshot }): Promise<{ run: AuditRun; jsonPath: string; reportPath: string; report: string }> {
  const root = fs.realpathSync(dir)
  const stateDir = path.join(root, '.kaddo')
  if (!fs.existsSync(stateDir)) fs.mkdirSync(stateDir)
  const within = (target: string) => { const rel = path.relative(root, fs.realpathSync(target)); return rel !== '..' && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel) }
  if (!within(stateDir)) throw new Error('Audit state directory resolves outside project.')
  const auditsDir = path.join(stateDir, 'audits')
  if (fs.existsSync(auditsDir) && !within(auditsDir)) throw new Error('Audit directory resolves outside project.')
  const lockPath = path.join(stateDir, 'audit-execution.lock')
  let lock: number
  try { lock = fs.openSync(lockPath, 'wx') } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') throw new Error('Audit execution is already running or requires recovery.')
    throw error
  }
  try {
  const discovery = deps.snapshot?.discovery ?? discoverProject(dir, { createdAt: deps.createdAt })
  const modules = discovery.modules.map(m => ({ name: m.name, path: m.path }))
  const scope = resolveAuditScope({ modules: opts.module, paths: opts.paths }, modules)
  const packageManager = deps.packageManager ?? discovery.stack.packageManager
  if (!['npm', 'pnpm', 'yarn', 'bun'].includes(packageManager)) throw new Error('Unsupported package manager for audit.')
  const id = (deps.idFor ?? nextAuditRunId)(dir)
  if (!/^AUD-\d+$/.test(id)) throw new Error('Invalid generated audit ID.')
  for (const ext of ['json', 'md']) {
    try { fs.lstatSync(path.join(auditsDir, `${id}.${ext}`)); throw new Error('Audit output already exists.') }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error }
  }
  const run = await runAudit({ id, createdAt: deps.createdAt, scope, analyzers: [createDependencyAnalyzer({ run: deps.run, packageManager }), createTypescriptAnalyzer({ run: deps.run })], context: { dir, scope, discovery } })
  const correlated = correlateFindings({ findings: run.findings, artifacts: deps.snapshot?.artifacts ?? discoverKnowledge(dir), owners: deps.snapshot?.owners ?? loadOwners(dir), modules })
  const report = renderAuditReport(run, correlated)
  return { run, ...writeAuditArtifacts(dir, run, { report }), report }
  } finally {
    fs.closeSync(lock)
    fs.unlinkSync(lockPath)
  }
}
