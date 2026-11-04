import { discoverWorkItems } from '../services/knowledge-artifacts.js'
import { getGitRoot, observeGit } from '../services/git.js'
import { loadMappedModules } from '../services/mapped-modules.js'
import { getWorkItem, WorkItemNotFoundError } from './work-items.js'
import path from 'node:path'

export type AttributionKind = 'explicit-reference' | 'branch-associated'
export type GitCommitEvidence = {
  repository: string
  sha: string
  author: string
  date: string
  subject: string
  paths: string[]
  attribution: AttributionKind
  evidence: string
}
export type WorkItemCollaboration = {
  workItemId: string
  responsibility: { owners: string[]; contributors: string[] }
  git: {
    availability: 'available' | 'partial' | 'unavailable'
    repositories: string[]
    observedAuthors: string[]
    linkedCommits: GitCommitEvidence[]
    relatedBranches: { repository: string; name: string; attribution: 'branch-associated'; evidence: string }[]
    unattributedActivityCount: number
    inspectedAt: string | null
    coverage: { maxCommits: number; inspectedCommits: number; note: string }
  }
}

export function matchesWorkItemReference(value: string, id: string): boolean {
  return new RegExp(`(^|[^A-Za-z0-9_-])${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=$|[^A-Za-z0-9_-])`, 'i').test(value)
}

export async function getWorkItemCollaboration(dir: string, id: string): Promise<WorkItemCollaboration> {
  const wi = getWorkItem(dir, id)
  const corePath = path.resolve(dir)
  // Only repositories explicitly registered in .kaddo/modules.yml are considered. This
  // keeps observation bounded and prevents accidental scans of neighbouring folders.
  const mappedPaths = loadMappedModules(dir)
    .map((module) => path.resolve(corePath, module.repoPath))
    .filter((modulePath) => modulePath !== corePath && modulePath.startsWith(`${corePath}${path.sep}`))
  const paths = [...new Set([corePath, ...mappedPaths])]
  // Several mapped modules may live inside the same repository. Resolve their Git root first
  // so one repository contributes one bounded observation rather than duplicated evidence.
  const roots = await Promise.all(paths.map((repoPath) => getGitRoot(repoPath)))
  const repositoryPaths = [...new Set(roots.filter((root): root is string => root != null))]
  const observations = await Promise.all(repositoryPaths.map((repoPath) => observeGit(repoPath)))
  const linkedCommits: GitCommitEvidence[] = []
  const relatedBranches: WorkItemCollaboration['git']['relatedBranches'] = []
  for (const observation of observations) {
    const repository = observation.repository ?? 'local'
    for (const commit of observation.commits) {
      if (!matchesWorkItemReference(commit.subject, wi.id)) continue
      linkedCommits.push({ repository, sha: commit.sha, author: commit.author, date: commit.date, subject: commit.subject, paths: commit.files.slice(0, 50), attribution: 'explicit-reference', evidence: `Exact reference ${wi.id} in commit subject.` })
    }
    for (const branch of observation.branches) {
      if (!matchesWorkItemReference(branch.name, wi.id)) continue
      relatedBranches.push({ repository, name: branch.name, attribution: 'branch-associated', evidence: `Exact reference ${wi.id} in local branch name.` })
    }
  }
  const inspectedCommits = observations.reduce((total, observation) => total + observation.commits.length, 0)
  const available = observations.filter((observation) => observation.availability === 'available').length
  const availability = available === observations.length ? 'available' : available > 0 ? 'partial' : observations.some((observation) => observation.availability === 'partial') ? 'partial' : 'unavailable'
  return {
    workItemId: wi.id,
    responsibility: { owners: wi.owners, contributors: wi.contributors },
    git: {
      availability,
      repositories: observations.flatMap((observation) => observation.repository ? [observation.repository] : []),
      observedAuthors: [...new Set(linkedCommits.map((commit) => commit.author))],
      linkedCommits,
      relatedBranches,
      unattributedActivityCount: Math.max(0, inspectedCommits - linkedCommits.length),
      inspectedAt: observations.map((observation) => observation.inspectedAt).sort().at(-1) ?? null,
      coverage: { maxCommits: observations[0]?.limit ?? 100, inspectedCommits, note: 'Only the core repository and explicitly mapped module repositories were inspected with read-only Git metadata. File overlap never creates attribution.' },
    },
  }
}

export function knownWorkItemIds(dir: string): string[] {
  return discoverWorkItems(dir).map((item) => item.id).filter(Boolean)
}

export { WorkItemNotFoundError }
