---
type: contract
id: build-contract
title: Kaddo-Native Build Contract
status: current
generated_by: implementation-agent
template_version: 1
related_work_item: WI-003
knowledge_level: K3
---

# Kaddo-Native Build Contract

> Idioma del proyecto: español. Claves, nombres de archivo y código en inglés.

## Propósito

Este contrato define formalmente qué significa construir algo con Kaddo. Establece las condiciones, responsabilidades y artefactos de cada etapa del lifecycle de construcción.

El contrato es:

- **Agent-neutral** — define qué debe ocurrir, no qué agente lo hace.
- **Human-compatible** — un developer humano puede ejecutar todo el lifecycle con CLI y archivos.
- **Tool-neutral** — no depende de un coding agent, IDE o framework específico.
- **No monolítico** — cada etapa es independiente; no existe un artefacto único que concentre todo el contexto.

## Principios

1. **Knowledge separado del Work Item.** El WI define qué construir y por qué. El knowledge del proyecto (business, product, tech, delivery) permanece en sus artefactos propios. El WI referencia o recupera knowledge relevante; no lo copia dentro de sí.

2. **Context assembly dinámico.** El contexto necesario para cada etapa se ensambla según el scope del WI: Work Item + Knowledge relevante + System Context + Repository Context. Un cambio pequeño no requiere cargar todo el knowledge del proyecto.

3. **Proporcionalidad.** El nivel de detalle crece según la complejidad del trabajo. Un fix de una línea no necesita 44 acceptance criteria.

4. **Ready no es una spec gigante.** Ready significa que existe suficiente definición y knowledge recuperable para producir un Implementation Handoff. No significa que todo el contexto esté almacenado dentro del WI.

5. **Implementation Handoff es una proyección.** El handoff se ensambla dinámicamente; no es una nueva source of truth que duplique el WI o el knowledge.

---

## Lifecycle

```text
Idea
 ↓
Captured Intent (draft)
 ↓
Refinement (draft enriquecido)
 ↓
Human Review
 ↓
Ready (ready)
 ↓
Implementation Handoff (in-progress)
 ↓
Implementing
 ↓
Implementation Evidence
 ↓
Verification
 ↓
Human Review
 ↓
Completed (completed)
```

---

## Etapa 1: Captured Intent

**Estado lifecycle.ts:** `draft`

**Entry criteria:**
- Existe una necesidad identificada (roadmap candidate, user request, bug report, external import, idea).

**Actividades:**
- Crear WI vía `kaddo create`, `kaddo work-item import`, o manualmente.
- Capturar al menos: actor, outcome esperado, problema o motivación.
- No se requiere completitud — un Work Item puede comenzar con información incompleta.

**Exit criteria:**
- Archivo WI existe en `knowledge/delivery/work-items/draft/` con frontmatter válido.
- Contiene al menos una descripción del intent (qué y por qué).

**Artefactos:**
- Archivo markdown con status: draft.

**Participación de agentes:** roadmap-agent, work-item-agent, backlog-agent (opcional).
**Participación humana:** confirmar que el intent vale la pena perseguir.

**CLI:** `kaddo create` | `kaddo work-item import`

---

## Etapa 2: Refinement

**Estado lifecycle.ts:** `draft` (enriquecido)

**Entry criteria:**
- Draft WI existe.

**Actividades:**
- Aplicar work-item-refinement skill.
- Enriquecer con: current behavior, target behavior, entry points, end-to-end flow, surface review, module review, scope unknowns, scope confidence, acceptance criteria, validation, definition of done.
- Descubrir knowledge relevante del proyecto (business, product, tech, delivery, system context).
- Identificar dependencias y open questions.

**Exit criteria:**
- WI tiene todas las secciones del quality checklist de work-item-refinement.
- Acceptance criteria son testables.
- Open questions están documentadas (blocking o aceptadas como assumptions).
- Scope confidence tiene level y reasons.

**Artefactos:**
- WI archivo enriquecido (aún draft, ahora refinado).

**Participación de agentes:** work-item-agent con work-item-refinement skill.
**Participación humana:** revisar output de refinement, confirmar scope.

**Skill:** work-item-refinement

---

## Etapa 3: Ready

**Estado lifecycle.ts:** `ready`

**Entry criteria:**
- WI refinado aprobado por humano.
- Condiciones mínimas verificadas:
  - Intent claro (problema / motivación documentados).
  - Outcome esperado definido.
  - Scope y out of scope definidos.
  - Áreas afectadas identificadas.
  - Constraints identificados.
  - Acceptance criteria definidos.
  - Knowledge relevante descubierto o accesible.
  - Dependencias identificadas.
  - Open questions bloqueantes resueltas o explícitamente aceptadas.

**Actividades:**
- Human review del WI refinado.
- Transición vía `kaddo ready` o MCP `mark_work_item_ready`.
- Archivo se mueve a `work-items/ready/`.

