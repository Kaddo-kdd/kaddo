# Spec: Align Module Generation with Template Registry

## User Story

As a Kaddo user working in a multirepo system, I want `kaddo modules map` to generate
module artifacts from official templates, so that module knowledge is consistent,
traceable and ready for future ownership workflows.

## Expected Behavior

Mapping a module (e.g. `storefront-web` → `../frontend`, type `frontend`, owner
`web-team`, capabilities `checkout, customer-portal`) generates:

```txt
architecture/modules/storefront-web/module-design.md
architecture/modules/storefront-web/stack.md
architecture/modules/storefront-web/security.md
architecture/modules/storefront-web/standards.md
architecture/modules/storefront-web/diagrams/.gitkeep
architecture/modules/storefront-web/adrs/.gitkeep
```

The generated markdown files use the centralized template registry and include front
matter.

## Acceptance Criteria

- **AC1** — Module artifacts are based on `module-design`, `module-stack`,
  `module-security`, `module-standards` registry templates.
- **AC2** — Each generated module `.md` starts with front matter.
- **AC3** — Front matter includes module id, repo path, status, module type (where
  relevant), owner (where relevant), capabilities (where relevant).
- **AC4** — Front matter includes `code:` with `<repoPath>/**`.
- **AC5** — Generated artifacts include a quality checklist from the template.
- **AC6** — No-overwrite behavior is preserved (existing files skipped).
- **AC7** — `.kaddo/modules.yml` still upserts modules by id.
- **AC8** — `diagrams/` and `adrs/` folders are still created.
- **AC9** — Guard behavior does not change (no cross-repo Guard).
- **AC10** — The CLI remains deterministic and does not call an LLM.
- **AC11** — Tests cover front matter, `code:` globs, template usage and no-overwrite.
- **AC12** — Docs clarify that generated `code:` globs are ownership metadata, but
  default Guard does not yet aggregate diffs from sibling repos.

## Example Output (`module-design.md`)

```md
---
type: module-design
module: storefront-web
name: Storefront Web
status: draft
owner: web-team
repoPath: ../frontend
moduleType: frontend
mainTechnology: Next.js
capabilities:
  - checkout
  - customer-portal
code:
  - ../frontend/**
---

# Storefront Web — Design
...
## Quality checklist

- [ ] Boundaries make clear what is in and out of the module.
- [ ] Dependencies on other modules are listed.
```

## Edge Cases

- Module path does not exist → existing non-fatal warning remains; artifacts still
  generated.
- No owner → `owner: unknown`.
- No capabilities → `capabilities: []`.
- Existing artifact → skipped and reported.
- Re-mapped module → `.kaddo/modules.yml` updated; existing artifacts not overwritten.

## Validation

```bash
pnpm --filter "@kaddo/cli" test
pnpm -r build
```
