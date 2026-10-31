// Pure conversions between a Resource's connection profiles (as read from the API) and the editable
// draft used by the ResourceDetail form (WI-069). No secrets logic here — the Core contract rejects
// secret-looking coordinates on write; this only shapes data and drops empty rows.

import type { ResourceConnectionProfile, ResourceConnectionProfileInput } from './api'

export type ProfileDraft = {
  environment: string
  interface: string
  coordinates: { key: string; value: string }[]
}

/** API profiles → editable drafts (nulls become empty strings). */
export function toDraft(profiles: ResourceConnectionProfile[]): ProfileDraft[] {
  return profiles.map((p) => ({
    environment: p.environment ?? '',
    interface: p.interface ?? '',
    coordinates: p.coordinates.map((c) => ({ ...c })),
  }))
}

/** Editable drafts → API input, trimming and dropping empty coordinates and empty profiles. */
export function toInput(drafts: ProfileDraft[]): ResourceConnectionProfileInput[] {
  return drafts
    .map((p) => ({
      environment: p.environment.trim() || undefined,
      interface: p.interface.trim() || undefined,
      coordinates: p.coordinates
        .map((c) => ({ key: c.key.trim(), value: c.value.trim() }))
        .filter((c) => c.key && c.value),
    }))
    .filter((p) => p.environment || p.interface || (p.coordinates && p.coordinates.length > 0))
}
