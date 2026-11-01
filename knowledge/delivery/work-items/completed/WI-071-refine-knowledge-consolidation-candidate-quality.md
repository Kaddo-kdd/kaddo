---
type: bugfix
id: WI-071
title: Refine Knowledge Consolidation Candidate Quality
status: completed
completed_at: '2026-11-01'
released_in: v3.129.1
work_type: bugfix
created_at: '2026-10-31'
knowledge_level: K2
domains:
  - Tech
  - Delivery
affected_modules:
  - cli
  - docs
antecedent: WI-070
generated_by: kaddo-admin
implementation_status: completed
validation_status: passed
implementation_evidence:
  repositories:
    cli:
      role: core
      status: completed
      changed_paths:
        - packages/cli/src/core/knowledge-consolidation.ts
        - packages/cli/tests/knowledge-consolidation.test.ts
      validations:
        - command: >-
            pnpm exec vitest run
            packages/cli/tests/knowledge-consolidation.test.ts
          status: passed
          reason: >-
            18 verdes: redundancia por contenido (ADRs/Initiatives con plantilla
            no disparan; solapamiento literal sí), clasificación de learning
            (compile/benchmark/narración no son regla; fragmento real como
            evidencia; destino sin resolver), fragmentación/organización solo en
            conocimiento canónico, coherencia observado +
            requires_semantic_review, determinismo, staleness y no-fuga de
            secretos.
    docs:
      role: module
      status: completed
      changed_paths:
        - apps/docs/src/content/docs/knowledge-consolidation.md
        - apps/docs/src/content/docs/es/knowledge-consolidation.md
      validations:
        - command: pnpm --filter @kaddo/docs build
          status: passed
          reason: 259 páginas; reglas de precisión documentadas EN/ES.
scope_confidence:
  level: high
  reasons:
    - >-
      Antecedente directo de WI-070 (v3.129.0). Mejora acotada de precisión del
      analizador determinístico, sin cambios de contrato CLI/MCP ni rediseño.
    - >-
      Causas raíz localizadas y verificadas en `knowledge-consolidation.ts`;
      cada una tiene un test de regresión que reproduce el falso positivo
      reportado en Wasma.
    - >-
      No se introducen LLMs, embeddings ni motores de similitud pesados; se
      mantiene lectura solo de `knowledge/`.
summary: >-
  Al ejecutar Knowledge Consolidation (WI-070) sobre el proyecto Wasma se
  generaron candidatos técnicamente explicables pero de baja utilidad:
  redundancias por plantillas compartidas en ADRs/Initiatives, aprendizajes
  clasificados a partir de resultados históricos/benchmarks, destinos genéricos,
  fragmentación de Work Items históricos y señales de calidad demasiado
  genéricas. Este WI refina la precisión de los candidatos sin silenciar
  oportunidades reales y sin ampliar el alcance de la capacidad.
ready_at: '2026-11-01'
verified_at: '2026-11-01'
---

# Refine Knowledge Consolidation Candidate Quality

## Antecedente

WI-070 (Knowledge Consolidation, liberado en v3.129.0) incorporó el análisis determinístico
`kaddo knowledge consolidate`. Al ejecutarlo sobre el proyecto Wasma (140 artifacts, 79 Work Items,
87 oportunidades) se observó que varias oportunidades eran técnicamente explicables pero no
representaban problemas reales de conocimiento. Este WI corrige la **calidad de los candidatos**;
no amplía la funcionalidad ni cambia el contrato CLI/MCP.

## Problema

Baseline de Wasma: 87 oportunidades (49 redundancias, 21 aprendizajes, 1 fragmentación, 7 relaciones,
9 organización). Causas raíz identificadas en `packages/cli/src/core/knowledge-consolidation.ts`:

1. **Redundancia por plantilla.** El candidato se disparaba con ≥2 encabezados compartidos
   (`distinctiveHeadings`). ADRs e Initiatives comparten secciones (`Decision`, `Consequences`,
   `Expected value`, `Success criteria`) por plantilla → falsos positivos.
2. **Aprendizajes mal clasificados.** `looksLikeDurableRule` buscaba una palabra (`debe`, `must`) en
   toda la sección Learning y mostraba como evidencia el inicio de la sección, no el fragmento que
   disparaba. No distinguía regla durable de resultado histórico, benchmark, observación de pruebas o
   resultado experimental.
3. **Destinos genéricos.** Todos los aprendizajes recomendaban `knowledge/tech/codebase.md`.
4. **Fragmentación de Work Items históricos.** Se contaban WIs completados breves por compartir carpeta
   y longitud.
