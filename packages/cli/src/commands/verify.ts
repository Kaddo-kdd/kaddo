import matter from 'gray-matter'
import { discoverWorkItems } from '../services/knowledge-artifacts.js'
import { getModifiedFiles } from '../services/git.js'
import { exists, join, cwd, readFile, writeFile, readDir } from '../utils/fs.js'
import { intro, outro, log, confirm } from '../utils/ui.js'
import { lifecycleStateOf } from '../core/lifecycle.js'
import {
  verifyWorkItem,
  evaluateCompletion,
  WorkItemNotInProgressError,
} from '../core/implementation-evidence.js'
import { WorkItemNotFoundError } from '../core/work-items.js'
import type { CollectEvidenceInput } from '../core/implementation-evidence.js'

const WORK_ITEMS_DIR = 'knowledge/delivery/work-items'

function findWorkItemFile(dir: string, id: string): string | null {
  const check = (subdir: string) => {
    const wiDir = join(dir, subdir)
    if (!exists(wiDir)) return null
    const files = readDir(wiDir).filter((f) => f.endsWith('.md'))
    const match = files.find((f) => f.includes(id.toUpperCase()) || f.includes(id.toLowerCase()))
    return match ? join(wiDir, match) : null
  }

  for (const sub of ['in-progress', 'ready', 'draft', 'blocked', '']) {
    const found = check(sub ? `${WORK_ITEMS_DIR}/${sub}` : WORK_ITEMS_DIR)
    if (found) return found
  }
  return null
}

export type ParsedAcceptanceCriterion = { criterion: string; checked: boolean }

type PersistedACVerification = {
  criterion?: unknown
  status?: unknown
  evidence?: unknown
  reference?: unknown
  method?: unknown
}

function normalizeAC(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ')
}

function storedACVerifications(value: unknown): Map<string, PersistedACVerification> {
  if (!Array.isArray(value)) return new Map()
  return new Map(value
    .filter((entry): entry is PersistedACVerification => Boolean(entry) && typeof entry === 'object')
    .filter((entry) => typeof entry.criterion === 'string')
    .map((entry) => [normalizeAC(entry.criterion as string), entry]))
}

/** Resolve parsed criteria from durable frontmatter evidence, never checkboxes alone. */
export function buildACVerifications(
  acs: ParsedAcceptanceCriterion[],
  persisted: unknown,
) {
  const persistedACs = storedACVerifications(persisted)
  return acs.map((ac) => {
    const stored = persistedACs.get(normalizeAC(ac.criterion))
    const validStatus = stored?.status === 'passed' || stored?.status === 'failed' ||
      stored?.status === 'not-verified' || stored?.status === 'manual-review-required'
      ? stored.status
      : 'not-verified' as const
    const hasEvidence = typeof stored?.evidence === 'string' && stored.evidence.trim().length > 0 &&
      typeof stored?.reference === 'string' && stored.reference.trim().length > 0
    return {
      criterion: ac.criterion,
      status: validStatus === 'passed' && !hasEvidence ? 'not-verified' as const : validStatus,
      ...(typeof stored?.evidence === 'string' ? { evidence: stored.evidence } : {}),
      ...(typeof stored?.reference === 'string' ? { reference: stored.reference } : {}),
      ...(stored?.method === 'automated' || stored?.method === 'manual' ? { method: stored.method } : {}),
    }
  })
}

/**
 * Read canonical EN/ES acceptance criteria. Checkboxes express intent, not verification evidence.
 *
 * The Acceptance Criteria block may contain subsections (e.g. `### Lifecycle`, `### Verification`): the
 * parser enters on the (optionally numbered) EN/ES heading, keeps collecting through any *deeper*
 * heading, and stops only at a heading of the same or a higher level — so content from later top-level
 * sections is never read as an acceptance criterion, while grouped ACs are all recognized.
 */
