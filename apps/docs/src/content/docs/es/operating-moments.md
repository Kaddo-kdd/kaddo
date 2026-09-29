---
title: Momentos de operación
description: "Cómo opera Kaddo a lo largo de un proyecto — el conocimiento madura en cuatro momentos: Base, Definición, Proyección, Ejecución."
---

Kaddo no es una lista larga de comandos. Es un **flujo progresivo de maduración del conocimiento**.
A lo largo de la vida de un proyecto recorre cuatro momentos:

```text
Base → Definición → Proyección → Ejecución
```

| Momento | Pregunta | Vas de… a… |
|---|---|---|
| **Base** | ¿Cómo preparo el espacio de trabajo? | nada → un lugar para el conocimiento + contexto |
| **Definición** | ¿Qué es este producto? | una idea → conocimiento claro de negocio / producto / tech |
| **Proyección** | ¿Qué construimos primero? | conocimiento → un plan de entrega (roadmap + Work Items) |
| **Ejecución** | Construir, validar, sincronizar conocimiento | Work Items → código + conocimiento actualizado |

En cada momento: el **CLI** prepara contexto determinista, los **agentes LLM** interpretan y el
**humano** confirma. Kaddo nunca llama a un LLM ni ejecuta Git.

## Momento 1 — Base

**Propósito:** preparar el proyecto para operar con Kaddo — crear el espacio donde vive el
conocimiento y configurar el proyecto.

**Comandos**

```bash
kaddo init          # .kaddo/config.yml (state · structure · team · language)
kaddo bootstrap     # archivos base knowledge/business|product|tech (proyectos nuevos)
kaddo scan          # .kaddo/scan.json + knowledge/inventory.md
kaddo add agents    # knowledge/agents/
kaddo context       # .kaddo/context-pack.md / .json
kaddo understand    # .kaddo/understand.md — fase actual + siguiente paso
kaddo explain       # .kaddo/explain.md / .json — qué sabe Kaddo
```

**Agentes que pueden intervenir:** `bootstrap-agent` · `business-agent` · `codebase-agent`.

**Resultado:** configuración inicial, estructura de conocimiento, agentes instalados y contexto
listo para un LLM.

## Momento 2 — Definición

**Propósito:** convertir la idea inicial en conocimiento claro de Negocio, Producto y Tech. El
humano alimenta a Kaddo con información real del proyecto.

**Comandos:** `kaddo context` · `kaddo understand` · `kaddo explain` · `kaddo scan`.

**Agentes**

| Agente | Refina / produce |
|---|---|
| `business-agent` | problema · usuarios · reglas · restricciones → `knowledge/business/business.md` |
| `product-agent` | producto · alcance · fuera de alcance · valor · criterios de éxito → `knowledge/product/product.md` |
| `capability-agent` | capacidades del sistema → `knowledge/product/capabilities.md` |
| `codebase-agent` | intención técnica → `knowledge/tech/codebase.md` |
| `architecture-agent` | realidad / baseline técnico → `knowledge/tech/current-state.md` |
| `adr-agent` / `decision-agent` | decisiones → `knowledge/tech/decisions/` |

**Resultado:** claridad sobre por qué existe el producto, qué construirá, cómo se piensa construir,
qué decisiones ya se tomaron y qué capacidades son relevantes.

## Momento 3 — Proyección

**Propósito:** convertir el conocimiento definido en un plan de entrega — de *"sabemos qué
queremos"* a *"sabemos qué construir primero"*.

**Comandos:** `kaddo context` · `kaddo understand` · `kaddo create --from roadmap` · `kaddo explain`.

**Agentes**

| Agente | Rol |
|---|---|
| `roadmap-agent` | conocimiento → iniciativas, dependencias, candidatos de Work Items, orden sugerido → `knowledge/delivery/roadmap.md` |
| `backlog-agent` | ideas informales → un draft de Work Item o un candidato de roadmap (no implementa/refina) |
| `work-item-agent` | refina un draft en un Work Item ready (problem · acceptance · validation · DoD · ownership) → `knowledge/delivery/work-items/` |
| `ownership-agent` | propone globs `code:` precisos; el humano confirma con `kaddo owners suggest` |

