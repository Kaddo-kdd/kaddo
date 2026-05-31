import { getModifiedFiles, isGitRepo } from '../services/git.js'
import { readArtifacts } from '../services/artifact-reader.js'
import { analyzeGuard } from '../core/diff-analysis.js'
import { exists, join, cwd } from '../utils/fs.js'
import { parse as parseYaml } from 'yaml'
import { readFile } from '../utils/fs.js'

const ARCH_DIR = 'architecture'
const CONFIG_PATH = '.kaddo/config.yml'

type KaddoConfig = {
  guard?: {
    silent_without_ownership?: boolean
  }
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

function printFYI(artifactPath: string, artifactId: string, matchedFiles: string[]) {
  const fallback = artifactPath.split('/').pop()?.replace('.md', '') ?? artifactPath
  const id = artifactId || fallback
  console.log(`  FYI: ${matchedFiles[0]}${matchedFiles.length > 1 ? ` (+${matchedFiles.length - 1} more)` : ''} matches ${id}`)
  console.log(`  ${id} was not modified in this diff.`)
  console.log(`  Consider reviewing whether ${id} still reflects the implementation.`)
  console.log('')
}

export async function runGuard(opts: { staged?: boolean } = {}): Promise<void> {
  const dir = cwd()

  const isRepo = await isGitRepo(dir)
  if (!isRepo) {
    console.error('Not a Git repository. kaddo guard requires Git.')
    process.exit(1)
  }

  const config = loadConfig(dir)
  const silentWithoutOwnership = config.guard?.silent_without_ownership ?? true

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

  if (result.silenced) {
    // No artifacts with ownership — stay silent per config
    return
  }

  if (result.matches.length === 0) {
    printHeader(touchedFiles)
    console.log('  No artifact ownership matches found.')
    return
  }

  printHeader(touchedFiles)

  let fyiCount = 0

  for (const match of result.matches) {
    if (!match.artifactWasModified) {
      printFYI(match.artifact.filePath, match.artifact.id || match.artifact.title, match.matchedFiles)
      fyiCount++
    }
  }

  if (fyiCount === 0) {
    console.log('  All matched artifacts were updated in this diff.')
  }
}
