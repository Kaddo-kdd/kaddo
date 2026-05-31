import { minimatch } from 'minimatch'
import path from 'path'
import type { Artifact } from '../services/artifact-reader.js'

export type ArtifactMatch = {
  artifact: Artifact
  matchedFiles: string[]
  artifactWasModified: boolean
}

export type GuardResult = {
  touchedFiles: string[]
  matches: ArtifactMatch[]
  silenced: boolean
}

function normalizePath(p: string): string {
  return p.split(path.sep).join('/')
}

function fileMatchesGlobs(file: string, globs: string[]): boolean {
  const normalized = normalizePath(file)
  return globs.some((glob) =>
    minimatch(normalized, glob, { matchBase: false, dot: true })
  )
}

function artifactFileWasModified(artifact: Artifact, touchedFiles: string[]): boolean {
  const normalized = normalizePath(artifact.filePath)
  return touchedFiles.some((f) => {
    // artifact paths may be absolute; touched files are relative to repo root
    const normalizedTouched = normalizePath(f)
    return normalized.endsWith(normalizedTouched) || normalizedTouched.endsWith(normalized)
  })
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
      matches.push({ artifact, matchedFiles, artifactWasModified })
    }
  }

  return { touchedFiles, matches, silenced: false }
}
