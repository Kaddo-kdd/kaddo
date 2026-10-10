---
id: RB-001
type: production-runbook
title: Runbook de verificación para DEP-001
deprecation_plan: DEP-001
target: DEP-TGT-OPENSPEC-WORKFLOW
approval:
  required: true
  status: pending
  approved_by: null
  approved_at: null
---

## Purpose

Registrar la frontera de producción para el dogfooding de `DEP-001`. El retiro se limita a referencias
operativas de workflow y no modifica datos, infraestructura, servicios ni artefactos de producción.

## Preconditions

- El target está validado con evidencia estática, runtime y revisión humana.
- Las referencias históricas se conservan como evidencia de migración.

## Dependencies

- `DEP-001` y la evidencia de uso asociada.
- Revisión humana de la frontera de producción.

## Backup/Recovery

No hay datos, infraestructura ni configuración de producción que respaldar o restaurar. Si se descubre
una dependencia operativa, se aborta y se vuelve a `usage-validated`.

## Impact

El cambio solo elimina referencias operativas de workflow ya sustituidas por el build contract Kaddo-Native.
Las referencias históricas permanecen intactas.

## Execution Order

1. Confirmar que no existe una dependencia operativa.
2. Confirmar la aprobación humana.
3. Cerrar el plan sin ejecutar comandos de producción.

## Commands

```bash
kaddo deprecation status DEP-001
kaddo graph export --scope all --format json
```

## Expected Results

- El target permanece `completed`.
- El grafo contiene el plan y el target.
- No se ejecuta una operación de producción.

## Validation

```bash
kaddo status
kaddo graph --scope all
```

## Rollback

Restaurar el target a `usage-validated`, registrar la dependencia encontrada y detener el cierre.

## Abort conditions

Detener el cambio si una referencia activa revela una dependencia operativa de OpenSpec; registrarla
como evidencia y volver el target a `usage-validated`.

## Observation Window

No se inicia una ventana de producción porque no hay cambio de producción. La verificación histórica y
la aprobación humana son la evidencia de cierre.

## Approval

Requiere aprobación humana antes de considerar cerrado el plan. Este documento no autoriza operaciones
destructivas ni sustituye esa aprobación.

## Evidence

No se ejecutó ninguna operación de producción. Este runbook documenta la decisión y la ausencia de
una acción destructiva, no autoriza ni contiene comandos de producción.
