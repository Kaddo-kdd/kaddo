import { parse as parseYaml } from 'yaml'

/** Minimal data eligible for a registry advisory request; never includes URLs or lockfile metadata. */
export type RegistryInventory = { packages: Record<string, string[]>; omitted: number }

const NAME = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/
const VERSION = /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/
const MAX_LOCK_BYTES = 10 * 1024 * 1024
const MAX_ENTRIES = 100_000

export function buildRegistryInventory(format: 'npm' | 'pnpm', content: string): RegistryInventory {
  if (Buffer.byteLength(content, 'utf8') > MAX_LOCK_BYTES) throw new Error('Lockfile exceeds audit inventory limit.')
  const parsed: unknown = format === 'npm' ? JSON.parse(content) : parseYaml(content, { maxAliasCount: 50 })
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid lockfile.')
  const root = parsed as Record<string, unknown>
  const lockVersion = String(root.lockfileVersion ?? '')
  if (format === 'npm' && !['2', '3'].includes(lockVersion)) throw new Error('Unsupported npm lockfile version.')
  if (format === 'pnpm' && !['9', '9.0'].includes(lockVersion)) throw new Error('Unsupported pnpm lockfile version.')
  if (!root.packages || typeof root.packages !== 'object' || Array.isArray(root.packages)) throw new Error('Lockfile has no package inventory.')
  const entries = Object.entries(root.packages as Record<string, unknown>)
  if (entries.length > MAX_ENTRIES) throw new Error('Lockfile exceeds audit inventory entry limit.')
  const values = new Map<string, Set<string>>()
  let omitted = 0
  for (const [key, value] of entries) {
    if (format === 'npm' && key === '') continue
    let name: unknown; let version: unknown
    if (format === 'pnpm') {
      const at = key.lastIndexOf('@')
      name = at > 0 ? key.slice(0, at) : undefined
      version = at > 0 ? key.slice(at + 1) : undefined
    } else {
      const marker = 'node_modules/'
      const at = key.lastIndexOf(marker)
      if (at < 0 || !value || typeof value !== 'object' || Array.isArray(value)) { omitted++; continue }
      const entry = value as { name?: unknown; version?: unknown; link?: unknown }
      if (entry.link) { omitted++; continue }
      name = entry.name ?? key.slice(at + marker.length)
      version = entry.version
    }
    if (typeof name !== 'string' || typeof version !== 'string' || !NAME.test(name) || !VERSION.test(version)) { omitted++; continue }
    const versions = values.get(name) ?? new Set<string>()
    versions.add(version)
    values.set(name, versions)
  }
  return { packages: Object.fromEntries([...values.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([name, versions]) => [name, [...versions].sort()])), omitted }
}
