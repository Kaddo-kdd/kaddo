# Tasks: Align Module Generation with Template Registry

## Implementation

- [x] Create OpenSpec change.
- [x] Review current `modules-map.ts` inline templates.
- [x] Review template registry module templates.
- [x] Define module template rendering context.
- [x] Add a utility to render registry templates with module metadata.
- [x] Use `module-design` template for `module-design.md`.
- [x] Use `module-stack` template for `stack.md`.
- [x] Use `module-security` template for `security.md`.
- [x] Use `module-standards` template for `standards.md`.
- [x] Inject module id/name/repoPath/type/owner/capabilities into front matter.
- [x] Inject default `code: ["<repoPath>/**"]`.
- [x] Keep diagrams/adrs folder creation.
- [x] Preserve no-overwrite behavior.
- [x] Keep `.kaddo/modules.yml` schema and upsert behavior unchanged.
- [x] Ensure no LLM is called.

## Tests

- [x] Generated `module-design.md` / `stack.md` / `security.md` / `standards.md` start
      with front matter.
- [x] Generated files include `code: <repoPath>/**`.
- [x] Generated files include module metadata (id, repoPath).
- [x] Generated files include a quality checklist.
- [x] Existing files are skipped.
- [x] modules.yml upsert behavior still works.
- [x] diagrams/adrs directories are still created.
- [x] Registry template ids are used.
- [x] Existing tests remain green.

## Documentation

- [x] Update multirepo docs (template-based artifacts + Guard limitation note).
- [x] Maintain EN/ES parity.

## Validation

- [x] Run `pnpm --filter "@kaddo/cli" test`.
- [x] Run `pnpm -r build`.
