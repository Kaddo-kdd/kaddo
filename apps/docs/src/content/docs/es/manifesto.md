---
title: Manifiesto Kaddo
description: Knowledge Driven Development — software guiado por conocimiento, arquitectura viva, contexto mínimo y evolución trazable.
---

El software no se degrada solamente porque el código envejece. Se degrada porque el conocimiento se pierde.

Se pierde en reuniones que nadie documentó, en chats imposibles de buscar, en tickets cerrados sin contexto, en decisiones arquitectónicas que quedaron en la cabeza de alguien, en sistemas legacy que siguen funcionando aunque nadie sepa exactamente por qué, y en cambios que parecen pequeños pero terminan afectando partes críticas del producto. Durante años aceptamos esta pérdida como parte normal del desarrollo de software.

Kaddo parte de una idea distinta: el conocimiento del producto debe ser tratado como una pieza viva del sistema. No como documentación decorativa, no como un trámite después de programar, ni como un cementerio de archivos Markdown que nadie vuelve a leer. El conocimiento debe guiar cómo entendemos, diseñamos, cambiamos, validamos y evolucionamos el software.

A eso lo llamamos **Knowledge Driven Development.**

## La idea central

Kaddo propone un ciclo simple:

**Clasifica → Captura → Estructura → Construye → Aprende**

Cada cambio debería poder responder:

- ¿Qué se quiere cambiar?
- ¿Por qué se quiere cambiar?
- ¿Qué parte del producto impacta?
- ¿Qué conocimiento existente se ve afectado?
- ¿Qué decisión, diseño o contexto debe actualizarse?
- ¿Qué aprendimos después de hacer el cambio?

El objetivo no es escribir más documentación. El objetivo es preservar el conocimiento mínimo suficiente para que humanos e inteligencia artificial puedan construir software con menos ambigüedad, menos retrabajo y más trazabilidad.

## El macro-flujo de un proyecto

Por debajo de ese ciclo por cambio, Kaddo enmarca el proyecto como un todo a través de cuatro capas macro:

**Business → Product → Tech → Delivery**

Este es el macro-concepto que gobierna el proyecto de punta a punta. Cada capa responde una pregunta y se mantiene conectada con la de arriba:

- **Business** — _¿por qué existe?_ problema, usuarios, restricciones, reglas de negocio, valor.
- **Product** — _¿qué construimos?_ product brief, capacidades, alcance, objetivos.
- **Tech** — _¿cómo lo construimos?_ codebase, decisiones, módulos, stack, estándares.
- **Delivery** — _¿cómo lo evolucionamos?_ roadmap, work items, ownership, aprendizaje.

El conocimiento fluye hacia abajo por estas capas — así product responde a business, tech responde a product y delivery responde a las tres. Físicamente, el repositorio de conocimiento las refleja: `knowledge/business/`, `knowledge/product/`, `knowledge/tech/`, `knowledge/delivery/`.

Cada estado de proyecto entra y recorre estas capas de forma distinta:

- **new** — empieza en Business y construye las capas desde una idea (es lo que hace `kaddo bootstrap` hoy).
- **pre-AI** — _fases por definir._ Las capas ya existen implícitas en el código; Kaddo las reconstruye hacia arriba como conocimiento explícito.
- **legacy** — _fases por definir._ Las capas se entran con cautela, entendiendo antes de cambiar.

El ciclo por cambio (Clasifica → Captura → Estructura → Construye → Aprende) opera _dentro_ de estas capas; las capas le dan forma al proyecto, el ciclo lo mantiene vivo.

## El problema que Kaddo quiere resolver

Muchos equipos no tienen un problema de herramientas. Tienen un problema de contexto.

El código existe, pero el razonamiento detrás del código no siempre existe. La arquitectura existe, pero no siempre está conectada con las decisiones que la formaron. El roadmap existe, pero no siempre está conectado con las capacidades reales del producto. Los tickets existen, pero no siempre explican el impacto. La documentación existe, pero muchas veces está desactualizada.

Y ahora, con IA, este problema se vuelve más grande. Un agente de IA sin contexto no construye sobre conocimiento: construye sobre suposiciones.

Por eso Kaddo no pone la IA al inicio del proceso. Primero organiza el conocimiento; después permite que la IA ayude a construir. La IA no reemplaza el conocimiento del producto: la IA necesita buen conocimiento para ser útil.

