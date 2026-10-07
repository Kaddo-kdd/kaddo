import { cwd } from '../utils/fs.js'
import { getResources, getResource } from '../core/resources.js'
import {
  createResource,
  updateResource,
  deleteResource,
  ResourceWriteError,
  type ResourceInput,
  type ResourceFinding,
} from '../core/resource-write.js'
import { intro, outro, log, text, select, confirm } from '../utils/ui.js'

function printFindings(findings: ResourceFinding[]): void {
  for (const f of findings) {
    if (f.level === 'error') log.error(f.message)
    else log.warn(f.message)
  }
}

// Read-only surfaces for Project Resources (WI-031). They never connect to the described system and
// never resolve credential values — only reference names. Deterministic; consume the Core read model.

export function runResourcesList(dir: string = cwd(), opts: { json?: boolean } = {}): void {
  const resources = getResources(dir)

  if (opts.json) {
    console.log(JSON.stringify(resources, null, 2))
    return
  }

  if (resources.length === 0) {
    console.log('')
    console.log('No Project Resources are defined for this project.')
    console.log('')
    console.log('Add one under:')
    console.log('  knowledge/tech/resources/')
    console.log('')
    return
  }

  console.log('')
  console.log('Project Resources:')
  for (const r of resources) {
    const type = r.resourceType ?? '—'
    const provider = r.provider ? ` (${r.provider})` : ''
    const envs = r.environments.length > 0 ? `  [${r.environments.join(', ')}]` : ''
    console.log(`  ${r.id.padEnd(22)} ${type.padEnd(12)}${provider}${envs}`)
  }
  console.log('')
}

export function runResourcesGet(id: string, dir: string = cwd(), opts: { json?: boolean } = {}): void {
  const resource = getResource(dir, id)

  if (!resource) {
    if (opts.json) {
      console.log(JSON.stringify({ error: `Resource "${id}" not found.` }, null, 2))
    } else {
      console.error(`Project Resource "${id}" not found under knowledge/tech/resources/.`)
    }
    process.exit(1)
  }

  if (opts.json) {
    console.log(JSON.stringify(resource, null, 2))
    return
  }

  const r = resource
  console.log('')
  console.log(`${r.id} — ${r.title}`)
  console.log('')
  console.log(`  Type:         ${r.resourceType ?? '—'}`)
  console.log(`  Provider:     ${r.provider ?? '—'}`)
  if (r.environments.length > 0) console.log(`  Environments: ${r.environments.join(', ')}`)
  if (r.purpose) console.log(`  Purpose:      ${r.purpose}`)

  if (r.interfaces.length > 0) {
    console.log('')
    console.log('  Access interfaces:')
    for (const i of r.interfaces) {
      const tool = i.tool ?? i.provider ?? ''
      const label = tool ? `${i.type} (${tool})` : i.type
      console.log(`    - ${label}`)
      if (i.purpose) console.log(`        purpose: ${i.purpose}`)
      if (i.operations.length > 0) console.log(`        operations: ${i.operations.join(', ')}`)
      if (i.environments.length > 0) console.log(`        environments: ${i.environments.join(', ')}`)
      if (i.constraints) console.log(`        constraints: ${i.constraints}`)
    }
  }

  const boundaryEnvs = Object.keys(r.boundaries)
  if (boundaryEnvs.length > 0) {
    console.log('')
    console.log('  Access boundaries:')
    for (const env of boundaryEnvs) {
      console.log(`    - ${env}: ${r.boundaries[env].join(', ')}`)
    }
  }

  if (r.authRefs.length > 0 || r.authMode) {
    console.log('')
    console.log('  Authentication (references only — never values):')
    if (r.authMode) console.log(`    mode: ${r.authMode}`)
    if (r.authRefs.length > 0) console.log(`    refs: ${r.authRefs.join(', ')}`)
  }
  console.log('')
}

type CreateOpts = { title?: string; type?: string; provider?: string; scope?: string; module?: string; json?: boolean }

