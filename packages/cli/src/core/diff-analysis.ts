import { minimatch } from 'minimatch'
import path from 'path'
import type { Artifact } from '../services/artifact-reader.js'

function toPosix(p: string): string {
  return p.replace(/\\/g, '/')
}

/**
 * Normalize a Git-reported path (relative to the Git root) to a Kaddo-project-root-relative path,
 * so it can be matched against `code:` globs which are always project-root relative (VS-060.1).
 *
 * - Git root == project root → returned unchanged.
 * - Git root above the project (project is a subfolder) → strips the project prefix.
 * - File outside the Kaddo project → returns null (no false matches).
 */
export function normalizeTouchedPathForProject(
  touchedPath: string,
  gitRoot: string | null,
  projectRoot: string
): string | null {
  const t = toPosix(touchedPath).replace(/^\.\//, '').replace(/^\/+/, '')
  if (!gitRoot) return t // no git root info: assume already project-relative

  const prefix = toPosix(path.relative(gitRoot, projectRoot)).replace(/^\.\//, '').replace(/\/+$/, '')
  if (prefix === '' || prefix === '.') return t // project root == git root
  if (prefix.startsWith('..')) return t // project is above git root — paths already project-relative

  if (t === prefix) return null // the project folder itself, not a file
  if (t.startsWith(prefix + '/')) return t.slice(prefix.length + 1)
  return null // outside this Kaddo project
}

export type EvidenceScore = {
  matched: number
  total: number
  label: string        // e.g. "3/4 globs matched"
  signals: string[]    // human-readable explanation of what matched
}

export type ArtifactMatch = {
  artifact: Artifact
  matchedFiles: string[]
  artifactWasModified: boolean
  evidence: EvidenceScore
}

export type GuardResult = {
  touchedFiles: string[]
  matches: ArtifactMatch[]
  silenced: boolean
}

function normalizePath(p: string): string {
  // Always normalize Windows-style backslashes to POSIX separators, regardless of the
  // platform Guard runs on (CI is Linux, where path.sep would not convert them).
  return p.replace(/\\/g, '/')
}

function fileMatchesGlob(file: string, glob: string): boolean {
  return minimatch(normalizePath(file), glob, { matchBase: false, dot: true })
}

function fileMatchesGlobs(file: string, globs: string[]): boolean {
  return globs.some((glob) => fileMatchesGlob(file, glob))
}

function artifactFileWasModified(artifact: Artifact, touchedFiles: string[]): boolean {
  const normalized = normalizePath(artifact.filePath)
  return touchedFiles.some((f) => {
    const normalizedTouched = normalizePath(f)
    return normalized.endsWith(normalizedTouched) || normalizedTouched.endsWith(normalized)
  })
}

function computeEvidence(artifact: Artifact, matchedFiles: string[]): EvidenceScore {
  const totalGlobs = artifact.codeGlobs.length
  const matchedGlobs = artifact.codeGlobs.filter((glob) =>
    matchedFiles.some((f) => fileMatchesGlob(f, glob))
  )

  const signals: string[] = []

  if (matchedGlobs.length > 0) {
    signals.push(`${matchedGlobs.length}/${totalGlobs} globs matched`)
  }
  if (artifact.knowledgeLevel) {
    signals.push(`artifact ${artifact.knowledgeLevel}`)
  }
  if (artifact.domains.length > 0) {
    signals.push(`domain: ${artifact.domains.join(', ')}`)
  }

  return {
    matched: matchedGlobs.length,
    total: totalGlobs,
    label: `${matchedGlobs.length}/${totalGlobs} globs matched`,
    signals,
  }
}

export function analyzeGuard(
  touchedFiles: string[],
  artifacts: Artifact[],
  silentWithoutOwnership: boolean
): GuardResult {
  const artifactsWithGlobs = artifacts.filter((a) => a.codeGlobs.length > 0)

  if (artifactsWithGlobs.length === 0) {
    return { touchedFiles, matches: [], silenced: silentWithoutOwnership }
  }

  const matches: ArtifactMatch[] = []

  for (const artifact of artifactsWithGlobs) {
    const matchedFiles = touchedFiles.filter((f) => fileMatchesGlobs(f, artifact.codeGlobs))

    if (matchedFiles.length > 0) {
      const artifactWasModified = artifactFileWasModified(artifact, touchedFiles)
      const evidence = computeEvidence(artifact, matchedFiles)
      matches.push({ artifact, matchedFiles, artifactWasModified, evidence })
    }
  }

  return { touchedFiles, matches, silenced: false }
}
