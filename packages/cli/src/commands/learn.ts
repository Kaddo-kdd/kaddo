import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { exists, join, cwd, readFile, writeFile, ensureDir } from '../utils/fs.js'
import { discoverWorkItems } from '../services/knowledge-artifacts.js'
import { lifecycleFolderOf } from '../core/lifecycle.js'
import { intro, outro, log, text, select } from '../utils/ui.js'

const ARCH_DIR = 'knowledge'
const WORK_ITEMS_DIR = 'knowledge/delivery/work-items'

/**
 * Resolve a Work Item's real file path by id, using the same recursive discovery
 * the other lifecycle commands (`ready`, `verify`) rely on. This finds Work Items
 * wherever they currently sit in the lifecycle (draft/, ready/, in-progress/,
 * completed/), not just the flat top-level work-items/ directory.
 */
export function findWorkItemFile(dir: string, id: string): string | null {
  const wis = discoverWorkItems(dir)
  const match =
    wis.find((w) => w.id.toLowerCase() === id.toLowerCase()) ??
    wis.find((w) => path.basename(w.filePath).toLowerCase().includes(id.toLowerCase()))
  return match ? match.filePath : null
}

/** The path a Work Item should live at once completed, moving it to work-items/completed/. */
function completedPathFor(filePath: string): string {
  const folder = lifecycleFolderOf(filePath)
  if (!folder || folder === 'completed') return filePath
  const completedDir = path
    .dirname(filePath)
    .replace(new RegExp(`[/\\\\]${folder}$`), path.sep + 'completed')
  return path.join(completedDir, path.basename(filePath))
}

/**
 * Record the learning, mark the Work Item completed, and move the file to
 * work-items/completed/ when it currently sits in another lifecycle subfolder.
 * Returns the final path of the Work Item file.
 */
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

  const targetPath = completedPathFor(filePath)
  if (targetPath !== filePath) {
    ensureDir(path.dirname(targetPath))
    writeFile(targetPath, newRaw)
    fs.unlinkSync(filePath)
    return targetPath
  }

  writeFile(filePath, newRaw)
  return filePath
}

export async function runLearn(artifactId?: string, opts: { force?: boolean } = {}): Promise<void> {
  const dir = cwd()

  if (!exists(join(dir, ARCH_DIR))) {
    console.error('No knowledge/ directory found. Run `kaddo init` first.')
    process.exit(1)
  }

  intro('kaddo learn')

  const closable = discoverWorkItems(dir).filter(
    (a) => a.lifecycle === 'in-progress' || a.lifecycle === 'completed'
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

  const filePath = findWorkItemFile(dir, targetId)
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
  if (finalPath !== filePath) {
    log.success(`Moved file:`)
    log.info(`  ${path.relative(dir, filePath)}`)
    log.info(`  → ${path.relative(dir, finalPath)}`)
  }
  log.success(`Learning recorded in ${path.relative(dir, finalPath)}`)
  if (hasExceptions) {
    log.warn('Learning captured from a Work Item completed with validation exceptions.')
  }
  log.info('Consider updating knowledge/knowledge.md if this changes the current state.')

  outro('Work item closed.')
}