## La estrella polar

La pregunta central de Kaddo es:

**¿Cómo sabe Kaddo que el conocimiento correcto fue impactado por este cambio?**

Esa pregunta guía todo el sistema. No se trata solo de saber qué archivos cambiaron, sino de entender qué artifacts, decisiones, dominios, capacidades, contratos o riesgos podrían estar relacionados con ese cambio.

Si alguien modifica `src/payments/**`, Kaddo debería poder sugerir:

> "Este cambio toca el dominio de pagos. Existe un ADR, una capability o un contrato relacionado. Revise si el conocimiento sigue siendo válido."

Eso no necesita magia desde el primer día. Necesita una relación clara entre código y conocimiento.

## Principio central

El conocimiento guía la evolución del producto. El ciclo esperado es:

```
Conocimiento → Contexto → Arquitectura → Decisiones → Roadmap → Work Items → Código → Aprendizaje → Conocimiento actualizado
```

El código no debería evolucionar desconectado del conocimiento. Cada cambio importante debería fortalecer la comprensión del sistema, no volverlo más opaco.

Los frameworks pueden cambiar, los modelos de IA pueden cambiar, las herramientas pueden cambiar y los equipos pueden cambiar. Pero el conocimiento del producto debe sobrevivir.

## Qué es Kaddo

Kaddo es un toolkit open source para aplicar Knowledge Driven Development en proyectos nuevos, existentes o legacy. No busca ser solamente un boilerplate para agentes de IA, ni reemplazar herramientas de gestión, frameworks de agentes, plataformas de orquestación, metodologías ágiles o sistemas de documentación.

Kaddo busca ocupar una capa más profunda: la capa del conocimiento vivo del producto. Su propósito es ayudar a los equipos a crear productos más entendibles, gobernables, trazables, evolucionables y menos dependientes de memoria oral.

Kaddo no quiere generar documentación por generar documentación. Quiere que el conocimiento correcto esté disponible cuando el equipo o un agente lo necesita.

## Qué no es Kaddo

Kaddo no es un reemplazo para Jira, Linear, GitHub Issues o Trello. No es un framework de agentes, ni una plataforma de IA, ni una metodología pesada. No es un sistema enterprise que obliga a mapear toda la empresa antes de escribir una línea de código, ni una excusa para burocratizar el desarrollo.

Kaddo debe pedir poco, aportar rápido y crecer solo cuando el proyecto lo necesite. La regla es simple: más contexto cuando hay más riesgo; menos contexto cuando el cambio es simple. Porque no todos los cambios merecen el mismo nivel de análisis.

Cambiar un texto no debería requerir un comité, pero migrar pagos sí merece más cuidado. Actualizar un color no necesita un ADR, pero cambiar una integración crítica probablemente sí. Kaddo debe entender esa diferencia.

## Minimum Sufficient Knowledge

Uno de los principios más importantes de Kaddo es el conocimiento mínimo suficiente. No se trata de pedir documentos, sino de pedir las respuestas necesarias según el impacto del cambio.

Kaddo organiza esto en niveles de conocimiento:

**K0 — Cambio trivial.** Cambios pequeños como texto, CSS o ajustes visuales menores. No requieren contexto adicional.

**K1 — Hotfix o corrección simple.** Debe quedar claro el problema y el resultado esperado.

**K2 — Feature o bugfix funcional.** Debe incluir problema, impacto y criterios de aceptación.

**K3 — Capability, integración o cambio funcional relevante.** Debe incluir diseño suficiente, impacto, aceptación y artifacts relacionados.

**K4 — Cambio arquitectónico, migración o decisión de alto riesgo.** Debe incluir ADR, riesgos, alternativas, mitigación o rollback.

Este modelo permite que Kaddo sea liviano cuando el cambio es simple y más riguroso cuando el cambio puede afectar la arquitectura, la operación o el negocio. La documentación no se mide por cantidad; se mide por suficiencia.

## Work Items como unidad mínima de cambio

Kaddo usa Work Items como unidades trazables de cambio. Un Work Item no es solo una tarea: es una forma de conectar intención, contexto, decisión, implementación y aprendizaje.

Un Work Item puede ser un bugfix, hotfix, feature, chore, capability, spike, RFC, migration, architecture change, incident o vertical slice.

No todo debe ser un vertical slice, no todo debe ser un ADR y no todo debe pasar por el mismo flujo. Cada tipo de cambio necesita el nivel de conocimiento adecuado.

