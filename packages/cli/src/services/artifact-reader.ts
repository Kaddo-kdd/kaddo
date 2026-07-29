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
  /** Raw frontmatter data for source metadata parsing (VS-082). */
  rawFrontmatter: Record<string, unknown>
  /** ADR/decision IDs this artifact depends on (front matter `decisions`). */
  decisions: string[]
  /** External Knowledge Capsule IDs this artifact uses (front matter `capsules`). */
  capsules: string[]
  /** Independent status dimensions (VS-094). */
  implementationStatus: string
  validationStatus: string
  releaseStatus: string
  /** Affected module IDs (VS-091 / VS-094). */
  affectedModules: string[]
  /** Agent history (VS-094). */
  refinedBy: string
  implementedBy: string
  closedBy: string
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
      source: data.source && typeof data.source === 'object' ? String((data.source as Record<string, unknown>).type ?? '') : (data.source ? String(data.source) : ''),
      sourceId: String(data.source_id ?? ''),
      rawFrontmatter: data as Record<string, unknown>,
      decisions: Array.isArray(data.decisions) ? data.decisions.map(String).filter(Boolean) : [],
      capsules: Array.isArray(data.capsules) ? data.capsules.map(String).filter(Boolean) : [],
      implementationStatus: String(data.implementation_status ?? ''),
      validationStatus: String(data.validation_status ?? ''),
      releaseStatus: String(data.release_status ?? ''),
      affectedModules: Array.isArray(data.affected_modules) ? data.affected_modules.map(String).filter(Boolean) : [],
      refinedBy: String(data.refined_by ?? ''),
      implementedBy: String(data.implemented_by ?? ''),
      closedBy: String(data.closed_by ?? ''),
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
