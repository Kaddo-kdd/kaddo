---
title: Manifiesto KDD
description: Knowledge Driven Development — Manifiesto v2.5 — fundacional, runtime eficiente y contexto mínimo.
---

> **Manifiesto v2.5** — manifiesto fundacional, runtime eficiente y contexto mínimo.

Esta versión conserva la visión de v2.4 y recupera piezas de producto que aportan valor:
contribución open source, contratos de extensión, comandos de explicación, lifecycle
outputs y una separación explícita entre estado actual e histórico.

## 1. Visión general

Kaddo es un toolkit open source basado en Knowledge Driven Development (KDD) para ayudar
a equipos a crear, evolucionar y mantener productos digitales usando conocimiento
estructurado, arquitectura viva e inteligencia artificial.

Kaddo no busca ser solamente un boilerplate para agentes de IA. Tampoco busca reemplazar
frameworks de agentes, sistemas de especificación, plataformas de orquestación o
herramientas de gestión. Kaddo busca convertir proyectos nuevos, proyectos existentes
pre-IA y sistemas legacy en productos más entendibles, gobernables y evolucionables.

La idea central es: **Clasifica → Captura → Estructura → Construye → Aprende.**

El objetivo no es generar más documentación. El objetivo es preservar el conocimiento
mínimo suficiente para que humanos e IA puedan construir software con menos ambigüedad,
menos retrabajo y más trazabilidad.

## 2. Problema que resuelve

Muchos proyectos fallan o se degradan porque el conocimiento está disperso en reuniones,
chats, tickets, correos, código, personas, documentos desactualizados, decisiones que
nadie recuerda y sistemas legacy sin contexto claro.

Con IA, este problema se vuelve más crítico. Si el agente no tiene contexto, construye
sobre supuestos. La calidad del output de la IA depende directamente de la calidad del
conocimiento disponible.

Por eso Kaddo no pone la IA al inicio del proceso. Primero organiza el conocimiento.
Después permite que la IA ayude a construir.

## 3. Estrella polar

La pregunta central de Kaddo es: **¿cómo sabe Kaddo que el conocimiento correcto fue
impactado por este cambio?**

Todo lo demás —work items, niveles K, módulos, agentes, skills y guardrails— existe para
responder esa pregunta cada vez mejor sin convertir el desarrollo en burocracia.

## 4. Principio central

El conocimiento guía la evolución del producto.

```
Conocimiento → Contexto → Arquitectura → Decisiones → Roadmap → Work Items → Código → Aprendizaje → Conocimiento actualizado
```

Los agentes, modelos y herramientas pueden cambiar; el conocimiento del producto debe
sobrevivir a todos ellos.

## 5. Diferencial vs MVP instalable

La v2.2 hizo más honesto el diferencial de Kaddo, pero también subió la vara del MVP.
Esta versión separa dos cosas distintas: lo que hace especial a Kaddo a largo plazo y lo
mínimo que ya vale la pena instalar.

| Capa | Propósito | Debe estar en v1 |
|---|---|---|
| Diferencial de largo plazo | Knowledge Graph, Guard inteligente, clasificación observada, análisis semántico de cambios. | No completo. Debe evolucionar por etapas. |
| MVP instalable | Classification, Knowledge Levels, Work Items y Guard Lite basado en globs declarados. | Sí. Debe ser simple, útil y construible rápido. |
| Módulos posteriores | Confidence/Evidence Score, Classification Drift avanzado, CI estricto, ownership por dominio enterprise. | No. Deben llegar cuando el Core sea útil. |

Kaddo no debe retrasar su primer lanzamiento esperando resolver el problema completo. El
primer valor instalable debe ser pequeño: detectar que se tocaron archivos asociados a un
artifact y sugerir revisar ese artifact.

## 6. Alcance inicial del proyecto

El alcance inicial debe ser deliberadamente pequeño. Kaddo no debería iniciar como un
framework completo, sino como una base mínima que valide si el conocimiento observable
mejora la evolución del software.

### 6.1 Core v1

| Pieza | Responsabilidad en v1 | Complejidad esperada |
|---|---|---|
| Classification | Permitir declarar el tipo de cambio y sugerir un nivel K inicial. | Baja |
| Knowledge Levels | Definir cuánta información se necesita según impacto y riesgo. | Baja |
| Work Items | Convertir una intención de cambio en una unidad clara, accionable y trazable. | Baja |
| Guard Lite v1 | Cruzar git diff contra globs declarados en artifacts y mostrar FYI si el artifact no cambió. | Baja-media |