## Knowledge Repository

Kaddo propone que cada proyecto tenga un repositorio de conocimiento. Puede vivir dentro del mismo repositorio del código o en un repositorio dedicado de arquitectura, y puede incluir archivos como `knowledge.md`, `roadmap.md`, `knowledge/`, `work-items/`, `contracts/`, `capabilities/`, `incidents/` y `.kaddo/config.yml`.

La idea no es crear una carpeta bonita. La idea es construir una fuente viva que explique qué es el producto, cómo está organizado, qué decisiones lo formaron, qué capacidades tiene, qué contratos expone, qué riesgos existen y qué conocimiento debe actualizarse cuando el sistema cambia.

## Ownership del conocimiento

Uno de los riesgos de cualquier sistema de documentación es crear otro lugar que también se desactualiza. Por eso Kaddo evita depender de un archivo central donde alguien tenga que mantener manualmente relaciones como `payments → ADR-004`.

En lugar de eso, cada artifact declara qué protege. Por ejemplo, un ADR puede declarar que está relacionado con el dominio de pagos, la capacidad de procesamiento de pagos, los archivos `src/payments/**`, ciertos contratos y ciertos owners.

Así, el conocimiento no vive en un mapa central frágil: vive distribuido en los mismos artifacts que explican el sistema. Cada artifact nace con sus relaciones.

## Knowledge Graph

A partir del ownership declarado, Kaddo puede construir un Knowledge Graph. Este grafo conecta:

```
Artifacts → Dominios → Capacidades → Código → Contratos → Decisiones → Aprendizajes
```

En su versión inicial, el grafo puede ser muy simple: un artifact declara globs de código, Kaddo lee el git diff, detecta que se tocó código relacionado y sugiere revisar el artifact.

Con el tiempo, ese grafo puede crecer e incorporar dominios, capabilities, owners, contratos, eventos, incidentes, señales de runtime, historial de cambios y evidencia de impacto.

El grafo es el diferencial de largo plazo, pero no debe bloquear el MVP. Kaddo debe empezar simple y mejorar con el uso real del equipo.

## Guard Lite

Guard Lite es la primera versión práctica del sistema de protección de conocimiento. Su trabajo no es "entenderlo todo". Su trabajo inicial es mucho más humilde: leer el diff, leer los globs declarados en los artifacts, cruzar ambos y avisar cuando se tocó código relacionado con conocimiento que no cambió.

Por ejemplo:

> "Se modificó `src/payments/payments.service.ts`. ADR-004 declara ownership sobre `src/payments/**`. ADR-004 no fue actualizado. Revise si la decisión sigue reflejando la implementación."

Eso ya aporta valor. No bloquea por defecto, no inventa porcentajes mágicos, no pretende ser más inteligente de lo que es y no genera ruido si no existe ownership declarado. Solo dice: "Hay una relación posible. Revísela."

Y eso, en muchos equipos, ya es muchísimo. Casi como ese compañero que no programa, pero recuerda todo. Solo que sin pedir café.

## Gobernanza por excepción

Kaddo no cree que todo deba pasar por aprobación. El conocimiento cotidiano no necesita burocracia; la gobernanza debe aparecer cuando hay riesgo, impacto o decisiones relevantes.

Por eso Kaddo propone governance by exception: en proyectos personales no se necesita owner; en equipos pequeños el PR puede ser la revisión natural; en equipos medianos el Tech Lead revisa por excepción; y en entornos enterprise los Domain Owners revisan solo los cambios de su dominio.

La idea no es frenar al equipo. La idea es proteger el conocimiento donde realmente importa.

## Current State vs Historical Knowledge

Kaddo distingue entre el conocimiento que representa el estado actual del producto y el conocimiento histórico. El estado actual responde *¿qué es verdad ahora?*; el histórico responde *¿por qué llegamos a esto?*. Ambos son importantes, pero no deben usarse igual.

El estado actual puede vivir en `knowledge.md`, `roadmap.md`, `capabilities.md`, `contracts/`, `module.md` y `.kaddo/config.yml`. El histórico puede vivir en ADRs, RFCs, Work Items, Vertical Slices, incidentes, migraciones, release notes y aprendizajes.

