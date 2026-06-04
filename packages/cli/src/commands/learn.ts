import matter from 'gray-matter'
import { readArtifacts } from '../services/artifact-reader.js'
import { exists, join, cwd, readFile, writeFile, readDir } from '../utils/fs.js'
import { intro, outro, log, text, select } from '../utils/ui.js'

const ARCH_DIR = 'knowledge'
const WORK_ITEMS_DIR = 'knowledge/delivery/work-items'

function findWorkItemFile(dir: string, id: string): string | null {
  const wiDir = join(dir, WORK_ITEMS_DIR)
  if (!exists(wiDir)) return null
  const files = readDir(wiDir).filter((f) => f.endsWith('.md'))
  const match = files.find((f) => f.includes(id.toUpperCase()) || f.includes(id.toLowerCase()))
  return match ? join(wiDir, match) : null
}

function updateWorkItemFile(filePath: string, learning: string): void {
  const raw = readFile(filePath)
  const { data, content } = matter(raw)

  // Update status to done
  data.status = 'done'
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
  writeFile(filePath, newRaw)
}

export async function runLearn(artifactId?: string): Promise<void> {
  const dir = cwd()

  if (!exists(join(dir, ARCH_DIR))) {
    console.error('No knowledge/ directory found. Run `kaddo init` first.')
    process.exit(1)
  }

  intro('kaddo learn')

  const artifacts = readArtifacts(join(dir, ARCH_DIR))
  const inProgress = artifacts.filter(
    (a) => a.status === 'in-progress' && a.type !== 'current-state' && a.type !== 'roadmap'
  )

  if (inProgress.length === 0) {
    log.warn('No in-progress work items found.')
    outro('Nothing to close.')
    return
  }

  // Determine which work item to close
  let targetId: string

  if (artifactId) {
    targetId = artifactId
  } else if (inProgress.length === 1) {
    targetId = inProgress[0].id || inProgress[0].title
    log.info(`Closing: ${targetId} — ${inProgress[0].summary || inProgress[0].title}`)
  } else {
    const chosen = await select<string>({
      message: 'Which work item are you closing?',
      options: inProgress.map((a) => ({
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

  const learning = await text({
    message: 'What did you learn from this change?',
    placeholder: 'e.g. The retry logic needed a separate queue to avoid blocking the main flow',
    validate: (v) => (v.trim().length === 0 ? 'Learning is required.' : undefined),
  })

  updateWorkItemFile(filePath, learning.trim())

  log.success(`${targetId} marked as done`)
  log.success(`Learning recorded in ${filePath.replace(dir + '/', '')}`)
  log.info('Consider updating knowledge/knowledge.md if this changes the current state.')

  outro('Work item closed.')
}
