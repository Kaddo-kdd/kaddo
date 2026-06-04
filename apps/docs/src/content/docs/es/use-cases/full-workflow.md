---
title: Flujo completo
description: El loop completo de Kaddo de principio a fin, con el artefacto que produce cada paso.
---

Este es el loop completo de Kaddo como una narrativa. Cada paso muestra el comando, qué aporta
y el artefacto que produce.

| # | Paso | Comando | Produce |
|---|---|---|---|
| 1 | Inicializar | `kaddo init` | `.kaddo/config.yml` |
| 2 | Escanear | `kaddo scan` | `.kaddo/scan.json`, `knowledge/inventory.md` |
| 3 | Context pack | `kaddo context` | `.kaddo/context-pack.md` |
| 4 | Instalar agentes | `kaddo add agents` | `knowledge/agents/*.md` |
| 5 | Understand | `kaddo understand` | `.kaddo/understand.md` |
| 6 | Entender en el LLM | *(tu chat)* | `knowledge/product/capabilities.md`, `knowledge/tech/current-state.md`, `knowledge/delivery/roadmap.md` |
| 7 | Crear desde roadmap | `kaddo create --from roadmap` | `knowledge/delivery/work-items/*.md` |
| 8 | Declarar ownership | `kaddo owners suggest` | front matter `code:` actualizado |
| 9 | Guard | `kaddo guard` | FYI de deriva sobre el `git diff` |
| 10 | Explain | `kaddo explain` | `.kaddo/explain.md`, `.kaddo/explain.json` |

## El loop en detalle

```mermaid
flowchart TD
    A[Petición / Necesidad] --> B[Discovery inicial]

    B --> B1[Stakeholders explican contexto]
    B --> B2[CLI aporta señales existentes]
    B2 --> B3[kaddo scan]
    B3 --> B4[Inventario técnico<br/>.kaddo/scan.json<br/>knowledge/inventory.md]

    B1 --> C[Context Pack]
    B4 --> C
    C --> C1[kaddo context<br/>.kaddo/context-pack.md]

    C1 --> D[Entendimiento con LLM + Agentes]
    D --> D1[Capability Agent]
    D --> D2[Architecture Agent]
    D --> D3[Legacy Agent si aplica]
    D --> D4[ADR Agent si aplica]

    D1 --> E1[knowledge/product/capabilities.md]
    D2 --> E2[knowledge/tech/current-state.md]
    D3 --> E3[knowledge/legacy/risks.md<br/>unknowns.md<br/>modernization-candidates.md]
    D4 --> E4[knowledge/tech/decision-candidates.md]

    E1 --> F[Priorización]
    E2 --> F
    E3 --> F
    E4 --> F

    F --> F1[Roadmap Agent]
    F1 --> F2[knowledge/delivery/roadmap.md]
    F2 --> F3[Roadmap initiatives<br/>RM-001, RM-002...]
    F3 --> F4[Candidate Work Items<br/>WI-CANDIDATE-001...]

    F4 --> G[Clasificación]
    G --> G1{Tipo de cambio}

    G1 -->|Feature| H1[K2]
    G1 -->|Bugfix| H2[K2]
    G1 -->|Hotfix| H3[K1]
    G1 -->|Spike| H4[K2/K3]
    G1 -->|Architecture Change| H5[K4]
    G1 -->|Migration| H6[K4]
    G1 -->|Incident follow-up| H7[K2/K3]

    H1 --> I[Crear Work Item]
    H2 --> I
    H3 --> I
    H4 --> I
    H5 --> I
    H6 --> I
    H7 --> I

    I --> I1[kaddo create --from roadmap]
    I1 --> I2[knowledge/delivery/work-items/WI-*.md]

    I2 --> J[Captura de conocimiento mínimo suficiente]
    J --> J1[Problema]
    J --> J2[Resultado esperado]
    J --> J3[Impacto]
    J --> J4[Criterios de aceptación]
    J --> J5[Diseño / Riesgo si aplica]

    J --> K[Ownership]
    K --> K1[kaddo owners suggest]
    K1 --> K2[Front matter actualizado]
    K2 --> K3[code:<br/>- src/module/**]

    K3 --> L[Construcción]
    L --> L1[Implementación en código]
    L1 --> L2[Tests / Validación]
    L2 --> L3[Pull Request]

    L3 --> M[Guard Lite]
    M --> M1[kaddo guard]
    M1 --> M2{¿Código cambió y artifact relacionado no?}

    M2 -->|Sí| N[Possible Knowledge Drift]
    N --> N1[Revisar si el artifact sigue vigente]
    N1 --> O[Actualizar conocimiento o justificar no impacto]

    M2 -->|No| P[Sin warning]

    O --> Q[Release / Merge]
    P --> Q

    Q --> R[Aprendizaje]
    R --> R1[Actualizar Learning en Work Item]
    R --> R2[Actualizar roadmap / architecture si aplica]
    R --> R3[kaddo explain]

    R3 --> S[Proyecto explicado y conocimiento actualizado]
    S --> T[Nuevo ciclo de evolución]
    T --> A
```

## Los comandos

```bash
kaddo init
kaddo scan
kaddo context
kaddo add agents
kaddo understand
# ── usa tu LLM con .kaddo/context-pack.md + los agentes recomendados para crear
#    capacidades, el baseline de arquitectura y el roadmap ──
kaddo create --from roadmap
kaddo owners suggest
kaddo guard
kaddo explain
```

## Qué ocurre dónde

- **Pasos 1–5 (CLI):** Kaddo prepara contexto determinístico — config, inventario técnico,
  context pack, prompts de agentes y un plan de handoff. Sin LLM, sin API key.
- **Paso 6 (chat LLM):** ejecutas los agentes de Kaddo en tu LLM favorito para convertir ese
  contexto en capacidades, arquitectura y un roadmap. Aquí ocurre la interpretación.
- **Pasos 7–10 (CLI):** Kaddo convierte el roadmap en Work Items, los conecta al código vía
  ownership y cierra el loop — Guard avisa sobre la deriva y Explain resume el estado.

## Cómo se cierra el loop

`kaddo guard` lee el `git diff`, cruza los archivos cambiados con los globs `code:` de cada
artefacto y muestra un **FYI no bloqueante** cuando el conocimiento relacionado no se
actualizó. `kaddo explain` luego reporta lo que Kaddo sabe, qué falta y qué hacer a
continuación — para que la siguiente iteración empiece con contexto completo.

Elige tu punto de partida: [Proyecto nuevo](/es/use-cases/new-project/),
[Proyecto pre-IA](/es/use-cases/pre-ai-project/) o [Proyecto legacy](/es/use-cases/legacy-project/).
