# Spec: Workspace Guard for Multirepo

## User Story

As a Kaddo user in a multirepo workspace, I want Guard to optionally check local mapped
module repositories, so I can detect possible knowledge drift when code changes happen
outside the architecture repo.

## Expected Behavior

Given a workspace with `architecture-repo/` and a sibling `../frontend`, `.kaddo/modules.yml`
registering `storefront-web → ../frontend`, and a module artifact declaring
`code: ["../frontend/**"]`, when `../frontend/src/checkout/checkout.ts` changes, then
`kaddo guard --workspace` shows a non-blocking FYI if the artifact was not updated.

## Acceptance Criteria

- **AC1** — `kaddo guard --workspace` exists.
- **AC2** — `kaddo guard` (no flag) does not inspect mapped module repo paths.
- **AC3** — Workspace guard reads `.kaddo/modules.yml`.
- **AC4** — For each valid local module repo, changed file paths are collected via Git.
- **AC5** — Changed module files are normalized to match globs like `../frontend/**`.
- **AC6** — A normalized changed path matching an artifact `code:` glob, with the artifact
  not updated, yields a non-blocking FYI.
- **AC7** — If the related artifact also changed in the architecture repo, no warning.
- **AC8** — Missing/invalid/failed module repos are skipped with warnings, never fatal.
- **AC9** — `kaddo guard --workspace --ci` includes workspace metadata.
- **AC10** — No remote Git APIs are called.
- **AC11** — Changed file *paths* are read, not source contents.
- **AC12** — No LLM is called.
- **AC13** — Tests cover detection, suppression, skipped modules, JSON output and path
  normalization.

## Edge Cases

- No `.kaddo/modules.yml` → workspace runs current-repo guard only (no modules found).
- Empty modules list → same.
- Module path missing → skipped (`path does not exist`).
- Module path not Git → skipped (`not a git repository`).
- Git diff fails → skipped (`git diff failed`).
- Windows paths → normalized to `/`.
- Multiple modules match → all matched artifacts reported.

## Example JSON (`--workspace --ci`)

```json
{
  "kaddo_guard": true,
  "ci": true,
  "findings": [
    {
      "artifact_id": "architecture/modules/storefront-web/module-design.md",
      "matched_files": ["../frontend/src/checkout/checkout.ts"],
      "ownership": ["../frontend/**"]
    }
  ],
  "workspace": {
    "enabled": true,
    "modulesChecked": 1,
    "modulesSkipped": 0,
    "skippedModules": []
  }
}
```

## Validation

```bash
pnpm --filter "@kaddo/cli" test
pnpm -r build
```
