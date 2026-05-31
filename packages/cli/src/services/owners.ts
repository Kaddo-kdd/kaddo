import { exists, readFile, join } from '../utils/fs.js'
import { parse as parseYaml } from 'yaml'

const CONFIG_PATH = '.kaddo/config.yml'

export type DomainOwners = Record<string, string[]>

type OwnersConfig = {
  owners?: DomainOwners
}

export function loadOwners(dir: string): DomainOwners {
  const configPath = join(dir, CONFIG_PATH)
  if (!exists(configPath)) return {}
  try {
    const config = parseYaml(readFile(configPath)) as OwnersConfig
    const raw = config.owners ?? {}
    const result: DomainOwners = {}
    for (const [domain, people] of Object.entries(raw)) {
      result[domain] = Array.isArray(people) ? people.map(String) : [String(people)]
    }
    return result
  } catch {
    return {}
  }
}

export type OwnerMatch = {
  domain: string
  owners: string[]
}

export function resolveAffectedOwners(domains: string[], ownerMap: DomainOwners): OwnerMatch[] {
  const matches: OwnerMatch[] = []
  for (const domain of domains) {
    const owners = ownerMap[domain]
    if (owners && owners.length > 0) {
      matches.push({ domain, owners })
    }
  }
  return matches
}

export function collectMatchedDomains(matchedArtifactDomains: string[][]): string[] {
  const seen = new Set<string>()
  for (const domainList of matchedArtifactDomains) {
    for (const d of domainList) {
      if (d) seen.add(d)
    }
  }
  return [...seen]
}
