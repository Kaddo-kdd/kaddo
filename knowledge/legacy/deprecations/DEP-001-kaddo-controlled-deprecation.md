---
id: DEP-001
type: deprecation-plan
title: Retiro controlado de referencias operativas de OpenSpec
status: completed
targets:
  - id: DEP-TGT-OPENSPEC-WORKFLOW
    type: config
    title: Referencias operativas de OpenSpec
    locator: knowledge/delivery + contribution workflow
    module: cli
    lifecycle: completed
    environments:
      development: removed
      test: removed
      production: removed
    assessment:
      unused_confidence: high
      blast_radius: low
      reversibility: high
    usage_evidence:
      static:
        status: no-usage
        quality: observed-fact
        detail: No hay dependencias operativas de OpenSpec en el árbol de trabajo.
      runtime:
        status: no-usage
        quality: observed-fact
        detail: El CLI no registra comandos ni artefactos operativos de OpenSpec.
      human_review:
        status: no-usage
        quality: human-confirmed
        detail: Se confirmó que las referencias históricas en migraciones y WIs completados deben conservarse.
    soft_deprecation:
      strategy: deprecation-warning
      mechanism: El build contract declara Kaddo-Native y prohíbe crear nuevos artefactos OpenSpec.
      started_at: '2026-10-10'
      observation_window_days: 0
      exit_criteria:
        - description: El build contract y las guías no declaran OpenSpec como dependencia operativa.
          met: true
        - description: Las referencias históricas se mantienen como evidencia y no como instrucciones operativas.
          met: true
---

# Purpose

Dogfooding del lifecycle de Controlled Deprecation sobre el retiro ya completado de las referencias
operativas de OpenSpec. El objetivo no fue borrar historia: las referencias en migraciones y Work
Items completados se conservan como evidencia, mientras que el workflow activo quedó Kaddo-Native.

## Evidence trail

1. **Identify**: OpenSpec era una dependencia histórica del flujo de delivery.
2. **Validate**: búsqueda estática, inspección del CLI y revisión humana confirmaron que no existe
   una dependencia operativa.
3. **Soft deprecate**: el build contract anunció el workflow Kaddo-Native y bloqueó artefactos nuevos.
4. **Observe**: se verificó que la documentación activa, los comandos y los WIs nuevos usan Kaddo.
5. **Remove Dev/Test**: se retiraron las rutas operativas sin eliminar la evidencia histórica.
6. **Verify**: `kaddo status`, tests y builds confirman el estado actual.
7. **Runbook**: `RB-001` registra la frontera de producción; no hubo cambio destructivo de producción.

## Outcome

El target está completado. No existe una acción de producción pendiente y no se eliminó evidencia
histórica necesaria para comprender la evolución del proyecto.
