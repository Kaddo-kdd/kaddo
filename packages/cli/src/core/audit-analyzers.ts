// WI-093 (EP-001 / INI-001, candidate AUD-C5) — concrete TypeScript analyzers for the audit flow: one for
// dependencies (the package manager's `audit`) and one for code (the `tsc` compiler diagnostics). Both
// implement the Analyzer interface (WI-092) and produce evidence-backed AuditFindings (WI-090).
//
// The external-tool invocation is INJECTABLE (a CommandRunner), so the output→findings mapping is pure and
// deterministic and is tested against captured tool output, never a spawned process. Honest by construction:
// a tool fact is `confirmed` (never upgraded past what the tool supports), every finding carries evidence
// and provenance, a missing or broken tool is surfaced as a failure (→ partial coverage via the
// orchestrator), and a non-zero exit that still yields valid findings (e.g. `audit` finding vulnerabilities)
// is NOT treated as a failure.

import { execa } from 'execa'
import fs from 'node:fs'
import path from 'node:path'
import { stableFindingId, type AuditFinding, type FindingSeverity } from './audit.js'
import type { Analyzer } from './audit-orchestrator.js'

export type CommandResult = { stdout: string; stderr: string; exitCode: number }
/** Injectable command runner. The default (execaRunner) shells out; tests pass a stub returning fixtures. */
export type CommandRunner = (command: string, args: string[], options?: { cwd?: string }) => Promise<CommandResult>

/** Default runner over execa. `reject: false` so a non-zero exit (e.g. audit found vulns) does not throw. */
export const execaRunner: CommandRunner = async (command, args, options) => {
  const res = await execa(command, args, { cwd: options?.cwd, reject: false })
  return {
    stdout: typeof res.stdout === 'string' ? res.stdout : '',
    stderr: typeof res.stderr === 'string' ? res.stderr : '',
    exitCode: res.exitCode ?? 1,
  }
}

/** Map a tool's severity label to the finding severity scale. Unknown labels are `info`, never guessed up. */
export function mapSeverity(label: string | undefined): FindingSeverity {
  switch ((label ?? '').toLowerCase()) {
    case 'critical': return 'critical'
    case 'high': return 'high'
    case 'moderate':
    case 'medium': return 'medium'
    case 'low': return 'low'
    default: return 'info'
  }
}

type Advisory = {
  id?: number | string
  module_name?: string
  severity?: string
  title?: string
  url?: string
  vulnerable_versions?: string
  recommendation?: string
}

/**
 * Map the JSON of a package-manager `audit` to dependency findings. Pure and deterministic. Each advisory
 * becomes a `confirmed` finding (a tool-reported fact) with evidence and provenance. Accepts the npm/pnpm
 * `advisories` shape; an absent/empty `advisories` yields no findings (a clean audit).
 */
export function mapAuditAdvisories(parsed: unknown, packageManager: string): AuditFinding[] {
  const root = parsed as { advisories?: unknown; vulnerabilities?: unknown } | null
  const advisories: Advisory[] = root && typeof root.advisories === 'object' && root.advisories && !Array.isArray(root.advisories)
    ? Object.values(root.advisories as Record<string, Advisory>)
    : []
  // npm audit v7+ reports direct advisories in vulnerabilities[*].via.
  // String entries identify indirect dependencies, not advisories by themselves.
  if (root && typeof root.vulnerabilities === 'object' && root.vulnerabilities && !Array.isArray(root.vulnerabilities)) {
    for (const [name, value] of Object.entries(root.vulnerabilities as Record<string, { via?: unknown }>)) {
      if (!value || !Array.isArray(value.via)) continue
      for (const via of value.via) {
        if (!via || typeof via !== 'object' || Array.isArray(via)) continue
        const item = via as Record<string, unknown>
        advisories.push({ id: typeof item.source === 'number' || typeof item.source === 'string' ? item.source : undefined,
          module_name: typeof item.name === 'string' ? item.name : name,
          title: typeof item.title === 'string' ? item.title : undefined,
          severity: typeof item.severity === 'string' ? item.severity : undefined,
          url: typeof item.url === 'string' ? item.url : undefined,
          vulnerable_versions: typeof item.range === 'string' ? item.range : undefined })
      }
    }
  }
  return advisories.map((a) => {
    const moduleName = a.module_name ?? 'unknown'
    const fingerprint = String(a.id ?? a.url ?? a.title ?? moduleName)
    return {
      id: stableFindingId({ category: 'dependency', location: { symbol: moduleName }, fingerprint }),
      category: 'dependency',
      title: a.title ?? `Vulnerable dependency: ${moduleName}`,
      description: a.recommendation ?? a.title ?? `Advisory for ${moduleName}.`,
      location: { symbol: moduleName },
      evidence: `${a.severity ?? 'unknown'} advisory for ${moduleName}`
        + (a.vulnerable_versions ? ` (${a.vulnerable_versions})` : '')
        + (a.url ? ` — ${a.url}` : ''),
      provenance: `${packageManager} audit`,
      severity: mapSeverity(a.severity),
      confidence: 'confirmed',
      recommendation: a.recommendation ?? 'Review and upgrade the affected dependency.',
      status: 'open',
      references: {},
    }
  })
}

// path(line,col): error|warning TSxxxx: message
const TSC_DIAGNOSTIC = /^(.+?)\((\d+),(\d+)\):\s+(error|warning)\s+(TS\d+):\s+(.*)$/

/**
 * Map `tsc` diagnostic output (one diagnostic per line, --pretty false) to code findings. Pure and
 * deterministic. Compiler diagnostics are `confirmed`; errors are high severity, warnings low. Each finding
 * carries evidence (file:line:col + message) and provenance.
 */
