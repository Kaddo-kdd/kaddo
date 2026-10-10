---
title: Deprecación controlada
description: Retira funcionalidad legacy con evidencia, ambientes por etapas y una frontera de producción controlada por humanos.
---

La Deprecación controlada convierte una eliminación riesgosa en un lifecycle trazable. Kaddo registra
el conocimiento necesario para decidir qué puede retirarse; nunca concluye que algo no se usa solo
porque una búsqueda de código no encontró referencias.

## Lifecycle

Crea un Deprecation Plan versionado bajo `knowledge/legacy/deprecations/`. Cada target avanza por
`candidate` → `usage-validated` → `soft-deprecated` → `disabled` → `removed-devtest` →
`production-ready` → `production-changed` → `observing` → `completed`.

La evidencia de uso mantiene separadas las señales estáticas, runtime, base de datos, consumidores
externos y revisión humana. La evidencia ausente sigue siendo desconocida; nunca prueba ausencia de uso.

## Despliegue seguro

1. Identifica el target y sus módulos, resources y targets dependientes.
2. Valida uso, blast radius, reversibilidad y orden de retiro.
3. Aplica primero una soft deprecation, observa criterios de salida y retira en development y test.
4. Verifica el resultado y genera un Production Runbook cuando producción esté afectada.

Producción permanece bajo control humano. Kaddo puede preparar el runbook y registrar evidencia, pero
nunca ejecuta cambios destructivos de producción de forma autónoma.

## Resources y proyectos multirepo

Un target puede referenciar un Project Resource y un módulo de un proyecto multirepo. El Knowledge
Graph expone relaciones de plan, target, módulo/resource, Work Item y `depends_on_removal`, para
inspeccionar waves antes de actuar.

## Comandos

```bash
kaddo deprecation list
kaddo deprecation show DEP-001
kaddo deprecation status DEP-001
kaddo graph export --scope all --format json
```

La sección **Deprecations** de Admin ofrece la misma vista de solo lectura: summary, pipeline de
lifecycle, matriz de ambientes, waves de retiro y runbooks relacionados.
