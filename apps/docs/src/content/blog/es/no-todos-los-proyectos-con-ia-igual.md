---
title: No todos los proyectos se desarrollan con IA igual
description: Los proyectos new, pre-IA y legacy necesitan estrategias de IA diferentes. Antes de hablar de desarrollo asistido por IA hay que hablar del estado real del proyecto y del conocimiento que la IA necesita.
publishedAt: 2026-07-11
updatedAt: 2026-09-15
author: Julian Dario Luna Patiño
tags:
  - knowledge-driven-development
  - ai-assisted-development
  - legacy
  - brownfield
locale: es
cover: /blog/project-types/cover.webp
featured: false
translationKey: project-ai-readiness
---

> Publicado originalmente en [AWS Builder Center](https://builder.aws.com/content/3GMWI4lfWvuf18IaGlNPJoQvh6I/no-todos-los-proyectos-se-desarrollan-con-ia-igual). Segundo artículo de la serie Knowledge Driven Development (KDD).

La inteligencia artificial está cambiando la forma en que construimos software. Hoy podemos usar
asistentes y agentes para generar código, explicar módulos, crear pruebas, revisar errores, proponer
arquitecturas o documentar partes de un sistema. Todo eso suena poderoso, y lo es, pero hay una idea
que muchas veces se pasa por alto: **no todos los proyectos están igual de preparados para trabajar
con IA.**

No es lo mismo usar IA en un proyecto que apenas empieza, que usarla en un producto que ya tiene
varios años de evolución, o en un sistema legacy donde tocar una línea de código puede romper un
comportamiento que nadie entiende del todo. La IA puede acelerar el desarrollo, pero cuando el
proyecto no tiene contexto suficiente, también puede acelerar errores, deuda técnica y decisiones mal
alineadas.

Por eso, antes de hablar de desarrollo asistido por IA, necesitamos hablar del estado real del
proyecto. No se trata solo de preguntarle mejor a la IA, sino de preparar mejor el conocimiento que
la IA necesita para ayudar. Ahí es donde entra
[Kaddo](/es/knowledge-driven-development/).

## El error: pensar que la IA funciona igual en todos los proyectos

Una idea común es asumir que basta con abrir un editor con IA, conectar el repositorio y empezar a
pedir cambios. Podemos pedirle cosas como "agrega esta funcionalidad", "refactoriza este módulo",
"crea una API" o "moderniza este código". El problema es que esas instrucciones no significan lo mismo
en todos los proyectos.

En un proyecto nuevo, la IA puede ayudar a estructurar desde cero. En un proyecto existente, primero
necesita entender qué ya existe antes de proponer cambios. Y en un sistema legacy debe actuar con
mucho más cuidado, porque muchas decisiones no están documentadas y parte del conocimiento vive en la
cabeza de pocas personas.

El problema no es usar IA. El problema es usarla sin considerar el estado real del proyecto.

Para trabajar con IA de forma más responsable, podemos pensar en tres tipos de proyectos: **new**,
**pre-IA** y **legacy**. Esta clasificación no busca etiquetar un proyecto para siempre, sino
responder una pregunta práctica: ¿qué necesita saber la IA antes de ayudarnos a construir?

## 1. New projects: cuando el conocimiento se puede crear desde el inicio

Un proyecto new es un proyecto que está empezando. Todavía no tiene demasiada deuda técnica,
decisiones ocultas o capas históricas difíciles de entender. Eso no significa que sea fácil, pero sí
representa una oportunidad muy valiosa: crear una base de conocimiento desde el primer día.

En este tipo de proyecto, el mayor riesgo no suele ser romper algo existente, sino avanzar rápido sin
dejar claridad sobre lo que se está construyendo. Al comienzo todo parece evidente: el equipo sabe
qué quiere hacer, las decisiones están frescas, los acuerdos viven en conversaciones recientes y la
arquitectura todavía parece simple. Sin embargo, con el tiempo, esa claridad empieza a diluirse.

Lo que al inicio era una conversación rápida termina convirtiéndose en una decisión invisible. Después
llega una nueva persona al equipo, se retoma el proyecto semanas más tarde o se usa un agente de IA
para continuar el trabajo, y muchas respuestas empiezan a depender de suposiciones.

En un proyecto nuevo, la IA puede ser muy útil para ayudar a definir el contexto del negocio, la
intención del producto, los primeros módulos, las decisiones iniciales de arquitectura, el roadmap,
los work items y los criterios de entrega. Pero la IA no debería inventar el negocio ni decidir sola
la arquitectura. Su rol debería ser ayudar a estructurar el pensamiento del equipo.

En este escenario, la clave no es darle a la IA un repositorio enorme para analizar, porque
probablemente ese repositorio todavía no existe o está apenas naciendo. La clave es construir una base
mínima de conocimiento que acompañe el crecimiento del proyecto. No hace falta documentarlo todo; hace
falta documentar lo suficiente para que el equipo y la IA entiendan qué problema se está resolviendo,
para quién se está construyendo, qué decisiones se han tomado, qué restricciones existen y cómo se
espera que evolucione el producto.

### Cómo ayuda Kaddo en proyectos new

En proyectos nuevos, Kaddo ayuda a crear una estructura inicial de conocimiento sin convertir el
proceso en una carga innecesaria. La idea no es empezar con una documentación gigante, sino con una
base mínima que conecte negocio, producto, tecnología, delivery, roadmap y work items.

Esto permite que el proyecto nazca con memoria desde el inicio. Y eso cambia mucho la forma en que se
usa IA, porque un agente no solo necesita código para ayudar; también necesita intención. Un proyecto
nuevo bien preparado puede usar IA para acelerar sin perder dirección. (Ver el
[caso de uso de proyecto nuevo](/es/use-cases/new-project/).)

## 2. Pre-IA projects: cuando el proyecto existe, pero no fue preparado para agentes

Un proyecto pre-IA es un proyecto que ya existe, pero que fue creado antes de que el equipo pensara
seriamente en asistentes, copilotos o agentes de IA. Puede ser un proyecto sano, con buen código,
pruebas y documentación parcial, pero probablemente no fue diseñado para responder preguntas como: qué
contexto necesita un agente antes de modificar un módulo, qué decisiones arquitectónicas debe respetar
o qué partes del código están conectadas con cada capacidad del negocio.

Este tipo de proyecto es muy común. No necesariamente está roto y no necesariamente es legacy.
Simplemente no fue preparado para trabajar con IA de forma consistente.

El problema aparece cuando cada asistente o agente empieza a explorar el repositorio desde cero. Lee
archivos, intenta inferir arquitectura, busca patrones, analiza nombres de carpetas y propone cambios
a partir de señales parciales. Esa exploración se repite una y otra vez, porque cada nueva sesión
vuelve a descubrir lo mismo.

El resultado es que la IA puede ayudar, pero no siempre de forma alineada. Un agente puede entender el
proyecto de una manera hoy y de otra forma mañana. Así, el proyecto empieza a depender demasiado de
prompts individuales, en lugar de tener una base compartida de conocimiento.

En un proyecto pre-IA, el primer paso no debería ser pedirle a la IA que cambie código. El primer paso
debería ser entender el proyecto. Antes de implementar, conviene reconstruir capacidades del producto,
arquitectura actual, módulos principales, dependencias, convenciones, roadmap, ownership, riesgos y
decisiones existentes.

La pregunta cambia. Ya no es solo: "¿qué puede generar la IA?". La pregunta correcta es: ¿qué necesita
entender la IA antes de generar algo?

### Cómo ayuda Kaddo en proyectos pre-IA

En proyectos pre-IA, Kaddo ayuda a pasar de un repositorio existente a una capa de conocimiento más
clara. El flujo puede iniciar escaneando señales técnicas del repositorio, preparando un context pack
para agentes LLM y usando agentes especializados para interpretar capacidades, arquitectura, roadmap y
posibles work items.

Después, ese conocimiento puede conectarse con ownership, decisiones y partes reales del código.
Además, comandos como `guard` ayudan a detectar cuando el código cambia pero el conocimiento
relacionado no se actualiza, mientras que `explain` permite entender qué sabe Kaddo del proyecto y qué
falta por completar. (Ver el [caso de uso de proyecto pre-IA](/es/use-cases/pre-ai-project/).)

## 3. Legacy projects: cuando cambiar código implica riesgo real

Un proyecto legacy no es simplemente un proyecto viejo. Un sistema legacy es un sistema donde el cambio
es riesgoso porque el conocimiento está incompleto, disperso o concentrado en pocas personas.

Puede tener código antiguo, poca documentación, dependencias frágiles, reglas de negocio escondidas,
módulos que nadie quiere tocar y procesos que funcionan en producción aunque nadie se atreva a
modificarlos. También puede seguir generando mucho valor para la organización. De hecho, muchos
sistemas legacy son críticos precisamente porque llevan años sosteniendo procesos importantes.

En este tipo de proyecto, la IA puede ser útil, pero también puede ser peligrosa si se usa con
demasiada confianza. Una sugerencia aparentemente correcta puede romper una regla invisible. Una
refactorización elegante puede ignorar una decisión histórica. Una recomendación de modernización
puede desconocer dependencias operativas que nunca fueron documentadas.

En legacy, el problema no es solo técnico. Es un problema de conocimiento. Antes de cambiar, hay que
entender. Antes de modernizar, hay que mapear riesgos. Antes de automatizar, hay que identificar zonas
frágiles.

Por eso, en un proyecto legacy, la IA no debería entrar como "desarrollador rápido", sino como apoyo
para una exploración controlada. El objetivo inicial no es producir más código, sino reducir
incertidumbre. En legacy, la velocidad sin contexto es una amenaza.

### Cómo ayuda Kaddo en proyectos legacy

En proyectos legacy, Kaddo ayuda a trabajar con más cuidado. No promete modernizar un sistema con
magia ni reemplazar el criterio del equipo. Su valor está en ayudar a estructurar señales, riesgos y
conocimiento antes de cambiar código: riesgos, unknowns, candidatos de modernización, arquitectura
actual, capacidades del producto, roadmap, work items pequeños y ownership asociado al código.

En lugar de pedirle a la IA "moderniza este sistema", el equipo puede avanzar por piezas más pequeñas,
con contexto, con riesgos visibles y con mayor control. (Ver el
[caso de uso de proyecto legacy](/es/use-cases/legacy-project/).)

## La diferencia no está en la IA, está en el contexto

Los tres tipos de proyecto pueden beneficiarse de la IA, pero no de la misma forma.

| Tipo de proyecto | Qué necesita primero | Riesgo principal | Enfoque recomendado |
|---|---|---|---|
| **New** | Crear base de conocimiento | Avanzar sin dirección | Estructurar intención, roadmap y decisiones desde el inicio |
| **Pre-IA** | Reconstruir contexto | Que la IA interprete desde señales parciales | Escanear, empaquetar contexto y alinear agentes |
| **Legacy** | Reducir incertidumbre | Romper reglas invisibles | Mapear riesgos, ownership y cambios pequeños |

La idea central es simple: la IA no debería abordar todos los proyectos igual porque no todos los
proyectos tienen el mismo nivel de conocimiento disponible.

## Kaddo como capa de conocimiento para IA

Kaddo parte de una idea muy concreta: los proyectos ya tienen conocimiento, pero suele estar disperso.
Parte vive en el código, parte en tickets, parte en documentos, parte en conversaciones, parte en
decisiones que nadie escribió y parte en personas que han estado cerca del sistema durante años.

El objetivo de Kaddo es acercar ese conocimiento al repositorio y convertirlo en contexto útil para
humanos y agentes de IA. No se trata de hacer documentación pesada, sino de crear una capa mínima,
viva y accionable de conocimiento.

### CLI determinístico, interpretación humana y agentes LLM

Una parte importante de Kaddo es la separación de responsabilidades. El CLI hace trabajo
determinístico: escanea, empaqueta contexto, crea estructura, detecta señales, relaciona cambios con
conocimiento y explica el estado del proyecto.

Pero Kaddo no intenta reemplazar la interpretación humana. La interpretación ocurre con humanos y
agentes LLM externos, usando el contexto que el proyecto ha preparado. Kaddo no dice: "yo entiendo tu
proyecto, confía en mí". La propuesta es más responsable: "aquí está el contexto estructurado; úsalo
con tu equipo y tus agentes para tomar mejores decisiones".

## No se trata de IA-first, se trata de knowledge-first

Muchos equipos están intentando volverse AI-first. Eso puede sonar atractivo, pero antes de ser
AI-first, muchos proyectos necesitan ser **knowledge-first**.

La IA necesita una base sobre la cual razonar. Un proyecto sin conocimiento estructurado obliga a la
IA a adivinar; un proyecto con conocimiento vivo le permite colaborar. Esa es la diferencia. No se
trata de usar menos IA, se trata de usarla mejor.

## Conclusión

No todos los proyectos se desarrollan con IA igual: un proyecto nuevo necesita crear conocimiento
desde el inicio, un proyecto pre-IA necesita reconstruir y estructurar contexto antes de evolucionar, y
un proyecto legacy necesita reducir incertidumbre antes de cambiar código.

La IA puede ser útil en los tres casos, pero la estrategia debe cambiar. Kaddo propone una forma de
abordar esa diferencia: construir una capa viva de conocimiento cerca del código, preparar contexto
para humanos y agentes de IA, y mantener trazabilidad entre decisiones, trabajo y evolución del
sistema.

Porque el futuro del desarrollo asistido por IA no depende solo de mejores modelos. Depende también de
mejores proyectos para trabajar con IA. Y un mejor proyecto no es solo el que tiene más código, es el
que recuerda por qué ese código existe.
