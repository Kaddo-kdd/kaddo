import { getModifiedFiles, isGitRepo } from '../services/git.js'
import { readArtifacts } from '../services/artifact-reader.js'
import { classify } from '../core/classifier.js'
import { exists, join, cwd } from '../utils/fs.js'

const ARCH_DIR = 'knowledge'

function findActiveWorkItem(dir: string) {
  const archDir = join(dir, ARCH_DIR)
  if (!exists(archDir)) return null
  const artifacts = readArtifacts(archDir)
  return artifacts
    .filter((a) => a.status === 'in-progress' && a.type !== 'current-state' && a.type !== 'roadmap')
    .sort((a, b) => {
      // Prefer most recently created
      const dateA = (a as unknown as { created_at?: string }).created_at ?? ''
      const dateB = (b as unknown as { created_at?: string }).created_at ?? ''
      return dateB.localeCompare(dateA)
    })[0] ?? null
}

function printResult(result: ReturnType<typeof classify>, workItemId?: string): void {
  console.log('')

  if (workItemId) {
    console.log(`Work item: ${workItemId}`)
  }
  console.log(`Declared:  ${result.declaredType} / ${result.declaredLevel}`)
  console.log('')

  if (result.observedSignals.length > 0) {
    console.log('Observed signals:')
    for (const signal of result.observedSignals) {
      console.log(`  - ${signal.name}: ${signal.file}`)
      console.log(`    → ${signal.implication}`)
    }
    console.log('')
  }

  if (result.hasDrift) {
    console.log('Suggested review:')
    console.log(`  ${result.summary}`)
    if (result.suggestedTypes.length > 0) {
      console.log(`  Consider: ${result.suggestedTypes.join(' / ')}`)
    }
  } else {
    console.log(`  ${result.summary}`)
  }

  console.log('')
}

export async function runClassify(opts: { type?: string; level?: string; staged?: boolean } = {}): Promise<void> {
  const dir = cwd()

  const isRepo = await isGitRepo(dir)
  if (!isRepo) {
    console.error('Not a Git repository.')
    process.exit(1)
  }

  const mode = opts.staged ? 'staged' : 'head'
  const touchedFiles = await getModifiedFiles(mode)

  if (touchedFiles.length === 0) {
    console.log('kaddo classify: no modified files detected.')
    return
  }

  // If type/level provided via flags, use them directly
  if (opts.type) {
    const result = classify(opts.type, opts.level ?? '', touchedFiles)
    printResult(result)
    return
  }

  // Otherwise, infer from active work item
  const activeItem = findActiveWorkItem(dir)
  if (!activeItem) {
    console.log('kaddo classify: no active work item found.')
    console.log('Use --type <type> to classify without a work item.')
    console.log('Or create one with: kaddo create <type>')
    return
  }

  const result = classify(activeItem.type, activeItem.knowledgeLevel, touchedFiles)
  printResult(result, activeItem.id || activeItem.title)
}
