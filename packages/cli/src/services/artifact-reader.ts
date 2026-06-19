import matter from 'gray-matter'
import { readFile, readDir, join, isFile } from '../utils/fs.js'

export type Artifact = {
  filePath: string
  id: string
  type: string
  title: string
  summary: string
  knowledgeLevel: string
  codeGlobs: string[]
  domains: string[]
  capabilities: string[]
  status: string
  phase: string
  initiative: string
  source: string
  sourceId: string
  /** ADR/decision IDs this artifact depends on (front matter `decisions`). */
  decisions: string[]
}

function parseArtifact(filePath: string, raw: string): Artifact | null {
  try {
    const { data } = matter(raw)
    const globs: string[] = Array.isArray(data.code) ? data.code.filter(Boolean) : []

    return {
      filePath,
      id: String(data.id ?? ''),
      type: String(data.type ?? ''),
      title: String(data.title ?? ''),
      summary: String(data.summary ?? ''),
      knowledgeLevel: String(data.knowledge_level ?? ''),
      codeGlobs: globs,
      domains: Array.isArray(data.domains) ? data.domains : [],
      capabilities: Array.isArray(data.capabilities) ? data.capabilities.map(String).filter(Boolean) : [],
      status: String(data.status ?? ''),
      phase: String(data.phase ?? ''),
      initiative: String(data.initiative ?? data.source_initiative ?? ''),
      source: data.source ? String(data.source) : '',
      sourceId: String(data.source_id ?? ''),
      decisions: Array.isArray(data.decisions) ? data.decisions.map(String).filter(Boolean) : [],
    }
  } catch {
    return null
  }
}

export function readArtifacts(archDir: string): Artifact[] {
  const artifacts: Artifact[] = []

  function walkDir(dir: string) {
    const entries = readDir(dir)
    for (const entry of entries) {
      const fullPath = join(dir, entry)
      if (isFile(fullPath) && entry.endsWith('.md')) {
        const raw = readFile(fullPath)
        const artifact = parseArtifact(fullPath, raw)
        if (artifact) artifacts.push(artifact)
      } else if (!isFile(fullPath) && !entry.startsWith('.')) {
        walkDir(fullPath)
      }
    }
  }

  walkDir(archDir)
  return artifacts
}

export function artifactsWithOwnership(artifacts: Artifact[]): Artifact[] {
  return artifacts.filter((a) => a.codeGlobs.length > 0)
}
