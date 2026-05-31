import path from 'path'
import { exists, writeFile, ensureDir, readFile, cwd, join } from '../utils/fs.js'
import { intro, outro, log, text, confirm } from '../utils/ui.js'

const KADDO_DIR = '.kaddo'
const ARCH_DIR = 'architecture'

function inferProjectName(dir: string): string {
  const pkgPath = join(dir, 'package.json')
  if (exists(pkgPath)) {
    try {
      const pkg = JSON.parse(readFile(pkgPath))
      if (pkg.name) return pkg.name
    } catch {
      // ignore
    }
  }
  return path.basename(dir)
}

function hasGit(dir: string): boolean {
  return exists(join(dir, '.git'))
}

function buildConfig(projectName: string): string {
  return `version: 1
project:
  name: "${projectName}"
  domains: []
knowledge:
  default_level: K2
guard:
  silent_without_ownership: true
`
}

function buildKnowledge(projectName: string): string {
  return `---
type: current-state
updated_at: ${new Date().toISOString().split('T')[0]}
---

# ${projectName} — Knowledge

> What is true about this product right now.

## Purpose

_Describe what this product does and who it serves._

## Architecture overview

_High-level description of the main components._

## Key domains

_List the main domains or bounded contexts._

## Active constraints

_Technical, regulatory, or operational constraints that shape decisions._
`
}

function buildRoadmap(projectName: string): string {
  return `---
type: roadmap
updated_at: ${new Date().toISOString().split('T')[0]}
---

# ${projectName} — Roadmap

> What we intend to build and why.

## Now

_What is in progress or planned for the immediate cycle._

## Next

_What comes after the current cycle._

## Later

_Ideas and intentions not yet committed._
`
}

export async function runInit(): Promise<void> {
  const dir = cwd()

  intro('kaddo init')

  if (!hasGit(dir)) {
    log.warn('No Git repository detected. Kaddo works best inside a Git repo.')
  }

  const kaddoExists = exists(join(dir, KADDO_DIR, 'config.yml'))

  if (kaddoExists) {
    const overwrite = await confirm({
      message: 'Kaddo is already initialized. Overwrite configuration?',
      initialValue: false,
    })
    if (!overwrite) {
      outro('Nothing changed.')
      return
    }
  }

  const inferredName = inferProjectName(dir)
  const projectName = await text({
    message: 'Project name',
    initialValue: inferredName,
    validate: (v) => (v.trim().length === 0 ? 'Project name is required.' : undefined),
  })

  // Create .kaddo/
  const kaddoConfigPath = join(dir, KADDO_DIR, 'config.yml')
  writeFile(kaddoConfigPath, buildConfig(projectName.trim()))

  // Create architecture/
  ensureDir(join(dir, ARCH_DIR, 'work-items'))
  writeFile(join(dir, ARCH_DIR, 'knowledge.md'), buildKnowledge(projectName.trim()))
  writeFile(join(dir, ARCH_DIR, 'roadmap.md'), buildRoadmap(projectName.trim()))

  log.success('Created .kaddo/config.yml')
  log.success('Created architecture/knowledge.md')
  log.success('Created architecture/roadmap.md')
  log.success('Created architecture/work-items/')
  log.info('Next: run `kaddo scan` to detect your stack.')

  outro('Kaddo initialized.')
}