Kaddo no elimina la historia: la convierte en evidencia. Pero el runtime no debería cargar toda la historia para cada acción; primero debe consultar el estado actual y solo cargar artifacts históricos cuando sean relevantes. La historia explica; el estado actual guía.

## Eficiencia de contexto

Kaddo no solo busca mejorar la calidad del conocimiento; también busca mejorar la eficiencia del contexto. Un sistema de conocimiento vivo fracasa si para responder una pregunta necesita cargar todos los documentos del proyecto.

Por eso Kaddo debe actuar como un motor de selección de contexto. Debe preferir metadata antes que documentos completos, summaries antes que artifacts completos, artifacts relacionados antes que contexto global, análisis determinístico antes que llamadas innecesarias a LLM, y contexto pequeño y explicable antes que prompts gigantes.

El manifiesto completo no debe cargarse en cada ejecución. Las reglas operativas deben vivir en archivos compactos como `.kaddo/rules.md`, y el conocimiento del proyecto debe exponerse con metadata, summaries, ownership y relaciones suficientes para que Kaddo sepa qué cargar y qué ignorar.

El objetivo no es enviar más información al agente. El objetivo es enviar la información correcta.

## Classification y Classification Drift

Kaddo permite declarar qué tipo de cambio se está haciendo, pero también puede observar señales en el diff. Por ejemplo, alguien puede declarar "esto es un bugfix", pero el diff muestra una migración de base de datos, cambios en contratos de API, modificación de infraestructura o actualización de dependencias críticas.

En ese caso, Kaddo puede sugerir:

> "Esto puede ser más que un bugfix. Considere clasificarlo como feature, migration o architecture change."

Kaddo no reemplaza la decisión humana: contrasta lo declarado con lo observado. El objetivo no es castigar, sino evitar que cambios grandes entren disfrazados de cambios pequeños. Porque todos hemos visto ese PR de "quick fix" que termina tocando medio sistema. Clásico episodio de terror técnico.

## Evidence Score, no magia falsa

Kaddo evita mostrar porcentajes de confianza que parecen científicos pero en realidad son heurísticos. En lugar de decir "Confidence: 92%", Kaddo debería decir:

> "Evidence: se tocaron 3 de 3 globs relacionados; el artifact es K4; el dominio es crítico; existe una capability asociada."

La señal debe ser explicable. Un número sin explicación genera falsa seguridad; la evidencia transparente genera confianza. Si Kaddo no puede explicar por qué sugiere algo, no debería mostrarlo como verdad.

## Diff Analysis Core

Kaddo no debería tener tres motores distintos leyendo el mismo git diff. Debe existir un núcleo común de análisis de diff que alimente Knowledge Drift, Classification Drift, el Classification Engine, Guard y futuros plugins.

Ese núcleo responde preguntas como: ¿se tocó código relacionado con artifacts existentes?, ¿el conocimiento relacionado fue actualizado?, ¿la clasificación declarada coincide con las señales observadas?, ¿qué nivel K podría aplicar? y ¿qué tipo de Work Item parece más adecuado?

La base debe ser simple, determinística y extensible: primero filesystem y git, después IA si hace falta.

## Arranque en frío

Kaddo entiende que un proyecto no nace con un Knowledge Graph completo, y que un sistema legacy tampoco puede mapearse entero antes de empezar. Por eso Kaddo debe tener degradación elegante.

En un proyecto nuevo, Guard Lite puede estar silencioso hasta que exista el primer artifact con ownership declarado. En un proyecto brownfield o legacy, Kaddo no debe exigir documentar toda la empresa antes de hacer un cambio.

La regla es `touch the domain, improve the graph`: cuando tocas un dominio, mejoras el conocimiento de ese dominio. No antes, no todo de golpe, no como castigo. El grafo crece con el trabajo real.

Para proyectos nuevos, Kaddo ofrece un bootstrap guiado para que un proyecto pueda nacer con contexto: captura el conocimiento mínimo suficiente a lo largo de las capas base — `Business → Product → Tech → Delivery` — antes de escribir código, sin generar código ni decidir la arquitectura automáticamente.

**El conocimiento crece progresivamente.** No todo el conocimiento debe existir desde el inicio. Bootstrap crea solo un archivo consolidado por capa (`business.md`, `product.md`, `codebase.md`); los documentos especializados (`problem.md`, `users.md`, `capabilities.md`, …) y el resto de los agentes aparecen después, a medida que el proyecto los gana. Kaddo debe sentirse ligero al comienzo y crecer con el trabajo real — nunca más archivos que conocimiento, nunca más agentes que necesidades.

