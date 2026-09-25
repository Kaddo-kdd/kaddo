---
type: skill
id: graph-metadata-review
name: graph-metadata-review
title: Graph Metadata Review Skill
version: 3.89.0
group: tech
applies_to:
  - graph-agent
  - ownership-agent
  - work-item-agent
---
# Graph Metadata Review Skill

## Purpose

Standardize how `kaddo graph export` hints become precise relationship front matter.

## When to use

When relationship quality is partial/sparse/empty, or when reviewing `.kaddo/graph-hints.md`.

## Inputs

The context pack, `.kaddo/graph.json` and `.kaddo/graph-hints.md`, plus the affected artifacts.

## Output

Front matter proposals, e.g.

```yaml
capabilities:
  - local-persistence
decisions:
  - ADR-0001
code:
  - src/database/**
capsules:
  - orders-service
```

## Rules

- Never invent relationships, paths or IDs.
- Do not try to resolve every hint at once — propose what is justified.
- Do not modify artifacts; the human applies and re-runs `kaddo graph export`.

## Quality checklist

- Each proposal maps to a real artifact/path/capability/ADR/capsule.
- Globs are narrow; uncertainty is marked.

## Example output

The YAML proposal above, grouped per artifact, with a short reason each.
