import { listAuditRuns, getAuditView, queryAuditFindings, previewAuditPlan, compareAuditRuns, linkAuditFinding, getWorkItemForEdit, discoverProject, resolveAuditScope, executeAudit, loadConfig, type AuditFindingFilters, type CommandRunner } from '@kaddo/cli/core'
import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { assertAuditSandboxAvailable, createAuditSandboxRunner } from './audit-sandbox.js'
import { assertNoNestedMounts } from './audit-mounts.js'
import { discoverAuditIsolated, type IsolatedDiscovery } from './audit-isolated-discovery.js'

/** Reject symlinks in discovery inputs before the host-side scanner reads them. */
function assertDiscoveryTree(dir: string): void {
  const root = fs.realpathSync(dir)
  assertNoNestedMounts(root)
  const visit = (target: string) => {
    for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
      const child = path.join(target, entry.name)
      const stat = fs.lstatSync(child)
      if (stat.isSymbolicLink()) throw new AuditExecutionError('INVALID_INPUT', 'Symlinked discovery inputs are unsupported.')
      if (stat.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') visit(child)
    }
  }
  visit(root)
}

/** Reject symlinked audit stores or run files that resolve outside the project. */
function assertAuditStorage(dir: string): void {
  const root = fs.realpathSync(dir)
  const auditDir = path.join(root, '.kaddo', 'audits')
  if (!fs.existsSync(auditDir)) return
  const inside = (target: string) => { const relative = path.relative(root, fs.realpathSync(target)); return relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative) }
  if (!inside(auditDir)) throw new Error('Audit storage outside project.')
  for (const name of fs.readdirSync(auditDir)) if (/^AUD-\d+\.json$/.test(name) && !inside(path.join(auditDir, name))) throw new Error('Audit file outside project.')
}

/** Discovery recursively reads knowledge; reject paths resolving outside the configured project first. */
function assertKnowledgeTree(dir: string): void {
  const root = fs.realpathSync(dir), knowledge = path.join(root, 'knowledge')
  if (!fs.existsSync(knowledge)) return
  const visited = new Set<string>()
  const visit = (target: string) => {
    const real = fs.realpathSync(target), relative = path.relative(root, real)
    if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) throw new Error('Knowledge path outside project.')
    if (fs.lstatSync(target).isSymbolicLink() && fs.statSync(target).isDirectory()) throw new Error('Symlinked knowledge directories are unsupported.')
    if (visited.has(real)) return
    visited.add(real)
    if (fs.statSync(target).isDirectory()) for (const name of fs.readdirSync(target)) if (!name.startsWith('.')) visit(path.join(target, name))
  }
  visit(knowledge)
}

export function listAuditsAdmin(dir: string) { assertAuditStorage(dir); return listAuditRuns(dir) }
export async function getAuditAdmin(dir: string, id: string, filters: AuditFindingFilters = {}, opts: { module?: string; status?: string } = {}, discover: (dir: string) => Promise<IsolatedDiscovery> = discoverAuditIsolated) {
  assertAuditStorage(dir)
  assertNoNestedMounts(fs.realpathSync(dir))
  const snapshot = await discover(dir)
  const { run, findings } = getAuditView(dir, id, snapshot)
  if (opts.module) {
    const modules = snapshot.discovery.modules
    const matches = modules.filter(m => m.name === opts.module || m.path === opts.module)
    if (matches.length !== 1) throw new Error('Invalid or ambiguous module.')
    filters = { ...filters, pathPrefix: [matches[0].path] }
  }
  return { run, findings: queryAuditFindings(findings, filters).filter(f => !opts.status || f.status === opts.status) }
}
export async function previewAuditAdmin(dir: string, id: string, discover: (dir: string) => Promise<IsolatedDiscovery> = discoverAuditIsolated) {
  assertAuditStorage(dir)
  assertNoNestedMounts(fs.realpathSync(dir))
  const { run, findings } = getAuditView(dir, id, await discover(dir))
  return previewAuditPlan(run, findings)
}
export async function compareAuditsAdmin(dir: string, beforeId: string, afterId: string, discover: (dir: string) => Promise<IsolatedDiscovery> = discoverAuditIsolated) {
  assertAuditStorage(dir)
  assertNoNestedMounts(fs.realpathSync(dir))
  const snapshot = await discover(dir)
  return compareAuditRuns(getAuditView(dir, beforeId, snapshot).run, getAuditView(dir, afterId, snapshot).run)
}
export function linkAuditAdmin(dir: string, input: { runId: string; findingId: string; workItemId: string; expectedRevision: string; confirmed: boolean }) {
  assertAuditStorage(dir)
  assertKnowledgeTree(dir)
  const root = fs.realpathSync(dir)
  const wi = getWorkItemForEdit(root, input.workItemId)
  const relative = path.relative(root, fs.realpathSync(path.resolve(root, wi.path)))
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) throw new AuditExecutionError('INVALID_INPUT', 'Work Item resolves outside project.')
  return linkAuditFinding(dir, input)
}

