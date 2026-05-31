# Tasks: Scan Baseline Artifact

## Implementation Tasks

- [x] Review current `kaddo scan` and `ScanResult` shape.
- [x] Add deterministic test-directory detection to `scanner.ts`.
- [x] Define a stable `ScanBaseline` JSON structure (`core/scan-baseline.ts`).
- [x] Read project context (state/structure/teamSize) from `.kaddo/config.yml`.
- [x] Implement `buildBaseline(result, context)` and `serializeBaseline()`.
- [x] Implement markdown renderer (`templates/inventory-template.ts`).
- [x] Wire both artifacts into `runScan`.
- [x] Create required folders safely; guard markdown overwrite.
- [x] Keep existing scan behavior intact; no LLM; no capability inference.

## Tests

- [x] Test `.kaddo/scan.json` baseline shape (full project).
- [x] Test minimal/empty project baseline (unknown/empty values).
- [x] Test markdown renderer output.
- [x] Ensure existing scanner tests still pass.

## Documentation

- [x] Update `kaddo scan` docs (README + docs site) with generated artifacts and example.
- [x] Clarify scan output vs project understanding (scan prepares input for agents).

## Validation

- [x] Run test suite (`pnpm test`).
- [x] Run build (`pnpm -r build`).
- [ ] Manually verify `kaddo scan` in a sample project.
