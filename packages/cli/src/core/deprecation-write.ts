// Controlled Deprecation mutation contract (WI-049, slice C of WI-046).
//
// The single, deterministic source of create/update/remove rules for Deprecation Plans and their
// Targets. CLI, MCP and (later) Admin converge here; none writes Markdown on its own. Markdown under
// knowledge/legacy/deprecations/ stays the source of truth. No network, no execution. Mutations are
// proposal → preview → confirm: destructive changes never apply without an explicit confirm.

import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { readFile, exists, join, ensureDir } from '../utils/fs.js'
import { discoverKnowledge } from '../services/knowledge-artifacts.js'
import { loadMappedModules } from '../services/mapped-modules.js'
import { getResource } from './resources.js'
import {
  getDeprecationPlan,
  parseTarget,
  validateTarget,
  DEPRECATION_ARTIFACT_TYPE,
  DEPRECATION_PLANS_DIR,
} from './deprecation.js'

export type DeprecationFindingLevel = 'error' | 'warning'
export type DepFinding = { level: DeprecationFindingLevel; message: string }

export type PlanInput = { title?: string; purpose?: string; status?: string; id?: string }

export type TargetInput = {
  id?: string
  type?: string
  locator?: string
  title?: string
  lifecycle?: string
  environments?: Record<string, string>
  assessment?: { unusedConfidence?: string; blastRadius?: string; reversibility?: string }
  dependsOnRemoval?: string[]
  resource?: string
  module?: string
}

export type PlanWriteResult = { id: string; path: string; findings: DepFinding[] }
export type TargetWriteResult = { planId: string; targetId: string; path: string; findings: DepFinding[] }
export type TargetRemovePreview = { planId: string; targetId: string; dependents: string[] }

export class DeprecationWriteError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message)
    this.name = 'DeprecationWriteError'
  }
}

function slug(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
}

function atomicWrite(filePath: string, content: string): void {
  const tmp = `${filePath}.tmp-${process.pid}-${Date.now()}`
  fs.writeFileSync(tmp, content, 'utf-8')
  fs.renameSync(tmp, filePath)
}

function serialize(data: Record<string, unknown>, body: string): string {
  return matter.stringify(`\n${body.trim()}\n`, data)
}

function allPlanArtifacts(dir: string) {
  return discoverKnowledge(dir).filter((a) => a.type === DEPRECATION_ARTIFACT_TYPE)
}

/** Next DEP-NNN id (zero-padded, numeric), unique across existing plans. */
export function nextPlanId(dir: string, explicit?: string): string {
  if (explicit && explicit.trim()) return explicit.trim()
  let max = 0
  for (const a of allPlanArtifacts(dir)) {
    const m = (a.id || '').match(/^DEP-(\d+)$/i)
    if (m) max = Math.max(max, parseInt(m[1], 10))
  }
  return `DEP-${String(max + 1).padStart(3, '0')}`
}

/** Next DEP-TGT-NNN id within a plan, unique among its existing targets. */
export function nextTargetId(targetIds: string[]): string {
  let max = 0
  for (const id of targetIds) {
    const m = id.match(/^DEP-TGT-(\d+)$/i)
    if (m) max = Math.max(max, parseInt(m[1], 10))
  }
  return `DEP-TGT-${String(max + 1).padStart(3, '0')}`
}

/** Build a snake_case frontmatter target from an input, including only provided fields. */
function buildTargetRaw(input: TargetInput, base: Record<string, unknown> = {}): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base }
  if (input.id != null) out.id = input.id
  if (input.type != null) out.type = input.type
  if (input.locator != null) out.locator = input.locator
  if (input.title != null) out.title = input.title
  if (input.lifecycle != null) out.lifecycle = input.lifecycle
  if (input.environments != null) out.environments = input.environments
  if (input.assessment != null) {
    const a: Record<string, unknown> = { ...(typeof base.assessment === 'object' && base.assessment ? base.assessment as object : {}) }
    if (input.assessment.unusedConfidence != null) a.unused_confidence = input.assessment.unusedConfidence
    if (input.assessment.blastRadius != null) a.blast_radius = input.assessment.blastRadius
    if (input.assessment.reversibility != null) a.reversibility = input.assessment.reversibility
    out.assessment = a
  }
  if (input.dependsOnRemoval != null) out.depends_on_removal = input.dependsOnRemoval
  if (input.resource != null) out.resource = input.resource
  if (input.module != null) out.module = input.module
  return out
}

