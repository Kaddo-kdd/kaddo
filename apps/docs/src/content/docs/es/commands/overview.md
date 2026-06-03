---
title: Resumen de comandos
description: La superficie de la CLI de Kaddo.
---

Comandos en orden del flujo de trabajo:

| Comando | Qué hace |
|---|---|
| `kaddo init` | Inicializa Kaddo en el proyecto actual |
| `kaddo bootstrap` | Construye la base de conocimiento inicial de un proyecto nuevo (Business → Architecture → Codebase → Development) |
| `kaddo scan` | Detecta el stack del proyecto y sugiere dominios |
| `kaddo context` | Genera un context pack para entregar a un agente LLM |
| `kaddo add agents` | Instala los agent prompt packs para tu chat LLM |
| `kaddo understand` | Guía el handoff CLI → LLM con un plan de agentes según el estado |
| `kaddo create <type>` / `--from roadmap` | Crea un Work Item (feature, bugfix, hotfix, spike) |
| `kaddo owners suggest` | Asistente para declarar propiedad `code:` en artefactos |
| `kaddo guard` | Revisa si el código modificado tiene artefactos relacionados sin actualizar |
| `kaddo explain` | Resume lo que Kaddo sabe actualmente del proyecto |

Comandos de apoyo:

| Comando | Qué hace |
|---|---|
| `kaddo status` | Muestra el estado actual del Repositorio de Conocimiento |
| `kaddo learn` | Cierra un Work Item y registra lo aprendido |
| `kaddo classify` | Detecta deriva de clasificación en el diff |
| `kaddo history` | Lista Work Items con filtros |
| `kaddo owners` | Lista los dueños de dominio |
| `kaddo module` | Muestra o inicializa el descriptor de módulo multirepo |
| `kaddo add <module>` | Instala un módulo opcional |
