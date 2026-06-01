# Design: Align Module Generation with Template Registry

## Current behavior

`kaddo modules map` (`src/commands/modules-map.ts`):

1. asks for module metadata,
2. writes/updates `.kaddo/modules.yml` (upsert by id),
3. creates `architecture/modules/<id>/{module-design,stack,security,standards}.md` plus
   `diagrams/.gitkeep` and `adrs/.gitkeep`.

The `.md` files are generated from **inline strings** with no front matter and no `code:`.

## Target behavior

The command writes the same paths, but each `.md` is rendered from the template registry
(`src/templates/registry.ts`):

| Generated artifact | Template id |
|---|---|
| module-design.md | `module-design` |
| stack.md | `module-stack` |
| security.md | `module-security` |
| standards.md | `module-standards` |

`adrs/` and `diagrams/` keep their `.gitkeep` (no default ADR file in this VS).

## Rendering approach

Registry module templates already carry placeholder front matter + body + quality
checklist. The renderer:

1. gets the template by id from the registry,
2. **strips** the template's placeholder front matter block,
3. emits **generated** front matter from the module context,
4. keeps the template **body** (headings + `## Quality checklist`),
5. applies minimal interpolation on the body: replace `<Module>` with the module name and
   fill the descriptive `**Type/Repository/Main technology/Owner**` lines where present.

No templating engine is introduced — string operations only, so the CLI stays
deterministic. The generated front matter (not the body) is the authoritative metadata.

## Module template context

```ts
type ModuleTemplateContext = {
  id: string
  name: string
  repoPath: string
  type: string
  mainTechnology: string
  owner: string
  capabilities: string[]
  code: string[]        // ["<repoPath>/**"]
  status: 'draft'
}
```

## Front matter shapes

`module-design.md`:

```yaml
type: module-design
module: <id>
name: <name>
status: draft
owner: <owner-or-unknown>
repoPath: <repoPath>
moduleType: <type>
mainTechnology: <tech-or-unknown>
capabilities:
  - <capability>     # or `capabilities: []`
code:
  - <repoPath>/**
```

`module-stack.md`: `type: module-stack`, `module`, `status`, `repoPath`,
`mainTechnology`, `code`.
`module-security.md`: `type: module-security`, `module`, `status`, `repoPath`, `owner`,
`code`.
`module-standards.md`: `type: module-standards`, `module`, `status`, `repoPath`, `code`.

## `code:` glob

Default `code: ["<repoPath>/**"]` (reusing `MappedModule.code`). This declares ownership
consistently; **it does not** mean Guard detects cross-repo drift yet — default Guard
still only reads the current repo's `git diff`. Workspace-level Guard is a future VS.

## No-overwrite behavior

Unchanged: if a target file exists, skip it (reported as `skipped`); otherwise write.
Re-mapping an existing module still upserts `.kaddo/modules.yml` but never overwrites
existing artifacts. No migration of existing artifacts (`kaddo modules upgrade` is out of
scope).

## Tests

Assert generated artifacts: start with front matter; contain `code: <repoPath>/**`;
include module id and repoPath; include a quality checklist; existing files skipped;
modules.yml still upserts by id; diagrams/adrs dirs still created.

## Alternatives considered

- **Keep inline templates** — rejected (causes drift from official templates).
- **Migrate existing artifacts** — rejected for this VS (risks overwriting user work).
- **Make Guard read modules.yml** — rejected (changes Guard; separate slice).
- **Deep multirepo scan** — rejected (Kaddo must not scan all repos automatically).