**El conocimiento se descubre progresivamente, pero la realidad y la intención deben permanecer distintas.** Lo que planeamos (`codebase.md`) no es lo mismo que lo que está construido de verdad (`current-state.md`), y ninguno es lo mismo que por qué lo decidimos (un ADR) o qué detectaron las herramientas (`scan.json`). Kaddo las mantiene separadas para que el proyecto nunca confunda un plan con la verdad.

## Quality Gates

Un Quality Gate en Kaddo no valida cantidad de documentación; valida suficiencia de conocimiento. Para K0 puede no haber gate; para K1 basta con problema y resultado esperado; para K2 se necesitan criterios de aceptación; para K3 se necesita diseño suficiente y artifacts relacionados revisados; y para K4 se necesitan ADR, riesgos, alternativas y plan de mitigación o rollback.

Un cambio está terminado cuando el código funciona, las pruebas relevantes pasan y el conocimiento afectado queda actualizado o explícitamente marcado como no impactado. Ese último punto es clave: el conocimiento no se actualiza "si queda tiempo". Hace parte del Definition of Done.

## Módulos de Kaddo

Kaddo Core debe ser pequeño. Debe incluir lo mínimo para empezar: clasificación, Knowledge Levels, Work Items, ownership, Guard Lite y configuración base.

Luego, el proyecto puede crecer con módulos:

- **ADR Module** — Para registrar decisiones arquitectónicas.
- **RFC Module** — Para explorar cambios relevantes antes de construirlos.
- **Migration Module** — Para manejar cambios de datos, infraestructura o tecnología.
- **Incident Module** — Para documentar incidentes, aprendizajes y acciones preventivas.
- **Legacy Module** — Para entender sistemas con deuda técnica o bajo conocimiento.
- **Contracts Module** — Para conectar APIs, eventos e integraciones con el conocimiento.
- **Capabilities Module** — Para mapear capacidades del producto.
- **Guard Advanced Module** — Para Evidence Score, Classification Drift, CI y análisis más profundo.
- **Agents Module** — Para agregar agentes reutilizables cuando el equipo ya tenga estructura suficiente.
- **Skills Module** — Para capacidades reutilizables entre agentes, equipos o proyectos.

Nada de esto debe ser obligatorio desde el inicio. Kaddo crece por necesidad, no por defecto.

## CLI de Kaddo

Kaddo debe tener un CLI realista. No debe prometer que adivina toda la arquitectura mágicamente: debe detectar lo barato y preguntar lo ambiguo.

Puede detectar stack, framework, dependencias, estructura del proyecto, carpetas de migraciones, archivos de contrato, lockfiles e infraestructura. Pero debería pedir confirmación humana para dominios, capabilities, criticidad, ownership y la relación entre artifact y código.

Comandos esperados:

- `kaddo init` — Inicializa la estructura base.
- `kaddo bootstrap` — Para proyectos nuevos: construye la base de conocimiento inicial en las capas Business → Product → Tech → Delivery.
- `kaddo scan` — Detecta estructura, stack y posibles dominios.
- `kaddo create` — Crea Work Items o artifacts.
- `kaddo guard` — Revisa cambios contra ownership declarado.
- `kaddo status` — Muestra estado del conocimiento.
- `kaddo explain` — Explica el proyecto para humanos o agentes.
- `kaddo learn` — Registra aprendizaje y actualiza estado actual.
- `kaddo classify` — Contrasta clasificación declarada con señales observadas.
- `kaddo history` — Consulta histórico por dominio, artifact o rango.

El comando `kaddo explain` es especialmente importante porque convierte el Knowledge Repository en onboarding humano y contexto eficiente para agentes.

## Open Source y extensibilidad

Kaddo debe ser open source y extensible, pero extensible no significa desordenado. La comunidad debe poder contribuir templates, módulos, agentes, skills, plugins, ejemplos reales e integraciones por stack.

Pero cada extensión debe declarar qué hace, cuándo se usa, qué archivos instala, qué entradas necesita, qué salidas produce, cómo se valida y cuáles son sus límites. Los contratos de extensión evitan que Kaddo se convierta en una colección caótica de prompts y carpetas. La extensibilidad debe tener estructura.

## Principios de diseño

Kaddo se sostiene sobre estos principios:

