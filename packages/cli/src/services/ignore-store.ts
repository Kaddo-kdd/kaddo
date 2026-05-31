import { exists, readFile, writeFile, join } from '../utils/fs.js'
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'

const IGNORE_FILE = '.kaddo/ignores.yml'

export type IgnoreEntry = {
  artifact_id: string
  reason: string
  created_at: string
  files: string[]
}

export function loadIgnores(dir: string): IgnoreEntry[] {
  const path = join(dir, IGNORE_FILE)
  if (!exists(path)) return []
  try {
    const raw = readFile(path)
    const parsed = parseYaml(raw)
    return Array.isArray(parsed) ? (parsed as IgnoreEntry[]) : []
  } catch {
    return []
  }
}

export function saveIgnore(dir: string, entry: IgnoreEntry): void {
  const path = join(dir, IGNORE_FILE)
  const existing = loadIgnores(dir)
  // Replace if same artifact_id already ignored, otherwise append
  const idx = existing.findIndex((e) => e.artifact_id === entry.artifact_id)
  if (idx >= 0) {
    existing[idx] = entry
  } else {
    existing.push(entry)
  }
  writeFile(path, stringifyYaml(existing))
}

export function isIgnored(ignores: IgnoreEntry[], artifactId: string): IgnoreEntry | undefined {
  return ignores.find((e) => e.artifact_id === artifactId)
}

export function removeIgnore(dir: string, artifactId: string): boolean {
  const path = join(dir, IGNORE_FILE)
  const existing = loadIgnores(dir)
  const filtered = existing.filter((e) => e.artifact_id !== artifactId)
  if (filtered.length === existing.length) return false
  writeFile(path, stringifyYaml(filtered))
  return true
}