**Exit criteria:**
- status: ready
- ready_at timestamp establecido.

**Artefactos:**
- Archivo WI en `ready/` con ready_at.

**Participación de agentes:** ninguna (gate humano).
**Participación humana:** aprobación explícita de readiness.

**CLI:** `kaddo ready <WI-ID>` | MCP `mark_work_item_ready`

### Ready no es una spec estática

Ready significa que Kaddo dispone de suficiente definición y knowledge recuperable para producir un Implementation Handoff. No significa que exista un documento gigante con todo el contexto pre-calculado.

### Open Questions en Ready

```text
Open question
     ↓
¿Blocking?
  ┌──┴──┐
 sí    no
  │     │
Not    Accept / document assumption
Ready
```

Una open question bloqueante impide la transición a Ready. Una no-bloqueante se acepta como assumption y se documenta.

---

## Etapa 4: Implementation Handoff

**Estado lifecycle.ts:** `in-progress`

**Estado de formalización:** Formalizado (VS-110). La skill `implementation-planning` fue
enriquecida con deliberación de diseño. El tipo `ImplementationHandoff` en
`packages/cli/src/core/implementation-handoff.ts` provee un contrato compartido para CLI, MCP y
agentes.

**Entry criteria:**
- WI en estado ready seleccionado para implementación.

**Actividades:**
- Aplicar implementation-planning skill (v3.93.0, con deliberación de diseño).
- Ensamblar contexto relevante dinámicamente:
  - Work Item (qué construir, constraints, ACs)
  - Knowledge relevante (business, product, tech, delivery)
  - System Context (topology, dependencias entre módulos)
  - Repository Context (archivos relevantes, patrones existentes)
  - Related Work Items (dependencias, WIs completados relacionados)
- Documentar Technical Approach y Rationale antes de listar pasos de implementación.
- Evaluar si la decisión requiere un ADR (adr-writing skill).
- Producir plan de implementación: scope técnico, archivos esperados, riesgos, validaciones, pasos, stop criteria.
- Human confirma plan.
- Usar `buildImplementationHandoff()` del Core para ensamblar el handoff programáticamente, o
  aplicar la skill manualmente.

**Exit criteria:**
- Plan confirmado por humano.
- Implementación puede comenzar.

**Artefactos:**
- Plan de implementación (inline en conversación o como archivo separado).
- Branch creado según git-strategy del proyecto.

**Participación de agentes:** implementation-agent con implementation-planning skill.
**Participación humana:** confirmar plan antes de comenzar a codear.

**Skill:** implementation-planning (v3.93.0, con deliberación de diseño)

### El Handoff es una proyección

```text
Work Item
+
Knowledge relevante
+
System Context
+
Repository Context
        ↓
Dynamic Context Assembly
        ↓
Implementation Handoff
```

El handoff no es una nueva source of truth. Si el WI o el knowledge cambian, el handoff se regenera.

### Qué necesita un implementador

Independientemente de si es un agente o un humano, el implementador necesita entender:

- Qué debe lograr (outcome, ACs).
- Qué restricciones aplican (constraints, out of scope).
- Qué contexto es relevante (knowledge, system context, repo context).
- Qué tiene permitido modificar (affected modules, code globs).

---

## Etapa 5: Implementation Evidence

**Estado lifecycle.ts:** `in-progress`

> **Nota:** Esta etapa está definida conceptualmente. La infraestructura de tipos existe en `lifecycle.ts` (RepoEvidence, ImplementationEvidence) pero aún no existe un comando CLI o MCP tool que recolecte evidencia automáticamente.

**Entry criteria:**
- Cambios de código existen (commits, archivos modificados).

**Actividades:**
- Recolectar evidencia de implementación:
  - Archivos cambiados (changed_paths).
  - Resumen de implementación.
  - Decisiones tomadas durante implementación.
  - Tests ejecutados y resultados.
  - Evidencia de acceptance criteria.
  - Desviaciones del plan.
  - Issues descubiertos.
  - Knowledge gaps descubiertos.

**Exit criteria:**
- Evidencia recolectada y disponible para verificación.

**Artefactos:**
- Metadata de evidencia (estructura ImplementationEvidence de lifecycle.ts).

**Tipos disponibles en lifecycle.ts:**

```typescript
type RepoEvidence = {
  role?: string
  status?: string
  changed_paths?: string[]
  validations?: { command: string; status: string; reason?: string }[]
  migrations?: { id: string; environment: string; status: string }[]
}

type ImplementationEvidence = {
  repositories?: Record<string, RepoEvidence>
}
```

**Participación de agentes:** implementation-agent.
**Participación humana:** commit, push, PR creation.

---

## Etapa 6: Verification

**Estado lifecycle.ts:** `in-progress`

> **Nota:** Esta etapa está definida conceptualmente. Los tipos existen en `lifecycle.ts` (ValidationStatus, ReleaseStatus, ReleaseGate, CompletionException) pero no existe un comando CLI que orqueste la verificación.

