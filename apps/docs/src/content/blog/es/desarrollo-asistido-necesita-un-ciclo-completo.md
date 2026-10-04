---
title: 'Dar contexto a la IA no es suficiente: el desarrollo asistido necesita un ciclo completo'
description: Dar contexto a un agente de IA no garantiza un buen resultado. El desarrollo asistido necesita un ciclo completo que conecte intención, planificación, implementación, evidencia, verificación y aprendizaje.
publishedAt: 2026-09-29
author: Julian Dario Luna Patiño
tags:
  - knowledge-driven-development
  - ai-assisted-development
  - sdlc
  - agents
locale: es
cover: /banner.png
featured: true
---

> Publicado originalmente en [AWS Builder Center](https://builder.aws.com/content/3JsFSWtFxGITb1j8n0uwTMmfpxu/dar-contexto-a-la-ia-no-es-suficiente-el-desarrollo-asistido-necesita-un-ciclo-completo). Quinto artículo de la serie Knowledge Driven Development (KDD).

Durante los últimos meses he trabajado bastante alrededor de una misma pregunta: ¿qué necesita
realmente un agente de IA para construir software correctamente? La primera respuesta parecía
evidente: contexto.

Un agente puede tener acceso al repositorio y aun así no entender por qué existe una funcionalidad,
qué reglas de negocio debe respetar, qué decisiones arquitectónicas ya se tomaron o qué espera
realmente el producto. Por eso, desde el inicio, Kaddo se construyó alrededor de una idea sencilla:
el conocimiento del proyecto debería mantenerse cerca del desarrollo y poder reutilizarse cuando
humanos o agentes necesiten tomar decisiones.

Sin embargo, a medida que fui usando ese enfoque en proyectos reales apareció un problema más
interesante: tener buen contexto antes de empezar no garantiza que el resultado final sea correcto.

Entre entender una necesidad y considerar una implementación terminada ocurren muchas cosas: se
toman decisiones técnicas, aparecen restricciones nuevas, el agente puede desviarse del plan, se
modifican archivos que inicialmente no estaban contemplados y, en algunos casos, el propio proyecto
aprende algo que antes no sabía. Eso llevó a una evolución importante en Kaddo.

## El problema no termina cuando el agente entiende la tarea

En muchos flujos de desarrollo asistido por IA, el proceso se parece a esto:

```text
Necesidad → Prompt → Código
```

En escenarios un poco más maduros agregamos contexto:

```text
Necesidad → Contexto → Agente → Código
```

Eso mejora mucho el resultado, pero sigue dejando preguntas importantes sin resolver:

- ¿Cómo decidió el agente abordar técnicamente el cambio?
- ¿Qué partes del sistema terminó modificando?
- ¿Qué validaciones ejecutó?
- ¿La implementación realmente cumplió los criterios definidos?
- ¿Qué aprendimos durante el proceso?

Si esas respuestas quedan únicamente en una conversación con el agente, el proyecto pierde buena
parte del conocimiento producido durante la implementación. Por eso empecé a pensar el desarrollo
asistido por IA no solo como un problema de contexto, sino como un problema de ciclo de vida.

## Del intent al learning

El Lifecycle v2 de Kaddo organiza ese recorrido desde que aparece una necesidad hasta que el
aprendizaje generado durante la implementación puede regresar al conocimiento del proyecto.

El flujo general es:

```text
Captured Intent → Refinement → Human Review → Ready → Implementation Handoff →
Human Confirmation → Implementation → Implementation Evidence → Verification →
Human Review → Completed → Learning
```

La intención no es crear más burocracia. Al contrario, cada etapa intenta resolver una
responsabilidad diferente para evitar que un único documento tenga que explicar todo.

El Work Item define qué queremos cambiar y por qué. El Implementation Handoff ayuda a decidir cómo
abordarlo. La implementación produce evidencia. La verificación contrasta esa evidencia contra lo
que originalmente se pidió. Finalmente, los aprendizajes relevantes pueden regresar al conocimiento
del proyecto. Esto hace que el proceso deje de ser lineal y empiece a comportarse como un ciclo.

## Refinar no significa diseñar toda la solución

Una separación que considero especialmente importante está entre refinement e implementación.
Durante el refinement buscamos entender qué queremos cambiar, por qué necesitamos hacerlo, qué
comportamiento esperamos, qué restricciones existen y cómo sabremos que el trabajo está terminado.
Eso no significa que en ese momento tengamos que decidir cada detalle técnico.

Un Work Item llega a Ready cuando existe suficiente claridad para empezar a decidir cómo implementar
el cambio, no cuando tenemos una especificación gigantesca. Esa diferencia permite separar dos
conversaciones que muchas veces mezclamos:

- **Refinement** define WHAT + WHY.
- **Implementation Handoff** define HOW, usando el contexto actual del proyecto.

Esta separación resulta especialmente útil con agentes, porque evita que una descripción funcional
termine llena de decisiones técnicas que podrían quedar obsoletas o depender del estado actual del
sistema.

## El Implementation Handoff: contexto justo antes de construir

Antes de modificar código, Kaddo puede combinar el Work Item con conocimiento relevante del
proyecto, contexto del sistema y contexto del repositorio para producir un Implementation Handoff.

Ese handoff puede incluir el enfoque técnico, las áreas afectadas, los pasos de implementación,
restricciones relevantes, decisiones de diseño, alternativas, trade-offs y estrategia de validación,
pero hay un principio importante: la profundidad del handoff debe ser proporcional al cambio.

Cambiar un texto no necesita el mismo nivel de deliberación que agregar una funcionalidad completa.
De la misma manera, una decisión arquitectónica requiere más contexto que una modificación
localizada.

La idea no es generar más documentos, sino darle al agente la cantidad correcta de conocimiento
antes de tocar el sistema. Esto conecta con algo que he venido explorando bastante en
[KDD](/es/knowledge-driven-development/): más contexto no siempre significa mejor contexto. Lo
importante es entregar el conocimiento que realmente corresponde al alcance de la decisión.

## Implementar y verificar son dos cosas diferentes

Otro problema frecuente en desarrollo asistido por IA aparece cuando el agente termina una tarea y
simplemente responde algo como:

> "Implementation completed successfully."

Eso no debería ser suficiente.

Una cosa es ejecutar cambios y otra distinta es demostrar que esos cambios cumplen lo solicitado.
Por eso el lifecycle incluye Implementation Evidence.

La evidencia puede registrar qué cambió, qué archivos o áreas fueron modificados, qué validaciones
se ejecutaron, qué decisiones surgieron durante la implementación, qué se desvió del plan inicial y
qué nuevos gaps de conocimiento aparecieron.

Esa información permite que la siguiente etapa, Verification, no dependa únicamente de lo que el
agente afirma haber hecho. La verificación puede contrastar la intención inicial, los acceptance
criteria, los resultados de validación, las excepciones y la evidencia producida durante la
implementación. Así, completar un Work Item deja de significar simplemente cambiar su estado a done.

## Human in the loop donde realmente importa

Este ciclo tampoco busca que la IA tome todas las decisiones. Hay puntos donde la revisión humana
sigue siendo necesaria, especialmente antes de comenzar una implementación relevante y antes de
considerar un cambio completamente terminado.

El agente puede analizar, proponer, implementar y reunir evidencia, pero el equipo conserva la
capacidad de validar decisiones importantes. Esto también permite mantener Kaddo neutral frente al
agente utilizado. La implementación puede ejecutarse con Kiro, Claude, Codex, Cursor, Copilot, otro
agente o incluso directamente por una persona. Kaddo no intenta reemplazar esas herramientas: su
responsabilidad es mantener el conocimiento, el Work Item y el ciclo alrededor de quien esté
ejecutando el cambio.

## El conocimiento también debería aprender de la implementación

Quizá la parte que más me interesa de este ciclo aparece después de completar el trabajo. Durante
una implementación casi siempre descubrimos cosas que no conocíamos antes: una restricción técnica,
una dependencia inesperada, una regla de negocio, una nueva convención o una decisión arquitectónica
que terminó siendo necesaria.

Si ese conocimiento queda únicamente en el código o en la conversación con el agente, probablemente
tendrá que ser descubierto nuevamente en el futuro. Por eso el lifecycle termina con Learning. Los
aprendizajes relevantes pueden regresar al Knowledge del proyecto y convertirse en contexto para
futuros Work Items.

El ciclo termina siendo algo parecido a:

```text
Knowledge → Work Item → Implementation → Evidence → Learning → Knowledge
```

Ahí el conocimiento deja de ser documentación estática y empieza a evolucionar junto con el
software.

## De contexto para agentes a una capa alrededor del delivery

Esta evolución también cambió la manera en que veo Kaddo como producto. Inicialmente, el foco estaba
principalmente en estructurar el conocimiento que los agentes necesitan para trabajar mejor. Ahora
ese conocimiento puede participar durante casi todo el recorrido de un cambio: definición,
planificación, implementación, evidencia, verificación y aprendizaje.

Kaddo no reemplaza GitHub, Jira, el IDE ni los agentes utilizados para programar: funciona como una
capa de conocimiento y coordinación alrededor del delivery. Esto permite mantener trazabilidad entre
qué se pidió, qué se entendió, cómo se planeó, qué se implementó, cómo se verificó y por qué
finalmente se consideró terminado. En proyectos donde participan varias personas o varios agentes,
esa trazabilidad empieza a ser especialmente valiosa.

## El contexto también debe ser proporcional

Otro principio que se mantiene dentro de esta evolución es evitar que cada Work Item cargue todo el
conocimiento disponible del proyecto. El conocimiento permanece separado y el contexto se ensambla
según lo que necesita cada cambio.

Un cambio pequeño requiere poco contexto. Un cambio entre varios módulos necesita una mirada más
amplia. Una modificación arquitectónica requiere conocimiento más profundo del sistema. Esto evita
convertir cada Work Item en un documento enorme y permite que la memoria del proyecto siga creciendo
sin obligar a cada agente a procesarla completa.

El objetivo no es maximizar contexto, es maximizar contexto relevante.

## Kaddo ahora construye Kaddo

Una de las pruebas más interesantes de este lifecycle fue aplicarlo sobre el propio proyecto.
Durante las últimas iteraciones, Kaddo fue incorporando las capacidades necesarias para reemplazar
el flujo que anteriormente dependía de OpenSpec. Después empezamos a construir Work Items reales
usando exclusivamente el lifecycle nativo hasta retirar OpenSpec del workflow activo.

Incluso el trabajo necesario para eliminar OpenSpec fue gestionado como un Work Item de Kaddo. En
otras palabras: Kaddo define trabajo con Kaddo, lo planifica con Kaddo, lo implementa con Kaddo, lo
verifica con Kaddo y utiliza lo aprendido para seguir mejorando Kaddo. Ese milestone lo resumí hace
tiempo en una frase: "Build Kaddo with Kaddo".

No significa que el ciclo esté terminado. Seguramente seguirán apareciendo fricciones y
oportunidades para simplificarlo, pero sí representa algo importante: Kaddo ya puede evolucionar
utilizando los mismos principios que propone para otros proyectos.

## El desarrollo asistido por IA necesita memoria, no solo prompts

La evolución más importante para mí no está en haber agregado más estados a un Work Item, está en
entender que el desarrollo asistido por IA necesita conectar varias cosas que normalmente están
separadas:

```text
Knowledge + Intent + Planning + Implementation + Evidence + Verification + Learning
```

Los agentes seguirán mejorando y cada vez serán capaces de ejecutar más trabajo por su cuenta, pero
precisamente por eso necesitamos mejores mecanismos para mantener intención, contexto, evidencia y
aprendizaje alrededor de lo que hacen.

El objetivo de Kaddo sigue siendo el mismo: que los agentes no construyan software únicamente con el
código que tienen enfrente, sino con el conocimiento necesario para tomar mejores decisiones dentro
del proyecto.

La diferencia es que ahora ese conocimiento puede acompañar mucho más del ciclo de desarrollo,
porque darle contexto a la IA es importante, pero saber qué ocurrió después de dárselo es todavía
más importante.
