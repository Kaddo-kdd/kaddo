# Spec: New Project Flow Hardening & Agent Organization

## Acceptance Criteria

- **AC1** — Agents install into per-layer folders (`knowledge/agents/<group>/`).
- **AC2** — The recommended agents for `new` include `capability-agent` and
  `architecture-agent`.
- **AC3** — `explain` does not show ADRs as Work Items.
- **AC4** — `explain` ignores invalid Work Items (no valid type / not under
  `delivery/work-items/`).
- **AC5** — Docs clearly explain `scan`, `context`, `understand`, `explain`.
- **AC6** — Docs explain the ownership flow `scan → owners suggest → agent → human`
  (including multiple `code:` globs).
- **AC7** — Explicit documentation for `codebase.md`, `current-state.md`, ADR, `scan.json`
  (intent vs reality vs rationale vs signals).
- **AC8** — Examples reflect the corrected flow.
- **AC9** — Build and tests keep passing.

## Edge Cases

- Existing flat-installed agents → still detected (back-compat lookup during transition).
- `--all` / `--group` still work with folders.
- A `tech/decisions/ADR-0001.md` with `type: adr` → counted as a decision, never a Work Item.
- A markdown file in `delivery/work-items/` without front matter/type → not a Work Item.

## Validation

```bash
pnpm --filter "@kaddo/cli" test
pnpm -r build
```
