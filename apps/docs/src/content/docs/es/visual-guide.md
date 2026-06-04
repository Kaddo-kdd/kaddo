---
title: Guía visual
description: Entiende Kaddo de un vistazo — el knowledge loop, el reparto CLI vs LLM, el flujo de artefactos, Guard, multirepo y gobernanza, como diagramas Mermaid.
---

Esta página es el mapa visual de Kaddo. Muestra el **knowledge loop implementado (v2.6+)**:
qué hace el CLI determinístico, qué hacen tus agentes LLM, cómo se conectan los artefactos
y cómo encajan Guard, multirepo y la gobernanza. Haz clic en cualquier diagrama para
abrirlo a pantalla completa.

> Estos diagramas describen comportamiento que existe hoy. **No** implican ninguna
> automatización futura — mira [Qué no significan los diagramas](#qué-no-significan-los-diagramas).

## Capas de conocimiento (macro-flujo)

Kaddo enmarca todo el proyecto en cuatro capas macro bajo `knowledge/`. Cada una responde
una pregunta y se mantiene conectada con la de arriba.

```mermaid
flowchart TD
    B[Business — por qué existe] --> P[Product — qué construimos]
    P --> T[Tech — cómo lo construimos]
    T --> D[Delivery — cómo lo evolucionamos]
    B --> B1[problem · users · constraints · business-rules]
    P --> P1[product-brief · capabilities]
    T --> T1[codebase · current-state · decisions · modules]
    D --> D1[roadmap · work-items]
```

`kaddo bootstrap` siembra la base mínima (Business + Product + `tech/codebase.md`);
Delivery y las decisiones emergen después vía agentes y trabajo real.

## Kaddo Knowledge Loop

El loop completo, desde un repo en crudo hasta un estado de conocimiento explicado. Los
pasos del CLI son determinísticos; el paso con agentes ocurre en tu propio chat LLM.

```mermaid
flowchart TD
    A[Repo / Proyecto] --> B[kaddo init]
    B --> C[kaddo scan]
    C --> D[scan.json + inventory.md]
    D --> E[kaddo context]
    E --> F[context-pack.md]
    F --> G[kaddo understand]
    G --> H[understand.md]
    H --> I[Chat LLM + Agentes Kaddo]
    I --> J[capabilities.md]
    I --> K[current-state.md]
    I --> L[roadmap.md]
    L --> M[kaddo create --from roadmap]
    M --> N[work-items/*.md]
    N --> O[kaddo owners suggest]
    O --> P[globs code: en front matter]
    P --> Q[Cambios de código]
    Q --> R[kaddo guard]
    R --> S{Posible drift?}
    S -->|Sí| T[Revisar / actualizar artefacto]
    S -->|No| U[Continuar]
    T --> V[kaddo explain]
    U --> V
    V --> W[explain.md]
```

## CLI vs LLM

Kaddo trabaja en dos capas. El CLI es determinístico y nunca llama a un LLM; tu chat LLM
(con los prompts de agentes de Kaddo) hace la interpretación. El Repositorio de
Conocimiento es el terreno común entre ambos.

```mermaid
flowchart LR
    subgraph CLI["Kaddo CLI · determinístico"]
        A[init]
        B[scan]
        C[context]
        D[understand]
        E[create --from roadmap]
        F[owners suggest]
        G[guard]
        H[explain]
    end
    subgraph LLM["Chat LLM + Agentes Kaddo · interpretación"]
        I[capability-agent]
        J[architecture-agent]
        K[roadmap-agent]
        L[legacy-agent]
        M[adr-agent]
        N[agentes operativos]
    end
    subgraph Repo["Repositorio de Conocimiento"]
        O[.kaddo/]
        P[knowledge/]
        Q[work-items]
        R[globs de ownership]
    end
    B --> O
    C --> O
    D --> I
    D --> J
    D --> K
    I --> P
    J --> P
    K --> P
    P --> E
    E --> Q
    Q --> F
    F --> R
    R --> G
    G --> H
```

## Humano ↔ CLI ↔ LLM

El handoff operativo. El humano ejecuta cada comando y guarda cada artefacto revisado —
Kaddo nunca llama al LLM por ti.

```mermaid
sequenceDiagram
    participant H as Humano
    participant CLI as Kaddo CLI
    participant Repo as Repo de Conocimiento
    participant LLM as Chat LLM + Agentes
    H->>CLI: kaddo init
    CLI->>Repo: .kaddo/config.yml
    H->>CLI: kaddo scan
    CLI->>Repo: scan.json + inventory.md
    H->>CLI: kaddo context
    CLI->>Repo: context-pack.md
    H->>CLI: kaddo add agents
    CLI->>Repo: knowledge/agents/*.md
    H->>CLI: kaddo understand
    CLI->>Repo: understand.md
    H->>LLM: context-pack + agente elegido
    LLM-->>H: artefacto propuesto
    H->>Repo: guardar artefacto revisado
    H->>CLI: kaddo create --from roadmap
    CLI->>Repo: work item
    H->>CLI: kaddo owners suggest
    CLI->>Repo: globs code: en front matter
    H->>CLI: kaddo guard
    CLI-->>H: FYI no bloqueante
    H->>CLI: kaddo explain
    CLI->>Repo: explain.md
```

## Grafo de artefactos

Cómo cada artefacto alimenta al siguiente, desde `config.yml` hasta `explain.md`.

```mermaid
flowchart LR
    A[config.yml] --> B[scan.json]
    B --> C[inventory.md]
    B --> D[context-pack.md]
    D --> E[capabilities.md]
    E --> F[current-state.md]
    F --> G[roadmap.md]
    G --> H[work-items/*.md]
    H --> I[globs code:]
    I --> J[guard]
    J --> K[FYI de drift]
    E --> L[explain.md]
    F --> L
    G --> L
    H --> L
```

## Estados del proyecto

`kaddo init` registra el estado del proyecto. El estado cambia a qué agentes recurres
primero, pero el loop y los artefactos son los mismos.

```mermaid
flowchart TD
    A[Proyecto] --> B{Estado}
    B -->|new| C[Empezar con conocimiento ligero]
    B -->|pre-AI| D[Preparar repo existente para evolución asistida por LLM]
    B -->|legacy| E[Entender antes de cambiar]
    C --> F[roadmap-agent + architecture-agent]
    D --> G[capability-agent + architecture-agent + roadmap-agent]
    E --> H[legacy-agent + architecture-agent + capability-agent]
    F --> I[Roadmap + Work Items]
    G --> I
    H --> I
    I --> J[Ownership]
    J --> K[Guard]
    K --> L[Explain]
```

## Mapa multirepo

Desde el repo de arquitectura mapeas repos secundarios como módulos; cada uno obtiene su
propia estructura de conocimiento. Los archivos existentes nunca se sobrescriben.

```mermaid
flowchart TD
    A[Repo de Arquitectura] --> B[.kaddo/modules.yml]
    A --> C[knowledge/tech/modules/]
    B --> D[repo frontend]
    B --> E[repo backend]
    B --> F[repo worker]
    B --> G[repo infra]
    C --> H[frontend/module-design.md]
    C --> I[backend/module-design.md]
    C --> J[worker/module-design.md]
    C --> K[infra/module-design.md]
    H --> H1["stack · security · standards · diagrams · adrs"]
    I --> I1["stack · security · standards · diagrams · adrs"]
    J --> J1["stack · security · standards · diagrams · adrs"]
    K --> K1["stack · security · standards · diagrams · adrs"]
```

## Guard Lite

Guard lee `git diff`, matchea los archivos cambiados contra los globs `code:` declarados y
emite un FYI **no bloqueante** solo cuando un artefacto dueño no se actualizó en el mismo
diff. Es silencioso cuando ningún artefacto declara ownership.

```mermaid
flowchart TD
    A[git diff] --> B[Archivos cambiados]
    C[Artefactos con front matter] --> D[globs code:]
    B --> E[Match archivos vs globs]
    D --> E
    E --> F{Match?}
    F -->|No| G[Sin aviso]
    F -->|Sí| H{Artefacto también cambió?}
    H -->|Sí| I[Sin aviso]
    H -->|No| J[FYI de Posible Knowledge Drift]
    J --> K[El humano revisa]
    K --> L[Actualizar artefacto o confirmar sin impacto]
```

## Niveles de gobernanza

La gobernanza escala según el tamaño de equipo. Kaddo nunca la impone — la revisión ocurre
por excepción.

```mermaid
flowchart TD
    A[Proyecto Kaddo] --> B{Tamaño de equipo}
    B -->|Indie| C[Sin owner formal]
    B -->|Equipo pequeño| D[Revisión en PR]
    B -->|Equipo mediano| E[Tech Lead por excepción]
    B -->|Enterprise| F[Domain Owners]
    C --> G[Conocimiento mínimo suficiente]
    D --> G
    E --> G
    F --> G
    G --> H[Work Items por Nivel de Conocimiento]
    H --> I[Guard como señal no bloqueante]
```

## Kaddo de un vistazo

Un mapa de alto nivel de comandos, agentes, artefactos, plantillas y principios.

```mermaid
mindmap
  root((Kaddo))
    CLI
      init
      scan
      context
      understand
      create
      owners
      guard
      explain
      modules
    Agentes
      capability
      architecture
      roadmap
      legacy
      adr
      work-item
      git-strategy
      security
      standards
      stack
      module-design
    Artefactos
      .kaddo
      architecture
      work-items
      modules
    Plantillas
      core
      architecture
      module
      operations
      legacy
    Principios
      CLI determinístico
      Sin llamadas a LLM
      El humano confirma
      Guard no bloqueante
      Ownership en front matter
```

## Qué no significan los diagramas

Para mantener expectativas honestas, estos diagramas **no** implican que:

- Kaddo llame a un LLM — tú ejecutas los agentes en tu propio chat.
- Guard bloquee — siempre es un FYI no bloqueante.
- El ownership se infiera — los globs `code:` se declaran y los confirma un humano.
- Kaddo escanee repos remotos o llame a APIs de Git/GitHub.
- Kaddo genere estos diagramas automáticamente — son docs escritos a mano.

---

Siguiente: recorre el mismo loop con artefactos reales en los [Ejemplos](/es/examples/), o
lee el [Prompt Workflow](/es/playbook/prompt-workflow/) paso a paso.
