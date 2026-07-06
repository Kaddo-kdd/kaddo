import { scan, type ScanResult } from '../services/scanner.js'
import { exists, readFile, writeFile, join, cwd } from '../utils/fs.js'
import { intro, outro, log, confirm } from '../utils/ui.js'
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'
import { buildBaseline, serializeBaseline, readProjectContext } from '../core/scan-baseline.js'
import { renderInventory } from '../templates/inventory-template.js'
import { loadConfig, describeProject, nextStepsForState, ConfigError } from '../core/config.js'
import { printCommandFooter } from '../core/command-help.js'
import { signalCount, renderSignalsConsole } from '../core/scan-signals.js'

function formatList(items: string[]): string {
  return items.length > 0 ? items.map((i) => `  - ${i}`).join('\n') : '  (none detected)'
}

function printResult(result: ScanResult): void {
  console.log('')
  console.log('Detected:')
  console.log(`  Language:        ${result.language}`)
  console.log(`  Framework:       ${result.framework}`)
  console.log(`  Package manager: ${result.packageManager}`)

  if (result.codeDirs.length > 0) {
    console.log(`  Code dirs:`)
    result.codeDirs.forEach((d) => console.log(`    ${d}/`))
  }

  if (result.migrationDirs.length > 0) {
    console.log(`  Migration dirs:`)
    result.migrationDirs.forEach((d) => console.log(`    ${d}/`))
  }

  if (result.contractFiles.length > 0) {
    console.log(`  Contracts/API:`)
    result.contractFiles.forEach((f) => console.log(`    ${f}`))
  }

  if (result.infraFiles.length > 0) {
    console.log(`  Infrastructure:`)
    result.infraFiles.forEach((f) => console.log(`    ${f}`))
  }

  if (result.testDirs.length > 0) {
    console.log(`  Test dirs:`)
    result.testDirs.forEach((d) => console.log(`    ${d}/`))
  }

  console.log('')

  if (result.suggestedDomains.length > 0) {
    console.log('Suggested domains (confirm or edit in .kaddo/config.yml):')
    result.suggestedDomains.forEach((d) => console.log(`  [ ] ${d}`))
  } else {
    console.log('No domains detected automatically.')
    console.log('You can add them manually in .kaddo/config.yml under project.domains.')
  }

  // Signals (VS-081)
  const signalLines = renderSignalsConsole(result.signals)
  if (signalLines.length > 0) {
    console.log('Signals:')
    for (const line of signalLines) console.log(line)
    console.log('')
  } else {
    console.log('Signals: none detected')
    console.log('')
  }
}

function updateConfig(dir: string, result: ScanResult): void {
  const configPath = join(dir, '.kaddo', 'config.yml')
  if (!exists(configPath)) return

  try {
    const raw = readFile(configPath)
    const config = parseYaml(raw) as Record<string, unknown>

    // Add scan results under a 'scan' key without overwriting user-edited domains
    const scanData = {
      language: result.language,
      framework: result.framework,
      packageManager: result.packageManager,
      codeDirs: result.codeDirs,
      migrationDirs: result.migrationDirs.length > 0 ? result.migrationDirs : undefined,
      contractFiles: result.contractFiles.length > 0 ? result.contractFiles : undefined,
      infraFiles: result.infraFiles.length > 0 ? result.infraFiles : undefined,
    }

    // Only write scan section — never overwrite domains (user owns those)
    config.scan = scanData

    // If domains list is empty, populate with suggestions for user to edit
    const project = config.project as Record<string, unknown> | undefined
    if (project && Array.isArray(project.domains) && project.domains.length === 0 && result.suggestedDomains.length > 0) {
      project.domains = result.suggestedDomains.map((d) => `# ${d}`)
    }

    writeFile(configPath, stringifyYaml(config))
  } catch {
    // Non-fatal: config update is best-effort
  }
}

async function writeBaselineArtifacts(dir: string, result: ScanResult): Promise<void> {
  const context = readProjectContext(dir)
  const baseline = buildBaseline(result, context)

  // .kaddo/scan.json — machine-generated, always regenerated.
  const scanJsonPath = join(dir, '.kaddo', 'scan.json')
  writeFile(scanJsonPath, serializeBaseline(baseline))
  log.success('Wrote .kaddo/scan.json')

  // knowledge/inventory.md — human-readable; guard overwrite of user-authored content.
  const inventoryPath = join(dir, 'knowledge', 'inventory.md')
  const inventoryExists = exists(inventoryPath)
  let writeInventory = true

  if (inventoryExists) {
    writeInventory = await confirm({
      message: 'knowledge/inventory.md already exists. Overwrite it?',
      initialValue: true,
    })
  }

  if (writeInventory) {
    writeFile(inventoryPath, renderInventory(baseline))
    log.success(`${inventoryExists ? 'Updated' : 'Wrote'} knowledge/inventory.md`)
  } else {
    log.info('Kept existing knowledge/inventory.md.')
  }
}

function printStateAwareNextStep(dir: string): void {
  let config
  try {
    config = loadConfig(dir)
  } catch (err) {
    if (err instanceof ConfigError) {
      log.warn(err.message)
      return
    }
    throw err
  }

  if (!config) return

  log.info(`This is a ${describeProject(config)}.`)
  log.info(`Next: ${nextStepsForState(config.project.state)}`)
}

export async function runScan(): Promise<void> {
  const dir = cwd()

  intro('kaddo scan')

  const result = scan(dir)
  printResult(result)

  // Generate the reusable baseline artifacts (scan.json + inventory.md).
  await writeBaselineArtifacts(dir, result)

  const kaddoExists = exists(join(dir, '.kaddo', 'config.yml'))

  if (kaddoExists) {
    const save = await confirm({
      message: 'Save scan results to .kaddo/config.yml?',
      initialValue: true,
    })
    if (save) {
      updateConfig(dir, result)
      log.success('Scan results saved to .kaddo/config.yml')
    }
  } else {
    log.warn('No .kaddo/config.yml found. Run `kaddo init` first to record project context.')
  }

  printStateAwareNextStep(dir)
  printCommandFooter('scan')

  outro('Scan complete.')
}
