import { createHash } from 'node:crypto'
import matter from 'gray-matter'
import { discoverKnowledge, discoverWorkItems } from '../services/knowledge-artifacts.js'
import { exists, join, readDir, readFile, writeFile } from '../utils/fs.js'
import { getResource, parseWorkItemResources } from './resources.js'
import { POC_ARTIFACT_PATH, readPocSummary, type PocConclusion } from './poc.js'

export const POC_REPORT_PREFIX = 'poc-report-v'
export type PocReportStatus = 'missing' | 'current' | 'stale'
export type PocReportSource = { path: string; kind: 'poc' | 'work-item' | 'resource' | 'knowledge'; digest: string; content: string }
export type PocReportContext = {
  eligible: boolean
  conclusion: PocConclusion
  status: PocReportStatus
  latestReport: { path: string; version: number; sourceFingerprint: string; sourceManifest: Record<string, string> } | null
  nextPath: string
  sourceFingerprint: string
  sources: PocReportSource[]
  changesSinceLatest: string[]
  handoff: string
}

const SECRET_LINE = /(^|\s)(?:[A-Z][A-Z0-9_]*(?:TOKEN|SECRET|PASSWORD|API_KEY|PRIVATE_KEY)|(?:token|secret|password|api[_-]?key))\s*[:=]\s*\S+/i
const reportName = /^poc-report-v(\d{3,})\.md$/

function sha(value: string): string { return createHash('sha256').update(value).digest('hex') }
function posix(value: string): string { return value.replace(/\\/g, '/') }

/** Redact values that look like credentials while retaining a safe reference name. */
export function redactSecrets(value: string): string {
  return value.split(/\r?\n/).map((line) => {
    if (!SECRET_LINE.test(line)) return line
    return line.replace(/([:=]\s*)\S+.*/, '$1[redacted]')
  }).join('\n')
}

function source(dir: string, path: string, kind: PocReportSource['kind']): PocReportSource | null {
  const absolute = join(dir, path)
  if (!exists(absolute)) return null
  const raw = readFile(absolute)
  return { path: posix(path), kind, digest: sha(raw), content: redactSecrets(raw) }
}

function reportFiles(dir: string): { path: string; version: number; sourceFingerprint: string; sourceManifest: Record<string, string> }[] {
  const delivery = join(dir, 'knowledge', 'delivery')
  return readDir(delivery).flatMap((name) => {
    const match = name.match(reportName)
    if (!match) return []
    try {
      const parsed = matter(readFile(join(delivery, name)))
      const fingerprint = typeof parsed.data.source_fingerprint === 'string' ? parsed.data.source_fingerprint : ''
      const manifest = parsed.data.source_manifest
      const sourceManifest = manifest && typeof manifest === 'object' && !Array.isArray(manifest)
        ? Object.fromEntries(Object.entries(manifest as Record<string, unknown>).filter(([, digest]) => typeof digest === 'string'))
        : {}
      return [{ path: `knowledge/delivery/${name}`, version: Number(match[1]), sourceFingerprint: fingerprint, sourceManifest }]
    } catch { return [] }
  }).sort((a, b) => b.version - a.version)
}

function reportPath(version: number): string { return `knowledge/delivery/${POC_REPORT_PREFIX}${String(version).padStart(3, '0')}.md` }

