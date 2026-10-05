import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

// Deterministic sync of the npm-published README (packages/cli/README.md) from the canonical project
// README.md. No LLM. Mirrors scripts/sync-agent-plugin-skills.mjs: a generated, versioned artifact
// with a `--check` drift mode for CI/release (WI-026).
//
//   README.md  ──deterministic transform──▶  packages/cli/README.md  ──▶  npm
//
// The transform is minimal: it only rewrites relative asset/link references so the README renders
// correctly on npm (outside the repo root). It never maintains a second editorial version.

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourceRelative = 'README.md'
const outputRelative = 'packages/cli/README.md'
const sourcePath = path.join(repoRoot, sourceRelative)
const outputPath = path.join(repoRoot, outputRelative)
const checkOnly = process.argv.includes('--check')

const RAW_BASE = 'https://raw.githubusercontent.com/Kaddo-kdd/kaddo/main'
const REPO_BASE = 'https://github.com/Kaddo-kdd/kaddo'
const NOTICE =
  `<!-- Generated from /${sourceRelative} by scripts/sync-npm-readme.mjs. ` +
  'Run `pnpm npm-readme:sync`; do not edit directly. -->'

/** Map a relative repo path to a navigable GitHub URL (tree for directories, blob for files). */
function toGitHubUrl(link) {
  const clean = link.replace(/^\.\//, '')
  const isDir = clean.endsWith('/')
  const kind = isDir ? 'tree' : 'blob'
  const target = isDir ? clean.replace(/\/+$/, '') : clean
  return `${REPO_BASE}/${kind}/main/${target}`
}

/** Rewrite relative asset/link references to absolute URLs so the README renders on npm. */
export function transformReadme(readme) {
  let out = readme.replace(/\r\n/g, '\n')

  // 1. Assets referenced from HTML (<img src="assets/...">) → raw.githubusercontent.
  out = out.replace(/src="assets\/([^"]+)"/g, `src="${RAW_BASE}/assets/$1"`)
  // 2. Assets referenced from Markdown (](assets/...) covers links and ![images](...)).
  out = out.replace(/\]\(assets\/([^)]+)\)/g, `](${RAW_BASE}/assets/$1)`)
  // 3. Remaining relative Markdown links → navigable GitHub URLs. Absolute links, in-page anchors
  //    and mailto are left untouched (and assets were already made absolute above).
  out = out.replace(/\]\((?!https?:|#|mailto:)([^)]+)\)/g, (_m, link) => `](${toGitHubUrl(link)})`)

  return `${NOTICE}\n\n${out.trimEnd()}\n`
}

function main() {
  if (!fs.existsSync(sourcePath)) {
    process.stderr.write(`Canonical README not found: ${sourceRelative}\n`)
    process.exit(1)
  }

  const expected = transformReadme(fs.readFileSync(sourcePath, 'utf8'))
  const current = fs.existsSync(outputPath)
    ? fs.readFileSync(outputPath, 'utf8').replace(/\r\n/g, '\n')
    : null

  if (current === expected) {
    if (checkOnly) process.stdout.write(`${outputRelative} is in sync with ${sourceRelative}.\n`)
    return
  }

  if (checkOnly) {
    process.stderr.write(
      `${outputRelative} is out of sync with ${sourceRelative}.\n` +
      'Run `pnpm npm-readme:sync` and commit the regenerated README.\n'
    )
    process.exit(1)
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, expected, 'utf8')
  process.stdout.write(`synced ${outputRelative} from ${sourceRelative}\n`)
}

// Run only when invoked directly (not when imported by tests).
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main()
}
