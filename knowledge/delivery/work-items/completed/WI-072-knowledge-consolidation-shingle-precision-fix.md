---
type: bugfix
id: WI-072
title: Knowledge Consolidation Shingle Precision Fix
status: completed
completed_at: '2026-11-01'
released_in: v3.129.2
work_type: bugfix
created_at: '2026-11-01'
knowledge_level: K2
domains:
  - Tech
  - Delivery
affected_modules:
  - cli
antecedent: WI-071
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
            21 verdes, incluidas las regresiones nuevas: URL compartida → 0;
            identificador/código en learning → 0; continuidad de shingles por
            bloque en ambas direcciones (pasaje partido → 0) y control positivo
            (contiguo en ambos documentos → 1).
scope_confidence:
  level: high
  reasons:
    - >-
      Antecedente directo de WI-071. Ajuste puntual de precisión del detector de
      redundancia y de la clasificación de learning; no cambia el contrato
      CLI/MCP ni amplía el alcance.
    - >-
      Cada corrección tiene una prueba de regresión determinística; se incluye
      un control positivo para garantizar que la detección real no se desactiva.
    - >-
      Core se mantiene determinístico y de solo lectura sobre `knowledge/`; sin
      LLMs ni similitud pesada.
summary: >-
  Refuerza la precisión de Knowledge Consolidation: las URLs compartidas y el
  código/identificadores dejan de activar reglas de lenguaje natural, y la
  continuidad de pasajes se verifica por bloque (un pasaje partido por un salto
  de párrafo/sección ya no cuenta como contiguo). Los solapamientos de contenido
  reales se conservan.
ready_at: '2026-11-01'
verified_at: '2026-11-01'
---

# Knowledge Consolidation Shingle Precision Fix

## Antecedente

WI-071 (v3.129.1) movió la detección de redundancia a solapamiento de contenido por pasaje contiguo
y la clasificación de learning a nivel de frase. La revisión posterior pidió tres ajustes puntuales de
precisión, sin ampliar el alcance.

## Problema

En `packages/cli/src/core/knowledge-consolidation.ts`:

1. **URLs compartidas.** Una URL idéntica en dos documentos (p. ej. una referencia o enlace de spec)
   aportaba palabras al shingle y podía contribuir a un falso solapamiento.
2. **Identificadores / bloques de código.** El código fenced e inline (p. ej. `` `must_validate()` ``)
   aportaba palabras a los shingles y, en la sección Learning, un identificador con `must`/`debe` podía
   activar la clasificación normativa.
3. **Continuidad no verificada.** `contentWords` aplanaba todo el cuerpo en un único array, de modo que
   una "racha contigua" podía unir pasajes separados por un salto de párrafo, encabezado o lista — una
   continuidad aparente, no real.

## Corrección implementada

Todo en `knowledge-consolidation.ts`, determinístico y de solo lectura:

1. **`stripNoise`** elimina bloques fenced, inline code y URLs antes de tokenizar (redundancia) y antes
   de clasificar el learning.
2. **`contentBlocks`** segmenta la prosa en bloques (párrafos e ítems de lista), cerrando bloque en
   línea en blanco, encabezado, cita, código o marcador de lista.
3. **Shingles y `longestSharedRun` por bloque:** la racha contigua se calcula dentro de un bloque y
   nunca lo cruza, así que un pasaje compartido es realmente contiguo. La verificación es por documento
   y en ambas direcciones del par.

## Before / After

- **URL compartida** (y contenido por lo demás distinto) — antes: podía contar; después: 0 redundancia.
- **Identificador `must_validate_schema()` en un learning** — antes: podía clasificarse como regla;
  después: no es regla (0 candidato).
- **Pasaje de 12 palabras partido por un salto de párrafo en uno de los documentos** — antes: la racha
  aplanada lo unía; después: 0 (no es contiguo). Control positivo: contiguo en ambos documentos → 1.

## Out of Scope

- Nuevas funcionalidades de Admin.
- Aplicación automática de consolidaciones.
- Rediseño de Knowledge Consolidation o de su ciclo de vida.
- Integración de LLM en Core o similitud semántica pesada.
- Cambios no relacionados con la precisión del detector.

## Acceptance Criteria

- [x] AC-01: una URL compartida por sí sola no genera un candidato de redundancia.
- [x] AC-02: identificadores y bloques de código no activan reglas de lenguaje natural (ni redundancia ni learning).
- [x] AC-03: la continuidad de shingles se verifica por bloque, en ambos documentos; un pasaje partido por un salto de párrafo no cuenta como contiguo.
- [x] AC-04: se conserva la detección de solapamiento real (control positivo) sin perder candidatos legítimos.
- [x] AC-05: CLI y MCP conservan compatibilidad de contrato.
- [x] AC-06: el análisis no modifica conocimiento canónico.
- [x] AC-07: las pruebas de regresión y la suite completa están en verde.
- [x] AC-08: la implementación se revisa localmente antes del commit.

## Validation

- `packages/cli/tests/knowledge-consolidation.test.ts` (21 verdes), con las regresiones nuevas: URL
  compartida → 0; identificador/código en learning → 0; continuidad por bloque en ambas direcciones
  (pasaje partido → 0) y control positivo (contiguo en ambos → 1).
- Build de `@kaddo/cli`; suite completa de vitest.
- Dogfooding `kaddo knowledge consolidate` sobre Kaddo con `git status knowledge/` limpio tras el
  análisis (AC-06).

## Definition of Done

- Las tres correcciones de precisión implementadas con regresiones y control positivo.
- Solapamientos reales conservados (Kaddo: 2 redundancias verbatim legítimas).
- Contrato CLI/MCP sin cambios.
- Implementation Evidence registrada.

## Commit Gate

Aprobado explícitamente por el usuario para implementar y publicar como v3.129.2 (Fase 1).

---

## Learning

Liberado en v3.129.2 como ajuste puntual de precisión sobre WI-071.

- **La "continuidad" de un pasaje es una propiedad de bloque, no del documento aplanado.** El defecto
  latente era que `contentWords` concatenaba todo el cuerpo, permitiendo que una racha contigua uniera
  pasajes de secciones distintas. Segmentar en bloques (párrafos/ítems) y calcular la racha dentro de
  un bloque resolvió la continuidad de raíz. La verificación debe ser **por documento y en ambas
  direcciones**, porque el matcher es direccional (racha de A presente en el set de B).
- **El control positivo es tan importante como el negativo.** Al endurecer un detector es fácil
  "arreglarlo" desactivándolo; el test que exige candidato cuando el pasaje es contiguo en ambos
  documentos evita esa regresión silenciosa.
- **Normalizar el ruido antes de analizar.** URLs y código (fenced/inline) no son lenguaje natural:
  aportaban falsos solapamientos y podían activar reglas normativas desde un identificador. Un único
  `stripNoise` aplicado tanto a redundancia como a la clasificación de learning cierra ambas vías.

**Conocimiento a vigilar:** la segmentación en bloques trata cada ítem de lista como bloque propio; si
un proyecto documenta pasajes largos en listas, podría requerir revisar el umbral. Ajustar con
dogfooding real, nunca subiendo el conteo como objetivo.