### 6.2 No entra completo en v1

- Confidence Score sofisticado.
- Classification Drift con análisis semántico.
- Diff semántico de contratos API, schemas o eventos.
- Reglas CI estrictas.
- Domain Ownership enterprise completo.
- Agentes y skills como requisito base.

## 7. Kaddo Core y módulos

Kaddo Core debe incluir únicamente lo necesario para empezar. Todo lo demás crece por
necesidad, no por defecto.

```
architecture/
  roadmap.md
  knowledge.md
  work-items/
.kaddo/
  config.yml
```

| Módulo | Propósito |
|---|---|
| ADR Module | Registrar decisiones arquitectónicas cuando el riesgo lo justifique. |
| RFC Module | Explorar cambios relevantes antes de construirlos. |
| Migration Module | Gestionar cambios de datos, infraestructura o tecnología con mayor rigor. |
| Incident Module | Documentar incidentes, aprendizajes y acciones preventivas. |
| Legacy Module | Entender sistemas con deuda técnica o bajo conocimiento antes de modificarlos. |
| Contracts Module | Agregar contratos de API, eventos o integraciones. |
| Capabilities Module | Mapear capacidades del producto y relacionarlas con dominios, work items y decisiones. |
| Guard Advanced Module | Agregar Evidence Score, Classification Drift, reglas CI y análisis más profundo. |
| Agents Module | Agregar agentes reutilizables cuando el equipo ya tenga estructura suficiente. |
| Skills Module | Agregar capacidades reutilizables entre agentes, equipos o proyectos. |

## 8. Conceptos principales

### 8.1 Knowledge Repository

Es el conjunto de archivos que preservan el conocimiento del producto. Puede vivir dentro
del mismo repositorio o en un repositorio dedicado de arquitectura. En Core, la estructura
mínima debe ser pequeña; los módulos agregan carpetas cuando la complejidad lo justifica.

### 8.2 Knowledge Ownership Model

El ownership no debe vivir en un archivo central que también pueda derivar. Cada artifact
declara qué protege mediante front matter. Así Kaddo puede construir un grafo distribuido
sin crear un meta-artefacto frágil.

```yaml
---
type: adr
id: ADR-004
domains:
  - payments
capabilities:
  - payment-processing
code:
  - src/payments/**
  - src/shared/payment/**
---
```

Este modelo permite que cada nuevo artifact nazca con sus relaciones. No existe un archivo
central `payments → ADR-004` que alguien deba mantener manualmente.

### 8.3 Knowledge Graph

El Knowledge Graph es el grafo construido a partir del ownership declarado en cada artifact.
En v1 puede ser simple: artifacts → globs de código. Con el tiempo puede incorporar
dominios, capabilities, contratos, owners y señales de runtime.

```
Artifact → Domain → Capability → Code
ADR-004 → payments → payment-processing → src/payments/**
```

El grafo es el diferencial de largo plazo, pero no debe bloquear el MVP. En v1 basta con
que Kaddo pueda leer globs declarados en artifacts y cruzarlos con git diff.

### 8.4 Governance by Exception / Gobernanza por Excepción

El conocimiento cotidiano no requiere aprobación. Solo los cambios arquitectónicos,
estratégicos o de alto riesgo requieren revisión explícita. Kaddo no asume que todos los
proyectos necesitan un Process Owner.

| Nivel | Modelo de gobernanza | Revisión explícita |
|---|---|---|
| Nivel 1 — Indie | Developer → Knowledge | No existe Owner. |
| Nivel 2 — Equipo pequeño | Developer → PR → Knowledge | No existe Owner. La revisión ocurre naturalmente en el PR. |
| Nivel 3 — Equipo mediano | Developer → Knowledge → Tech Lead por excepción | Solo ADR, RFC y Architecture Change. |
| Nivel 4 — Enterprise | Domain Owners por dominio | Cada owner revisa únicamente cambios de su dominio. |

### 8.5 Minimum Sufficient Knowledge como sistema