1. **El conocimiento guía el desarrollo.** El código debe evolucionar conectado al conocimiento del producto.
2. **Menos documentación, más suficiencia.** No se pide documentación por cantidad. Se pide el contexto mínimo necesario según impacto y riesgo.
3. **La IA necesita contexto antes que instrucciones.** Un agente sin conocimiento del producto solo puede adivinar.
4. **El MVP debe ser pequeño.** Kaddo debe instalarse rápido, pedir poco y aportar valor desde el primer artifact.
5. **El grafo crece incrementalmente.** No se mapea todo al inicio. Se mejora el conocimiento cuando se toca un dominio.
6. **La gobernanza aparece por excepción.** No todo cambio necesita revisión formal. Solo los cambios de riesgo o impacto relevante.
7. **La evidencia debe ser explicable.** Kaddo debe mostrar señales, no porcentajes mágicos.
8. **El estado actual y la historia no son lo mismo.** El estado actual guía. La historia explica.
9. **El conocimiento debe ser más fácil de descubrir que el código.** Los agentes no deberían
   recorrer el repositorio solo para inferir producto, arquitectura, ownership y roadmap antes de
   tomar una decisión.
10. **El contexto debe ser eficiente.** Kaddo debe cargar lo mínimo necesario, no todo el repositorio de conocimiento.
11. **Las extensiones son opcionales.** Módulos, agentes, skills y plugins agregan valor, pero no deben ser requisito del Core.
12. **El conocimiento afectado hace parte del Definition of Done.** Un cambio no termina solo cuando el código compila. Termina cuando el conocimiento relevante queda actualizado o justificado.
13. **Kaddo debe ser honesto.** Si no puede detectar algo con certeza, debe pedir confirmación o mostrar evidencia limitada. Mejor útil y claro que mágico y falso.

## La visión

Kaddo empieza con un MVP humilde: clasificar cambios, crear Work Items, declarar ownership, leer git diff y alertar cuando el conocimiento relacionado podría quedar desactualizado.

Pero su visión es más grande: construir una capa de conocimiento vivo que permita que humanos e IA evolucionen productos digitales con más claridad, continuidad y trazabilidad.

Kaddo no quiere que cada equipo documente más. Quiere que cada equipo pierda menos conocimiento. Quiere que las decisiones sobrevivan al paso del tiempo, que los sistemas legacy puedan entenderse progresivamente, que los proyectos nuevos nazcan con contexto y que los agentes de IA trabajen sobre conocimiento real, no sobre prompts gigantes llenos de ruido. Quiere que cada cambio importante deje el producto un poco más claro que antes.

## Cierre

Kaddo no intenta resolver todo el problema del conocimiento vivo en su primera versión. Debe empezar pequeño, debe ser instalable, debe pedir poco y debe aportar valor rápido. Pero sin traicionar su diferencial: construir, poco a poco, una respuesta confiable a la pregunta **¿cómo sabemos que el conocimiento correcto fue impactado por este cambio?**

La ventaja de Kaddo no está en generar ADRs, RFCs, Work Items, agentes o skills. Eso cualquiera lo puede copiar. La ventaja está en conectar esas piezas para que el conocimiento del producto evolucione junto con el código.

El MVP debe ser humilde. La visión puede ser ambiciosa. Porque el futuro del desarrollo con IA no será solo escribir código más rápido: será construir sistemas que entiendan mejor lo que están cambiando.

Kaddo lleva Knowledge Driven Development al desarrollo de software asistido por IA: software guiado por conocimiento, arquitectura viva, contexto mínimo y evolución trazable.

## Origen

**Knowledge Driven Development (KDD)** es un concepto previo de la ingeniería de software y la gestión del conocimiento — Kaddo no lo inventó. Kaddo es una **implementación práctica de los principios de KDD para la era de la IA**: LLMs, agentes y repositorios modernos.

Kaddo fue creado por **Julian Dario Luna Patiño** a partir de años diseñando arquitecturas, liderando equipos y documentando sistemas — y la convicción de que, con IA en el loop, los proyectos necesitan que su conocimiento viva junto al código. El objetivo no es escribir código más rápido, sino construir sistemas que entiendan lo que están cambiando — mientras las decisiones críticas siguen siendo humanas. Mira [Knowledge Driven Development](/es/knowledge-driven-development/) y [Acerca de](/es/about/).
