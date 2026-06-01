# Spec: Documentation Diagrams & Visual Understanding

## User Story

As a Kaddo user, I want visual diagrams of the Kaddo workflow, so I can understand the
CLI/LLM split, artifact flow, Guard, multirepo and project states quickly.

## Expected Behavior

The documentation site includes a Visual Guide page with Mermaid diagrams (EN/ES).

## Acceptance Criteria

- **AC1 — Visual Guide exists**: Docs include a Visual Guide page in English and Spanish.
- **AC2 — Knowledge Loop diagram**: shows `init → scan → context → understand → agents → roadmap → create → ownership → guard → explain`.
- **AC3 — CLI vs LLM diagram**: clearly separates deterministic CLI from interpretive LLM agents.
- **AC4 — Sequence diagram**: shows human ↔ CLI ↔ knowledge repo ↔ LLM chat.
- **AC5 — Artifact graph**: shows dependencies from config to explain.
- **AC6 — Project states diagram**: shows new, pre-AI and legacy flows.
- **AC7 — Multirepo diagram**: shows architecture repo and mapped modules.
- **AC8 — Guard Lite diagram**: shows git diff + code globs + non-blocking FYI.
- **AC9 — Governance diagram**: shows governance levels by team size.
- **AC10 — Mindmap**: high-level Kaddo mindmap.
- **AC11 — Linked**: README and docs homepage link to the Visual Guide; it appears in the sidebar.
- **AC12 — No overpromise**: diagrams do not imply Kaddo calls LLMs, Guard blocks by default, ownership is inferred, Kaddo scans remote repos, or diagrams are auto-generated.
- **AC13 — Build passes**: `pnpm --filter docs build` succeeds and diagrams render.

## Validation

```bash
pnpm --filter docs build
```

Confirm Mermaid diagrams render and the page appears in EN and ES navigation.
