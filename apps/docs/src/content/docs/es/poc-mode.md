---
title: Modo Proof of Concept
description: Ejecuta un experimento enfocado en evidencia sin adoptar todo el ciclo de producto.
---

El modo de proyecto es independiente del estado. El estado describe el repositorio (`new`,
`pre-ai` o `legacy`); el modo describe cómo Kaddo debe guiar el trabajo.

Usa `poc` cuando el objetivo inmediato es validar una hipótesis, no planificar un roadmap de
producto completo.

```bash
kaddo init --mode poc
# o, para un proyecto existente
kaddo project mode poc
```

Los proyectos existentes permanecen en modo `standard` cuando `project.mode` no existe.

## Ruta POC

```mermaid
flowchart LR
  A[Activar Kaddo] --> B[Hipótesis]
  B --> C[Criterios de éxito]
  C --> D[Contexto técnico mínimo]
  D --> E[Recursos]
  E --> F[Work Item de experimento]
  F --> G[Evidencia]
  G --> H[Conclusión]
```

El artefacto canónico es `knowledge/delivery/poc.md`. Registra:

- Problema
- Hipótesis
- Valor esperado
- Escenario
- Criterios de éxito
- Restricciones
- No objetivos
- Evidencia
- Conclusión: `validated`, `rejected` o `inconclusive`

El modo POC queda listo después de inicializarse: define la hipótesis y los criterios de éxito en
`poc.md`, y crea un `spike` cuando el experimento esté claro. No exige la línea base estándar de
Business/Product, un roadmap ni un mapa completo de capacidades. Agrega contexto técnico y
Project Resources únicamente cuando el experimento los necesite.

Ejecuta `kaddo understand`, `kaddo context` o consulta `kaddo://poc` mediante MCP para ver el
estado POC y el siguiente paso recomendado.

## Graduar o finalizar

Cuando la evidencia justifique una iniciativa de delivery duradera, vuelve al flujo estándar y
crea la línea base restante:

```bash
kaddo project mode standard
kaddo bootstrap
```

Cuando la evidencia rechace o no pueda establecer la hipótesis, registra la conclusión en
`poc.md` y conserva la traza de decisión sin crear artefactos de planificación innecesarios.