// Create a Project Resource. Non-interactive when --title and --type are given; otherwise prompts
// (Minimum Sufficient Knowledge). Delegates all rules to Core — never writes Markdown itself.
export async function runResourcesCreate(opts: CreateOpts = {}, dir: string = cwd()): Promise<void> {
  let title = opts.title?.trim()
  let type = opts.type?.trim()
  let provider = opts.provider?.trim()
  let scopeType = opts.scope?.trim() || (opts.module ? 'module' : 'system')
  let moduleId = opts.module?.trim()

  const interactive = !opts.json && process.stdin.isTTY && (!title || !type)
  if (interactive) {
    intro('kaddo resources create')
    if (!title) title = (await text({ message: 'Resource name', placeholder: 'Supabase Main' })).trim()
    if (!type) type = await select<string>({
      message: 'Resource type',
      options: ['database', 'cloud', 'api', 'queue', 'storage', 'repository', 'platform', 'service', 'other'].map((v) => ({ value: v, label: v })),
    })
    if (!provider) provider = (await text({ message: 'Provider (optional)', placeholder: 'supabase', defaultValue: '' })).trim() || undefined
    scopeType = await select<string>({ message: 'Scope', options: [{ value: 'system', label: 'system' }, { value: 'module', label: 'module' }] })
    if (scopeType === 'module') moduleId = (await text({ message: 'Module id', placeholder: 'orders-api' })).trim()
  }

  if (!title || !type) {
    console.error('A resource title and type are required. Use --title and --type (or run interactively).')
    process.exit(1)
  }

  const input: ResourceInput = { title, resourceType: type }
  if (provider) input.provider = provider
  input.scope = scopeType === 'module' ? { type: 'module', module: moduleId } : { type: 'system' }

  try {
    const res = createResource(dir, input)
    if (opts.json) { console.log(JSON.stringify(res, null, 2)); return }
    printFindings(res.findings)
    log.success(`Created ${res.id}`)
    if (interactive) outro(`Resource created at ${res.path}. Enrich it with \`kaddo resources update ${res.id}\`.`)
    else { console.log(`  ${res.path}`); console.log(`  Enrich it later with: kaddo resources update ${res.id}`) }
  } catch (err) {
    console.error(err instanceof ResourceWriteError ? err.message : String(err))
    process.exit(1)
  }
}

type UpdateOpts = { title?: string; type?: string; provider?: string; purpose?: string; scope?: string; module?: string; json?: boolean }

export function runResourcesUpdate(id: string, opts: UpdateOpts = {}, dir: string = cwd()): void {
  const input: ResourceInput = {}
  if (opts.title != null) input.title = opts.title
  if (opts.type != null) input.resourceType = opts.type
  if (opts.provider != null) input.provider = opts.provider
  if (opts.purpose != null) input.purpose = opts.purpose
  if (opts.scope != null || opts.module != null) {
    const scopeType = opts.scope || (opts.module ? 'module' : 'system')
    input.scope = scopeType === 'module' ? { type: 'module', module: opts.module } : { type: 'system' }
  }
  if (Object.keys(input).length === 0) {
    console.error('Nothing to update. Pass at least one field (e.g. --provider, --purpose, --module).')
    process.exit(1)
  }
  try {
    const res = updateResource(dir, id, input)
    if (opts.json) { console.log(JSON.stringify(res, null, 2)); return }
    printFindings(res.findings)
    console.log(`Updated ${res.id} (${res.path}).`)
  } catch (err) {
    console.error(err instanceof ResourceWriteError ? err.message : String(err))
    process.exit(1)
  }
}

type DeleteOpts = { yes?: boolean; json?: boolean }

export async function runResourcesDelete(id: string, opts: DeleteOpts = {}, dir: string = cwd()): Promise<void> {
  let preview
  try {
    preview = deleteResource(dir, id)
  } catch (err) {
    console.error(err instanceof ResourceWriteError ? err.message : String(err))
    process.exit(1)
  }
  const refs = preview.preview?.references ?? []
  if (opts.json && !opts.yes) { console.log(JSON.stringify(preview.preview, null, 2)); return }

  if (refs.length > 0) {
    console.log('')
    console.log(`Resource "${id}" is referenced by:`)
    for (const r of refs) console.log(`  - ${r.id} (${r.kind}, role: ${r.role})`)
    console.log('')
    console.log('Deleting the resource will NOT remove these references.')
  }

  let proceed = opts.yes === true
  if (!proceed) {
    if (process.stdin.isTTY) {
      proceed = await confirm({ message: `Delete resource "${id}"?`, initialValue: false })
    } else {
      console.error(`Refusing to delete without confirmation. Re-run with --yes to delete "${id}".`)
      process.exit(1)
    }
  }
  if (!proceed) { console.log('Aborted.'); return }

  try {
    const done = deleteResource(dir, id, { confirm: true })
    if (opts.json) { console.log(JSON.stringify(done, null, 2)); return }
    log.success(`Deleted ${id} (${done.path}).`)
  } catch (err) {
    console.error(err instanceof ResourceWriteError ? err.message : String(err))
    process.exit(1)
  }
}
