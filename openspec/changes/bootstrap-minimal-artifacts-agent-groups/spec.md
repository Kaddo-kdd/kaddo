# Spec: Bootstrap Minimal Artifacts & Agent Groups

## User Story

As someone starting a new project, I want Kaddo to give me only the minimum sufficient
knowledge and the agents I actually need now, so the start feels light and depth appears as
the project matures.

## Acceptance Criteria

- **AC1** — Bootstrap generates exactly `knowledge/business/business.md`,
  `knowledge/product/product.md`, `knowledge/tech/codebase.md`.
- **AC2** — No specialized files are generated during bootstrap.
- **AC3** — Bootstrap templates are consolidated (single file per layer, sections inside).
- **AC4** — Agents are grouped by layer (Business / Product / Tech / Delivery / Utilities).
- **AC5** — `kaddo add agents` installs by default only the agents recommended for the
  project's current state.
- **AC6** — `kaddo add agents --all` exists (installs every agent).
- **AC7** — `kaddo add agents --group <name>` exists.
- **AC8** — `kaddo understand` recommends contextual agents (state + layer + existing
  artifacts).
- **AC9** — Documentation EN/ES is updated.
- **AC10** — Examples are updated.
- **AC11** — Tests and build keep passing.
- **AC12** — Specialized templates remain in the registry (as advanced), not deleted.

## Edge Cases

- Existing `business.md`/`product.md`/`codebase.md` → skipped, not overwritten.
- `add agents` on a project with no/unknown state → fall back to a sensible default set.
- `--group` with an unknown name → clear error listing valid groups.
- `--all` and `--group` together → `--all` wins (or error); document the precedence.

## Example

```
$ kaddo add agents          # new project
Installed (recommended for state: new):
- business-agent, bootstrap-agent, codebase-agent, roadmap-agent, work-item-agent
Use `kaddo add agents --all` for the full set, or `--group <name>` for one layer.
```

## Validation

```bash
pnpm --filter "@kaddo/cli" test
pnpm -r build
```
