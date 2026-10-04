---
title: Cómo Kiro Powers facilita la adopción de Knowledge-Driven Development con Kaddo
description: Tener las capacidades no basta; también hay que facilitar su adopción. Un Kiro Power activa el servidor MCP, las Skills y el flujo de KDD de Kaddo directamente dentro del IDE agéntico.
publishedAt: 2026-09-24
author: Julian Dario Luna Patiño
tags:
  - knowledge-driven-development
  - ai-assisted-development
  - agents
  - kiro
locale: es
cover: /blog/kiro-power/cover.webp
featured: false
translationKey: kiro-powers-kdd
---

> Publicado originalmente en [AWS Builder Center](https://builder.aws.com/content/3JmwwRMLPIiWyfWNlbn5Fhi3Pr3/como-kiro-powers-facilita-la-adopcion-de-knowledge-driven-development-con-kaddo). Cuarto artículo de la serie Knowledge Driven Development (KDD).

Los agentes de desarrollo asistido por IA son cada vez más capaces de navegar repositorios, escribir
código, usar herramientas y conectarse a servidores MCP. Sin embargo, tener acceso al código no
significa necesariamente entender el sistema que se está modificando. Un agente puede conocer
perfectamente un framework y, aun así, desconocer por qué se tomó una decisión de arquitectura, qué
regla de negocio protege determinado flujo o qué otras partes del producto pueden verse afectadas
por un cambio.

Ese es uno de los problemas que estoy explorando con Kaddo, un toolkit open source que aplica
[Knowledge-Driven Development (KDD)](/es/knowledge-driven-development/) al desarrollo de software
asistido por IA. Kaddo mantiene el conocimiento del proyecto cerca del código y lo organiza desde
cuatro perspectivas: Business, Product, Tech y Delivery. La idea es que ese conocimiento no sea
documentación pasiva, sino contexto que ayude a entender, planear, implementar y evolucionar el
software.

A medida que Kaddo fue creciendo apareció otro reto: ya existían el CLI, el servidor MCP, agentes,
Skills y adapters, pero una persona que llegaba por primera vez todavía tenía que entender cómo se
relacionaban todas esas piezas. El problema ya no era únicamente tener las capacidades correctas,
sino facilitar su adopción.

## Tener las capacidades no significa saber cómo usarlas

En Kaddo, el CLI se ocupa principalmente de operaciones determinísticas, mientras que los agentes
trabajan sobre actividades que requieren interpretación. MCP sirve como puente para que otras
herramientas puedan consultar el conocimiento y las capacidades de Kaddo desde el entorno donde el
agente está trabajando.

La arquitectura funcionaba, pero seguía existiendo una curva de entrada. Una persona debía entender
qué consultar primero, qué Skill utilizar, cuándo refinar un Work Item, cuándo empezar a implementar,
cuándo ejecutar Guard y qué conocimiento actualizar después de terminar un cambio.

En otras palabras, tener disponibles las herramientas no garantiza que el agente conozca el flujo
correcto para utilizarlas.

En este punto apareció una contribución interesante desde la comunidad. Esteban Fonseca desarrolló el
primer Kaddo Power para Kiro, integrando el servidor MCP, las Skills y un conjunto de instrucciones
para que Kiro pueda entender mejor cómo trabajar dentro del ciclo de KDD. La contribución llegó
mediante Pull Request y posteriormente se integró al repositorio principal de Kaddo.

Más que agregar una nueva capacidad al core, esta contribución resolvía una capa diferente del
problema: la experiencia de adopción.

## El papel de Kiro Powers

Un Kiro Power permite empaquetar conocimiento especializado, Skills, integraciones MCP e
instrucciones que Kiro puede utilizar cuando una tarea lo requiere. Para Kaddo esto encajaba
particularmente bien porque gran parte de esas capacidades ya existían.

La estructura actual de Kaddo Power es relativamente sencilla:

```text
kaddo-power/
├── plugin.json
├── mcp.json
├── skills/
└── dev.kiro/
```

El `plugin.json` define el Power, mientras que `mcp.json` conecta Kiro con `@kaddo/mcp`. Las Skills
representan capacidades reutilizables de Kaddo y `dev.kiro/` contiene el comportamiento específico que
necesita Kiro para seguir el flujo de trabajo.

Esto permite mantener una separación importante. El Power no reimplementa Kaddo ni mueve su lógica al
IDE. El Core, el CLI y MCP siguen teniendo sus responsabilidades; el Power agrega una capa que ayuda
al agente a entender cuándo y cómo utilizar esas capacidades.

La relación puede verse de esta forma:

```text
Developer
    ↓
   Kiro
    ↓
Kaddo Power
    ↓
@kaddo/mcp + Skills
    ↓
Project Knowledge
    ↓
Business / Product / Tech / Delivery
```

La diferencia parece pequeña, pero desde la experiencia de uso es importante. En lugar de aprender
primero toda la arquitectura de Kaddo para luego empezar a utilizarla, una persona puede comenzar
desde el problema que quiere resolver y seguir un flujo guiado.

## Kiro y Kaddo trabajan el contexto desde dos niveles diferentes

Hay además una relación conceptual interesante entre Powers y Kaddo. Ambos intentan reducir problemas
de contexto, pero actúan sobre capas diferentes.

![Kiro Powers y Kaddo trabajan el contexto en capas distintas](/blog/kiro-power/two-levels.webp)

Kiro Powers ayuda a decidir cuándo una capacidad especializada debería entrar al contexto del agente.
En lugar de cargar permanentemente todo lo que está instalado, puede activar el conocimiento y las
herramientas relacionadas con la tarea actual.

Kaddo trabaja sobre otra pregunta: qué conocimiento del proyecto necesita el agente para resolver
correctamente esa tarea. En vez de obligarlo a reconstruir el sistema explorando el repositorio desde
cero en cada sesión, organiza el conocimiento y permite recuperar contexto relacionado con
capabilities, Work Items, decisiones, módulos y otros artefactos.

Podría resumirse así: **Kiro Powers optimiza _cuándo_ entra una capacidad al contexto; Kaddo optimiza
_qué_ conocimiento del proyecto necesita entrar al contexto.**

Esto está alineado con una idea que he venido trabajando en Kaddo: no se trata de entregarle al
agente toda la información disponible, sino el conocimiento suficiente para entender correctamente el
cambio que está realizando.

## De una solicitud a un cambio con contexto

Pensemos en un escenario sencillo. Existe un Work Item relacionado con habilitar el registro de
usuarios después de terminar una beta y le pedimos a Kiro que lo implemente.

Sin suficiente contexto, un agente podría encontrar rápidamente una validación en backend,
modificarla, ejecutar las pruebas y considerar terminado el trabajo. Técnicamente podría haber
cambiado el código correcto, pero el alcance podría seguir incompleto si el frontend continúa
mostrando el registro como cerrado, existe una feature flag pendiente o parte del flujo vive en otro
módulo.

Con Kaddo Power, la interacción puede comenzar consultando el estado del proyecto y recuperando el
Work Item. Desde allí, el agente puede revisar el conocimiento relacionado, evaluar las superficies
potencialmente afectadas, utilizar la Skill de refinamiento cuando existe incertidumbre y preparar un
plan de implementación antes de modificar código.

El flujo completo se acerca más a esto:

```text
Work Item → Project knowledge → Scope refinement → Impact analysis →
Implementation plan → Human review → Implementation → Validation / Guard →
Learning capture → Updated knowledge
```

Lo importante no es que el Power automatice todos estos pasos, sino que haga visible el flujo dentro
del entorno donde el desarrollador ya está trabajando.

## El humano sigue siendo parte del proceso

Facilitar la adopción tampoco significa eliminar los puntos de decisión humana. Kaddo mantiene una
separación explícita entre lo que un agente puede descubrir o proponer y aquello que debería
confirmar una persona.

![El agente descubre, analiza y propone; la persona valida; Kaddo lo registra](/blog/kiro-power/human-loop.webp)

Por ejemplo, el knowledge graph puede ayudar a encontrar posibles impactos, pero esos resultados son
candidatos para investigar, no alcance confirmado. De la misma manera, un agente puede refinar un
Work Item y señalar que parece estar listo, pero la transición de readiness sigue teniendo una
confirmación humana.

El modelo continúa siendo:

```text
Agent discovers → Agent analyzes → Agent proposes →
Human validates → Kaddo records → Agent continues
```

Esta separación es importante porque Kaddo no busca que el agente simplemente haga más cosas de forma
autónoma. El objetivo es que pueda tomar mejores decisiones con contexto y que las personas mantengan
control sobre aquellas decisiones que afectan el alcance, el producto o la arquitectura.

## El beneficio principal está en reducir la fricción

Antes del Power, una persona podía necesitar entender primero el CLI, MCP, los agentes, las Skills,
el ciclo de los Work Items y Guard para aprovechar correctamente Kaddo desde un IDE agéntico.

Con el Power, el punto de entrada puede ser mucho más natural: instalarlo, abrir un proyecto que
utiliza Kaddo y comenzar a trabajar sobre el cambio que se quiere realizar. Los conceptos siguen
existiendo y siguen siendo importantes, pero pueden aprenderse progresivamente mientras se utiliza la
herramienta.

Ese cambio es especialmente relevante para proyectos open source. Muchas veces la dificultad de
adopción no está en que una herramienta carezca de funcionalidades, sino en que existe demasiada
distancia entre instalarla y experimentar su verdadero valor. Kaddo Power intenta reducir
precisamente esa distancia.

## De Kiro Power a una capacidad portable

Hay otro aspecto que considero interesante de esta implementación. Aunque actualmente Kiro es el
primer consumidor soportado, el Power utiliza el formato de Agent Plugins. Esto permite separar
conceptualmente la capacidad de Kaddo del cliente que la utiliza.

La relación queda así:

```text
Kaddo → Agent Plugin → Kiro Power
```

Esto significa que Kiro puede ser el primer punto de integración sin convertir el conocimiento o las
Skills de Kaddo en elementos dependientes exclusivamente de Kiro.

También refuerza una idea importante para el proyecto: las integraciones con herramientas de IA
deberían actuar como formas de acceder a Kaddo, no convertirse en nuevas fuentes de verdad. El
conocimiento sigue viviendo en Kaddo y el Power se encarga de hacerlo más accesible dentro del flujo
del agente.

## Probando Kaddo Power

Kaddo Power ya está disponible como parte del repositorio open source de Kaddo:

```text
https://github.com/Kaddo-kdd/kaddo/tree/main/kaddo-power
```

Actualmente puede importarse en Kiro como un Custom Power desde GitHub. Una vez configurado, Kiro
puede conectarse con `@kaddo/mcp`, utilizar las Skills disponibles y seguir el flujo de KDD sobre un
proyecto que ya tenga Kaddo inicializado. (Ver también la guía de [Kaddo Power para
Kiro](/es/kaddo-power/) en la documentación.)

Esta contribución de la comunidad terminó resolviendo algo que considero especialmente valioso para
el proyecto: no agregó simplemente otra integración, sino una forma más sencilla de acceder a
capacidades que ya existían.

Un servidor MCP puede darle herramientas a un agente. Las Skills pueden indicarle cómo realizar
determinadas tareas y una base de conocimiento puede darle contexto sobre el sistema. El reto es
lograr que esas piezas aparezcan juntas en el momento correcto sin obligar a cada persona a
reconstruir el flujo manualmente; ahí es donde Kiro Powers aporta una capa interesante para Kaddo.

Kiro facilita la activación de las capacidades y Kaddo aporta el conocimiento del proyecto necesario
para utilizarlas con contexto. El resultado es una forma más directa de llevar Knowledge-Driven
Development al lugar donde realmente ocurren los cambios: el flujo cotidiano entre desarrolladores,
agentes y código.