/** Build the bounded, evidence-only context used by a report-generating agent. */
export function buildPocReportContext(dir: string): PocReportContext {
  const poc = readPocSummary(dir)
  const reports = reportFiles(dir)
  const latestReport = reports[0] ?? null
  const nextPath = reportPath((latestReport?.version ?? 0) + 1)
  if (!poc.exists || poc.conclusion === 'pending') {
    return {
      eligible: false, conclusion: poc.conclusion, status: latestReport ? 'stale' : 'missing', latestReport,
      nextPath, sourceFingerprint: '', sources: [], changesSinceLatest: [],
      handoff: 'POC conclusion is still pending. Record validated, rejected, or inconclusive before generating a final report.',
    }
  }

  const sources: PocReportSource[] = []
  const add = (path: string, kind: PocReportSource['kind']) => {
    if (sources.some((item) => item.path === posix(path))) return
    const item = source(dir, path, kind)
    if (item) sources.push(item)
  }
  add(POC_ARTIFACT_PATH, 'poc')
  const pocText = readFile(join(dir, POC_ARTIFACT_PATH))
  const knowledge = discoverKnowledge(dir)
  const workItems = discoverWorkItems(dir)
  const referencedWorkItems = workItems.filter((wi) => wi.lifecycle === 'completed' && wi.id && new RegExp(`\\b${wi.id}\\b`).test(pocText))
  const resourceIds = new Set<string>()
  const decisionIds = new Set<string>()
  for (const wi of referencedWorkItems) {
    add(wi.relPath, 'work-item')
    for (const resource of parseWorkItemResources(wi.rawFrontmatter)) resourceIds.add(resource.id)
    const decisions = wi.rawFrontmatter.decisions
    if (Array.isArray(decisions)) decisions.forEach((id) => decisionIds.add(String(id)))
  }
  for (const id of resourceIds) {
    const resource = getResource(dir, id)
    if (resource) add(resource.path, 'resource')
  }
  for (const artifact of knowledge) {
    if (artifact.isWorkItem || !artifact.id) continue
    if (decisionIds.has(artifact.id) || referencedWorkItems.some((wi) => new RegExp(`\\b${artifact.id}\\b`).test(readFile(wi.filePath)))) add(artifact.relPath, 'knowledge')
  }
  sources.sort((a, b) => a.path.localeCompare(b.path))
  const sourceFingerprint = sha(sources.map((item) => `${item.path}\0${item.digest}`).join('\n'))
  const status: PocReportStatus = !latestReport ? 'missing' : latestReport.sourceFingerprint === sourceFingerprint ? 'current' : 'stale'
  const currentManifest = Object.fromEntries(sources.map((item) => [item.path, item.digest]))
  const changesSinceLatest = status === 'stale'
    ? [...new Set([...Object.keys(currentManifest), ...Object.keys(latestReport?.sourceManifest ?? {})])]
      .filter((path) => currentManifest[path] !== latestReport?.sourceManifest[path])
      .sort()
    : []
  const sourceList = sources.map((item) => `- ${item.path} (${item.kind})`).join('\n') || '- No sources selected.'
  return {
    eligible: true, conclusion: poc.conclusion, status, latestReport, nextPath, sourceFingerprint, sources, changesSinceLatest,
    handoff: [
      'Create a POC Final Report from the supplied sources only. Do not explore the repository.',
      `Canonical conclusion: ${poc.conclusion}. Do not contradict it.`,
      'Use the 15 canonical sections. Mark missing evidence as Not evaluated, Not applicable, or No evidence available.',
      'Distinguish measured, calculated, estimated, and projected values. Never include secret values.',
      'Choose the representation that best communicates each grounded fact: Markdown tables for structured comparisons, Mermaid for grounded architecture, flows, or relationships, and prose for explanation and interpretation.',
      'Do not invent data, entities, relationships, priorities, or metrics to create a table or diagram. Do not use ASCII diagrams when Mermaid can represent the same grounded flow.',
      'In Traceability, use repository-relative Markdown links or paths. Never use file:/// URLs or local absolute filesystem paths.',
      '', 'Selected sources:', sourceList,
    ].join('\n'),
  }
}

function canonicalReport(context: PocReportContext, proposal: string): string {
  const supersedes = context.latestReport?.path.split('/').pop()
  const data: Record<string, unknown> = {
    type: 'poc-report', report_version: Number(context.nextPath.match(/v(\d+)\.md$/)?.[1] ?? 1),
    generated_at: new Date().toISOString().slice(0, 10), poc_conclusion: context.conclusion,
    source_fingerprint: context.sourceFingerprint,
    sources: context.sources.map((item) => item.path),
    source_manifest: Object.fromEntries(context.sources.map((item) => [item.path, item.digest])),
  }
  if (supersedes) data.supersedes = supersedes
  return matter.stringify(redactSecrets(proposal).trimEnd() + '\n', data)
}

/** Persist a human-confirmed report only when its deterministic context is still current. */
export function persistPocReport(dir: string, proposal: string, opts: { confirm?: boolean; force?: boolean } = {}): { status: string; path: string; content?: string; message?: string } {
  const context = buildPocReportContext(dir)
  if (!context.eligible) throw new Error(context.handoff)
  if (context.status === 'current' && !opts.force) return { status: 'current', path: context.latestReport!.path, message: 'The current POC report already represents the latest evidence.' }
  if (!opts.confirm) return { status: 'needs_confirmation', path: context.nextPath, content: canonicalReport(context, proposal), message: 'Review the proposed report and confirm persistence.' }
  const output = join(dir, context.nextPath)
  if (exists(output)) throw new Error(`POC report already exists: ${context.nextPath}`)
  const content = canonicalReport(context, proposal)
  writeFile(output, content)
  return { status: 'persisted', path: context.nextPath, content }
}
