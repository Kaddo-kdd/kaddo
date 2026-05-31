import { saveIgnore, loadIgnores, removeIgnore } from '../services/ignore-store.js'
import { cwd } from '../utils/fs.js'
import { log } from '../utils/ui.js'

export function runIgnore(artifactId: string, reason: string): void {
  const dir = cwd()
  saveIgnore(dir, {
    artifact_id: artifactId,
    reason: reason.trim(),
    created_at: new Date().toISOString().split('T')[0],
    files: [],
  })
  log.success(`${artifactId} added to .kaddo/ignores.yml — "${reason}"`)
}

export function runIgnoreList(): void {
  const dir = cwd()
  const ignores = loadIgnores(dir)
  if (ignores.length === 0) {
    console.log('No ignores registered.')
    return
  }
  console.log('')
  console.log('Active ignores:')
  for (const entry of ignores) {
    console.log(`  ${entry.artifact_id}`)
    console.log(`    Reason:  ${entry.reason}`)
    console.log(`    Since:   ${entry.created_at}`)
    console.log('')
  }
}

export function runIgnoreRemove(artifactId: string): void {
  const dir = cwd()
  const removed = removeIgnore(dir, artifactId)
  if (removed) {
    log.success(`${artifactId} removed from .kaddo/ignores.yml`)
  } else {
    log.warn(`${artifactId} was not in .kaddo/ignores.yml`)
  }
}