export function mapTscDiagnostics(stdout: string): AuditFinding[] {
  const findings: AuditFinding[] = []
  for (const raw of stdout.split(/\r?\n/)) {
    const m = TSC_DIAGNOSTIC.exec(raw.trim())
    if (!m) continue
    const [, file, lineStr, colStr, level, code, message] = m
    const line = Number(lineStr)
    const normFile = file.replace(/\\/g, '/')
    findings.push({
      id: stableFindingId({ category: 'types', location: { file: normFile, line }, fingerprint: `${code}:${colStr}` }),
      category: 'types',
      title: `${code}: ${message.slice(0, 80)}`,
      description: message,
      location: { file: normFile, line },
      evidence: `${normFile}:${line}:${colStr} ${level} ${code}: ${message}`,
      provenance: 'tsc',
      severity: level === 'error' ? 'high' : 'low',
      confidence: 'confirmed',
      recommendation: 'Fix the TypeScript diagnostic.',
      status: 'open',
      references: {},
    })
  }
  return findings
}

/**
 * Dependency analyzer: runs `<packageManager> audit --json` and maps advisories to findings. A non-zero exit
 * with valid JSON (vulnerabilities found) is a success; unparseable output (a missing or broken tool) throws,
 * so the orchestrator records partial coverage — never a clean empty result.
 */
export function createDependencyAnalyzer(opts: { run: CommandRunner; packageManager?: string }): Analyzer {
  const pm = opts.packageManager ?? 'pnpm'
  return {
    name: `${pm} audit`,
    run: async (ctx) => {
      if (ctx.scope.kind !== 'project') return { status: 'skipped', findings: [], reason: 'Dependency audit cannot guarantee the selected module or path scope.' }
      const res = await opts.run(pm, ['audit', '--json'], { cwd: ctx.dir })
      let parsed: unknown
      try {
        parsed = JSON.parse(res.stdout)
      } catch {
        throw new Error(`${pm} audit produced no parseable JSON (exit ${res.exitCode})`)
      }
      const data = parsed as { error?: unknown; advisories?: unknown; vulnerabilities?: unknown; kaddoOmitted?: unknown } | null
      const objectMap = (v: unknown) => typeof v === 'object' && v !== null && !Array.isArray(v)
      if (!data || data.error || (!objectMap(data.advisories) && !objectMap(data.vulnerabilities))) throw new Error(`${pm} audit returned an unrecognized or error response`)
      const findings = mapAuditAdvisories(parsed, pm)
      const indirect = objectMap(data.vulnerabilities) && Object.values(data.vulnerabilities as Record<string, { via?: unknown }>).some(v => !v || !Array.isArray(v.via) || !v.via.some(x => x && typeof x === 'object' && !Array.isArray(x)))
      if (indirect && findings.length === 0) throw new Error(`${pm} audit returned vulnerabilities without direct advisory evidence`)
      const notEvaluated = [...(indirect ? ['indirect dependency vulnerability attribution'] : []), ...(typeof data.kaddoOmitted === 'number' && data.kaddoOmitted > 0 ? ['unsupported lockfile entries'] : [])]
      return { findings, evaluated: ['dependencies'], ...(notEvaluated.length ? { notEvaluated } : {}) }
    },
  }
}

/**
 * TypeScript code analyzer: runs `tsc --noEmit --pretty false` and maps diagnostics to findings. A non-zero
 * exit WITH diagnostics is a success (type errors found). A non-zero exit with NO parseable diagnostics means
 * the tool itself failed (missing tsc, bad config), so it throws → partial coverage.
 */
export function createTypescriptAnalyzer(opts: { run: CommandRunner }): Analyzer {
  return {
    name: 'tsc',
    run: async (ctx) => {
      if (ctx.scope.kind === 'paths') return { status: 'skipped', findings: [], reason: 'TypeScript analysis cannot guarantee an arbitrary path scope.' }
      const root = path.resolve(ctx.dir)
      const dirs = ctx.scope.kind === 'project' ? [{ cwd: root, prefix: '' }] : ctx.scope.modules.map(name => {
        const match = ctx.discovery?.modules.find(m => m.name === name)
        if (!match) throw new Error(`Unknown module: ${name}`)
        const resolved = path.resolve(root, match.path)
        const relative = path.relative(fs.realpathSync(root), fs.realpathSync(resolved))
        if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) throw new Error('Module resolves outside project.')
        return { cwd: resolved, prefix: match.path.replace(/\\/g, '/') }
      })
      const findings: AuditFinding[] = []
      for (const target of dirs) {
        const res = await opts.run('tsc', ['--noEmit', '--pretty', 'false'], { cwd: target.cwd })
        const found = mapTscDiagnostics(`${res.stdout}\n${res.stderr}`)
        if (res.exitCode !== 0 && found.length === 0) throw new Error(`tsc failed to run (exit ${res.exitCode}): ${(res.stderr || res.stdout).slice(0, 200)}`)
        for (const f of found) {
          if (target.prefix && f.location?.file) {
            const file = path.relative(root, path.resolve(target.cwd, f.location.file)).replace(/\\/g, '/')
            if (file !== target.prefix && !file.startsWith(`${target.prefix}/`)) continue
            const location = { ...f.location, file }
            const match = f.evidence.match(/:(\d+) (?:error|warning) (TS\d+):/)
            if (!match) throw new Error('Could not preserve diagnostic identity.')
            findings.push({ ...f, id: stableFindingId({ category: f.category, location, fingerprint: `${match[2]}:${match[1]}` }), location, evidence: f.evidence.replace(f.location.file, file) })
          } else findings.push(f)
        }
      }
      return { findings, evaluated: ctx.scope.kind === 'project' ? ['types'] : dirs.map(d => `types:${d.prefix}`) }
    },
  }
}
