# Design: Documentation Diagrams & Visual Understanding

## Documentation strategy

A single dedicated **Visual Guide** page collects all diagrams with short captions, so a
first-time user can scan the whole mental model in one place. Paths (EN at docs root, ES
under `es/`, matching the repo convention):

```txt
apps/docs/src/content/docs/visual-guide.md
apps/docs/src/content/docs/es/visual-guide.md
```

It is added to the "Start here" sidebar group (right after Workflow) so it is discovered
early. The page is linked from the docs homepage and README.

> Decision: one page (not per-diagram pages). The diagrams are short and benefit from
> being read together as a single map. Embedding copies into other pages is deferred —
> it duplicates content that drifts. Instead other pages link to the Visual Guide.

## Rendering

The docs site already renders Mermaid client-side via `astro-mermaid` (```mermaid fenced
blocks). VS-021 also added click-to-zoom, which makes a dense single page acceptable: any
diagram can be opened full-screen. No new tooling is required.

## Diagrams included

1. **Kaddo Knowledge Loop** — `flowchart TD`, full implemented loop init→explain.
2. **CLI vs LLM** — `flowchart LR` with `subgraph CLI` / `subgraph LLM` / `subgraph Repo`.
3. **Human / CLI / LLM sequence** — `sequenceDiagram` showing operational handoff.
4. **Artifact graph** — `flowchart LR`, config.yml → … → explain.md dependencies.
5. **Project states** — `flowchart TD`, new / pre-AI / legacy agent paths.
6. **Multirepo map** — `flowchart TD`, architecture repo + mapped modules.
7. **Guard Lite** — `flowchart TD`, git diff + code globs + non-blocking FYI.
8. **Governance levels** — `flowchart TD`, by team size.
9. **Mindmap** — `mindmap`, high-level CLI / agents / artifacts / templates / principles.

## Style guidelines

- Distinguish CLI (deterministic) from LLM (interpretation) visually.
- Show artifacts on nodes/edges when it adds clarity.
- Use implemented commands and agents only; no invented capabilities.
- Keep labels short; avoid overly dense diagrams.
- Each diagram has a one-line purpose caption above it.

## EN/ES parity

Diagram bodies are identical (command/agent names are language-neutral); only the
captions and surrounding prose are translated.

## Overpromise guardrails

A "What the diagrams do NOT mean" note states: Kaddo does not call LLMs, Guard never
blocks by default, ownership is never inferred, Kaddo does not scan remote repos, and
diagrams are not generated automatically.