**Entry criteria:**
- Evidencia de implementación recolectada.

**Actividades:**
- Validar acceptance criteria contra evidencia.
- Ejecutar validaciones automatizables (tests, build, type-check).
- Verificar release gates.
- Gestionar exceptions si las hay.
- Human review de la implementación.

**Exit criteria:**
- Todos los ACs verificados (passed, o accepted-with-exceptions).
- Release gates evaluados.
- Human review completado.

**Artefactos:**
- Estado de validación (ValidationStatus).
- Estado de release (ReleaseStatus).
- Release gates (ReleaseGate[]).
- Completion exceptions si aplica (CompletionException[]).

**Tipos disponibles en lifecycle.ts:**

```typescript
type ValidationStatus = 'not-started' | 'in-progress' | 'passed' | 'failed'
  | 'partial' | 'accepted-with-exceptions' | 'blocked'

type ReleaseGate = {
  id: string
  status: 'pending' | 'passed' | 'failed' | 'blocked' | 'waived' | 'not-applicable'
  required_for?: string
  reason?: string
}

type CompletionException = {
  id: string
  status: 'proposed' | 'accepted' | 'rejected' | 'deferred' | 'resolved'
  category?: string
  reason?: string
  impact?: string
}
```

**Participación de agentes:** guard-agent (futuro).
**Participación humana:** verificación manual de ACs, aprobación de exceptions.

---

## Etapa 7: Completed

**Estado lifecycle.ts:** `completed`

**Entry criteria:**
- Verificación pasada.
- Human review completado.

**Actividades:**
- Marcar como completado vía `kaddo learn` o actualización manual.
- Registrar learning (qué se aprendió, qué fue diferente de lo esperado).
- Archivo se mueve a `work-items/completed/`.

**Exit criteria:**
- status: completed
- completed_at timestamp establecido.
- Learning registrado.

**Artefactos:**
- WI archivo en `completed/` con learning.
- Evidencia preservada.

**Participación de agentes:** learning-capture skill (opcional).
**Participación humana:** aprobación final, merge.

**CLI:** `kaddo learn <WI-ID>`

**Skill:** learning-capture

---

## Decisiones arquitectónicas

| # | Decisión | Razón |
|---|----------|-------|
| D1 | El WI es la unidad principal de intención y trabajo. | Reemplaza el OpenSpec change como artifact central. |
| D2 | Knowledge no se copia dentro del WI. | Evita duplicación y drift. Knowledge se referencia o recupera dinámicamente. |
| D3 | Ready no significa spec completa almacenada. | Significa que existe suficiente definición + knowledge recuperable para handoff. |
| D4 | Implementation Handoff es una proyección temporal. | Se ensambla dinámicamente; no persiste como nueva source of truth. |
| D5 | El contrato es agent-neutral. | Cualquier coding agent o developer humano puede consumir un WI ready. |
| D6 | No se fuerza equivalencia 1:1 con OpenSpec. | Se mapean responsabilidades, no formatos ni artifacts. |
| D7 | Compatibilidad futura con OpenSpec será one-way. | OpenSpec → Kaddo, no bidireccional. |
| D8 | Context es proporcional al scope. | Un cambio pequeño no carga todo el knowledge del proyecto. |

---

## Validation Notes

### Walkthrough con WI-003 (VS-108) como Work Item representativo

Se validó el Build Contract utilizando WI-003 mismo como caso de estudio:

| Etapa | Resultado | Evidencia |
|-------|-----------|-----------|
| 1. Captured Intent | PASS | WI-003 tiene actor, outcome, problem documentados. Creado vía draft manual. |
| 2. Refinement | PASS | WI-003 tiene current/target behavior, 29 ACs testables, scope confidence high, affected_modules, domains, depends_on. |
| 3. Ready | PASS | Transicionable con `kaddo ready`. Human review confirma readiness. |
| 4. Implementation Handoff | PASS | Plan de implementación producido con 5 fases, AC coverage matrix, verification steps. Aprobado por humano antes de ejecutar. |
| 5. Implementation Evidence | PASS | Deliverables documentales: openspec-inventory.md, build-contract.md, openspec-kaddo-mapping.md, gap-analysis.md. Changed files enumerables. |
| 6. Verification | PASS | 29 ACs verificables contra los documentos producidos. No requiere tests automatizados (VS puramente documental). |
| 7. Completed | PASS | WI-003 transicionable a completed con learning. |

### Observaciones

1. El lifecycle funciona end-to-end para un WI de discovery/documentación.
2. Las etapas 5 (Evidence) y 6 (Verification) se ejecutaron manualmente — confirma que la automatización (G-05, G-06) es un gap real pero no bloquea el workflow.
3. La proporcionalidad funciona: un WI documental no necesita type-check ni build validation.
4. El contrato es consumible tanto por un agente (que ejecutó las fases) como por un humano (que revisó y aprobó).
