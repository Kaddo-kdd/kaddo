// WI-098 (EP-001 / INI-001, candidate AUD-C9) — read-only query over persisted audit runs. Lists the runs
// written under .kaddo/audits (by kaddo audit run, WI-097) and filters their findings by severity, category,
// confidence and path. Pure and deterministic; never re-runs an audit and never writes anything.

import fs from 'node:fs'
import path from 'node:path'
import { readAuditRun, AUDITS_DIR, type AuditFinding, type AuditRunStatus, type FindingSeverity, type FindingConfidence } from './audit.js'
import { discoverProject } from './discovery.js'
import { correlateFindings } from './audit-correlation.js'
import { discoverKnowledge } from '../services/knowledge-artifacts.js'
import { loadOwners } from '../services/owners.js'
import type { AuditDiscoverySnapshot } from './audit-execution.js'

export type AuditRunSummary = {
  id: string
  createdAt: string
  status: AuditRunStatus
  total: number
  confirmed: number
  inferences: number
}

/** List persisted audit runs under .kaddo/audits, newest-id last. Read-only; missing dir → empty. */
export function listAuditRuns(dir: string): AuditRunSummary[] {
  const d = path.join(dir, AUDITS_DIR)
  let files: string[] = []
  try {
    files = fs.readdirSync(d).filter((f) => /^AUD-\d+\.json$/.test(f))
  } catch {
    return []
  }
  const out: AuditRunSummary[] = []
  for (const f of files.sort()) {
    const run = readAuditRun(dir, f.replace(/\.json$/, ''))
    if (!run) continue
    const confirmed = run.findings.filter((x) => x.confidence === 'confirmed').length
    out.push({
      id: run.id,
      createdAt: run.createdAt,
      status: run.status,
      total: run.findings.length,
      confirmed,
      inferences: run.findings.length - confirmed,
    })
  }
  return out
}

export type AuditFindingFilters = {
  severity?: FindingSeverity[]
  category?: string[]
  confidence?: FindingConfidence[]
  /** POSIX path prefixes; a finding matches when its location.file is under one of them. */
  pathPrefix?: string[]
}

function matchesPathPrefix(file: string | undefined, prefixes: string[]): boolean {
  if (!file) return false
  const f = file.replace(/\\/g, '/')
  return prefixes.some((p) => {
    const base = p.replace(/\\/g, '/').replace(/\/+$/, '')
    return f === base || f.startsWith(base + '/')
  })
}

/**
 * Filter findings. OR within a dimension, AND across dimensions. Order is preserved. Pure and deterministic;
 * an empty/absent filter dimension does not constrain.
 */
export function queryAuditFindings(findings: AuditFinding[], filters: AuditFindingFilters): AuditFinding[] {
  const cats = filters.category?.map((c) => c.toLowerCase())
  return findings.filter((f) => {
    if (filters.severity?.length && !filters.severity.includes(f.severity)) return false
    if (cats?.length && !cats.includes(f.category.toLowerCase())) return false
    if (filters.confidence?.length && !filters.confidence.includes(f.confidence)) return false
    if (filters.pathPrefix?.length && !matchesPathPrefix(f.location?.file, filters.pathPrefix)) return false
    return true
  })
}

/** Load and correlate a stored run without writing or executing analyzers. */
export function getAuditView(dir: string, id: string, snapshot?: AuditDiscoverySnapshot) {
  if (!/^AUD-\d+$/.test(id)) throw new Error('Invalid audit id.')
  const run = readAuditRun(dir, id)
  if (!run) throw new Error(`Audit "${id}" not found or unreadable.`)
  const modules = (snapshot?.discovery ?? discoverProject(dir, { createdAt: run.createdAt })).modules.map(m => ({ name: m.name, path: m.path }))
  const findings = correlateFindings({ findings: run.findings, artifacts: snapshot?.artifacts ?? discoverKnowledge(dir), owners: snapshot?.owners ?? loadOwners(dir), modules })
  return { run, findings }
}
