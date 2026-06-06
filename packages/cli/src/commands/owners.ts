import { cwd, exists, join, readFile, writeFile } from '../utils/fs.js'
import { loadOwners } from '../services/owners.js'
import { intro, outro, log, text, select, multiselect, confirm } from '../utils/ui.js'
import {
  findWorkItemArtifacts,
  artifactsMissingOwnership,
  loadScanSignals,
  suggestGlobs,
  applyOwnership,
  type OwnershipArtifact,
  type MergeMode,
} from '../core/ownership-suggest.js'

const CONFIG_PATH = '.kaddo/config.yml'
const CUSTOM_GLOB = '__custom__'

export function runOwners(opts: { domain?: string }): void {
  const dir = cwd()

  if (!exists(join(dir, CONFIG_PATH))) {
    console.error('No .kaddo/config.yml found. Run `kaddo init` first.')
    process.exit(1)
  }

  const ownerMap = loadOwners(dir)
  const domains = Object.keys(ownerMap)

  if (domains.length === 0) {
    console.log('')
    console.log('No domain owners configured.')
    console.log('')
    console.log('Add owners to .kaddo/config.yml:')
    console.log('')
    console.log('  owners:')
    console.log('    payments: [alice, bob]')
    console.log('    orders: [carol]')
    console.log('')
    return
  }

  if (opts.domain) {
    const owners = ownerMap[opts.domain]
    if (!owners || owners.length === 0) {
      console.log(`No owners configured for domain "${opts.domain}".`)
      return
    }
    console.log('')
    console.log(`Domain: ${opts.domain}`)
    console.log(`Owners: ${owners.join(', ')}`)
    console.log('')
    return
  }

  console.log('')
  console.log('Domain owners:')
  console.log('')
  const maxLen = Math.max(...domains.map((d) => d.length))
  for (const domain of domains) {
    const owners = ownerMap[domain]
    console.log(`  ${domain.padEnd(maxLen)}  ${owners.join(', ')}`)
  }
  console.log('')
}

// ---------------------------------------------------------------------------
// Ownership Front Matter Assistant (VS-011): `kaddo owners suggest`
// ---------------------------------------------------------------------------

function artifactLabel(a: OwnershipArtifact): string {
  const name = a.id || a.title || a.relPath
  const title = a.title && a.title !== a.id ? ` — ${a.title}` : ''
  return `${name}${title}`
}

/** Collect glob choices interactively: suggestions + custom entries. */
async function chooseGlobs(suggested: string[]): Promise<string[]> {
  const chosen: string[] = []

  if (suggested.length > 0) {
    const picked = await multiselect<string>({
      message: 'Select ownership globs (space to toggle, enter to confirm):',
      options: [
        ...suggested.map((g) => ({ value: g, label: g })),
        { value: CUSTOM_GLOB, label: 'Add a custom glob…' },
      ],
      required: false,
    })
    for (const p of picked) {
      if (p !== CUSTOM_GLOB) chosen.push(p)
    }
    if (!picked.includes(CUSTOM_GLOB) && chosen.length > 0) return [...new Set(chosen)]
  }

  // Manual entry: no suggestions, or the user asked for a custom glob.
  let addMore = suggested.length === 0 || chosen.length === 0
  if (!addMore) {
    addMore = await confirm({ message: 'Add a custom glob?', initialValue: true })
  }
  while (addMore) {
    const glob = await text({
      message: 'Enter a code glob (e.g. src/payments/**)',
      placeholder: 'src/payments/**',
      validate: (v) => (v.trim().length === 0 ? 'A glob is required.' : undefined),
    })
    chosen.push(glob.trim())
    addMore = await confirm({ message: 'Add another glob?', initialValue: false })
  }

  return [...new Set(chosen)]
}

export async function runOwnersSuggest(): Promise<void> {
  const dir = cwd()

  if (!exists(join(dir, CONFIG_PATH))) {
    console.error('No .kaddo/config.yml found. Run `kaddo init` first.')
    process.exit(1)
  }

  intro('kaddo owners suggest')

  const artifacts = findWorkItemArtifacts(dir)
  if (artifacts.length === 0) {
    log.warn(
      'No Work Items found under knowledge/delivery/work-items/ (searched recursively, including ' +
        'draft/ ready/ in-progress/ …).'
    )
    log.info('Create one with `kaddo create` or `kaddo create --from roadmap`.')
    outro('Nothing to do.')
    return
  }

  const missing = artifactsMissingOwnership(artifacts)
  if (missing.length === 0) {
    // Be precise about WHY there is nothing to do (VS-046): the items exist, they are just
    // already owned.
    log.success(
      `Found ${artifacts.length} Work Item${artifacts.length === 1 ? '' : 's'}; ` +
        'all already declare code ownership.'
    )
    outro('Nothing to do.')
    return
  }
  log.info(
    `Found ${artifacts.length} Work Item${artifacts.length === 1 ? '' : 's'}; ` +
      `${missing.length} missing code ownership.`
  )

  // 1. Select an artifact.
  const relPath =
    missing.length === 1
      ? missing[0].relPath
      : await select<string>({
          message: 'Which artifact needs ownership?',
          options: missing.map((a) => ({
            value: a.relPath,
            label: artifactLabel(a),
            hint: a.source === 'roadmap' ? 'from roadmap' : undefined,
          })),
        })
  const artifact = missing.find((a) => a.relPath === relPath)!

  // 2. Suggest globs from scan signals + artifact metadata.
  const signals = loadScanSignals(dir)
  if (!signals) {
    log.warn('No .kaddo/scan.json found — run `kaddo scan` for suggestions. You can enter globs manually.')
  }
  const suggested = suggestGlobs(artifact, signals)

  const globs = await chooseGlobs(suggested)
  if (globs.length === 0) {
    log.warn('No globs selected. Nothing was changed.')
    outro('Cancelled.')
    return
  }

  // 3. Decide append vs replace if the artifact already had globs (defensive — missing set
  //    excludes these, but keep the contract honest).
  let mode: MergeMode = 'replace'
  if (artifact.codeGlobs.length > 0) {
    mode = (await select<MergeMode>({
      message: `${artifact.id || artifact.relPath} already declares code globs. Append or replace?`,
      options: [
        { value: 'append', label: 'Append to existing globs' },
        { value: 'replace', label: 'Replace existing globs' },
      ],
    })) as MergeMode
  }

  // 4. Preview.
  log.info(`Preview:\n\ncode:\n${globs.map((g) => `  - ${g}`).join('\n')}`)
  const ok = await confirm({
    message: `Update ${artifact.relPath}?`,
    initialValue: true,
  })
  if (!ok) {
    log.warn('No changes written.')
    outro('Cancelled.')
    return
  }

  // 5. Write, preserving keys and body.
  const updated = applyOwnership(readFile(artifact.filePath), globs, mode)
  writeFile(artifact.filePath, updated)
  log.success(`Updated ${artifact.relPath}`)
  log.info('Run `kaddo guard` after changing related code to detect possible knowledge drift.')
  outro('Ownership declared.')
}
