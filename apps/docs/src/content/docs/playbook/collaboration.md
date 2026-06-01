---
title: Collaboration Guide
description: How a team operates Kaddo without bureaucracy — governance by exception, role expectations, Guard as a review signal and a lightweight PR checklist.
---

Kaddo is designed to keep knowledge alive **without** turning development into paperwork. The
guiding principle is **governance by exception**: capture the minimum knowledge required, and
add rigor only where drift actually matters.

This works for a solo developer and for a larger team. Scale the practices to your context —
an indie project may skip most of the roles below.

## Suggested collaboration model

| Role | Responsibility |
|---|---|
| **Developer** | Creates or updates the Work Item alongside the code change. |
| **Tech Lead** | Reviews high-risk knowledge by exception, not every change. |
| **Architect** | Reviews ADR / architecture changes. |
| **Product Owner** | Validates capabilities and roadmap assumptions. |
| **Whole team** | Treats Guard warnings as review signals, not blockers. |

On a solo or indie project, one person plays all roles — the value is the same: a repo that
remembers why the code exists.

## Rules

- Do not document everything.
- Capture the **minimum knowledge required** for the Work Item's Knowledge Level.
- Use Knowledge Levels to avoid bureaucracy.
- Declare ownership only where drift matters.
- Treat Guard warnings as **review prompts**, not failures.
- Use PR review to validate knowledge, not to punish missing docs.
- Never accept LLM output without human review.

## Handling Guard warnings

`kaddo guard` is intentionally **non-blocking**. A warning means: "changed code matches an
artifact that was not updated — is that intentional?" Two valid answers:

1. **Update the artifact** — the knowledge genuinely changed.
2. **Leave it intentionally** — the change does not affect the knowledge; note it in the PR.

Guard never fails the build by itself. It surfaces a question for a human to answer.

## Suggested PR checklist

```txt
- Does this change have the right Work Item?
- Does the Work Item have enough context for its Knowledge Level?
- If code ownership exists, was the artifact updated or intentionally left unchanged?
- Did Guard produce warnings?
- Are assumptions documented?
- Is there learning to preserve?
```

---

Back to [Concepts](/playbook/concepts/) or jump to the
[Prompt Workflow](/playbook/prompt-workflow/).