Minimum Sufficient Knowledge no debe quedarse como concepto abstracto. En Kaddo se
materializa como Knowledge Levels. La regla sigue siendo: no pedir documentación, pedir
respuestas.

| Nivel | Cuándo aplica | Conocimiento requerido |
|---|---|---|
| K0 | Cambios triviales: CSS, texto, bug visual menor. | No requiere conocimiento adicional. |
| K1 | Hotfix o corrección simple. | Problema y resultado esperado. |
| K2 | Feature o bugfix con impacto funcional. | Problema, resultado esperado, impacto y criterios de aceptación. |
| K3 | Capability, integración o cambio funcional relevante. | Problema, impacto, aceptación y diseño. |
| K4 | Architecture Change, migración, decisión de alto riesgo. | Problema, impacto, diseño, ADR y riesgos. |

### 8.6 Work Item

Kaddo usa Work Item como unidad mínima de cambio trazable. No todo debe ser un vertical slice.

| Tipo de Work Item | Nivel sugerido |
|---|---|
| Bug visual menor | K0 |
| Hotfix | K1 |
| Bugfix funcional | K2 |
| Feature | K2 |
| Capability | K3 |
| Spike | K2 o K3 |
| RFC | K3 |
| Migration | K4 |
| Architecture Change | K4 |
| Incident | K2 o K3 según impacto |

## 9. Guard Lite v1

Guard Lite v1 es el Guard más tonto que ya vale la pena instalar. Su trabajo no es entender
semánticamente el sistema. Su trabajo es detectar intersecciones simples entre archivos
modificados y globs declarados en artifacts.

```
git diff
  ↓
leer globs declarados en artifacts
  ↓
si archivo modificado matchea artifact y artifact no cambió
  ↓
mostrar FYI
```

| Regla | Decisión |
|---|---|
| Sin Confidence Score en v1 | Evita porcentajes falsamente precisos. |
| Sin Classification Drift semántico en v1 | Solo señales baratas y explícitas. |
| No bloquea por defecto | Solo informa. |
| No alerta si no hay ownership declarado | Evita ruido en repos jóvenes. |
| Permite ignorar con razón | Convierte falsos positivos en aprendizaje. |

### 9.1 Ejemplo Guard Lite v1

```
Touched files:
- src/payments/payments.service.ts

Matched ownership:
- ADR-004 declares src/payments/**

ADR-004 was not modified in this commit.
FYI: review whether ADR-004 still reflects the implementation.
```

Este mensaje ya aporta valor sin prometer inteligencia avanzada. Es simple, comprensible y
accionable.

## 10. Estrategia de arranque en frío

El Knowledge Graph está vacío precisamente cuando el proyecto es joven o cuando Kaddo se
instala por primera vez. Por eso Guard no debe gritar desde el día uno.

### 10.1 Greenfield / Nivel 1

En repos jóvenes, Guard Lite arranca silencioso. Solo habla cuando existe al menos un
artifact con ownership declarado. Si no hay ownership, no hay alerta.

| Estado del repo | Comportamiento de Guard Lite |
|---|---|
| Sin artifacts con ownership | Silencioso. Puede sugerir crear el primer Work Item o artifact, pero no alerta. |
| Con 1+ artifacts con globs | Solo alerta cuando git diff toca esos globs. |
| Con ownership creciente | El grafo mejora de forma incremental. |

### 10.2 Brownfield / Pre-IA / Legacy

En proyectos existentes, Kaddo no debe exigir mapear todo el sistema antes de usarlo. Eso
contradice la degradación elegante. El grafo se construye incrementalmente: declaras
ownership de un artifact la próxima vez que tocas su dominio, no todo de golpe.

```
Regla: touch the domain, improve the graph.
No regla: map the whole company before writing code.
```

## 11. Evidence Score, no porcentaje mágico

La v2.2 usaba Confidence Score. Esta versión lo redefine como Evidence Score para evitar
una precisión falsa. Guard no debe mostrar un porcentaje desnudo si el número proviene de
heurísticas simples.

| Salida pobre | Salida preferida |
|---|---|
| Confidence: 92% | Evidence: 3/3 globs matched; artifact K4; related capability: payment-processing. |
| Suggested Architecture Change, 87% | Observed signals: migration file added; contract glob changed; dependency changed. |

### 11.1 Fórmula simple y transparente para versiones posteriores

