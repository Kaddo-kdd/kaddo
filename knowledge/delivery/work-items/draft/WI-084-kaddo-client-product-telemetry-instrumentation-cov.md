---
type: feature
id: WI-084
title: Kaddo Client — Product Telemetry Instrumentation & Coverage
status: draft
work_type: feature
created_at: '2026-11-16'
source:
  type: external
  imported_at: '2026-11-16'
  source_format: markdown
  source_hash: 76d3474e1f525013d2c2bb004fe45cb1ddaafe52ea5ad77f8c6a875d4710c2e9
  inferred: false
generated_by: kaddo-admin
affected_modules: []
summary: >-
  Como maintainer quiero medir adopción y uso con observaciones reales del
  cliente. Dependencia: desplegar el contrato 1.1 de kaddo-telemetry WI-111
  antes de activar la emisión. Referencia: docs/product-telemetry.md del
  collector.
original_snapshot:
  title: Kaddo Client — Product Telemetry Instrumentation & Coverage
  description: >-
    Como maintainer quiero medir adopción y uso con observaciones reales del
    cliente. Dependencia: desplegar el contrato 1.1 de kaddo-telemetry WI-111
    antes de activar la emisión. Referencia: docs/product-telemetry.md del
    collector.
---

# Kaddo Client — Product Telemetry Instrumentation & Coverage

Como maintainer quiero medir adopción y uso con observaciones reales del cliente. Dependencia: desplegar el contrato 1.1 de kaddo-telemetry WI-111 antes de activar la emisión. Referencia: docs/product-telemetry.md del collector.

## Alcance
Enviar la versión del cliente. Generar y persistir un pseudónimo estable por proyecto y por Work Item. Emitir acciones de creación, refinamiento y finalización. Reportar tecnologías normalizadas e interacciones de IA con etiquetas públicas permitidas. Enviar tokens únicamente desde fuentes explícitas y conservar su procedencia. Declarar contexto de proyecto y capacidad de reporte cuando corresponda. Conservar registro, opt-in y transporte firmado actuales.

## Acceptance Criteria
- Verificar el contrato mediante fixtures compartidos y envío firmado.
- Verificar estabilidad de identidades, reintentos y exclusión de datos sensibles.
- Medir cobertura real: versión 100 %, identidad de proyecto y WI al menos 95 % de los eventos elegibles.
- Validar muestras pequeñas y documentar las dimensiones aún no observables.
