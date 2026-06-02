# Tasks: Module-aware Context and Explain

## Implementation

- [x] Create OpenSpec change.
- [x] Add a mapped-module reader (`src/services/mapped-modules.ts`) with safe loading.
- [x] Add per-module artifact coverage helper.
- [x] Add `mappedModules` to the context pack (build + type).
- [x] Render a `## Mapped Modules` section in the context markdown.
- [x] Serialize `mappedModules` in `context-pack.json`.
- [x] Add `mappedModules` to the project explanation (build + type).
- [x] Render mapped modules + artifact coverage in the human explanation.
- [x] Emit `mapped_modules` in the agent explanation JSON.
- [x] Add `mapped_modules` to the filtered `explain --scope/--type` agent path.
- [x] Keep installed add-on modules separate from mapped modules.
- [x] Avoid reading secondary repo source code.
- [x] Ensure no LLM is called.

## Tests

- [x] No `.kaddo/modules.yml` (empty state) for context and explain.
- [x] Context markdown includes mapped modules.
- [x] Context JSON includes `mappedModules`.
- [x] Explain human includes mapped modules + coverage.
- [x] Explain agent JSON includes `mapped_modules` (not `mappedModules`).
- [x] Artifact coverage detects present/missing artifacts.
- [x] Installed modules remain separate from mapped modules.
- [x] Existing tests remain green.

## Documentation

- [x] Update `context` command docs (EN/ES).
- [x] Update `explain` command docs (EN/ES).
- [x] Update multirepo docs note (EN/ES).
- [x] Note: no secondary repo scanning; mapped vs installed modules.

## Validation

- [x] Run `pnpm --filter "@kaddo/cli" test`.
- [x] Run `pnpm -r build`.
