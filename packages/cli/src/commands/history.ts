import { readArtifacts, type Artifact } from '../services/artifact-reader.js'
import { exists, join, cwd } from '../utils/fs.js'

const ARCH_DIR = 'knowledge'

type HistoryOpts = {
  domain?: string
  type?: string
  status?: string
  limit?: number
}

function formatRow(a: Artifact): string {
  const id = (a.id || '').padEnd(8)
  const type = a.type.padEnd(18)
  const level = (a.knowledgeLevel || '').padEnd(4)
  const status = a.status.padEnd(12)
  const title = (a.summary || a.title).slice(0, 48)
  return `  ${id} ${type} ${level} ${status} ${title}`
}

export function runHistory(opts: HistoryOpts = {}): void {
  const dir = cwd()

  if (!exists(join(dir, ARCH_DIR))) {
    console.error('No knowledge/ directory found. Run `kaddo init` first.')
    process.exit(1)
  }

  let artifacts = readArtifacts(join(dir, ARCH_DIR)).filter(
    (a) => a.type !== 'current-state' && a.type !== 'roadmap'
  )

  if (opts.domain) {
    const d = opts.domain.toLowerCase()
    artifacts = artifacts.filter(
      (a) =>
        a.domains.some((x) => x.toLowerCase().includes(d)) ||
        a.codeGlobs.some((g) => g.toLowerCase().includes(d))
    )
  }

  if (opts.type) {
    artifacts = artifacts.filter((a) => a.type === opts.type)
  }

  if (opts.status) {
    artifacts = artifacts.filter((a) => a.status === opts.status)
  }

  // Sort by created_at desc (front matter field read as string)
  artifacts.sort((a, b) => {
    const dateA = (a as unknown as Record<string, string>).created_at ?? ''
    const dateB = (b as unknown as Record<string, string>).created_at ?? ''
    return dateB.localeCompare(dateA)
  })

  if (opts.limit) {
    artifacts = artifacts.slice(0, opts.limit)
  }

  console.log('')

  if (artifacts.length === 0) {
    console.log('No work items found matching the given filters.')
    return
  }

  // Header
  const h = (s: string, w: number) => s.padEnd(w)
  console.log(`  ${h('ID', 8)} ${h('Type', 18)} ${h('Lvl', 4)} ${h('Status', 12)} Summary`)
  console.log(`  ${'-'.repeat(8)} ${'-'.repeat(18)} ${'-'.repeat(4)} ${'-'.repeat(12)} ${'-'.repeat(48)}`)

  for (const a of artifacts) {
    console.log(formatRow(a))
  }

  console.log('')
  console.log(`  ${artifacts.length} work item(s)`)
  console.log('')
}