/** Validate a target input against the Core model + mapped modules + resource existence. */
export function validateTargetInput(dir: string, raw: Record<string, unknown>): DepFinding[] {
  const findings: DepFinding[] = []
  const parsed = parseTarget(raw)
  if (!parsed) {
    findings.push({ level: 'error', message: 'A target id is required.' })
    return findings
  }
  for (const f of validateTarget(parsed)) {
    findings.push({ level: f.severity === 'error' ? 'error' : 'warning', message: f.message })
  }
  // Module validation against .kaddo/modules.yml when available (advisory, no remote access).
  const mapped = loadMappedModules(dir).map((m) => m.id)
  if (parsed.module && mapped.length > 0 && !mapped.includes(parsed.module)) {
    findings.push({ level: 'warning', message: `Module "${parsed.module}" is not in .kaddo/modules.yml.` })
  }
  // Resource existence (advisory): database/external targets should link a known Project Resource.
  if (parsed.resource && !getResource(dir, parsed.resource)) {
    findings.push({ level: 'warning', message: `Project Resource "${parsed.resource}" not found.` })
  }
  return findings
}

function loadPlanRaw(dir: string, planId: string): { filePath: string; data: Record<string, unknown>; body: string } {
  const match = allPlanArtifacts(dir).find((a) => a.id === planId || a.title === planId)
  if (!match) throw new DeprecationWriteError('NOT_FOUND', `Deprecation Plan "${planId}" not found.`)
  const parsed = matter(readFile(match.filePath))
  // Clone: gray-matter memoizes parse results by raw string, so never mutate parsed.data in place
  // (two artifacts with byte-identical content would otherwise share — and poison — one object).
  const data = { ...((parsed.data ?? {}) as Record<string, unknown>) }
  return { filePath: match.filePath, data, body: parsed.content.trim() }
}

function rawTargets(data: Record<string, unknown>): Record<string, unknown>[] {
  return Array.isArray(data.targets) ? (data.targets as Record<string, unknown>[]) : []
}

/** Create a new, empty Deprecation Plan. */
export function createPlan(dir: string, input: PlanInput): PlanWriteResult {
  const title = (input.title ?? '').trim()
  if (!title) throw new DeprecationWriteError('INVALID_INPUT', 'A plan title is required.')

  const existing = allPlanArtifacts(dir)
  if (input.id && existing.some((a) => (a.id || '').toUpperCase() === input.id!.toUpperCase())) {
    throw new DeprecationWriteError('DUPLICATE', `A plan with id "${input.id}" already exists.`)
  }
  if (existing.some((a) => (a.title || '').toLowerCase() === title.toLowerCase())) {
    throw new DeprecationWriteError('DUPLICATE', `A plan titled "${title}" already exists.`)
  }

  const id = nextPlanId(dir, input.id)
  const data: Record<string, unknown> = {
    type: DEPRECATION_ARTIFACT_TYPE,
    id,
    title,
    status: (input.status ?? 'draft').trim() || 'draft',
    targets: [],
  }
  const body = `# Purpose\n\n${(input.purpose ?? '').trim() || 'TODO: describe what this plan retires and why.'}`
  const relPath = `${DEPRECATION_PLANS_DIR}/${id}-${slug(title) || 'plan'}.md`
  const filePath = join(dir, relPath)
  if (exists(filePath)) throw new DeprecationWriteError('DUPLICATE', `Plan file already exists: ${relPath}`)
  ensureDir(path.dirname(filePath))
  atomicWrite(filePath, serialize(data, body))
  return { id, path: relPath, findings: [] }
}

