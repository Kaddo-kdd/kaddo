# Design: Scan Baseline Artifact

## Technical Approach

The existing `scanner.ts` remains responsible for deterministic project detection. A new
baseline layer transforms its result (plus project context read from config) into two
serialized artifacts.

```txt
scanner.ts            → detects project signals (ScanResult)
core/scan-baseline.ts → normalizes ScanResult + project context into a ScanBaseline,
                        serializes JSON
templates/inventory-template.ts → renders the human-readable markdown
commands/scan.ts      → orchestrates: scan → build baseline → write files
```

## Affected Areas

```txt
src/services/scanner.ts             # add deterministic test-dir detection
src/core/scan-baseline.ts           # NEW — baseline model + JSON serializer + project context reader
src/templates/inventory-template.ts # NEW — markdown renderer
src/commands/scan.ts                # wire baseline generation into runScan
tests/scan-baseline.test.ts         # NEW — unit tests for pure builder/renderer
```

## Data Model / Types

`.kaddo/scan.json`:

```json
{
  "version": "1",
  "generatedAt": "ISO_DATE",
  "project": {
    "state": "new | pre-ai | legacy | unknown",
    "structure": "monorepo | multirepo | unknown",
    "teamSize": "indie | small | medium | enterprise | unknown"
  },
  "detected": {
    "languages": [],
    "frameworks": [],
    "packageManagers": [],
    "sourceDirectories": [],
    "migrationDirectories": [],
    "contractFiles": [],
    "infrastructureFiles": [],
    "testDirectories": []
  },
  "suggestions": {
    "possibleDomains": [],
    "openQuestions": []
  }
}
```

The scanner returns single `language`/`framework`/`packageManager`; the baseline wraps
them into arrays and drops `unknown`/`none`. `project.*` is read from `.kaddo/config.yml`
(written by `kaddo init`), defaulting to `unknown`.

`architecture/inventory.md` sections: Project Context · Detected Stack · Source
Directories · Dependencies (omitted in v1 — kept deterministic/minimal) · Migrations ·
Contracts · Infrastructure · Tests · Possible Domains · Open Questions.

## CLI Behavior

`kaddo scan` keeps its current output and config-save prompt, and additionally:

1. Writes `.kaddo/scan.json` (always — machine-generated).
2. Writes `architecture/inventory.md` (guarded overwrite if it already exists).
3. Creates `.kaddo/` and `architecture/` if missing.

## Alternatives Considered

- **Only update `.kaddo/config.yml`** — rejected: config is not a good artifact for human or agent understanding.
- **Only markdown** — rejected: future CLI commands need structured data.
- **Only JSON** — rejected: humans and LLM chats benefit from readable markdown.

## Trade-offs

Two files introduce mild duplication, but each serves a distinct purpose: JSON for tools,
markdown for humans and LLM handoff.

## Risks

- Inventory may become stale → it is regenerated on each scan; markdown overwrite is guarded.
- Scan output may become noisy → only deterministic signals, no speculative inference.
- `openQuestions` could overpromise → phrased strictly as confirmation prompts, never as truth.
