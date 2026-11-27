import fs from 'node:fs'
import path from 'node:path'

/** Linux mountinfo encodes spaces and other special characters as octal escapes. */
export function nestedLinuxMounts(root: string, mountinfo: string): string[] {
  const resolvedRoot = path.posix.resolve(root)
  const mounts: string[] = []
  for (const line of mountinfo.split('\n')) {
    if (!line) continue
    const fields = line.split(' ')
    if (fields.length < 10 || !fields.includes('-')) throw new Error('Invalid mount table.')
    const mount = fields[4].replace(/\\([0-7]{3})/g, (_, code: string) => String.fromCharCode(parseInt(code, 8)))
    if (!mount.startsWith('/')) throw new Error('Invalid mount table.')
    const rel = path.posix.relative(resolvedRoot, path.posix.resolve(mount))
    if (rel && rel !== '..' && !rel.startsWith('../') && !path.posix.isAbsolute(rel)) mounts.push(mount)
  }
  return mounts
}

/** Fail closed on Linux when a project contains a nested filesystem mount. */
export function assertNoNestedMounts(root: string): void {
  if (process.platform !== 'linux') return
  const mountinfo = fs.readFileSync('/proc/self/mountinfo', 'utf8')
  if (nestedLinuxMounts(root, mountinfo).length) throw new Error('Nested project mounts are unsupported.')
}
