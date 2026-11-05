import { discoverWorkItems } from '../services/knowledge-artifacts.js'
import { getGitRoot, observeGit } from '../services/git.js'
import { loadMappedModules } from '../services/mapped-modules.js'
import { getWorkItem, WorkItemNotFoundError } from './work-items.js'
import { getInitiative, associatedWorkItems } from './initiative.js'
import { getEpic, getPlan, initiativesInEpic, epicsInPlan, workItemsInEpic } from './delivery-planning.js'
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
export type CollaborationAggregate = {
  id: string
  responsibility: { owners: string[]; contributors: string[] }
  workItems: { id: string; owners: string[]; contributors: string[]; linkedCommitCount: number }[]
  observedAuthors: string[]
  linkedCommits: (GitCommitEvidence & { workItemIds: string[] })[]
  unassignedWorkItemIds: string[]
  git: WorkItemCollaboration['git']
}

export function matchesWorkItemReference(value: string, id: string): boolean {
  return new RegExp(`(^|[^A-Za-z0-9_-])${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=$|[^A-Za-z0-9_-])`, 'i').test(value)
}

async function observationsForProject(dir: string) {
  const corePath = path.resolve(dir)
  // Only repositories explicitly registered in .kaddo/modules.yml are considered. This
  // keeps observation bounded and prevents accidental scans of neighbouring folders.
  const mapped = loadMappedModules(dir)
    .filter((module) => Boolean(module.repoPath))
    .map((module) => ({ path: path.resolve(corePath, module.repoPath), repositoryId: `module:${module.id}` }))
  const candidates = [{ path: corePath, repositoryId: 'core' }, ...mapped]
  // Several mapped modules may live inside the same repository. Resolve their Git root first
  // so one repository contributes one bounded observation rather than duplicated evidence.
  const resolved = await Promise.all(candidates.map(async (candidate) => ({ ...candidate, root: await getGitRoot(candidate.path) })))
  // One observation per resolved root.  The label comes from the declared module
  // identity (or `core`), never from a potentially-colliding folder basename.
  const repositories = new Map<string, { root: string; repositoryId: string }>()
  for (const item of resolved) if (item.root && !repositories.has(item.root)) repositories.set(item.root, { root: item.root, repositoryId: item.repositoryId })
  const observations = await Promise.all([...repositories.values()].map((repo) => observeGit(repo.root, 100, repo.repositoryId)))
  return observations
}

async function collaborationForWorkItems(dir: string, ids: string[]): Promise<WorkItemCollaboration[]> {
  const observations = await observationsForProject(dir)
  return ids.map((id) => {
    const wi = getWorkItem(dir, id)
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
  })
}

/** Collection projection: one Git snapshot is shared by every requested Work Item. */
export async function getWorkItemsCollaboration(dir: string, ids: string[]): Promise<WorkItemCollaboration[]> {
  return collaborationForWorkItems(dir, [...new Set(ids)])
}

export async function getWorkItemCollaboration(dir: string, id: string): Promise<WorkItemCollaboration> {
  return (await collaborationForWorkItems(dir, [id]))[0]
}

function aggregate(id: string, responsibility: { owners: string[]; contributors: string[] }, items: WorkItemCollaboration[]): CollaborationAggregate {
  const commits = new Map<string, GitCommitEvidence & { workItemIds: string[] }>()
  for (const item of items) for (const commit of item.git.linkedCommits) {
    const key = `${commit.repository}:${commit.sha}`
    const existing = commits.get(key)
    if (existing) existing.workItemIds = [...new Set([...existing.workItemIds, item.workItemId])]
    else commits.set(key, { ...commit, workItemIds: [item.workItemId] })
  }
  const first = items[0]
  return {
    id, responsibility,
    workItems: items.map((item) => ({ id: item.workItemId, owners: item.responsibility.owners, contributors: item.responsibility.contributors, linkedCommitCount: item.git.linkedCommits.length })),
    observedAuthors: [...new Set([...commits.values()].map((commit) => commit.author))],
    linkedCommits: [...commits.values()],
    unassignedWorkItemIds: items.filter((item) => item.responsibility.owners.length === 0).map((item) => item.workItemId),
    git: first?.git ?? { availability: 'unavailable', repositories: [], observedAuthors: [], linkedCommits: [], relatedBranches: [], unattributedActivityCount: 0, inspectedAt: null, coverage: { maxCommits: 100, inspectedCommits: 0, note: 'No associated Work Items.' } },
  }
}

export async function getInitiativeCollaboration(dir: string, id: string): Promise<CollaborationAggregate> {
  const initiative = getInitiative(dir, id)
  if (!initiative) throw new WorkItemNotFoundError(`Initiative ${id} was not found.`)
  const items = await collaborationForWorkItems(dir, associatedWorkItems(dir, id).map((item) => item.id))
  return aggregate(id, { owners: initiative.owners, contributors: initiative.contributors }, items)
}

export async function getEpicCollaboration(dir: string, id: string): Promise<CollaborationAggregate> {
  const epic = getEpic(dir, id)
  if (!epic) throw new WorkItemNotFoundError(`Epic ${id} was not found.`)
  const items = await collaborationForWorkItems(dir, workItemsInEpic(dir, id).map((item) => item.id))
  const initiatives = initiativesInEpic(dir, id)
  return aggregate(id, { owners: [...new Set(initiatives.flatMap((item) => item.owners))], contributors: [...new Set(initiatives.flatMap((item) => item.contributors))] }, items)
}

export async function getPlanCollaboration(dir: string, id: string): Promise<CollaborationAggregate> {
  const plan = getPlan(dir, id)
  if (!plan) throw new WorkItemNotFoundError(`Plan ${id} was not found.`)
  const epicIds = epicsInPlan(dir, id).map((epic) => epic.id)
  const workItemIds = [...new Set(epicIds.flatMap((epicId) => workItemsInEpic(dir, epicId).map((item) => item.id)))]
  const items = await collaborationForWorkItems(dir, workItemIds)
  const initiatives = epicIds.flatMap((epicId) => initiativesInEpic(dir, epicId))
  return aggregate(id, { owners: [...new Set(initiatives.flatMap((item) => item.owners))], contributors: [...new Set(initiatives.flatMap((item) => item.contributors))] }, items)
}

export function knownWorkItemIds(dir: string): string[] {
  return discoverWorkItems(dir).map((item) => item.id).filter(Boolean)
}

export { WorkItemNotFoundError }
