import path from 'path'
import { exists, writeFile, ensureDir, readFile, cwd, join } from '../utils/fs.js'
import { intro, outro, log, text, confirm, select } from '../utils/ui.js'

const KADDO_DIR = '.kaddo'
const ARCH_DIR = 'knowledge'

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

interface ProjectMeta {
  name: string
  state: string
  teamSize: string
  structure: string
}

function buildConfig(meta: ProjectMeta): string {
  return `version: 1
project:
  name: "${meta.name}"
  state: ${meta.state}
  structure: ${meta.structure}
  domains: []
team:
  size: ${meta.teamSize}
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

  const state = await select<string>({
    message: 'What kind of project is this?',
    options: [
      { value: 'new', label: 'New', hint: 'Starting from scratch' },
      { value: 'pre-ai', label: 'Pre-AI', hint: 'Existing code, not prepared for agents' },
      { value: 'legacy', label: 'Legacy', hint: 'Knowledge lives in people\'s heads' },
    ],
    initialValue: 'pre-ai',
  })

  const teamSize = await select<string>({
    message: 'Team size',
    options: [
      { value: 'indie', label: 'Indie', hint: '1 person' },
      { value: 'small', label: 'Small', hint: '2-5 people' },
      { value: 'medium', label: 'Medium', hint: '6-20 people' },
      { value: 'enterprise', label: 'Enterprise', hint: '20+ people' },
    ],
    initialValue: 'small',
  })

  const structure = await select<string>({
    message: 'Repository structure',
    options: [
      { value: 'monorepo', label: 'Monorepo' },
      { value: 'multirepo', label: 'Multirepo' },
    ],
    initialValue: 'monorepo',
  })

  const meta: ProjectMeta = {
    name: projectName.trim(),
    state,
    teamSize,
    structure,
  }

  // Create .kaddo/
  const kaddoConfigPath = join(dir, KADDO_DIR, 'config.yml')
  writeFile(kaddoConfigPath, buildConfig(meta))

  // Create knowledge/
  ensureDir(join(dir, ARCH_DIR, 'delivery', 'work-items'))
  writeFile(join(dir, ARCH_DIR, 'knowledge.md'), buildKnowledge(projectName.trim()))
  writeFile(join(dir, ARCH_DIR, 'delivery', 'roadmap.md'), buildRoadmap(projectName.trim()))

  log.success('Created .kaddo/config.yml')
  log.success('Created knowledge/knowledge.md')
  log.success('Created knowledge/delivery/roadmap.md')
  log.success('Created knowledge/delivery/work-items/')
  log.info('Next: run `kaddo scan` to detect your stack.')

  outro('Kaddo initialized.')
}