`kaddo create --from roadmap` materializa los candidatos del roadmap en Work Items reales bajo
`knowledge/delivery/work-items/`.

**Resultado:** un roadmap, candidatos, Work Items draft/ready y ownership propuesto o declarado.

## Momento 4 — Ejecución

**Propósito:** implementar Work Items siguiendo el **Build Contract** — el ciclo de vida que conecta
intención con código verificado y conocimiento sincronizado.

```text
Ready → Implementation Handoff → Implementación → Evidencia → Verificación →
Guard → Completado → Aprendizaje
```

**Comandos:** `kaddo ready` · `kaddo verify` · `kaddo guard` · `kaddo learn` · `kaddo scan` ·
`kaddo owners suggest` · `kaddo context` · `kaddo understand` · `kaddo explain`.

**Agentes y skills**

| Agente / Skill | Rol en ejecución |
|---|---|
| `implementation-agent` | implementa un Work Item; sugiere nombre de rama / validación (nunca ejecuta git) |
| skill `implementation-planning` | deliberación de diseño + ensamblaje de contexto antes de codificar |
| skill `evidence-verification` | recolección de evidencia estructurada + verificación de ACs |
| skill `learning-capture` | aprendizaje retrospectivo sobre Work Items completados |
| skill `legacy-risk-assessment` | evalúa un cambio contra riesgos legacy conocidos (proyectos legacy) |
| `ownership-agent` | ajusta ownership cuando el código tocado cambia o aparecen rutas nuevas |
| `architecture-agent` | actualiza `current-state.md` si la realidad técnica cambió |
| `capability-agent` | actualiza capacidades si cambió el comportamiento del producto |
| `adr-agent` / `decision-agent` | registra un ADR si aparece una decisión relevante |
| `guard-agent` | interpreta los hallazgos de `kaddo guard` y propone qué revisar (no edita solo) |

**Loop recomendado**

```text
work-item-agent (refinar) → kaddo ready → implementation-planning skill →
implementation-agent → kaddo verify → kaddo guard → kaddo learn →
el agente correspondiente actualiza el conocimiento → kaddo explain
```

**Resultado:** código, cambios verificados, aprendizajes capturados y conocimiento que sigue
reflejando la realidad.

## Comandos cíclicos

Algunos comandos se repiten en varios momentos — ejecútalos cuando aplique la pregunta:

| Comando | Cuándo | Pregunta que responde |
|---|---|---|
| `kaddo context` | antes de usar agentes | ¿Qué le doy al LLM? |
| `kaddo understand` | cuando no sabes qué sigue | ¿Qué debería hacer ahora? |
| `kaddo explain` | para inspeccionar el estado | ¿Qué sabe Kaddo? |
| `kaddo scan` | después de cambios técnicos | ¿Qué señales técnicas existen? |
| `kaddo owners suggest` | para registrar/corregir ownership | ¿Qué artefacto posee qué código? |
| `kaddo guard` | antes de cerrar un cambio | ¿Qué conocimiento podría estar desactualizado? |
| `kaddo graph export` | onboarding, análisis de impacto, revisión | ¿Cómo está conectado el conocimiento? |

## Agentes cíclicos

| Agente | Aparece cada vez que… |
|---|---|
| `ownership-agent` | se crea o cambia un Work Item |
| `architecture-agent` | cambia la realidad técnica |
| `capability-agent` | cambia una capacidad |
| `adr-agent` | aparece una decisión relevante |
| `work-item-agent` | un Work Item pasa de draft a ready |
| `implementation-agent` | se ejecuta un Work Item |
| `backlog-agent` | surge una idea fuera del roadmap |
| `capsule-agent` | el conocimiento de este proyecto debe compartirse con otro ([Knowledge Capsules](/es/knowledge-capsules/)) |
| `graph-agent` | `kaddo graph export` reporta relaciones limitadas ([Exportar el grafo](/es/knowledge-graph-export/)) |

---

¿Perdido en algún punto? Ejecuta **`kaddo understand`** — te dice el momento/fase actual y el
siguiente paso desde el estado real de tu proyecto.
