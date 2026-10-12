// OKF validation (WI-065): read-only conformance check for an OKF v0.2 bundle.
//
// Permissive by design (per the spec): unknown types, unknown extra fields, missing optional fields,
// broken internal links and missing optional indexes are NOT conformance errors. It separates
// Conformance Errors, Warnings and Informational findings, and never writes anything.

import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { OKF_VERSION, type OkfFinding, type OkfValidationResult } from './types.js'
import { OKF_DEFAULT_OUTPUT } from './export.js'

function walk(root: string): string[] {
  const out: string[] = []
  const rec = (d: string) => {
    for (const entry of fs.readdirSync(d)) {
      const full = path.join(d, entry)
      const st = fs.statSync(full)
      if (st.isDirectory()) rec(full)
      else if (entry.endsWith('.md')) out.push(full)
    }
  }
  if (fs.existsSync(root)) rec(root)
  return out.sort()
}

/** Extract relative Markdown link targets (ignoring external URLs and anchors). */
function internalLinks(body: string): string[] {
  const out: string[] = []
  const re = /\]\(([^)]+)\)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(body))) {
    const href = m[1].trim().split('#')[0].split(' ')[0]
    if (!href || /^(https?:|mailto:|\/)/.test(href)) continue
    out.push(href)
  }
  return out
}

/** Validate an OKF bundle directory (default `.kaddo/okf`). Read-only. */
export function validateOkf(dir: string, opts: { location?: string } = {}): OkfValidationResult {
  const loc = opts.location ?? OKF_DEFAULT_OUTPUT
  const bundleDir = path.isAbsolute(loc) ? loc : path.join(dir, loc)
  const findings: OkfFinding[] = []

  if (!fs.existsSync(bundleDir)) {
    findings.push({ level: 'conformance', message: `OKF bundle directory not found: ${loc}. Run \`kaddo okf export\` first.` })
    return { dir: bundleDir, conformant: false, conceptCount: 0, findings, counts: { conformance: 1, warning: 0, info: 0 } }
  }

  const files = walk(bundleDir)
  const rel = (f: string) => path.relative(bundleDir, f).split(path.sep).join('/')
  const present = new Set(files.map(rel))
  const idToFile = new Map<string, string>()
  let conceptCount = 0

  const rootIndex = path.join(bundleDir, 'index.md')
  if (!fs.existsSync(rootIndex)) {
    findings.push({ level: 'warning', message: 'No root index.md — the bundle has no top-level navigation entry.' })
  }

  for (const file of files) {
    const r = rel(file)
    const isIndex = path.basename(file) === 'index.md'
    let data: Record<string, unknown> = {}
    try {
      data = (matter(fs.readFileSync(file, 'utf-8')).data ?? {}) as Record<string, unknown>
    } catch {
      findings.push({ level: 'conformance', file: r, message: 'Invalid YAML frontmatter.' })
      continue
    }

    const type = typeof data.type === 'string' ? data.type.trim() : ''
    if (!type) {
      // A concept must declare a non-empty type. An index without a type is a warning, not an error.
      findings.push(isIndex
        ? { level: 'warning', file: r, message: 'Index has no type.' }
        : { level: 'conformance', file: r, message: 'Concept has no non-empty `type`.' })
    }
    if (!isIndex) conceptCount++

    if (r === 'index.md') {
      const v = typeof data.okf_version === 'string' ? data.okf_version : (data.okf_version != null ? String(data.okf_version) : '')
      if (!v) findings.push({ level: 'warning', file: r, message: 'Root index does not declare okf_version.' })
      else if (v !== OKF_VERSION) findings.push({ level: 'info', file: r, message: `Bundle declares okf_version "${v}" (validator targets ${OKF_VERSION}).` })
    }

    const kid = typeof data.kaddo_id === 'string' ? data.kaddo_id : ''
    if (kid) {
      if (idToFile.has(kid)) findings.push({ level: 'conformance', file: r, message: `Duplicate concept id "${kid}" (also in ${idToFile.get(kid)}).` })
      else idToFile.set(kid, r)
    }

    // Internal links: broken ones are informational (OKF allows yet-unresolvable references).
    const body = (() => { try { return matter(fs.readFileSync(file, 'utf-8')).content } catch { return '' } })()
    for (const href of internalLinks(body)) {
      const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(r), href))
      if (!present.has(resolved)) findings.push({ level: 'info', file: r, message: `Internal link not resolvable yet: ${href}` })
    }
  }

  const counts = {
    conformance: findings.filter((f) => f.level === 'conformance').length,
    warning: findings.filter((f) => f.level === 'warning').length,
    info: findings.filter((f) => f.level === 'info').length,
  }
  return { dir: bundleDir, conformant: counts.conformance === 0, conceptCount, findings, counts }
}
