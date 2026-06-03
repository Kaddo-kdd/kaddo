---
title: Commands overview
description: The Kaddo CLI surface.
---

Commands in workflow order:

| Command | What it does |
|---|---|
| `kaddo init` | Initialize Kaddo in the current project |
| `kaddo bootstrap` | Build the initial knowledge base for a new project (Business → Architecture → Codebase → Development) |
| `kaddo scan` | Detect project stack and suggest domains |
| `kaddo context` | Generate an LLM context pack for agent handoff |
| `kaddo add agents` | Install agent prompt packs for your LLM chat |
| `kaddo understand` | Guide the CLI → LLM handoff with a state-aware agent plan |
| `kaddo create <type>` / `--from roadmap` | Create a Work Item (feature, bugfix, hotfix, spike) |
| `kaddo owners suggest` | Assistant to declare `code:` ownership on artifacts |
| `kaddo guard` | Check if modified code has related artifacts that were not updated |
| `kaddo explain` | Summarize what Kaddo currently knows about the project |

Supporting commands:

| Command | What it does |
|---|---|
| `kaddo status` | Show the current state of the Knowledge Repository |
| `kaddo learn` | Close a Work Item and record what was learned |
| `kaddo classify` | Detect classification drift in the diff |
| `kaddo history` | List Work Items with filters |
| `kaddo owners` | List domain owners |
| `kaddo module` | Show or init the multirepo module descriptor |
| `kaddo add <module>` | Install an optional module |
