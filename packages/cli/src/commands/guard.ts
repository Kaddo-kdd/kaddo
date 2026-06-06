import { getModifiedFiles, isGitRepo } from '../services/git.js'
import { discoverKnowledge } from '../services/knowledge-artifacts.js'
import { analyzeGuard, type ArtifactMatch } from '../core/diff-analysis.js'
import { loadIgnores, saveIgnore, isIgnored } from '../services/ignore-store.js'
import { collectWorkspaceChanges, type WorkspaceScan } from '../services/workspace-guard.js'
import { exists, join, cwd, readFile } from '../utils/fs.js'
import path from 'path'
import { parse as parseYaml } from 'yaml'
import { confirm, text, log } from '../utils/ui.js'
import { resolvePlugins, runPlugins, type PluginSignal } from '../plugins/registry.js'
import { loadOwners, resolveAffectedOwners, collectMatchedDomains } from '../services/owners.js'

const ARCH_DIR = 'knowledge'
const CONFIG_PATH = '.kaddo/config.yml'

type KaddoConfig = {
  guard?: { silent_without_ownership?: boolean }
  plugins?: string[]
}

function loadConfig(dir: string): KaddoConfig {
  const configPath = join(dir, CONFIG_PATH)
  if (!exists(configPath)) return {}
  try {
    return parseYaml(readFile(configPath)) as KaddoConfig
  } catch {
    return {}
  }
}

function printHeader(touchedFiles: string[]) {
  console.log('')
  console.log('Touched files:')
  touchedFiles.forEach((f) => console.log(`  - ${f}`))
  console.log('')
}

/** Stable identifier for an artifact: id, then title, then its workspace-relative path. */
function artifactLabel(artifact: ArtifactMatch['artifact'], dir: string): string {
  if (artifact.id) return artifact.id
  if (artifact.title) return artifact.title
  const rel = path.relative(dir, artifact.filePath).split(path.sep).join('/')
  return rel || artifact.filePath
}

function printWorkspaceHeader(scan: WorkspaceScan) {
  console.log('Workspace mode enabled.')
  console.log('Checking mapped modules from .kaddo/modules.yml.')
  console.log(
    `  Modules checked: ${scan.modulesChecked} · skipped: ${scan.modulesSkipped}`
  )
  for (const s of scan.skippedModules) {
    console.log(`  ↷ skipped ${s.id} (${s.repoPath || '—'}) — ${s.reason}`)
  }
  console.log('')
}

function printFYI(match: ArtifactMatch, dir: string) {
  const { artifact, matchedFiles, evidence } = match
  const id = artifactLabel(artifact, dir)
  const descriptor = [artifact.type, artifact.knowledgeLevel].filter(Boolean).join(', ')
  const heading = descriptor ? `${id} (${descriptor})` : id

  console.log(`  ⚠ Possible knowledge drift: ${heading}`)
  console.log(`    Changed code matching this artifact:`)
  matchedFiles.forEach((f) => console.log(`      - ${f}`))
  if (artifact.codeGlobs.length > 0) {
    console.log(`    Declared ownership:`)
    artifact.codeGlobs.forEach((g) => console.log(`      - ${g}`))
  }
  console.log(`    ${id} was not updated in this diff.`)
  console.log(`    Evidence: ${evidence.signals.join(' · ')}`)
  console.log(`    Suggested action: review ${id} and update it if the behavior changed,`)
  console.log(`    or ignore this artifact below if the change does not affect the knowledge.`)
  console.log('')
}

function printIgnored(artifactId: string, reason: string) {
  console.log(`  ↷ ${artifactId} ignored — ${reason}`)
}

function printPluginSignals(signals: PluginSignal[]) {
  if (signals.length === 0) return
  console.log('Plugin signals:')
  for (const s of signals) {
    const icon = s.severity === 'critical' ? '⚠' : s.severity === 'warn' ? '!' : 'i'
    console.log(`  [${s.plugin}] ${icon} ${s.file}`)
    console.log(`    ${s.message}`)
  }
  console.log('')
}

async function offerIgnore(dir: string, match: ArtifactMatch): Promise<boolean> {
  const id = match.artifact.id || match.artifact.title
  const shouldIgnore = await confirm({
    message: `Ignore ${id} in future guard runs?`,
    initialValue: false,
  })
  if (!shouldIgnore) return false

  const reason = await text({
    message: 'Reason for ignoring',
    placeholder: 'e.g. This file was moved, not functionally changed',
    validate: (v) => (v.trim().length === 0 ? 'Reason is required.' : undefined),
  })

  saveIgnore(dir, {
    artifact_id: id,
    reason: reason.trim(),
    created_at: new Date().toISOString().split('T')[0],
    files: match.matchedFiles,
  })

  log.success(`${id} added to .kaddo/ignores.yml`)
  return true
}

function printCIJson(
  dir: string,
  touchedFiles: string[],
  activeMatches: ArtifactMatch[],
  ignoredCount: number,
  pluginSignals: PluginSignal[],
  affectedOwners: Array<{ domain: string; owners: string[] }>,
  workspace: WorkspaceScan | null
): void {
  const output: Record<string, unknown> = {
    kaddo_guard: true,
    ci: true,
    touched_files: touchedFiles.length,
    fyi_count: activeMatches.length,
    ignored_count: ignoredCount,
    plugin_signals: pluginSignals,
    domain_owners: affectedOwners,
    findings: activeMatches.map((m) => {
      const label = artifactLabel(m.artifact, dir)
      return {
        artifact_id: label,
        artifact_type: m.artifact.type,
        knowledge_level: m.artifact.knowledgeLevel,
        matched_files: m.matchedFiles,
        ownership: m.artifact.codeGlobs,
        evidence: m.evidence.signals,
        message: `${label} was not modified in this diff`,
      }
    }),
  }
  if (workspace) {
    output.workspace = {
      enabled: true,
      modulesChecked: workspace.modulesChecked,
      modulesSkipped: workspace.modulesSkipped,
      skippedModules: workspace.skippedModules,
    }
  }
  console.log(JSON.stringify(output, null, 2))
}