/** Add a target to a plan (no-lossy: other frontmatter keys and the body are preserved). */
export function addTarget(dir: string, planId: string, input: TargetInput): TargetWriteResult {
  const { filePath, data, body } = loadPlanRaw(dir, planId)
  const targets = rawTargets(data)
  const existingIds = targets.map((t) => String(t.id ?? ''))

  const targetId = (input.id ?? '').trim() || nextTargetId(existingIds)
  if (existingIds.some((id) => id.toUpperCase() === targetId.toUpperCase())) {
    throw new DeprecationWriteError('DUPLICATE', `Target "${targetId}" already exists in ${planId}.`)
  }

  const raw = buildTargetRaw({ ...input, id: targetId, lifecycle: input.lifecycle ?? 'candidate' })
  const findings = validateTargetInput(dir, raw)
  if (findings.some((f) => f.level === 'error')) {
    throw new DeprecationWriteError('VALIDATION_FAILED', findings.filter((f) => f.level === 'error').map((f) => f.message).join('; '))
  }

  data.targets = [...targets, raw]
  atomicWrite(filePath, serialize(data, body))
  return { planId, targetId, path: `${DEPRECATION_PLANS_DIR}/${path.basename(filePath)}`, findings }
}

/** Update a target in place (no-lossy: unknown keys on the target and elsewhere are preserved). */
export function updateTarget(dir: string, planId: string, targetId: string, patch: TargetInput): TargetWriteResult {
  const { filePath, data, body } = loadPlanRaw(dir, planId)
  const targets = rawTargets(data)
  const idx = targets.findIndex((t) => String(t.id ?? '').toUpperCase() === targetId.toUpperCase())
  if (idx === -1) throw new DeprecationWriteError('NOT_FOUND', `Target "${targetId}" not found in ${planId}.`)

  const merged = buildTargetRaw({ ...patch, id: String(targets[idx].id) }, targets[idx])
  const findings = validateTargetInput(dir, merged)
  if (findings.some((f) => f.level === 'error')) {
    throw new DeprecationWriteError('VALIDATION_FAILED', findings.filter((f) => f.level === 'error').map((f) => f.message).join('; '))
  }

  const next = [...targets]
  next[idx] = merged
  data.targets = next
  atomicWrite(filePath, serialize(data, body))
  return { planId, targetId: String(targets[idx].id), path: `${DEPRECATION_PLANS_DIR}/${path.basename(filePath)}`, findings }
}

/**
 * Remove a target. Without `confirm`, returns the targets that depend on its removal (writes
 * nothing). With `confirm: true`, removes it; dependents' `depends_on_removal` are NOT rewritten.
 */
export function removeTarget(
  dir: string,
  planId: string,
  targetId: string,
  opts: { confirm?: boolean } = {},
): { removed: boolean; preview?: TargetRemovePreview; path?: string } {
  const { filePath, data, body } = loadPlanRaw(dir, planId)
  const targets = rawTargets(data)
  const exists = targets.some((t) => String(t.id ?? '').toUpperCase() === targetId.toUpperCase())
  if (!exists) throw new DeprecationWriteError('NOT_FOUND', `Target "${targetId}" not found in ${planId}.`)

  const dependents = targets
    .filter((t) => (Array.isArray(t.depends_on_removal) ? (t.depends_on_removal as unknown[]).map(String) : []).some((d) => d.toUpperCase() === targetId.toUpperCase()))
    .map((t) => String(t.id))

  if (!opts.confirm) {
    return { removed: false, preview: { planId, targetId, dependents } }
  }
  data.targets = targets.filter((t) => String(t.id ?? '').toUpperCase() !== targetId.toUpperCase())
  atomicWrite(filePath, serialize(data, body))
  return { removed: true, path: `${DEPRECATION_PLANS_DIR}/${path.basename(filePath)}` }
}

export { getDeprecationPlan }
