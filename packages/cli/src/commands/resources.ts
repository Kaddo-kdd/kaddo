import { cwd } from '../utils/fs.js'
import { getResources, getResource } from '../core/resources.js'

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