export async function runGuard(opts: { staged?: boolean; interactive?: boolean; ci?: boolean; json?: boolean; workspace?: boolean } = {}): Promise<void> {
  const dir = cwd()
  const interactive = opts.interactive !== false && !opts.ci && !opts.json
  const jsonMode = opts.json || opts.ci

  const isRepo = await isGitRepo(dir)
  if (!isRepo) {
    console.error('Not a Git repository. kaddo guard requires Git.')
    process.exit(1)
  }

  const config = loadConfig(dir)
  const silentWithoutOwnership = config.guard?.silent_without_ownership ?? true
  const ignores = loadIgnores(dir)
  const plugins = resolvePlugins(config.plugins ?? [])

  const mode = opts.staged ? 'staged' : 'head'
  const currentFiles = await getModifiedFiles(mode)

  // Workspace mode (opt-in): also collect diffs from local mapped module repos.
  let workspaceScan: WorkspaceScan | null = null
  if (opts.workspace) {
    workspaceScan = await collectWorkspaceChanges(dir, mode)
  }
  const workspaceFiles = workspaceScan
    ? workspaceScan.changedFiles.map((c) => c.normalizedPath)
    : []

  // Merged set drives artifact matching; plugins still run on current-repo files only
  // (workspace mode never reads sibling repo source contents).
  const touchedFiles = [...new Set([...currentFiles, ...workspaceFiles])]

  if (touchedFiles.length === 0) {
    if (workspaceScan) printWorkspaceHeader(workspaceScan)
    console.log('kaddo guard: no modified files detected.')
    return
  }

  const archDir = join(dir, ARCH_DIR)
  if (!exists(archDir)) {
    console.log('kaddo guard: no knowledge/ directory found. Run `kaddo init` first.')
    return
  }

  // Unified discovery (VS-046): guard analyzes exactly the artifacts explain/owners/context see.
  const artifacts = discoverKnowledge(dir)
  const result = analyzeGuard(touchedFiles, artifacts, silentWithoutOwnership)

  // Run plugins on current-repo files only — workspace mode never reads sibling source.
  const pluginSignals = runPlugins(plugins, currentFiles, (filePath) => {
    const abs = join(dir, filePath)
    try { return exists(abs) ? readFile(abs) : null } catch { return null }
  })

  const fyiMatches = result.matches.filter((m) => !m.artifactWasModified)
  const alreadyIgnoredMatches = fyiMatches.filter((m) =>
    isIgnored(ignores, m.artifact.id || m.artifact.title)
  )
  const activeMatches = fyiMatches.filter(
    (m) => !isIgnored(ignores, m.artifact.id || m.artifact.title)
  )

  // JSON / CI mode — emit clean JSON early (no human headers), always when requested.
  if (jsonMode) {
    const ownerMapCI = loadOwners(dir)
    const matchedDomainsCI = collectMatchedDomains(activeMatches.map((m) => m.artifact.domains))
    const affectedOwnersCI = resolveAffectedOwners(matchedDomainsCI, ownerMapCI)
    printCIJson(dir, touchedFiles, activeMatches, alreadyIgnoredMatches.length, pluginSignals, affectedOwnersCI, workspaceScan)
    return
  }

  if (result.silenced && pluginSignals.length === 0) {
    if (workspaceScan) printWorkspaceHeader(workspaceScan)
    return
  }

  if (result.matches.length === 0 && pluginSignals.length === 0) {
    if (workspaceScan) printWorkspaceHeader(workspaceScan)
    printHeader(touchedFiles)
    console.log('  No artifact ownership matches found.')
    return
  }

  if (workspaceScan) printWorkspaceHeader(workspaceScan)
  printHeader(touchedFiles)

  // Show active FYIs
  for (const match of activeMatches) {
    printFYI(match, dir)
  }

  // Show already-ignored artifacts (compact)
  if (alreadyIgnoredMatches.length > 0) {
    for (const match of alreadyIgnoredMatches) {
      const id = match.artifact.id || match.artifact.title
      const entry = isIgnored(ignores, id)!
      printIgnored(id, entry.reason)
    }
    console.log('')
  }

  // Show plugin signals
  printPluginSignals(pluginSignals)

  // Show domain owners for matched domains
  const ownerMap = loadOwners(dir)
  const matchedDomains = collectMatchedDomains(activeMatches.map((m) => m.artifact.domains))
  const affectedOwners = resolveAffectedOwners(matchedDomains, ownerMap)
  if (affectedOwners.length > 0) {
    console.log('Domain owners to notify:')
    for (const { domain, owners } of affectedOwners) {
      console.log(`  ${owners.join(', ')}  (${domain})`)
    }
    console.log('')
  }

  if (fyiMatches.length === 0) {
    if (pluginSignals.length === 0) {
      console.log('  All matched artifacts were updated in this diff.')
    }
    return
  }

  // Offer to ignore active FYIs interactively
  if (interactive && activeMatches.length > 0) {
    for (const match of activeMatches) {
      await offerIgnore(dir, match)
    }
  }
}
