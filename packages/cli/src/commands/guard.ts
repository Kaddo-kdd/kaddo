import { getModifiedFiles, isGitRepo } from '../services/git.js'
import { readArtifacts } from '../services/artifact-reader.js'
import { analyzeGuard, type ArtifactMatch } from '../core/diff-analysis.js'
import { loadIgnores, saveIgnore, isIgnored } from '../services/ignore-store.js'
import { exists, join, cwd, readFile } from '../utils/fs.js'
import { parse as parseYaml } from 'yaml'
import { confirm, text, log } from '../utils/ui.js'
import { resolvePlugins, runPlugins, type PluginSignal } from '../plugins/registry.js'

const ARCH_DIR = 'architecture'
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

function printFYI(match: ArtifactMatch) {
  const { artifact, matchedFiles, evidence } = match
  const id = artifact.id || artifact.title
  const extra = matchedFiles.length > 1 ? ` (+${matchedFiles.length - 1} more)` : ''
  console.log(`  FYI: ${matchedFiles[0]}${extra} matches ${id}`)
  console.log(`  ${id} was not modified in this diff.`)
  console.log(`  Evidence: ${evidence.signals.join(' · ')}`)
  console.log(`  Consider reviewing whether ${id} still reflects the implementation.`)
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
  touchedFiles: string[],
  activeMatches: ArtifactMatch[],
  ignoredCount: number,
  pluginSignals: PluginSignal[]
): void {
  const output = {
    kaddo_guard: true,
    ci: true,
    touched_files: touchedFiles.length,
    fyi_count: activeMatches.length,
    ignored_count: ignoredCount,
    plugin_signals: pluginSignals,
    findings: activeMatches.map((m) => ({
      artifact_id: m.artifact.id || m.artifact.title,
      artifact_type: m.artifact.type,
      knowledge_level: m.artifact.knowledgeLevel,
      matched_files: m.matchedFiles,
      evidence: m.evidence.signals,
      message: `${m.artifact.id || m.artifact.title} was not modified in this diff`,
    })),
  }
  console.log(JSON.stringify(output, null, 2))
}

export async function runGuard(opts: { staged?: boolean; interactive?: boolean; ci?: boolean; json?: boolean } = {}): Promise<void> {
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
  const touchedFiles = await getModifiedFiles(mode)

  if (touchedFiles.length === 0) {
    console.log('kaddo guard: no modified files detected.')
    return
  }

  const archDir = join(dir, ARCH_DIR)
  if (!exists(archDir)) {
    console.log('kaddo guard: no architecture/ directory found. Run `kaddo init` first.')
    return
  }

  const artifacts = readArtifacts(archDir)
  const result = analyzeGuard(touchedFiles, artifacts, silentWithoutOwnership)

  // Run plugins — always, regardless of artifact matches
  const pluginSignals = runPlugins(plugins, touchedFiles, (filePath) => {
    const abs = join(dir, filePath)
    try { return exists(abs) ? readFile(abs) : null } catch { return null }
  })

  if (result.silenced && pluginSignals.length === 0) return

  if (result.matches.length === 0 && pluginSignals.length === 0) {
    printHeader(touchedFiles)
    console.log('  No artifact ownership matches found.')
    return
  }

  printHeader(touchedFiles)

  const fyiMatches = result.matches.filter((m) => !m.artifactWasModified)
  const alreadyIgnoredMatches = fyiMatches.filter((m) =>
    isIgnored(ignores, m.artifact.id || m.artifact.title)
  )
  const activeMatches = fyiMatches.filter(
    (m) => !isIgnored(ignores, m.artifact.id || m.artifact.title)
  )

  // JSON / CI mode
  if (jsonMode) {
    printCIJson(touchedFiles, activeMatches, alreadyIgnoredMatches.length, pluginSignals)
    return
  }

  // Show active FYIs
  for (const match of activeMatches) {
    printFYI(match)
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