5. **Calidad demasiado genérica.** La organización se disparaba para cualquier artifact `weak`/
   `placeholder` (WIs, skills, inventarios, deprecaciones), sin considerar su naturaleza.
6. **Coherencia observado vs. acción.** La organización era `observed` con `requires_semantic_review:
   false`, aunque fusionar/expandir requiere criterio.

## Corrección implementada

Todo en `packages/cli/src/core/knowledge-consolidation.ts` (determinístico, solo lectura, sin LLM):

1. **Redundancia por contenido, no por estructura.** Nueva detección por **pasaje contiguo literal**:
   `buildShingles` (shingles de 6 palabras de la prosa, excluyendo encabezados, código, citas y
   marcadores de lista) + `longestSharedRun` (racha contigua ≥ `MIN_SHARED_RUN = 6`, ≈ pasaje de 11+
   palabras). Los encabezados ya no se usan. Se **incluyen** ADRs e Initiatives (`isComparableKnowledge`);
   solo se excluye andamiaje (agents/skills/capsules), Work Items y roadmap. La evidencia es el pasaje
   literal compartido (redactado si tiene forma de secreto).
2. **Clasificación de aprendizajes por frase.** `classifyLearningSentence` →
   `durable-rule | historical-result | benchmark-evidence | test-observation | experimental-result |
   none`. Solo señales normativas **fuertes** (modal/sustantivo de regla: `must/should/debe/deben/
   requiere/invariante/restricción/constraint/regla`), excluyendo `nunca/siempre/never/always` sueltos
   (narración en pasado). La evidencia es **la frase que disparó**, no el inicio de la sección. La
   clasificación se declara explícitamente como heurística, no como verdad verificada.
3. **Destino sin resolver.** `target_artifacts: []`; el render muestra "(unresolved — to be determined
   in semantic review)". Core no inventa destino.
4. **Fragmentación/organización solo sobre conocimiento canónico.** `isConsolidatableKnowledge` limita a
   documentos Business/Product/Tech; excluye Work Items, roadmap, initiative, deprecation,
   project-resource, inventory, capsules y andamiaje.
5. **Naturaleza del artifact.** Mismo predicado; los WIs históricos y artifacts generados/lifecycle no
   reciben recomendaciones narrativas.
6. **Coherencia de clasificación.** Organización: `classification: observed` (la calidad es observable)
   + `requires_semantic_review: true` (la acción requiere criterio); rationale separa evidencia de
   acción.

## Before / After

1. **ADR-001 vs ADR-005** (misma plantilla, decisiones distintas) — antes: redundancia por encabezados;
   después: 0.
2. **INI-001 vs INI-007** (secciones comunes, contenido distinto) — antes: redundancia por plantilla;
   después: 0.
3. **AN-004 "los crates compilaron correctamente"** — antes: aprendizaje candidato; después:
   `historical-result`, descartado.
4. **AN-065** con "benchmark ran in 42ms" + "…must never be reused" — antes: evidencia = frase del
   benchmark; después: evidencia = frase normativa, sin `42ms`, destino `[]`.
5. **WI completado breve en `completed/`** — antes: contaba para fragmentación/organización; después: 0.
6. **Dos documentos con un párrafo realmente duplicado** — después: sigue generando candidato
   `suggested` con el pasaje literal como evidencia (no se silencian solapamientos reales).

## Dogfooding comparativo (Kaddo)

No se dispone del snapshot de Wasma, por lo que se compara sobre Kaddo (mismo proyecto, antes/después
del cambio):

| Indicador | Antes | Después |
|---|---:|---:|
| Redundancy | 0 | 2 (reales, por contenido) |
| Learning | 23 | 19 |
| Organization | 4 | 1 |
| Fragmentation | 0 | 0 |
| Relationship | 2 | 1 |
| Total | 29 | 23 |

**Verificación del hallazgo de relaciones (no es regresión):** el 2→1 se debe a que WI-070 pasó de
`in-progress` a `completed` al liberar v3.129.0; graph-hints solo marca Work Items activos
(`ACTIVE_STATUSES = draft/ready/in-progress/blocked`). Demostración determinística: un WI activo sin
relaciones produce 1 oportunidad; el mismo WI completado produce 0. La lógica de relaciones
(`relationshipOpportunityFromHint`, `hintInScope`) no fue modificada por este WI. El hallazgo
`kaddo-telemetry` se conserva.

## Out of Scope

- Aplicación automática de propuestas.
- Edición del conocimiento canónico.
- Dashboard de consolidación en Admin.
- Incorporación automática post-`learn`.
- Rediseño del ciclo de vida de Work Items.
- Integración de un LLM en Core.
- Nuevos algoritmos de análisis semántico pesado.
- Rediseño de Knowledge Consolidation.
- Cambios no relacionados con la calidad de candidatos.