export class AuditExecutionError extends Error { constructor(public code: string, message: string) { super(message) } }

/** Persist the request key before starting; interrupted requests fail closed rather than rerunning. */
export async function runAuditAdmin(dir: string, input: { requestId: string; module?: string[]; paths?: string[] }, runner?: CommandRunner, discover: (dir: string) => Promise<IsolatedDiscovery> = discoverAuditIsolated) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.requestId)) throw new AuditExecutionError('INVALID_INPUT', 'Invalid request ID.')
  if (!runner) {
    try { await assertAuditSandboxAvailable(); runner = createAuditSandboxRunner(dir) }
    catch { throw new AuditExecutionError('AUDIT_ISOLATION_UNAVAILABLE', 'Audit execution requires the local isolated runtime and its pinned image.') }
  }
  const root = fs.realpathSync(dir), stateDir = path.join(root, '.kaddo'), requestDir = path.join(stateDir, 'audit-requests')
  const inside = (p: string) => { const rel = path.relative(root, fs.realpathSync(p)); return rel !== '..' && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel) }
  if (!fs.existsSync(stateDir)) throw new AuditExecutionError('INVALID_INPUT', 'A configured project is required.')
  if (!inside(stateDir)) throw new AuditExecutionError('INVALID_INPUT', 'Audit state must be inside the project.')
  assertNoNestedMounts(root)
  assertAuditStorage(root)
  const snapshot = await discover(root)
  if (!snapshot.configured) throw new AuditExecutionError('INVALID_INPUT', 'A configured project is required.')
  const discovery = snapshot.discovery
  if (!['npm', 'pnpm', 'yarn', 'bun'].includes(discovery.stack.packageManager)) throw new AuditExecutionError('INVALID_INPUT', 'Unsupported package manager for audit.')
  const scope = resolveAuditScope({ modules: input.module, paths: input.paths }, discovery.modules)
  if (scope.kind === 'module') for (const name of scope.modules) {
    const module = discovery.modules.find(m => m.name === name)
    if (!module || !inside(path.resolve(root, module.path))) throw new AuditExecutionError('INVALID_INPUT', 'Module must resolve inside the project.')
  }
  fs.mkdirSync(requestDir, { recursive: true })
  if (!inside(requestDir)) throw new AuditExecutionError('INVALID_INPUT', 'Audit request directory must be inside the project.')
  const file = path.join(requestDir, `${input.requestId}.json`)
  const fingerprint = createHash('sha256').update(JSON.stringify({ module: input.module ?? [], paths: input.paths ?? [] })).digest('hex')
  try {
    fs.writeFileSync(file, JSON.stringify({ state: 'started', fingerprint }), { flag: 'wx' })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
    const stat = fs.lstatSync(file)
    if (!stat.isFile() || stat.isSymbolicLink()) throw new AuditExecutionError('AUDIT_CONFLICT', 'Invalid prior request state.')
    let prior: { state?: string; fingerprint?: string; auditId?: string }
    try { prior = JSON.parse(fs.readFileSync(file, 'utf8')) } catch { throw new AuditExecutionError('AUDIT_CONFLICT', 'Prior request state requires review.') }
    if (prior.fingerprint !== fingerprint) throw new AuditExecutionError('AUDIT_CONFLICT', 'Request ID was already used with different input.')
    if (prior.state !== 'completed' || !prior.auditId) throw new AuditExecutionError('AUDIT_CONFLICT', 'Prior request is running or requires review.')
    return { run: getAuditView(dir, prior.auditId, snapshot).run, reused: true }
  }
  try {
    const result = await executeAudit(root, input, { run: runner, createdAt: new Date().toISOString(), snapshot })
    fs.writeFileSync(file, JSON.stringify({ state: 'completed', fingerprint, auditId: result.run.id }))
    return { run: result.run, reused: false }
  } catch (error) {
    // Keep the started marker: an interrupted run must not be silently repeated.
    throw error
  }
}
