---
title: Consolidación de Conocimiento
description: Revisa cómo está organizado y conectado tu conocimiento canónico y obtén oportunidades revisables para consolidarlo, relacionarlo y refinarlo — sin perder historia, decisiones ni evidencia, y sin ninguna edición automática.
---

A medida que un proyecto evoluciona, su conocimiento acumula problemas que no son errores
individuales: el mismo hecho repetido en varios artifacts, un aprendizaje que quedó enterrado en un
Work Item completado, conceptos que podrían relacionarse y no lo están, documentación que se
desactualizó, o muchos archivos pequeños difíciles de leer en conjunto.

**Knowledge Consolidation** es una capacidad de revisión —conceptualmente cercana a un `/compact`,
pero orientada al conocimiento *persistente* del proyecto, no al contexto temporal de una
conversación—. Su objetivo no es producir resúmenes indiscriminados; es hacer el conocimiento más
preciso, conectado, consistente, reutilizable y fácil de recuperar.

:::note[El análisis nunca edita el conocimiento]
`kaddo knowledge consolidate` solo **lee** `knowledge/` y escribe un plan derivado y de solo revisión
bajo `.kaddo/`. Nunca modifica artifacts canónicos, nunca ejecuta un LLM y nunca hace commit.
:::

## Qué produce

```bash
kaddo knowledge consolidate
```

Escribe un **Consolidation Plan** revisable:

- `.kaddo/consolidation-plan.md` — vista previa legible.
- `.kaddo/consolidation-plan.json` — oportunidades estructuradas para agentes/herramientas.

Cada oportunidad lleva su categoría, clasificación, confianza, artifacts de origen y destino sugerido,
evidencia, justificación, posible impacto y una acción propuesta.

## Alcance

```bash
kaddo knowledge consolidate --layer tech      # una capa de conocimiento
kaddo knowledge consolidate --module payments # artifacts que afectan a un módulo mapeado
kaddo knowledge consolidate --scope all       # proyecto completo (por defecto)
```

El plan siempre informa su **cobertura** —qué capas y cuántos artifacts/Work Items evaluó, y qué
excluyó un alcance más acotado— para que sepas qué se miró y qué no.

## La frontera determinístico / semántico

Esta es la regla central de la capacidad (y lo que la hace confiable):

- **Determinístico (Core):** los hechos que Kaddo puede verificar desde los archivos —relaciones
  opcionales ausentes (reutilizando graph hints), referencias a decisiones inexistentes, calidad de
  artifacts— se emiten como oportunidades `observed`.
- **Semántico (agente + skill):** todo lo que requiere criterio contextual —si dos documentos son
  realmente redundantes, si un aprendizaje histórico sigue siendo una regla vigente, si dos artifacts
  se contradicen de verdad— se emite como **candidato** `suggested`, marcado
  `requires_semantic_review`. Core nunca presenta esto como hecho.

Cada hallazgo se clasifica como **Observed / Derived / Suggested / Unknown**. La capa determinística
nunca ejecuta un LLM; la revisión semántica la realizan la skill `knowledge-consolidation` y el agente
`knowledge-consolidation-agent`, que proponen refinamientos para aprobación humana.

## Categorías

| Categoría | Qué revela |
|---|---|
| `knowledge_redundancy` | Dos documentos de conocimiento (capa, ADRs o Initiatives) que repiten un **pasaje literal** de contenido distintivo (candidato) |
| `unincorporated_learning` | Un Work Item completado cuyo learning contiene una **frase tipo regla** que podría pertenecer al conocimiento vigente (candidato) |
| `knowledge_fragmentation` | Varios artifacts **canónicos** de baja señal en una carpeta que podrían leerse mejor consolidados (candidato) |
| `relationship_opportunity` | Una relación opcional ausente en el grafo (observed, desde graph hints) |
| `potentially_outdated` | Una inconsistencia verificable, p. ej. una referencia a una decisión que ya no existe (observed) |
| `knowledge_organization` | Un documento de **conocimiento canónico** placeholder/débil que conviene ampliar o fusionar (evidencia observed; la acción requiere revisión) |

**Reglas de precisión que mantienen confiables los candidatos:**

- **La redundancia es por contenido, nunca por estructura.** Dos ADRs o dos Initiatives que comparten
  títulos de sección (`Decision`, `Consequences`, `Expected value`…) por una plantilla común *no* son
  un candidato; solo lo es un pasaje literal compartido de prosa distintiva. Los Work Items, el roadmap
  y el andamiaje reutilizable (agents/skills/capsules) quedan excluidos de la comparación.
- **Un learning requiere una regla, no un resultado.** Una frase se marca solo cuando se lee como una
  regla durable (un modal o un sustantivo de regla); compilaciones exitosas, benchmarks, resultados de
  pruebas y de experimentos no. Se conserva la frase exacta que disparó la detección —no el inicio de
  la sección—.