## Acceptance Criteria

- [x] AC-01: no se generan redundancias basadas exclusivamente en encabezados compartidos por plantillas.
- [x] AC-02: se preserva la detección conservadora de solapamientos con evidencia de contenido distintivo.
- [x] AC-03: Learning identifica el fragmento relevante y no solamente el inicio de una sección.
- [x] AC-04: resultados históricos no se presentan automáticamente como reglas vigentes.
- [x] AC-05: los destinos no verificables permanecen explícitamente sin resolver.
- [x] AC-06: WIs históricos breves no generan fragmentación por su longitud o ubicación.
- [x] AC-07: las oportunidades de organización consideran la naturaleza del artifact.
- [x] AC-08: observaciones y recomendaciones semánticas mantienen clasificaciones coherentes.
- [x] AC-09: CLI y MCP conservan compatibilidad.
- [x] AC-10: las pruebas y el dogfooding demuestran mejoras de precisión sin pérdida injustificada de candidatos útiles.
- [x] AC-11: no se modifica conocimiento canónico durante el análisis.
- [x] AC-12: la implementación se presenta para revisión antes del commit.

## Validation

- Tests de regresión en `packages/cli/tests/knowledge-consolidation.test.ts` (18 verdes) que cubren:
  ADRs con misma plantilla y decisiones distintas (sin redundancia), Initiatives con secciones comunes
  (sin redundancia), solapamiento real de contenido (sí candidato), compile/benchmark no convertido en
  regla, fragmento de regla con evidencia precisa y destino sin resolver, WI completado breve sin
  fragmentación ni organización, inventario generado sin recomendación, coherencia observado +
  requires_semantic_review, `classifyLearningSentence` (incluida narración en pasado), determinismo,
  staleness y no-fuga de secretos.
- Build de `@kaddo/cli` y `@kaddo/docs`; suite completa de vitest.
- Dogfooding `kaddo knowledge consolidate` sobre Kaddo con `git status knowledge/` limpio tras el
  análisis (AC-11).

## Definition of Done

- Las seis causas raíz corregidas con tests de regresión.
- Precisión mejorada sin pérdida de candidatos por regresión (verificado el hallazgo de relaciones).
- Contratos CLI/MCP sin cambios.
- Documentación EN/ES actualizada.
- Implementation Evidence registrada.

## Commit Gate

Aprobado explícitamente por el usuario para commit y release como v3.129.1 tras presentar diagnóstico,
cambios, pruebas y comparación antes/después.

---

## Learning

Liberado en v3.129.1 como mejora de precisión acotada sobre WI-070.

- **La señal de contenido, no de estructura, es lo que distingue una duplicación real.** Pasar de
  "encabezados compartidos" a "pasaje contiguo literal" (shingles de 6 palabras, racha ≥6 ≈ 11+
  palabras) eliminó los falsos positivos de ADRs/Initiatives por plantilla **sin** excluirlos: dos
  ADRs con decisiones distintas no se marcan, pero dos documentos que repiten un párrafo sí. El
  umbral de **racha contigua** fue clave: contar shingles sueltos seguía marcando boilerplate.
- **"nunca/siempre/never/always" son ambiguos.** En el dogfooding, un learning de WI-069 se marcó por
  `nunca lo renderizaba` (narración en pasado), no por una regla. Restringir a señales normativas
  fuertes (modal/sustantivo de regla) y clasificar por **frase** (no por sección) corrigió el caso:
  ahora WI-069 dispara por `invariante ya existente…`, la regla real. Preferir precisión sobre
  cobertura; la capa semántica recupera los bordes.
- **No todo hallazgo "observado" tiene una acción obvia.** La calidad `weak` es observable, pero
  fusionar/expandir requiere criterio → `observed` + `requires_semantic_review: true`. Y la señal de
  calidad solo aplica a documentos canónicos: Work Items históricos, inventarios generados,
  deprecaciones y Project Resources no son prosa a consolidar.
- **Una caída en conteos no es necesariamente una regresión.** El 2→1 en relaciones se explicó por el
  lifecycle de WI-070 (activo→completado), no por el código. Verificarlo de forma determinística
  (WI activo = 1, mismo WI completado = 0) evitó "arreglar" algo que funcionaba.

**Conocimiento a vigilar:** `MIN_SHARED_RUN=6` y las señales normativas son umbrales heurísticos fijos;
si un proyecto futuro necesita afinarlos, hacerlo con dogfooding sobre su conocimiento real, nunca
subiendo el conteo como objetivo.
