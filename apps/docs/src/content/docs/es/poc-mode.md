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
kaddo add agents
kaddo add skills
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
  H --> I["Informe final opcional"]
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

Instala los agentes y las skills durante la configuración inicial de la POC. Proveen el contexto
guiado de refinamiento e implementación sin crear una línea base estándar de Business/Product.

Ejecuta `kaddo understand`, `kaddo context` o consulta `kaddo://poc` mediante MCP para ver el
estado POC y el siguiente paso recomendado.

## Informe final de POC

`poc.md` continúa siendo el artefacto de trabajo y la fuente canónica del experimento. El informe
final es un snapshot de comunicación opcional e inmutable, disponible únicamente cuando la
conclusión es `validated`, `rejected` o `inconclusive`. No bloquea el cierre de la POC ni cambia
la conclusión canónica.

```bash
kaddo poc report
```

El comando prepara contexto determinista y trazable; no llama a un LLM ni escribe un informe. Un
agente sintetiza una propuesta desde ese contexto, una persona la revisa y Core persiste una versión
confirmada junto a `poc.md`: `poc-report-v001.md`, luego `poc-report-v002.md`, etc. Las versiones
anteriores nunca se sobrescriben.

Kaddo registra un fingerprint de las fuentes seleccionadas. El informe puede estar `missing`,
`current` o `stale`; la nueva evidencia lo vuelve stale pero no lo regenera automáticamente. La
regeneración crea la siguiente versión solo con confirmación explícita. El contexto incluye
`poc.md` y únicamente Work Items de experimento, evidencia, Resources, conocimiento Tech y
decisiones con trazabilidad directa. Excluye valores de credenciales, tokens, llaves privadas,
contraseñas y cadenas de conexión.

La estructura canónica del informe es:

1. Executive Summary
2. Problem and Objective
3. Hypothesis and Success Criteria
4. Scope, Constraints and Non-goals
5. Technical Approach and Architecture
6. Infrastructure and Project Resources
7. Implementation and Relevant Technical Decisions
8. Experiments and Validation
9. Results and Measurements
10. Cost and Efficiency Analysis
11. Observability and Operational Findings
12. Findings, Learnings, Limitations and Risks
13. Conclusion
14. Recommendation and Next Steps
15. Traceability and Sources

### Representación basada en evidencia

Elige la forma que comunique con mayor claridad la evidencia entregada. Las tablas y los diagramas
son herramientas de comunicación, no requisitos de completitud: no agregues ninguno solo para que
el informe parezca más completo. Usa prosa para contexto e interpretación, tablas Markdown para
evidencia comparable y Mermaid para arquitectura, topología o flujos respaldados. No inventes
filas, métricas, prioridades, componentes ni relaciones. Prefiere Mermaid frente a diagramas ASCII
cuando ambos puedan expresar el mismo flujo respaldado.

| Sección | Representación preferida cuando la evidencia la respalda |
|---|---|
| Executive Summary | Tabla snapshot y prosa breve |
| Problem and Objective | Prosa |
| Hypothesis and Success Criteria | Matriz de evaluación |
| Scope, Constraints and Non-goals | Lista compacta o tabla |
| Technical Approach and Architecture | Mermaid y prosa |
| Infrastructure and Project Resources | Tabla, con Mermaid opcional |
| Implementation and Relevant Technical Decisions | Tabla o prosa concisa |
| Experiments and Validation | Matriz de validación |
| Results and Measurements | Tablas de mediciones |
| Cost and Efficiency Analysis | Tabla comparativa |
| Observability and Operational Findings | Tabla o prosa |
| Findings, Learnings, Limitations and Risks | Matriz estructurada |
| Conclusion | Estado y prosa concisa |
| Recommendation and Next Steps | Matriz de recomendaciones cuando exista prioridad sustentada |
| Traceability and Sources | Tabla o lista con enlaces relativos |

Por ejemplo, una matriz de criterios de éxito es útil cuando cada resultado tiene evidencia directa:

| Criterio de éxito | Estado | Evidencia |
|---|---|---|
| Endpoint API disponible | Passed | Verificación end-to-end |
| Tres escenarios validados | Passed | 3/3 resultados registrados |

Cuando las fuentes seleccionadas describan una relación o flujo real, usa un diagrama Mermaid
respaldado:

```mermaid
flowchart LR
  Client --> API
  API --> Rules
  Rules --> Result
```

Del mismo modo, los Project Resources son más fáciles de revisar como tabla cuando las fuentes
proporcionan atributos comparables:

| Recurso | Tipo / proveedor | Propósito | Ambiente |
|---|---|---|---|
| `RES-model` | Proveedor de IA | Inferencia de modelo | `poc` |
| `RES-monitoring` | Servicio de monitoreo | Observabilidad del experimento | `poc` |

La trazabilidad debe ser portable entre GitHub, Kaddo Admin y clones locales. Usa enlaces relativos
al repositorio como `[Definición POC](./poc.md)` o
`[WI-001](./work-items/completed/WI-001.md)`; nunca URL `file:///` ni rutas locales absolutas.

Las secciones sin evidencia deben indicar `Not evaluated in this POC.`, `Not applicable.` o `No
evidence available.` en lugar de inventar datos. El informe puede recomendar graduar al modo
standard, pero la decisión de ejecutar `kaddo project mode standard` siempre es humana.

## Graduar o finalizar

Cuando la evidencia justifique una iniciativa de delivery duradera, vuelve al flujo estándar y
crea la línea base restante:

```bash
kaddo project mode standard
kaddo bootstrap
```

Cuando la evidencia rechace o no pueda establecer la hipótesis, registra la conclusión en
`poc.md` y conserva la traza de decisión sin crear artefactos de planificación innecesarios.