- **El destino del learning queda sin resolver.** Core nunca inventa un artifact destino; lo deja para
  la revisión semántica en lugar de concentrar todo en un solo archivo.
- **La organización considera la naturaleza del artifact.** Solo califican los documentos canónicos de
  Business/Product/Tech; los Work Items (unidades históricas independientes), inventarios generados,
  deprecaciones, initiatives y Project Resources no reciben recomendaciones narrativas de consolidación
  solo por ser breves.

## Cómo se relaciona con otras capacidades de Kaddo

La consolidación **reutiliza** las fundaciones existentes en lugar de duplicarlas: knowledge
discovery, calidad de artifacts, el grafo de conocimiento y sus hints, el vocabulario compartido de
reporting-evidence, y el lifecycle/learning de Work Items. Complementa a `learn` (que registra un
aprendizaje) preguntando si ese aprendizaje pertenece al conocimiento vigente; complementa a
`guard`/`drift` usando sus señales como evidencia; y complementa a `graph` convirtiendo hints en
oportunidades de relación.

## Revisión humana e integridad canónica

Toda consolidación que cambie conocimiento requiere revisión. El análisis y la vista previa nunca
modifican artifacts canónicos. Al actuar sobre una propuesta, la revisión:

- preserva información histórica, decisiones y razones, excepciones, riesgos conocidos, contratos
  técnicos, evidencia de implementación y procedencia;
- mantiene la separación de capas (Business / Product / Tech / Delivery);
- incorpora un aprendizaje solo con una referencia a su Work Item de origen —sin resumirlo ni
  eliminarlo—;
- presenta ambos lados de una inconsistencia potencial en lugar de elegir una verdad;
- aplica los cambios aprobados mediante los flujos de edición controlada existentes de Kaddo —nunca un
  commit automático—.

## Evitar la sobre-optimización

Menos archivos, menos palabras o más aristas en el grafo **no** son objetivos en sí mismos. El plan
protege la información valiosa: propone consolidación solo cuando aporta claridad, y nunca trata un
artifact antiguo como obsoleto solo por su antigüedad.

## Staleness y repetibilidad

El plan registra un fingerprint de contenido por cada archivo fuente que leyó. Si una fuente cambia
después, el plan puede reconocerse como potencialmente desactualizado, de modo que una propuesta
anterior nunca se trata como vigente sin volver a comprobar sus fuentes. Reejecutar el análisis
permite comparar resultados sin inventar indicadores de mejora.

## Seguridad y privacidad

La consolidación aplica las políticas de lectura segura de Kaddo: respeta los límites de acceso y
alcance, nunca revela valores de credenciales, nunca resuelve referencias secretas, nunca se conecta a
un Project Resource y nunca ejecuta comandos encontrados en documentos.

## MCP

El mismo análisis está disponible para agentes vía el tool `kaddo_generate_consolidation_plan`
(con `layer`/`module` opcionales), y el resultado se expone en solo lectura en
`kaddo://consolidation-plan`. Core produce el análisis determinístico, MCP da acceso estructurado, el
agente/skill hace la revisión semántica y un humano aprueba.

## Explorer en Admin

Kaddo Admin incluye un **Knowledge Consolidation Explorer** (Reports → Knowledge Consolidation, o el
acceso "Review Knowledge Consolidation" en la página de Knowledge) en `/reports/consolidation`. Es una
vista para explorar y preparar revisiones — nunca aplica cambios al conocimiento:

- **Generar / regenerar** un plan para todo el proyecto, una capa o un módulo. La generación reutiliza
  Core y solo escribe `.kaddo/consolidation-plan.{json,md}`; `knowledge/` nunca se modifica.
- **Dashboard** con totales, cuántos hallazgos requieren revisión semántica, cobertura y una
  distribución por categoría — oportunidades a revisar, nunca errores confirmados.
- **Explorer de oportunidades**: búsqueda por id/título/referencia y filtros por categoría,
  clasificación y necesidad de revisión; cada oportunidad abre un detalle con su evidencia,
  justificación, referencias de origen/destino (una referencia copiable cuando no hay página en la app)
  y la nota de destino sin resolver.
- **Staleness**: cuando una fuente registrada cambió, el plan se marca como stale (con las fuentes
  afectadas) y puede seguir explorándose o regenerarse.
- **Exportar** el snapshot persistido exacto como Markdown o JSON (nunca se recalcula).
- **Copy Agent Handoff**: produce una instrucción estructurada para el `knowledge-consolidation-agent`
  que trata la evidencia como dato no confiable y pide aprobación humana antes de cualquier cambio. No
  se ejecuta ningún agente ni se llama a un LLM desde Admin.
