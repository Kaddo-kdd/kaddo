---
title: Contributing
description: Kaddo contributions follow its own Knowledge-Driven Development model — One Work Item → One Branch → One Pull Request. Knowledge and intent come before implementation, and code is reviewed against an explicit Work Item.
---

Kaddo is built with its own Knowledge-Driven Development model, and contributions follow the same
idea: **knowledge and intent come before implementation, and code is reviewed against an explicit
Work Item.**

![Kaddo contribution cycle: Knowledge → Work Item → Branch → Implement → Verify → Pull Request → Review → Merge](/contribution-cycle.webp)

> **One Work Item → One Branch → One Pull Request.**

A contribution should represent a single coherent outcome. This does not mean "small PR" — a K3/K4
Work Item can justify a large PR. It means a PR should not bundle independent outcomes. If work you
discover mid-implementation falls outside the current Work Item's scope, open a **separate** Work
Item, branch and PR instead of growing the contribution silently.

## The flow

1. **Start from the latest `main`.**
2. **Understand the relevant knowledge first** — use Kaddo's own knowledge (business, product, tech,
   architecture, capabilities, initiatives, roadmap, completed Work Items and learnings) via the CLI,
   the MCP server, Kaddo agents, or your preferred LLM. You don't need to read the whole repo by hand.
3. **Define or select one Work Item** — proportional to the change.
   - *Planned work:* reference an existing canonical `WI-xxx` (from an Initiative) — don't duplicate it.
   - *New / external contributions:* include the Work Item **definition in the PR** instead of
     creating a `WI-xxx` in your fork. A maintainer decides later whether to materialize it into
     Kaddo's canonical traceability. An Initiative is **not** required.
4. **Discuss first** for changes that need it (new commands/flags, front-matter schema, Knowledge
   Level or Guard behavior).
5. **Create one dedicated branch** per Work Item (`feat/…`, `fix/…`, `docs/…`).
6. **Implement**, then **validate / verify** against the acceptance criteria (`kaddo verify <WI-ID>`
   for canonical Work Items).
7. **Open one Pull Request** using the PR template — reference the canonical Work Item or embed the
   definition you used, with validation/evidence and any knowledge impact.

**Review is against intent, not just the diff.** Reviewers check whether the implementation satisfies
the Work Item — intent, scope, acceptance criteria and validation — without undeclared scope.

## Full guide

This page is an overview. The complete, canonical contribution guide — setup, project structure,
tests, the Build Contract lifecycle, commit style, the Pull Request template and the release
process — lives in the repository:

- **[CONTRIBUTING.md on GitHub](https://github.com/Kaddo-kdd/kaddo/blob/main/CONTRIBUTING.md)**
- **[Pull Request template](https://github.com/Kaddo-kdd/kaddo/blob/main/.github/PULL_REQUEST_TEMPLATE.md)**

For the lifecycle details behind step 3–7, see the [Workflow](/workflow/) and
[Work Item Traceability](/playbook/work-item-traceability/) pages.