```
Evidence Score = señales_observadas / señales_configuradas

Ejemplo:
- 3 de 4 señales configuradas presentes
- Artifact relacionado es K4
- Dominio crítico: payments

Resultado: evidencia fuerte, no "confianza estadística".
```

El número solo debe aparecer acompañado de su explicación. Si no puede explicar el score,
no debe mostrarlo.

## 12. Classification Engine y Classification Drift

La clasificación debe combinar lo declarado por el developer con señales observadas en el
diff. En v1, las señales observadas deben ser baratas y de alta señal; el diff semántico
profundo queda para versiones posteriores.

### 12.1 Clasificación declarada vs señales observadas

```
Declared Classification: Bugfix

Observed Signals:
- Supabase migration file added
- API contract glob changed
- Dependency changed

Suggested Review:
This may be more than a Bugfix. Consider Feature, Migration or Architecture Change.
```

Kaddo no reemplaza la decisión humana. Contrasta lo declarado con lo observado y muestra el
desacuerdo cuando hay señales suficientes.

### 12.2 Señales baratas para v1

| Señal | Cómo detectarla en v1 | Posible implicación |
|---|---|---|
| Migración de base de datos | Archivo nuevo/cambiado en supabase/migrations, prisma/migrations, db/migrations. | K4 o Migration. |
| Contrato de API | Cambio en globs declarados como contracts/**, openapi.*, route schemas. | K3/K4 según impacto. |
| Contrato de evento | Cambio en globs de events/** o schemas/**. | K3/K4. |
| Dependencias | Cambio en package.json, lockfile, requirements.txt, pom.xml, etc. | K2-K4 según dominio. |
| Infraestructura | Cambio en terraform, cloudformation, serverless.yml, amplify, docker, k8s. | K3/K4. |
| Dominio crítico | Archivo modificado matchea artifact marcado critical: true. | Sube severidad. |

### 12.3 Diff semántico queda para después

Detectar que cambió semánticamente un contrato OpenAPI, un schema de evento o una migración
destructiva requiere analizadores por stack. Eso no debe ser promesa del Core v1. Debe vivir
en Guard Advanced o plugins por ecosistema.

## 13. Diff Analysis Core

Knowledge Drift, Classification Drift y el Classification Engine no deben implementar tres
lecturas distintas del mismo git diff. Deben compartir un solo motor: Diff Analysis Core.

```
git diff
  ↓
Diff Analysis Core
  ├─ Knowledge Drift: ¿tocaste código protegido sin tocar conocimiento relacionado?
  └─ Classification Drift: ¿lo que declaraste coincide con las señales observadas?
```

| Consumidor | Pregunta que responde |
|---|---|
| Knowledge Drift | ¿Actualizaste el conocimiento correcto cuando tocaste código relacionado? |
| Classification Drift | ¿La clasificación declarada parece consistente con las señales del cambio? |
| Classification Engine | ¿Qué nivel K y tipo de Work Item se sugieren inicialmente? |

## 14. Guard Advanced

Guard Advanced es el camino evolutivo, no el requisito para lanzar. Debe crecer después de
validar que Guard Lite ya aporta valor.

| Versión | Capacidad |
|---|---|
| v1.0 | Guard Lite: intersección de globs y artifacts. FYI no bloqueante. |
| v1.1 | Evidence Score transparente basado en señales configuradas. |
| v1.2 | Classification Drift con señales baratas: migraciones, contratos, dependencias, infra. |
| v1.3 | CI básico: comentarios en PR sin bloquear. |
| v2.0 | Diff semántico por stack mediante plugins. |
| v2.x | Reglas enterprise, Domain Owners, CI estricto por dominio crítico. |

## 15. CLI realista

El CLI debe inferir primero y preguntar después, pero no debe prometer detección perfecta
de dominios. En v1 debe detectar lo barato y pedir confirmación humana para lo ambiguo.

| Detecta automáticamente | Sugiere para confirmación humana |
|---|---|
| Stack, framework, dependencias, estructura, carpetas de migraciones, archivos de contrato, infra. | Dominios, capabilities, criticidad del dominio, ownership inicial, relación entre artifact y código. |

```
kaddo scan

Detected:
- Next.js
- TypeScript
- Supabase
- src/app/**
- supabase/migrations/**

Suggested domains:
[ ] Payments
[ ] Orders
[ ] Identity

Confirm or edit?
```

Este enfoque es menos mágico, pero más honesto. La magia real no está en adivinarlo todo;
está en pedir poco, aprender incrementalmente y no estorbar.

## 16. Riesgos operativos y contraestrategias

| Riesgo | Por qué importa | Contraestrategia |
|---|---|---|
| MVP demasiado caro | Knowledge Graph, Guard y Classification Engine completos son difíciles e interdependientes. | Separar diferencial de largo plazo del MVP: Guard Lite v1 con globs. |
| Arranque en frío | En repos jóvenes el grafo está vacío; Guard puede quedar mudo o hacer ruido. | Guard silencioso hasta que exista ownership declarado. |
| Carga front-loaded en brownfield | Mapear todo al inicio contradice degradación elegante. | Construcción incremental del grafo al tocar dominios. |
| Score autoritativo falso | Porcentajes heurísticos erosionan confianza. | Evidence Score explicado; mostrar señales, no números mágicos. |
| Observed Classification caro | Requiere analizadores por stack. | Empezar con señales baratas y plugins posteriores. |
| Doble implementación de diff | Knowledge Drift y Classification Drift pueden duplicar lógica. | Diff Analysis Core compartido. |

## 17. Quality Gates y Definition of Done

Un Quality Gate valida suficiencia de conocimiento, no cantidad de documentación. El objetivo
es confirmar que el cambio tiene el contexto mínimo necesario para su nivel K.

| Nivel | Quality Gate sugerido |
|---|---|
| K0 | No gate. |
| K1 | Problema y resultado esperado claros. |
| K2 | Criterios de aceptación verificables. |
| K3 | Diseño suficiente, efectos conocidos y artifacts relacionados revisados si existen. |
| K4 | ADR, riesgos, alternativas consideradas, mitigación/rollback y owner de dominio si aplica. |

Un Work Item está terminado cuando el código funciona, las pruebas relevantes pasan y el
conocimiento afectado queda actualizado o explícitamente marcado como no impactado.

## 18. Niveles de adopción

| Nivel | Objetivo | Gobernanza | Guard |
|---|---|---|---|
| Nivel 1 — Indie | Claridad y contexto persistente. | Sin owner. | Silencioso hasta ownership declarado. |
| Nivel 2 — Equipo pequeño | Coordinación y trazabilidad básica. | PR como revisión natural. | FYI local o PR warning. |
| Nivel 3 — Equipo mediano | Alineación entre producto y arquitectura. | Tech Lead por excepción. | Warnings por dominio/artifact. |
| Nivel 4 — Enterprise | Gobierno ligero, gestión de riesgo y continuidad. | Domain Owners. | Reglas por dominio, opcionalmente CI estricto. |

## 19. Métricas sugeridas

- Tiempo desde request hasta clasificación.
- Tiempo desde clasificación hasta work item.
- Cantidad de cambios por Knowledge Level.
- Cantidad de artifacts con ownership declarado.
- Cantidad de alertas Guard Lite.
- Alertas ignoradas y razón de ignore.
- Cambios con conocimiento suficiente.
- Cambios con retrabajo.
- Tiempo de onboarding.
- Tiempo humano invertido en estructurar conocimiento vs tiempo ahorrado por reducción de ambigüedad y retrabajo.

## 20. Posicionamiento

Kaddo ocupa una capa diferente dentro del ecosistema:

```
Herramientas de ejecución
      ↓
Frameworks de agentes
      ↓
Especificaciones
      ↓
Kaddo
      ↓
Conocimiento del producto
```

| Framework | Pregunta que responde |
|---|---|
| BMAD | ¿Cómo colaboran los agentes? |
| Gentle-AI | ¿Cómo mejorar entornos de agentes? |
| OpenSpec | ¿Cómo documentar la evolución del software? |
| Spec-Kit | ¿Cómo estructurar specs y planificación? |
| Kiro | ¿Cómo convertir especificaciones en implementación? |
| Claude Flow | ¿Cómo orquestar múltiples agentes? |
| GSD | ¿Cómo entregar más rápido con IA? |
| Kaddo | ¿Cómo preservar y evolucionar el conocimiento correcto cuando cambia el código? |

## 21. Orden de construcción recomendado

Si Kaddo empezara mañana, el orden correcto no sería construir todo el diferencial. Sería
construir el camino más corto hacia valor observable.

| Paso | Entregable | Por qué va primero |
|---|---|---|
| 1 | Work Items + K-Levels | Permite clasificar cambios y pedir el mínimo contexto. |
| 2 | Ownership front matter | Permite declarar qué protege cada artifact sin archivo central. |
| 3 | Guard Lite v1 | Entrega valor inmediato con intersección de globs. |
| 4 | Ignore reason | Convierte falsos positivos en aprendizaje. |
| 5 | Evidence Score transparente | Mejora señal sin inventar precisión. |
| 6 | Classification Drift barato | Contrasta clasificación declarada con señales simples. |
| 7 | Plugins semánticos | Agrega inteligencia por stack cuando haya base instalada. |

## 22. Manifesto, Boilerplate y Runtime Context

El manifiesto no está diseñado para cargarse completo en cada proyecto, agente o ejecución
del CLI. Su función es fundacional: define la filosofía, las restricciones, los principios y
las decisiones de diseño que soportan la construcción de Kaddo.

Kaddo debe distinguir entre principios fundacionales y contexto operativo. Confundir esas dos
capas produciría prompts grandes, agentes lentos y proyectos llenos de ruido documental.

| Capa | Propósito | Dónde vive | Uso esperado |
|---|---|---|---|
| Manifiesto | Define por qué existe Kaddo, qué problema resuelve y qué principios no debe romper. | Documentación principal del proyecto Kaddo. | Referencia humana y guía de diseño del CLI, boilerplate y módulos. |
| Boilerplate | Define cómo inicia un proyecto Kaddo con estructura mínima. | Proyecto del usuario al ejecutar kaddo init. | Instala Core, templates mínimos y configuración base. |
| Runtime Rules | Convierte los principios del manifiesto en reglas operativas pequeñas. | .kaddo/rules.md | Se carga en operaciones del CLI y en agentes cuando hace falta. |
| Project Knowledge Repository | Preserva el conocimiento específico del producto. | architecture/ y módulos instalados. | Fuente viva para work items, artifacts y aprendizaje. |
| Context Selection | Decide qué conocimiento entra en una ejecución específica. | Diff Analysis Core + Knowledge Graph. | Evita cargar el repositorio completo y selecciona solo lo relevante. |

```
Manifiesto → CLI design → Boilerplate → Runtime Rules → Project Artifacts → Context Selection → Agent or Human Action
```

**Regla de diseño:** Kaddo must not confuse founding principles with runtime context.

## 23. Token Efficiency

Kaddo no debe optimizar únicamente la calidad de la documentación. También debe optimizar la
eficiencia del contexto. Un sistema de conocimiento vivo fracasa si para responder una
pregunta necesita cargar todo el repositorio de conocimiento.

El manifiesto completo no debe ser el payload de cada interacción. En runtime, Kaddo debe usar
una versión compacta de reglas operativas, metadata de artifacts, summaries, globs relacionados
y diff resumido.

La regla central es: **Full documents are loaded only when metadata and summaries are insufficient.**

| Preferir | Evitar |
|---|---|
| Metadata sobre documentos completos. | Cargar todos los ADRs, RFCs, work items o roadmap completo por defecto. |
| Summaries sobre artifacts completos. | Enviar diffs grandes sin resumir o sin filtrar. |
| Artifacts relacionados sobre contexto global. | Usar el manifiesto completo como prompt operativo. |
| Análisis determinístico antes que llamadas LLM. | Usar IA para detectar lo que el filesystem y git ya pueden decir. |
| Context windows pequeños y explicables. | Contexto exhaustivo que aumenta costo, latencia y ruido. |

| Flujo | Presupuesto recomendado | Estrategia |
|---|---|---|
| kaddo guard v1 | 0 tokens LLM en modo normal; 150-400 tokens si se genera explicación para PR. | Git diff + globs + front matter. Regla determinística primero. |
| kaddo scan | 0 tokens para detectar stack, framework, dependencias y estructura; 300-800 si se pide resumen asistido. | Filesystem y manifests antes que LLM. |
| K0/K1 | 0-250 tokens. | Cambios triviales o hotfixes simples; no cargar artifacts completos. |
| K2 | 300-700 tokens. | Contexto mínimo de problema, impacto y aceptación. |
| K3 | 800-1.500 tokens. | Diseño suficiente, dependencias y artifacts relacionados. |
| K4 | 1.500-3.000 tokens. | ADR, riesgos, alternativas, rollback o mitigación; solo artifacts relacionados. |

Kaddo debe comportarse como un motor de selección de contexto. Su valor no es enviar más
información al agente, sino saber qué pocos cientos de tokens necesita para actuar con menos
ambigüedad.

## 24. Current State vs Historical Knowledge

Kaddo debe distinguir entre el conocimiento que representa el estado actual del producto y los
artifacts que explican cómo se llegó a ese estado. Esta separación evita cargar historia
innecesaria en runtime y evita que ADRs, vertical slices o incidentes se traten como si todos
fueran fuente de verdad vigente.

La regla práctica es: el estado actual responde **qué es verdad ahora**; el histórico responde
**por qué y cómo llegó a ser verdad**.

| Capa | Qué responde | Ejemplos | Uso en runtime |
|---|---|---|---|
| Current State / Estado actual | Qué es cierto ahora sobre el producto, arquitectura, capacidades, contratos y módulos. | knowledge.md, roadmap.md, capabilities.md, contracts/, module.md, .kaddo/config.yml, graph-index.json | Primera fuente para explicar el proyecto y seleccionar contexto. Debe ser pequeño, curado y vigente. |
| Decision History / Historial de decisiones | Por qué se tomó una decisión y qué alternativas se descartaron. | ADR, RFC, architecture decision notes | Se carga solo si el cambio toca artifacts relacionados o si hace falta explicar una decisión. |
| Change History / Historial de cambios | Qué cambió, cuándo cambió y qué se aprendió. | Work Items, Vertical Slices, migrations, incidents, release notes, learning.md | Se consulta por rango, dominio o artifact relacionado; no se carga completo por defecto. |
| Operational History / Historial operativo | Qué pasó en producción y cómo se respondió. | incidents/, runbooks/, postmortems, support notes | Se carga cuando el cambio toca operación, confiabilidad o dominios con incidentes previos. |

ADRs, RFCs, vertical slices e incidentes no son basura histórica; son evidencia. Pero Kaddo debe
proyectar lo aprendido hacia archivos de estado actual cuando una decisión cambia el presente del
producto.

```
Historical artifacts → Learning → Current State projection
ADR/RFC/VS/Incident → summary + ownership → knowledge.md / capabilities.md / contracts / module.md
```

Cuando un artifact histórico queda obsoleto, no debe eliminarse. Debe cambiar su estado, por
ejemplo: accepted, superseded, deprecated o replaced-by. El estado actual debe apuntar al artifact
vigente y, cuando sea necesario, al histórico que explica la decisión.

## 25. Lifecycle Outputs and Work Item Templates

El manifiesto no debe contener todos los flujos detallados. Los outputs del ciclo y los flujos por
tipo de cambio deben vivir como templates instalables. Aun así, Kaddo debe conservar una referencia
mínima para orientar el diseño del boilerplate.

| Fase | Output sugerido | Propósito |
|---|---|---|
| Request | request.md | Capturar necesidad, solicitante, urgencia e impacto esperado. |
| Classification | classification.md | Declarar tipo de cambio, nivel K sugerido, riesgo y flujo recomendado. |
| Capture | capture.md | Recoger respuestas mínimas de negocio, arquitectura, desarrollo u operación. |
| Structure | proposal.md, design.md, spec.md, tasks.md | Transformar respuestas en estructura accionable. |
| Plan | roadmap.md, dependencies.md, risk notes | Ordenar ejecución, dependencias, riesgos y exclusiones. |
| Build | implementation + tests | Construir respetando contratos, decisiones y criterios de aceptación. |
| Validate | validation.md | Registrar validación técnica y funcional. |
| Release | release-notes.md, changelog.md | Explicar qué cambió y qué se entrega. |
| Run | runbook.md, monitoring notes | Observar operación y soporte. |
| Learn | learning.md | Registrar aprendizaje y actualizar estado actual si aplica. |

```
templates/work-items/vertical-slice.md
templates/work-items/hotfix.md
templates/work-items/incident.md
templates/work-items/migration.md
```

## 26. CLI Product Roadmap

La primera versión del CLI debe seguir siendo pequeña. Sin embargo, Kaddo necesita un roadmap
explícito de comandos para no perder capacidades útiles de producto que estaban en la visión inicial.

| Versión | Comandos | Propósito |
|---|---|---|
| v1.0 | kaddo init, kaddo scan, kaddo create, kaddo guard | Instalar Core, detectar estructura básica, crear Work Items y alertar por ownership/globs. |
| v1.1 | kaddo status, kaddo explain, kaddo learn | Mostrar estado del conocimiento, explicar el proyecto y registrar aprendizaje. |
| v1.2 | kaddo classify, kaddo history | Contrastar clasificación declarada con señales baratas y consultar histórico por dominio/artifact. |
| v2.x | kaddo guard --ci, kaddo explain --scope, plugins semánticos | Integración con PR/CI, explicación por dominio y análisis avanzado por stack. |

```
kaddo explain --for human
kaddo explain --for agent
kaddo explain --scope payments
kaddo explain --since last-release
```

## 27. Multirepo Module Descriptor

En proyectos multirepo, cada repositorio o módulo debe poder declarar su identidad sin obligar a
cargar toda la arquitectura principal. Esto puede vivir en architecture/module.md o .kaddo/module.yml.

| Campo | Propósito |
|---|---|
| name | Nombre del módulo o repositorio. |
| purpose | Para qué existe dentro del sistema. |
| responsibilities | Qué capacidades o responsabilidades cubre. |
| stack | Stack detectado o definido. |
| dependencies | Dependencias internas y externas relevantes. |
| contracts | APIs, eventos o integraciones que expone o consume. |
| boundaries | Límites y cosas que no son responsabilidad del módulo. |
| constraints | Restricciones técnicas, regulatorias u operativas. |
| ownership | Dominio, equipo o responsables si aplica. |
| related-artifacts | ADRs, RFCs, incidents o Work Items vinculados. |

## 28. Open Source Contribution Model

Kaddo debe ser extensible sin convertirse en una colección desordenada de prompts, templates y
agentes. La comunidad debe poder contribuir, pero cada contribución debe declarar claramente qué
aporta, cuándo se usa y cómo se valida.

- Templates para nuevos tipos de Work Item o nuevos formatos de documentación.
- Módulos para ADR, RFC, incidentes, migraciones, contratos, capabilities o dominios específicos.
- Agentes y skills opcionales para equipos que ya tengan suficiente estructura.
- Plugins de análisis semántico por stack o ecosistema.
- Ejemplos reales de proyectos greenfield, pre-IA, legacy, monorepo y multirepo.

## 29. Extension Contracts

Los contratos de extensión evitan que el ecosistema crezca de forma inconsistente. No son
burocracia; son una interfaz mínima para que Kaddo pueda instalar, validar, documentar y ejecutar
extensiones con seguridad.

| Contrato | Debe declarar |
|---|---|
| Module Contract | name, purpose, installed-files, commands, dependencies, config, maturity-level, uninstall-strategy, examples. |
| Template Contract | name, description, work-item-type, knowledge-level, required-inputs, optional-inputs, output-files, quality-checklist, example. |
| Agent Contract | name, role, goal, inputs, outputs, constraints, steps, done-criteria, failure-modes, example-prompts. |
| Skill Contract | name, capability, when-to-use, inputs, outputs, prompt-pattern, examples, anti-patterns, quality-checklist. |
| Plugin Contract | name, ecosystem, signals-produced, files-read, confidence/evidence-model, limitations, performance-cost. |

Las extensiones deben ser opcionales. Ningún contrato debe convertir Agents, Skills o Plugins en
requisito del Core.

## 30. Conclusión

Kaddo no debe intentar resolver todo el problema de conocimiento vivo en su primera versión. Debe
instalarse rápido, pedir poco y aportar valor desde el primer artifact con ownership declarado.

La ventaja difícil de replicar no está en generar ADRs, RFCs, agentes o skills. Eso cualquiera lo
puede copiar. La ventaja está en construir, incrementalmente, una respuesta confiable a la pregunta:
**¿cómo sabe Kaddo que el conocimiento correcto fue impactado por este cambio?**

El MVP debe ser humilde. La visión puede ser ambiciosa. Esa separación es lo que permite lanzar sin
traicionar el diferencial.
