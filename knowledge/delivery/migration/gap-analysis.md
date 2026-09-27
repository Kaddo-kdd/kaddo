---
type: analysis
id: gap-analysis
title: Migration Gap Analysis — OpenSpec → Kaddo-Native
status: current
generated_by: implementation-agent
template_version: 1
related_work_item: WI-003
---

# Migration Gap Analysis — OpenSpec → Kaddo-Native

> Idioma del proyecto: español. Claves, nombres de archivo y código en inglés.

## Propósito

Identificar y clasificar los gaps que impiden retirar OpenSpec del workflow de desarrollo. Cada gap documenta la responsabilidad afectada, por qué importa, la capacidad Kaddo existente, lo que falta, el riesgo y la VS destino.

## Clasificación de severidad

- **Blocking:** OpenSpec no puede retirarse sin resolver este gap.
- **Important:** No bloquea técnicamente la eliminación, pero degrada significativamente el workflow.
- **Optional:** Puede resolverse después de retirar OpenSpec.

---

## Gaps identificados

### G-01 — Design-phase artifact

| Campo | Valor |
|-------|-------|
| **Responsabilidad** | Documentar approach técnico, alternativas evaluadas y trade-offs antes de implementar. |
| **Por qué importa** | OpenSpec `design.md` forzaba una fase deliberativa donde se evaluaban alternativas antes de codear. Sin ella, las decisiones técnicas se toman implícitamente durante implementación, reduciendo trazabilidad. |
| **Capacidad Kaddo existente** | implementation-planning skill produce scope técnico, archivos esperados, riesgos y pasos. adr-writing skill permite documentar decisiones arquitectónicas en `knowledge/tech/decisions/`. |
| **Lo que falta** | La implementation-planning skill no solicita alternativas ni trade-offs. La adr-writing skill existe pero no está integrada al workflow de WI — no se invoca automáticamente ni se linkea al WI. No existe un paso formal de "diseño" entre Ready e Implementation Handoff. |
| **Riesgo** | Medio. Las decisiones se documentan ad-hoc en planes de implementación. Para cambios complejos, la ausencia de una fase deliberativa puede resultar en approaches subóptimas. |
| **Severidad** | **important** |
| **VS destino** | VS-110 (Native Implementation Handoff) — enriquecer la skill o crear un paso explícito de diseño. |

---

### G-02 — Data model / type change documentation

| Campo | Valor |
|-------|-------|
| **Responsabilidad** | Documentar tipos nuevos o cambiados, config keys, frontmatter fields, file formats. |
| **Por qué importa** | OpenSpec `design.md` tenía una sección explícita "Data Model / Types" que forzaba documentar cambios de schema antes de implementar. |
| **Capacidad Kaddo existente** | WI affected_modules y code globs identifican qué archivos cambian. Surface review evalúa capas. Pero ninguna sección solicita explícitamente documentar los cambios de tipo o schema. |
| **Lo que falta** | Una sección en el WI template o en la work-item-refinement skill que solicite documentar cambios de modelo cuando aplique. |
| **Riesgo** | Bajo. Los cambios de tipo se descubren durante implementation-planning y quedan en el plan o en el código. La ausencia es más de disciplina que de capacidad. |
| **Severidad** | **optional** |
| **VS destino** | Enhancement — agregar sección opcional al quality checklist de work-item-refinement. |

---

### G-03 — Edge cases / error handling documentation

| Campo | Valor |
|-------|-------|
| **Responsabilidad** | Documentar explícitamente edge cases y manejo de errores antes de implementar. |
| **Por qué importa** | OpenSpec `spec.md` tenía secciones separadas "Edge Cases" y "Error Handling" que forzaban pensar en non-happy-paths. |
| **Capacidad Kaddo existente** | Los ACs del WI pueden cubrir edge cases y error handling cuando son suficientemente detallados. work-item-refinement enforce testability de ACs. |
| **Lo que falta** | El template y la skill no solicitan explícitamente edge cases y error handling como secciones separadas. Depende de la thoroughness del refinement. |
| **Riesgo** | Bajo. WIs bien refinados naturalmente cubren estos casos en sus ACs. La sección explícita es un prompt, no una capacidad. |
| **Severidad** | **optional** |
| **VS destino** | Enhancement — agregar prompt en el quality checklist de work-item-refinement. |

---

### G-04 — Output examples

