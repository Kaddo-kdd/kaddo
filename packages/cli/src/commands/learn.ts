import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { readArtifacts, type Artifact } from '../services/artifact-reader.js'
import { exists, join, cwd, readFile, writeFile, ensureDir } from '../utils/fs.js'
import { intro, outro, log, text, select } from '../utils/ui.js'

const ARCH_DIR = 'knowledge'
const WORK_ITEMS_DIR = 'knowledge/delivery/work-items'

/**
 * Where a completed Work Item should live. The lifecycle keeps WIs in subdirectories
 * (draft/ready/in-progress/blocked/completed); completing one moves it to completed/, mirroring how
 * `kaddo ready` moves draft/ → ready/. Returns the original path when the WI is not in such a
 * subdirectory (legacy flat layout), so nothing moves.
 */
export function completedPathFor(filePath: string): string {
  const posix = filePath.replace(/\\/g, '/')
  const m = posix.match(/\/work-items\/(draft|ready|in-progress|blocked)\//)
  if (!m) return filePath
  const completedDir = path.dirname(filePath).replace(
    new RegExp(`[/\\\\]${m[1]}$`),
    path.sep + 'completed'
  )
  return path.join(completedDir, path.basename(filePath))
}

/** Writes the completion + learning and moves the file to completed/. Returns the final path. */
export function updateWorkItemFile(filePath: string, learning: string): string {
  const raw = readFile(filePath)
  const { data, content } = matter(raw)

  data.status = 'completed'
  data.completed_at = new Date().toISOString().split('T')[0]

  // Replace learning section placeholder
  let updatedContent = content
  if (content.includes('_What did we learn from this change? Update after completion._')) {
    updatedContent = content.replace(
      '_What did we learn from this change? Update after completion._',
      learning.trim()
    )
  } else if (content.includes('## Learning')) {
    updatedContent = content.replace(
      /## Learning[\s\S]*$/,
      `## Learning\n\n${learning.trim()}\n`
    )
  } else {
    updatedContent = content.trimEnd() + `\n\n## Learning\n\n${learning.trim()}\n`
  }

  const newRaw = matter.stringify(updatedContent, data)

  const newPath = completedPathFor(filePath)
  if (newPath !== filePath) {
    ensureDir(path.dirname(newPath))
    writeFile(newPath, newRaw)
    fs.unlinkSync(filePath)
  } else {
    writeFile(filePath, newRaw)
  }
  return newPath
}

export async function runLearn(artifactId?: string, opts: { force?: boolean } = {}): Promise<void> {
  const dir = cwd()

  if (!exists(join(dir, ARCH_DIR))) {
    console.error('No knowledge/ directory found. Run `kaddo init` first.')
    process.exit(1)
  }

  intro('kaddo learn')

  const artifacts = readArtifacts(join(dir, ARCH_DIR))
  const closable = artifacts.filter(
    (a) =>
      (a.status === 'in-progress' || a.status === 'completed' || a.status === 'done') &&
      a.type !== 'current-state' &&
      a.type !== 'roadmap'
  )

  if (closable.length === 0) {
    log.warn('No in-progress or completed work items found.')
    outro('Nothing to close.')
    return
  }

  // Determine which work item to close
  let targetId: string

  if (artifactId) {
    targetId = artifactId
  } else if (closable.length === 1) {
    targetId = closable[0].id || closable[0].title
    log.info(`Closing: ${targetId} — ${closable[0].summary || closable[0].title}`)
  } else {
    const chosen = await select<string>({
      message: 'Which work item are you closing?',
      options: closable.map((a) => ({
        value: a.id || a.title,
        label: `${a.id || a.title} — ${a.summary || a.title}`,
      })),
    })
    targetId = chosen
  }

  // Resolve the artifact's real path from the recursive discovery above, so a Work Item is found
  // wherever it currently sits in the lifecycle (draft/ready/in-progress/completed), not just at
  // the top level of the work-items directory.
  const targetArtifact: Artifact | undefined = closable.find(
    (a) => (a.id || a.title) === targetId
  ) ?? artifacts.find((a) => (a.id || a.title) === targetId)
  const filePath = targetArtifact?.filePath ?? null
  if (!filePath) {
    log.error(`Work item "${targetId}" not found in ${WORK_ITEMS_DIR}/`)
    process.exit(1)
  }

  const wiRaw = readFile(filePath)
  const wiData = matter(wiRaw).data as Record<string, unknown>

  // Completion safety (VS-111): block on failed gates, rejected exceptions, failed validation.
  if (!opts.force) {
    const completionBlockers: string[] = []

    const releaseGates = Array.isArray(wiData.release_gates)
      ? (wiData.release_gates as { id: string; status: string; reason?: string }[])
      : []
    for (const gate of releaseGates) {
      if (gate.status === 'failed' || gate.status === 'blocked') {
        completionBlockers.push(`Release gate "${gate.id}" is ${gate.status}${gate.reason ? ': ' + gate.reason : ''}.`)
      }
    }

    const completionExceptions = Array.isArray(wiData.completion_exceptions)
      ? (wiData.completion_exceptions as { id: string; status: string; reason?: string }[])
      : []
    for (const ex of completionExceptions) {
      if (ex.status === 'rejected') {
        completionBlockers.push(`Completion exception "${ex.id}" was rejected${ex.reason ? ': ' + ex.reason : ''}.`)
      }
    }

    if (wiData.validation_status === 'failed') {
      completionBlockers.push('Validation status is "failed".')
    }

    if (completionBlockers.length > 0) {
      log.error('Completion blocked:')
      for (const b of completionBlockers) log.error(`  ✗ ${b}`)
      log.info('Run `kaddo verify` to review evidence, or use `kaddo learn --force` to override.')
      outro('Cannot complete Work Item.')
      return
    }
  }

  const learning = await text({
    message: 'What did you learn from this change?',
    placeholder: 'e.g. The retry logic needed a separate queue to avoid blocking the main flow',
    validate: (v) => (v.trim().length === 0 ? 'Learning is required.' : undefined),
  })

  const hasExceptions = wiData.validation_status === 'accepted-with-exceptions' ||
    (Array.isArray(wiData.completion_exceptions) && wiData.completion_exceptions.length > 0)
  const releaseBlocked = wiData.release_status === 'blocked'

  let enrichedLearning = learning.trim()
  if (hasExceptions || releaseBlocked) {
    const notes: string[] = []
    if (hasExceptions) notes.push('Validation exceptions were accepted for this Work Item.')
    if (releaseBlocked) {
      const gates = Array.isArray(wiData.release_gates)
        ? (wiData.release_gates as { id: string; status: string }[])
          .filter((g) => g.status === 'blocked' || g.status === 'pending')
          .map((g) => g.id)
        : []
      notes.push(gates.length > 0
        ? `Release gates remain: ${gates.join(', ')}.`
        : 'Production release remains blocked.')
    }
    enrichedLearning += '\n\n> ' + notes.join(' ')
  }

  const finalPath = updateWorkItemFile(filePath, enrichedLearning)

  log.success(`${targetId} marked as completed`)
  log.success(`Learning recorded in ${finalPath.replace(dir + path.sep, '').replace(/\\/g, '/')}`)
  if (hasExceptions) {
    log.warn('Learning captured from a Work Item completed with validation exceptions.')
  }
  log.info('Consider updating knowledge/knowledge.md if this changes the current state.')

  outro('Work item closed.')
}