export function extractACsFromBody(body: string): ParsedAcceptanceCriterion[] {
  const lines = body.split(/\r?\n/)
  let acLevel = 0 // 0 = not inside the Acceptance Criteria section; otherwise the heading level (# count)
  const acs: ParsedAcceptanceCriterion[] = []
  for (const line of lines) {
    const heading = line.match(/^(#{1,6})\s+(.*)$/)
    if (heading) {
      const level = heading[1].length
      if (acLevel === 0) {
        if (/^(?:\d+(?:\.\d+)*\.?\s+)?(acceptance\s+criteria|criterios\s+de\s+aceptaci[oó]n)\s*$/i.test(heading[2].trim())) {
          acLevel = level
        }
        continue
      }
      // Inside the block: a heading at the same or a higher level ends it; a deeper heading is a
      // subsection and stays inside.
      if (level <= acLevel) break
      continue
    }
    if (acLevel > 0) {
      const m = line.match(/^\s*[-*+]\s+(?:\[([ xX])\]\s*)?(.+)$/)
      if (m) {
        const text = m[2].trim()
        if (text && !/^_.*_$/.test(text) && !/^tbd$/i.test(text)) {
          acs.push({ criterion: text, checked: m[1]?.toLowerCase() === 'x' })
        }
      }
    }
  }
  return acs
}

export async function runVerify(workItemId: string, opts: { json?: boolean; yes?: boolean; force?: boolean } = {}): Promise<void> {
  const dir = cwd()

  if (!exists(join(dir, 'knowledge'))) {
    console.error('No knowledge/ directory found. Run `kaddo init` first.')
    process.exit(1)
  }

  if (!opts.json) intro('kaddo verify')

  // Find the WI
  const artifacts = discoverWorkItems(dir)
  const match = artifacts.find((a) => (a.id || a.title) === workItemId)
  if (!match) {
    if (opts.json) {
      console.log(JSON.stringify({ error: `Work Item "${workItemId}" not found.` }))
    } else {
      log.error(`Work Item "${workItemId}" not found.`)
    }
    process.exit(1)
  }

  const lifecycle = lifecycleStateOf({ status: match.status, filePath: match.filePath })
  if (lifecycle !== 'in-progress') {
    if (opts.json) {
      console.log(JSON.stringify({ error: `Work Item "${workItemId}" is "${lifecycle}", expected "in-progress".` }))
    } else {
      log.error(`Work Item "${workItemId}" is "${lifecycle}". Only in-progress Work Items can be verified.`)
    }
    process.exit(1)
  }

  // Collect git changed paths
  const changedPaths = await getModifiedFiles('head')

  // Read ACs from body
  const raw = readFile(match.filePath)
  const parsed = matter(raw)
  const fm = parsed.data as Record<string, unknown>
  const acs = extractACsFromBody(parsed.content)

  // Build evidence input from existing frontmatter + git data
  const existingEvidence = fm.implementation_evidence as {
    repositories?: Record<string, unknown>
    ac_verifications?: PersistedACVerification[]
  } | undefined
  const existingRepos = existingEvidence?.repositories ?? {}

  const repos = Object.keys(existingRepos).length > 0
    ? Object.entries(existingRepos).map(([repoId, data]) => {
        const d = data as Record<string, unknown>
        return {
          repoId,
          role: typeof d.role === 'string' ? d.role : undefined,
          changedPaths: Array.isArray(d.changed_paths) ? d.changed_paths.map(String) : [],
          validations: Array.isArray(d.validations)
            ? (d.validations as Record<string, unknown>[]).map((v) => ({
                command: String(v.command ?? ''),
                status: String(v.status ?? 'passed') as 'passed' | 'failed' | 'skipped' | 'error',
                ...(v.reason ? { reason: String(v.reason) } : {}),
              }))
            : [],
          migrations: Array.isArray(d.migrations)
            ? (d.migrations as Record<string, unknown>[]).map((m) => ({
                id: String(m.id ?? ''),
                environment: String(m.environment ?? ''),
                status: String(m.status ?? 'unknown'),
                ...(m.reason ? { reason: String(m.reason) } : {}),
              }))
            : undefined,
        }
      })
    : [{ repoId: 'core', changedPaths, validations: [] }]

  // A checked Markdown item is author intent, not independently reviewable
  // evidence. Only an evidence record stored in the canonical frontmatter can
  // verify an AC across repeated `kaddo verify` invocations.
  const acVerifications = buildACVerifications(acs, existingEvidence?.ac_verifications)

  const input: CollectEvidenceInput = {
    repos,
    acVerifications,
  }

  // Run verification
  let verification
  try {
    verification = verifyWorkItem(dir, workItemId, input)
  } catch (e) {
    if (e instanceof WorkItemNotFoundError || e instanceof WorkItemNotInProgressError) {
      if (opts.json) {
        console.log(JSON.stringify({ error: e.message }))
      } else {
        log.error(e.message)
      }
      process.exit(1)
    }
    throw e
  }

  const evaluation = evaluateCompletion(verification)

  // Output
  if (opts.json) {
    console.log(JSON.stringify({ verification, evaluation }, null, 2))
    return
  }

  // Display results
  log.info(`Work Item: ${workItemId}`)
  log.info(`Lifecycle: ${verification.lifecycle}`)
  log.info(`Implementation: ${verification.implementationStatus}`)
  log.info(`Validation: ${verification.validationStatus}`)
  console.log('')

  // AC status
  if (verification.acVerifications.length > 0) {
    console.log('Acceptance Criteria:')
    for (const ac of verification.acVerifications) {
      const icon = ac.status === 'passed' ? '✓' : ac.status === 'failed' ? '✗' : ac.status === 'manual-review-required' ? '?' : '·'
      console.log(`  ${icon} [${ac.status}] ${ac.criterion}`)
    }
    console.log(`  Summary: ${verification.acSummary.passed}/${verification.acSummary.total} passed`)
    console.log('')
  }

  // Release gates
  if (verification.releaseGates.length > 0) {
    console.log('Release Gates:')
    for (const gate of verification.releaseGates) {
      const icon = gate.status === 'passed' ? '✓' : gate.status === 'failed' || gate.status === 'blocked' ? '✗' : '·'
      console.log(`  ${icon} [${gate.status}] ${gate.id}${gate.reason ? ' — ' + gate.reason : ''}`)
    }
    console.log('')
  }

  // Completion exceptions
  if (verification.completionExceptions.length > 0) {
    console.log('Completion Exceptions:')
    for (const ex of verification.completionExceptions) {
      const icon = ex.status === 'accepted' || ex.status === 'resolved' ? '✓' : ex.status === 'rejected' ? '✗' : '·'
      console.log(`  ${icon} [${ex.status}] ${ex.id}${ex.reason ? ' — ' + ex.reason : ''}`)
    }
    console.log('')
  }

  // Findings
  if (verification.findings.length > 0) {
    console.log('Findings:')
    for (const f of verification.findings) {
      const icon = f.severity === 'blocking' ? '✗' : f.severity === 'warning' ? '!' : '·'
      console.log(`  ${icon} [${f.severity}] ${f.message}`)
    }
    console.log('')
  }

  // Planned vs actual
  if (verification.plannedVsActual) {
    const pva = verification.plannedVsActual
    if (pva.addedModules.length > 0 || pva.missingModules.length > 0) {
      console.log('Planned vs Actual:')
      if (pva.addedModules.length > 0) console.log(`  Added: ${pva.addedModules.join(', ')}`)
      if (pva.missingModules.length > 0) console.log(`  Missing: ${pva.missingModules.join(', ')}`)
      console.log('')
    }
  }

  // Completion decision
  const readinessIcon = evaluation.readiness === 'READY_TO_COMPLETE' ? '✓'
    : evaluation.readiness === 'READY_WITH_EXCEPTIONS' ? '!'
    : '✗'
  console.log(`Completion Decision: ${readinessIcon} ${evaluation.readiness}`)
  for (const r of evaluation.reasons) console.log(`  ${r}`)
  if (evaluation.blockers.length > 0) {
    console.log('  Blockers:')
    for (const b of evaluation.blockers) console.log(`    ✗ ${b}`)
  }
  if (evaluation.warnings.length > 0) {
    console.log('  Warnings:')
    for (const w of evaluation.warnings) console.log(`    ! ${w}`)
  }
  console.log('')

  // Persist evidence
  const shouldPersist = opts.yes || await confirm({
    message: 'Update Work Item frontmatter with verification evidence?',
    initialValue: true,
  })

  if (shouldPersist) {
    const filePath = match.filePath
    const wiRaw = readFile(filePath)
    const wiParsed = matter(wiRaw)
    const data = wiParsed.data as Record<string, unknown>

    data.implementation_evidence = verification.implementationEvidence
    data.implementation_status = verification.implementationStatus
    data.validation_status = verification.validationStatus
    data.verified_at = new Date().toISOString().split('T')[0]

    const newRaw = matter.stringify(wiParsed.content, data)
    writeFile(filePath, newRaw)

    log.success('Work Item frontmatter updated with verification evidence.')
  }

  if (!opts.json) outro('Verification complete.')
}
