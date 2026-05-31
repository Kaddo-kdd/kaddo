import { scan, type ScanResult } from '../services/scanner.js'
import { exists, readFile, writeFile, join, cwd } from '../utils/fs.js'
import { intro, outro, log, confirm } from '../utils/ui.js'
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'

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

  console.log('')

  if (result.suggestedDomains.length > 0) {
    console.log('Suggested domains (confirm or edit in .kaddo/config.yml):')
    result.suggestedDomains.forEach((d) => console.log(`  [ ] ${d}`))
  } else {
    console.log('No domains detected automatically.')
    console.log('You can add them manually in .kaddo/config.yml under project.domains.')
  }

  console.log('')
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

export async function runScan(): Promise<void> {
  const dir = cwd()

  intro('kaddo scan')

  const result = scan(dir)
  printResult(result)

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
    log.warn('No .kaddo/config.yml found. Run `kaddo init` first to save results.')
  }

  outro('Scan complete.')
}
