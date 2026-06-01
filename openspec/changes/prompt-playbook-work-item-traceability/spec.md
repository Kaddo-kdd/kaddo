# Spec: Prompt Playbook & Work Item Traceability Guide

## User Story

As a Kaddo user, I want a playbook that explains concepts, prompts, traceability and
collaboration, so that I can use Kaddo consistently with my team and my preferred LLM tools.

## Expected Behavior

The documentation includes a playbook with: Kaddo concepts, prompt workflow, Work Item
traceability, examples with other tools, and a collaboration guide.

## Acceptance Criteria

### AC1 — Concepts page exists

The docs define: Work Item, Knowledge Level, Context Pack, Agent Prompt Pack, Ownership,
Knowledge Drift, Guard Lite, Explain.

### AC2 — Work Item is clearly defined

The docs explain that a Work Item is not just a task. It is the smallest traceable unit of
product evolution in Kaddo and may represent features, hotfixes, spikes, migrations,
incidents, architecture changes or knowledge updates.

### AC3 — Prompt Workflow page exists

The docs include a workflow table mapping CLI input, LLM prompt/agent, expected output and
target artifact.

### AC4 — Prompt examples exist

The playbook includes examples of prompts or agent usage for: capability-agent,
architecture-agent, roadmap-agent, legacy-agent, adr-agent.

### AC5 — Work Item Traceability page exists

The docs explain `roadmap → candidate work item → Kaddo work item → ownership → guard →
learning`.

### AC6 — Examples with other tools exist

The docs explain how Kaddo can be used alongside GitHub Issues, Jira/Linear, OpenSpec,
BMAD/Gentle-AI and Cursor/Claude/ChatGPT/Windsurf, clarifying these are usage patterns
unless official integrations exist.

### AC7 — Collaboration Guide exists

The docs explain lightweight collaboration practices including governance by exception, PR
review, role expectations, how to handle Guard warnings and how to avoid documentation
bureaucracy.

### AC8 — README links to Playbook

The README includes links to the playbook pages.

### AC9 — EN/ES parity

All pages exist in both English and Spanish.

### AC10 — No overpromise

The docs do not claim Kaddo calls LLMs, replaces human review, integrates officially with
tools unless implemented, or automatically understands business truth.

## Validation

Run `pnpm -r build`. Confirm docs build successfully and sidebar links work.
