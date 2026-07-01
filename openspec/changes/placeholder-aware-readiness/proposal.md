# Proposal: Placeholder-Aware Readiness and Guidance (VS-073.1)

## Why

After VS-073, bootstrap creates the baseline correctly, but `context`/`explain`/`understand` treated
a file's *existence* as proof of maturity. A freshly bootstrapped project reported Business
Consolidated / Tech Structured and advanced to Delivery Preparation even though the files were still
template placeholders — recommending premature steps like `kaddo create --from roadmap` with 0
roadmap candidates. A file existing ≠ knowledge being ready.

## What

Add a deterministic, conservative artifact-quality classifier and wire it through readiness, layers,
phase detection and context:

- `core/artifact-quality.ts`: `analyzeKnowledgeArtifact` / `analyzeContent` → `missing` |
  `placeholder` | `weak` | `useful` (when in doubt, classify down). Detects bootstrap template prose
  (italic guidance, `[open]`/`[observed]` bullets, template stems); useful requires ≥80 real words,
  <25% placeholder ratio, and ≥2 sections with real content.
- Knowledge layers downgrade `Consolidated`/`Structured` → `Placeholder`/`Weak` when the layer's
  baseline files are still placeholders/weak (new `LayerMaturity` values).
- Phase detection: base knowledge that is placeholder/weak yields a new `Knowledge Refinement` phase
  (before Planning); a roadmap with no candidates and no Work Items stays `Planning` — `create
  --from roadmap` is never recommended with 0 candidates.
- Readiness (`explain`/`understand`): per-file quality signals; `knowledge-incomplete` recommends the
  specific agent for the first non-useful file (capability/architecture/codebase/business/product).
- `context-pack`: `knowledgeQuality` per layer/artifact in JSON; placeholder files surfaced in
  Missing Context; maturity line reflects the downgraded layers.
- Bootstrap templates carry `generated_by: kaddo-bootstrap` + `template_version` (a best-effort hint;
  detection never depends on it, since older files won't have it).

## Scope

Detection + wiring only. No auto-edit of knowledge, no LLM, no agents/scan/git execution, no command
blocking. Deterministic and explainable.

## Impact

- New `core/artifact-quality.ts`; `knowledge-discovery.ts` (maturity values); `layers.ts` (downgrade);
  `delivery-phase.ts` (Knowledge Refinement + candidate guard); `readiness.ts` (quality signals +
  agent recommendations); `context-pack.ts` (knowledgeQuality + Missing Context); `bootstrap-templates.ts`
  (metadata); `project-explain.ts` (render business/product/capabilities quality).
- Docs commands/explain.md (EN/ES) knowledge-quality note; README. Minor bump 3.37.0.
