import { cwd, writeFile, join } from '../utils/fs.js'
import { intro, outro, log } from '../utils/ui.js'
import { requireConfig } from '../core/config.js'
import { printCommandFooter } from '../core/command-help.js'
import { assetStatus, canonicalAgents, canonicalSkills, type AssetKind } from '../core/assets.js'

type StatusOpts = { json?: boolean }
type UpdateOpts = { force?: boolean }

const LABEL: Record<AssetKind, string> = { agent: 'Agents', skill: 'Skills' }

/** `kaddo agents status` / `kaddo skills status` — list installed assets, version and state. */
export function runAssetsStatus(kind: AssetKind, opts: StatusOpts = {}): void {
  const dir = cwd()
  requireConfig(dir)
  const summary = assetStatus(dir, kind)

  if (opts.json) {
    console.log(JSON.stringify(summary, null, 2))
    return
  }

  console.log('')
  console.log(LABEL[kind])
  console.log('')
  // Show installed assets in detail; missing ones only as a trailing count to avoid noise.
  const installed = summary.items.filter((i) => i.state !== 'missing')
  for (const a of installed) {
    console.log(`${a.path}`)
    console.log(`  Name: ${a.name}`)
    console.log(`  Installed: ${a.installed ?? 'unknown'}`)
    console.log(`  Available: ${a.available}`)
    console.log(`  Status: ${a.state}`)
    console.log('')
  }
  if (installed.length === 0) console.log(`No ${kind}s installed. Run \`kaddo add ${kind}s\`.`)
  console.log(
    `Summary: ${summary.up_to_date} up-to-date, ${summary.outdated} outdated, ` +
      `${summary.unknown_version} unknown-version, ${summary.modified} modified, ${summary.missing} not installed.`,
  )
  if (summary.outdated > 0 || summary.unknown_version > 0) {
    console.log(`Run \`kaddo ${kind}s update\` to refresh outdated ${kind}s (\`--force\` for unknown/modified).`)
  }
  printCommandFooter(`${kind}s status`)
}

/** `kaddo agents update` / `kaddo skills update` — refresh outdated assets. Safe by default. */
export function runAssetsUpdate(kind: AssetKind, opts: UpdateOpts = {}): void {
  const dir = cwd()
  requireConfig(dir)
  intro(`kaddo ${kind}s update`)

  const summary = assetStatus(dir, kind)
  const catalog = kind === 'agent' ? canonicalAgents() : canonicalSkills()
  const byPath = new Map(catalog.map((a) => [a.path, a.content]))

  const updated: string[] = []
  const skipped: string[] = []

  for (const item of summary.items) {
    const canonical = byPath.get(item.path)
    if (!canonical) continue
    const safe = item.state === 'outdated'
    const needsForce = item.state === 'unknown-version' || item.state === 'modified'
    if (safe || (needsForce && opts.force)) {
      writeFile(join(dir, item.path), canonical)
      updated.push(`${item.path} (${item.installed ?? 'unknown'} → ${item.available})`)
    } else if (needsForce) {
      skipped.push(`${item.path} — ${item.state} (use --force to overwrite local changes)`)
    }
    // `missing` is left to `kaddo add`; `up-to-date` needs nothing.
  }

  if (updated.length > 0) {
    log.success('Updated:')
    for (const u of updated) console.log(`  - ${u}`)
  } else {
    log.info(`No ${kind}s to update.`)
  }
  for (const s of skipped) log.warn(`Skipped ${s}`)
  if (summary.missing > 0) log.info(`${summary.missing} ${kind}(s) not installed — run \`kaddo add ${kind}s\` to add them.`)

  printCommandFooter(`${kind}s status`)
  outro(`${LABEL[kind]} update complete.`)
}
