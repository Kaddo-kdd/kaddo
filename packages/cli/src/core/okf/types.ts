// Open Knowledge Format (OKF v0.2) adapter — shared types (WI-065).
//
// OKF is an optional, read-only INTEROPERABILITY projection of Kaddo's canonical knowledge. These
// types describe the bundle the adapter emits and the findings the validator reports. They never
// replace Kaddo's domain models — the adapter consumes existing Core readers and maps their output.

export const OKF_VERSION = '0.2'

/** Reserved OKF file names (navigation index + history log). */
export const OKF_RESERVED_FILES = ['index.md', 'log.md'] as const

/** A single exported knowledge concept, ready to serialize as one Markdown file. */
export type OkfConcept = {
  /** Canonical Kaddo id (stable identity across exports). */
  id: string
  /** OKF concept type (required in the emitted frontmatter). */
  type: string
  title: string
  description: string | null
  tags: string[]
  /** Bundle-relative path this concept is written to, e.g. "delivery/work-items/WI-001.md". */
  path: string
  /** Canonical source path inside the project (provenance; never invented). Null for generated concepts. */
  sourcePath: string | null
  /** For generated concepts (reports): the generation time (OKF `generated.at`). Never a source date. */
  generatedAt?: string | null
  /** For generated concepts: the responsible process (OKF `generated.by`), e.g. process:kaddo-okf-export. */
  generatedBy?: string | null
  /** Ids of related concepts, resolved to bundle links at render time. */
  related: { id: string; role: string }[]
  /** A pre-rendered Markdown body to use verbatim (e.g. a report), instead of title + description. */
  body: string | null
}

export type OkfIndex = {
  /** Bundle-relative path of the index file, e.g. "delivery/index.md". */
  path: string
  title: string
  /** Concept ids listed by this index (for progressive navigation). */
  conceptIds: string[]
  /** Only the root index declares the OKF version. */
  root?: boolean
}

export type OkfBundle = {
  concepts: OkfConcept[]
  indexes: OkfIndex[]
  /** Artifact types that were discovered but intentionally not exported (e.g. not in the allow-list). */
  omitted: { type: string; count: number }[]
}

export const OKF_EXPORT_PROCESS = 'process:kaddo-okf-export'

export type OkfExportResult = {
  outputDir: string
  conceptCount: number
  indexCount: number
  omitted: { type: string; count: number }[]
  /** Concepts skipped on purpose (e.g. potential sensitive content), with a reason — never the value. */
  omittedConcepts: { id: string; reason: string }[]
  /** Non-fatal notes surfaced to the user. */
  warnings: string[]
  /** Bundle-relative paths written, sorted (determinism aid). */
  files: string[]
}

/** Thrown before any destructive operation when export cannot proceed safely (dangerous destination,
 * unresolved identity collision). A prior valid bundle is never touched when this is raised. */
export class OkfExportError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message)
    this.name = 'OkfExportError'
  }
}

export type OkfFindingLevel = 'conformance' | 'warning' | 'info'

export type OkfFinding = {
  level: OkfFindingLevel
  /** Bundle-relative file the finding refers to, when applicable. */
  file?: string
  message: string
}

export type OkfValidationResult = {
  dir: string
  conformant: boolean
  conceptCount: number
  findings: OkfFinding[]
  counts: { conformance: number; warning: number; info: number }
}
