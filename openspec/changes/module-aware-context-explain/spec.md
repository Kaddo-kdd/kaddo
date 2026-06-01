# Spec: Module-aware Context and Explain

## User Story

As a Kaddo user working in a multirepo system, I want context packs and project
explanations to include mapped modules, so humans and LLM agents can understand the
project as a system of repositories/modules.

## Expected Behavior

Given `.kaddo/modules.yml` and `architecture/modules/<id>/`, `kaddo context` includes
mapped modules in `.kaddo/context-pack.md` and `.kaddo/context-pack.json`, and
`kaddo explain` includes them in `.kaddo/explain.md` and `.kaddo/explain.json`.

## Acceptance Criteria

- **AC1** — Mapped modules are loaded from `.kaddo/modules.yml`.
- **AC2** — `.kaddo/context-pack.md` includes a `Mapped Modules` section when modules exist.
- **AC3** — `.kaddo/context-pack.json` includes a `mappedModules` field.
- **AC4** — `kaddo explain` / `.kaddo/explain.md` includes a mapped modules summary.
- **AC5** — `kaddo explain --for agent` / `.kaddo/explain.json` includes a `mapped_modules` field.
- **AC6** — Artifact coverage is reported per module (module-design, stack, security,
  standards, diagrams, adrs).
- **AC7** — Installed add-ons (`installed_modules`) stay separate from `mapped_modules`.
- **AC8** — Missing module artifacts are reported as missing, not as errors.
- **AC9** — No secondary repo source code is read.
- **AC10** — The CLI does not call an LLM.
- **AC11** — Tests cover context, explain and empty/missing module cases.
- **AC12** — Docs explain that context/explain are module-aware via `.kaddo/modules.yml`
  but do not scan secondary repos.

## Edge Cases

- No `.kaddo/modules.yml` → context and explain still work (`Mapped modules: 0`).
- Empty / invalid `.kaddo/modules.yml` → empty state, no crash.
- Module path does not exist → module still shown (registered).
- Module artifact missing → shown as missing in coverage.

## Example Agent JSON

```json
{
  "mapped_modules": [
    {
      "id": "storefront-web",
      "name": "Storefront Web",
      "type": "frontend",
      "repoPath": "../frontend",
      "owner": "web-team",
      "capabilities": ["checkout"],
      "code": ["../frontend/**"],
      "artifacts": {
        "moduleDesign": true, "stack": true, "security": true,
        "standards": true, "diagrams": true, "adrs": true
      }
    }
  ]
}
```

## Validation

```bash
pnpm --filter "@trycatch.tv/kaddo" test
pnpm -r build
```
