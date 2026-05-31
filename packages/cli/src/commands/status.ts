import { readArtifacts } from '../services/artifact-reader.js'
import { loadIgnores } from '../services/ignore-store.js'
import { exists, join, cwd, readFile } from '../utils/fs.js'
import { parse as parseYaml } from 'yaml'

const ARCH_DIR = 'architecture'
const CONFIG_PATH = '.kaddo/config.yml'

type KaddoConfig = {
  project?: { name?: string; domains?: string[] }
  scan?: { language?: string; framework?: string; packageManager?: string }
}

function loadConfig(dir: string): KaddoConfig {
  const p = join(dir, CONFIG_PATH)
  if (!exists(p)) return {}
  try { return parseYaml(readFile(p)) as KaddoConfig } catch { return {} }
}

export function runStatus(): void {
  const dir = cwd()

  if (!exists(join(dir, ARCH_DIR))) {
    console.error('No architecture/ directory found. Run `kaddo init` first.')
    process.exit(1)
  }

  const config = loadConfig(dir)
  const artifacts = readArtifacts(join(dir, ARCH_DIR))
  const ignores = loadIgnores(dir)

  const workItems = artifacts.filter(
    (a) => a.type !== 'current-state' && a.type !== 'roadmap'
  )

  const byStatus = {
    'in-progress': workItems.filter((a) => a.status === 'in-progress'),
    done: workItems.filter((a) => a.status === 'done'),
    cancelled: workItems.filter((a) => a.status === 'cancelled'),
  }

  const withOwnership = workItems.filter((a) => a.codeGlobs.length > 0)
  const domains = [...new Set(workItems.flatMap((a) => a.domains))].filter(Boolean)

  const projectName = config.project?.name ?? 'unknown'
  const scan = config.scan

  console.log('')
  console.log(`Project: ${projectName}`)

  if (scan?.language) {
    const parts = [scan.language, scan.framework !== 'unknown' && scan.framework !== 'none' ? scan.framework : null, scan.packageManager !== 'unknown' ? scan.packageManager : null]
      .filter(Boolean).join(' · ')
    console.log(`Stack:   ${parts}`)
  }

  console.log('')
  console.log('Knowledge Repository:')
  console.log(`  Work items:   ${workItems.length} total`)
  console.log(`    In progress: ${byStatus['in-progress'].length}`)
  console.log(`    Done:        ${byStatus['done'].length}`)
  console.log(`    Cancelled:   ${byStatus['cancelled'].length}`)
  console.log(`  With ownership (code: globs): ${withOwnership.length}/${workItems.length}`)
  console.log(`  Ignores active: ${ignores.length}`)

  if (domains.length > 0) {
    console.log(`  Domains: ${domains.join(', ')}`)
  }

  if (byStatus['in-progress'].length > 0) {
    console.log('')
    console.log('Active work items:')
    for (const wi of byStatus['in-progress']) {
      const level = wi.knowledgeLevel ? ` [${wi.knowledgeLevel}]` : ''
      const owned = wi.codeGlobs.length > 0 ? ' ●' : ' ○'
      console.log(`  ${owned} ${wi.id || wi.title}${level} — ${wi.summary || wi.title}`)
    }
    console.log('  ● = has ownership declared  ○ = no code globs')
  }

  console.log('')
}
