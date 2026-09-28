---
type: dogfooding
id: friction-log
title: Kaddo Dogfooding Friction Log
version: 3.95.0
spec: VS-112
---

# Friction Log

Registro compacto de fricciones encontradas durante la ventana de dogfooding VS-112.

## Entries

- work_item: WI-006
  stage: verification
  friction: >
    `kaddo verify` reports BLOCKED because affected_modules: [cli] is not registered in
    .kaddo/modules.yml. Cross-repo evidence treats unregistered modules as blocking findings.
    Also, the verify command defaults repoId to "core" when no modules are mapped, creating a
    planned-vs-actual mismatch even though the actual changed files are correct.
  severity: significant
  workaround: >
    Proceed with manual verification. The underlying evidence (changed paths, test results)
    is correct. The blocking finding is a false positive from the absence of modules.yml.
    WI-008 will install modules and fix this for subsequent WIs.
  category: verification
  action: evaluate-after-dogfooding

- work_item: WI-006
  stage: evidence
  friction: >
    AC status requires manual input — the verify command collects git evidence automatically
    but cannot auto-determine whether individual acceptance criteria passed from test output.
    All ACs show "not-verified" even when tests pass.
  severity: minor
  workaround: >
    Accept as designed — AC verification is intentionally agent-assisted, not fully automated.
    The agent or human reviews evidence and provides AC status.
  category: evidence
  action: evaluate-after-dogfooding

- work_item: WI-008
  stage: implementation
  friction: >
    Updating `.kaddo/config.yml` project state from `pre-ai` to `ai-assisted` was a derived
    change not captured in the original ACs. The inconsistency between config.yml and
    current-state.md was discovered during implementation and resolved as a minor scope
    deviation.
  severity: minor
  workaround: >
    Add the change and document as scope deviation. The ACs should have included a
    "config.yml consistency" criterion, but the fix was trivially correct.
  category: scope
  action: evaluate-after-dogfooding