| Campo | Valor |
|-------|-------|
| **Responsabilidad** | Capturar ejemplos concretos de output (command output, archivos generados, JSON/markdown) antes de implementar. |
| **Por qué importa** | OpenSpec `spec.md` incluía "Output Examples" con bloques de código que mostraban exactamente qué produce el cambio. Esto servía como spec visual para el implementador. |
| **Capacidad Kaddo existente** | WI Target behavior describe el resultado esperado en prosa. ACs verifican outcomes. Pero no hay mecanismo para incluir output examples concretos. |
| **Lo que falta** | Un pattern o sección para capturar output examples en el WI. |
| **Riesgo** | Bajo. Los output examples son útiles pero no críticos. El target behavior y los ACs comunican el resultado esperado. |
| **Severidad** | **optional** |
| **VS destino** | Enhancement — convención de incluir code blocks en Target behavior cuando aplique. |

---

### G-05 — Implementation Evidence collection

| Campo | Valor |
|-------|-------|
| **Responsabilidad** | Recolectar y preservar evidencia de implementación: archivos cambiados, tests ejecutados, decisiones tomadas. |
| **Por qué importa** | El Build Contract define la etapa 5 (Implementation Evidence) con tipos ya existentes en `lifecycle.ts` (RepoEvidence, ImplementationEvidence). Pero ningún comando CLI o MCP tool recolecta esta evidencia automáticamente. |
| **Capacidad Kaddo existente** | Tipos TypeScript definidos: `RepoEvidence` (changed_paths, validations, migrations), `ImplementationEvidence` (repositories). `kaddo learn` captura learning textual pero no evidencia estructurada. |
| **Lo que falta** | Un comando o tool que recolecte: changed files desde git diff, test results, build status, y lo asocie al WI. |
| **Riesgo** | Medio. Sin evidencia estructurada, la verificación depende de revisión manual del diff y los logs. Para cambios grandes esto es significativo. |
| **Severidad** | **important** |
| **VS destino** | VS-111 (Implementation Evidence & Verification) |

---

### G-06 — Verification orchestration

| Campo | Valor |
|-------|-------|
| **Responsabilidad** | Verificar acceptance criteria, evaluar release gates, gestionar exceptions. |
| **Por qué importa** | El Build Contract define la etapa 6 (Verification) con tipos ya existentes en `lifecycle.ts` (ValidationStatus, ReleaseStatus, ReleaseGate, CompletionException, CompletionDecision). Pero no existe comando que orqueste la verificación. |
| **Capacidad Kaddo existente** | Tipos definidos para todos los conceptos de verificación. `kaddo guard` verifica drift de knowledge pero no ACs de WIs. |
| **Lo que falta** | Un comando o workflow que: evalúe cada AC contra evidencia, check release gates, gestione exceptions, y produzca un reporte de verificación. |
| **Riesgo** | Medio. La verificación actual es manual — funciona pero no escala y no deja registro estructurado. |
| **Severidad** | **important** |
| **VS destino** | VS-111 (Implementation Evidence & Verification) |

---

### G-07 — CONTRIBUTING.md workflow update

| Campo | Valor |
|-------|-------|
| **Responsabilidad** | Instruir a contributors sobre el workflow de desarrollo. |
| **Por qué importa** | CONTRIBUTING.md líneas 76-81 dicen "OpenSpec: define before you build" y dirigen a crear un OpenSpec change antes de codear. Mientras esto persista, el workflow oficial sigue siendo OpenSpec, independientemente de que exista un Build Contract. |
| **Capacidad Kaddo existente** | El Build Contract (`knowledge/delivery/build-contract.md`) define el lifecycle completo. |
| **Lo que falta** | Actualizar CONTRIBUTING.md para referenciar el Build Contract en lugar de OpenSpec. Esta actualización está fuera de scope de VS-108 (no modificar workflow oficial todavía). |
| **Riesgo** | Alto para la eliminación de OpenSpec. Sin esta actualización, OpenSpec no puede retirarse. |
| **Severidad** | **blocking** |
| **VS destino** | VS posterior de workflow transition (pre-VS-114 OpenSpec Removal). |

---

### G-08 — Documentation site OpenSpec sections

