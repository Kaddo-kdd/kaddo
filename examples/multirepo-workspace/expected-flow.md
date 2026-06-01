# Expected flow — Commerce Stack (multirepo)

A walkthrough of how a team turns four separate repos into one shared knowledge
base with Kaddo. Commands are deterministic; the interpretation happens in your
LLM with the Kaddo agent prompts.

## 1. Initialize the architecture repo

```bash
cd architecture-repo
kaddo init        # structure: multirepo, state: existing
```

This repo holds no product code — only knowledge.

## 2. Map each code repo as a module

```bash
kaddo modules map
# Module name:        Storefront Web
# Repository path:    ../frontend
# Module type:        frontend
# Main technology:    Next.js
# Owner:              web-team
# Related capabilities: browse-catalog, checkout
```

Repeat for Orders API (`../backend`, backend), Fulfillment Worker (`../worker`,
worker), and Platform Infra (`../infra`, infrastructure).

Each `map` does two deterministic things:

1. Appends the module to `.kaddo/modules.yml`.
2. Scaffolds `architecture/modules/<id>/` with starter
   `module-design.md`, `stack.md`, `security.md`, `standards.md`
   plus empty `diagrams/` and `adrs/` folders.

Existing files are **never overwritten** — re-running `map` keeps your edits.

## 3. See the system

```bash
kaddo modules list
#   storefront-web     frontend       ../frontend
#   orders-api         backend        ../backend
#   fulfillment-worker worker         ../worker
#   platform-infra     infrastructure ../infra
```

## 4. Fill in each module's knowledge (LLM step)

Open the `module-design-agent` prompt in your LLM with `.kaddo/context-pack.md`
and the module's repo. The agent reads the code and fills in
`architecture/modules/storefront-web/module-design.md` and friends. In this
example those files are already filled in so you can see the target shape.

## 5. Cross-cutting decisions

System-wide choices (e.g. "all services emit OrderEvents to one bus") live in the
architecture repo as ADRs, not inside any single code repo. That is the whole
point of the architecture repo: it is the only place that sees the seams between
modules.

## What Kaddo does NOT do here

- It does not move or modify code in the four repos.
- It does not call an LLM — you run the agent prompts yourself.
- It does not enforce anything; `modules.yml` is a map, not a gate.
