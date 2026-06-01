# Design: Module-aware Context and Explain

## Technical approach

Add a shared reader `src/services/mapped-modules.ts`:

```ts
loadMappedModules(dir): MappedModuleWithCoverage[]   // [] when missing/empty/invalid
presentArtifacts(coverage): string[]                 // human-readable list
```

Both `core/context-pack.ts` and `core/project-explain.ts` consume it, keeping the reader
in `services/` (shared, no command↔core coupling).

## Module data source

`.kaddo/modules.yml` is the **single source of truth** — modules are never inferred from
folders. Folders under `architecture/modules/<id>/` only enrich artifact coverage.

## Types

```ts
type MappedModuleInfo = {
  id: string; name?: string; repoPath: string; type?: string; mainTechnology?: string
  owner?: string; capabilities: string[]; code: string[]; status?: string
}
type ModuleArtifactCoverage = {
  moduleDesign: boolean; stack: boolean; security: boolean
  standards: boolean; diagrams: boolean; adrs: boolean
}
type MappedModuleWithCoverage = MappedModuleInfo & { artifacts: ModuleArtifactCoverage }
```

Coverage is computed with `exists()` on `module-design.md`, `stack.md`, `security.md`,
`standards.md`, `diagrams/`, `adrs/`. No secondary repo source is read.

## Context pack changes

- `ContextPack` gains `mappedModules: MappedModuleWithCoverage[]`.
- `buildContextPack` calls `loadMappedModules(dir)`.
- The markdown template renders a `## Mapped Modules` table **only when modules exist**,
  with a "does not scan secondary repositories" note.
- `context-pack.json` carries `mappedModules` automatically (whole-pack serialization).

## Explain changes

- `ProjectExplanation` gains `mappedModules`.
- Human render adds `## Mapped Modules` (or `Mapped modules: 0`) and, when present, a
  `## Module Artifact Coverage` section.
- Agent render (`renderExplanationAgent`, source of `explain.json`) emits the modules
  under the snake_case key **`mapped_modules`** (and omits the internal `mappedModules`
  camel key) so agents see a stable, distinct field.
- The filtered `explain --scope/--type` agent path also adds `mapped_modules` next to the
  existing `installed_modules`.

## Mapped vs installed — naming rule

- **installed_modules** = Kaddo add-ons installed with `kaddo add`.
- **mapped_modules** = repos/components registered with `kaddo modules map`.

These must never be merged.

## Edge cases

- No `.kaddo/modules.yml` → `[]`; context omits the section; explain shows `Mapped
  modules: 0`.
- Empty/invalid descriptor → `[]` (never throws).
- Module path does not exist → still listed (it is registered).
- Missing module artifact → reported as missing in coverage; no failure.

## Alternatives considered

- **Infer modules from folders** — rejected (folders may exist without a mapping).
- **Scan secondary repos during context** — rejected (changes deterministic scope, cost).
- **Merge installed and mapped modules** — rejected (different concepts).