| Campo | Valor |
|-------|-------|
| **Responsabilidad** | Documentar patrones de uso de herramientas con Kaddo. |
| **Por qué importa** | `tool-examples.md` (EN/ES) tiene una sección "Kaddo + OpenSpec" que presenta OpenSpec como patrón de integración vigente. |
| **Capacidad Kaddo existente** | La sección ya enmarca OpenSpec como complemento externo. Kaddo tiene su propio lifecycle documentado. |
| **Lo que falta** | Actualizar la sección para reflejar que el Build Contract nativo es el approach preferido. OpenSpec puede permanecer mencionado como herramienta external compatible. |
| **Riesgo** | Bajo. Es documentación, no funcionalidad. |
| **Severidad** | **important** |
| **VS destino** | VS posterior de documentation update (puede ser parte de VS-112 Dogfooding o VS-114 Removal). |

---

### G-09 — Historical change preservation

| Campo | Valor |
|-------|-------|
| **Responsabilidad** | Preservar la historia de por qué cada feature del CLI fue construida. |
| **Por qué importa** | 99 change folders en `openspec/changes/` contienen proposals, designs, specs y tasks que documentan la motivación y diseño de cada feature. |
| **Capacidad Kaddo existente** | `knowledge/delivery/work-items/completed/` preserva intent y learning de WIs completados. Git history preserva todos los cambios de código. |
| **Lo que falta** | Un mecanismo de discovery para la historia anterior a Kaddo. Si se elimina el directorio `openspec/changes/`, la historia sigue en git pero la descubribilidad disminuye. |
| **Riesgo** | Bajo. La historia es in git regardless. Los WIs completados (WI-001, WI-002) ya capturan esta función para features nuevos. |
| **Severidad** | **optional** |
| **VS destino** | Decisión post-migration. Opciones: (a) mantener como read-only archive, (b) eliminar confiando en git history, (c) importar selectivamente a WIs. |

---

## Resumen de gaps

| Severidad | Cantidad | IDs |
|-----------|----------|-----|
| **blocking** | 1 | G-07 |
| **important** | 4 | G-01, G-05, G-06, G-08 |
| **optional** | 4 | G-02, G-03, G-04, G-09 |
| **Total** | **9** | — |

---

## Migration Roadmap Validation

El roadmap propuesto en VS-108 se valida contra los gaps reales:

| VS | Propósito | Gaps que cierra | Validado |
|----|-----------|----------------|----------|
| VS-108 | Build Contract & Inventory | — (discovery) | Esta VS |
| VS-109 | AI / External Work Item Import & Normalization | Ninguno directamente | Funcionalidad independiente |
| VS-110 | Native Implementation Handoff | G-01 (design-phase) | Sí — enriquecer handoff con fase deliberativa |
| VS-111 | Implementation Evidence & Verification | G-05, G-06 | Sí — implementar evidence collection y verification orchestration |
| VS-112 | Kaddo Dogfooding Migration | G-08 (docs update parcial) | Sí — comenzar a usar Kaddo para construir Kaddo |
| VS-113 | OpenSpec Compatibility Bridge | G-09 (historical preservation) | Condicional — solo si el inventory confirma valor |
| VS-114 | OpenSpec Removal | G-07 (CONTRIBUTING.md) | Sí — última VS, cuando operational dependencies = 0 |

### Condiciones para VS-114 (OpenSpec Removal)

```text
G-07 resuelto (CONTRIBUTING.md actualizado)     → blocking
G-01 resuelto (design-phase cubierto)            → important
G-05 resuelto (evidence collection disponible)   → important
G-06 resuelto (verification orchestration)       → important
G-08 resuelto (docs actualizados)                → important
```

Gaps optional (G-02, G-03, G-04, G-09) no bloquean la eliminación.

---

## OpenSpec Removal Gate

OpenSpec NO puede eliminarse hasta que:

```text
Todas las dependencias operacionales
         ↓
    inventariadas (VS-108 ✓)
         ↓
    mapeadas (VS-108 ✓)
         ↓
    reemplazadas (VS-110, VS-111)
         ↓
    validadas (VS-112)
         ↓
    workflow actualizado (pre-VS-114)
         ↓
    eliminación segura (VS-114)
```

---

## No New OpenSpec Dependencies Rule

Desde VS-108 aplica la regla:

> No introducir nuevas dependencias de OpenSpec sin justificación explícita.

OpenSpec puede seguir utilizándose donde todavía sea necesario durante la migración, pero el footprint no debe crecer. Métricas baseline registradas en `openspec-inventory.md` permiten verificar esta regla.
