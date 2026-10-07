---
title: Cómo trabajar con proyectos legacy con IA sin romper lo que ya funciona
description: La IA no resuelve por sí sola la incertidumbre de un sistema legacy. Un enfoque seguro hace visibles riesgos, incógnitas y dependencias antes de cambiar código.
publishedAt: 2026-10-05
author: Julian Dario Luna Patiño
tags:
  - knowledge-driven-development
  - ai-assisted-development
  - legacy
  - migration
  - software-architecture
locale: es
cover: /blog/legacy-ai/cover.webp
featured: false
translationKey: legacy-ai-modernization
---

> Publicado originalmente en [AWS Builder Center](https://builder.aws.com/content/3KHwuq79rg4dyQPg2oaSrt13YKV/como-trabajar-con-proyectos-legacy-con-ia-sin-romper-lo-que-ya-funciona). Quinto artículo de la serie Knowledge Driven Development (KDD).

## Antes de modernizar un sistema legacy, primero hay que entenderlo

Cuando hablamos de IA aplicada al desarrollo de software, es fácil imaginar el escenario ideal:
conectar un agente al repositorio, pedirle que entienda el sistema y empezar a refactorizar,
actualizar dependencias o reemplazar componentes antiguos. En un sistema legacy, la situación es
distinta. El código puede mostrar qué hace el sistema, pero no necesariamente por qué lo hace.

Una condición aparentemente innecesaria puede proteger una regla de negocio que nadie documentó. Una
duplicación puede existir por diferencias entre clientes o países. Una dependencia obsoleta puede
sostener un proceso crítico que sigue funcionando todos los días. Cuando la IA entra en un proyecto
legacy, su primera responsabilidad no debería ser cambiar código: debería ayudar a reducir
incertidumbre.

Ese es el principio del enfoque legacy de Kaddo: **entender antes de cambiar y mantener ese
entendimiento durante todo el ciclo de la modificación**.

## Legacy no significa simplemente código viejo

![Un sistema legacy requiere entender conocimiento y dependencias, no solo su tecnología](/blog/legacy-ai/legacy-definition.webp)

Un sistema no se vuelve legacy solo por usar una versión antigua de Java, .NET o PHP. Incluso un
proyecto reciente puede ser legacy si nadie entiende bien sus dependencias, si las decisiones
importantes no quedaron registradas o si modificar una parte del sistema genera miedo porque no se
sabe qué podría romperse.

El riesgo no está únicamente en lo que conocemos del código, sino también en lo que todavía no
conocemos. Si sabemos que facturación comparte transacciones con conciliación, tenemos un riesgo que
debemos mitigar. Si no sabemos quién consume una tabla o por qué existe una validación extraña,
tenemos una incógnita que debemos investigar. Tratar ambas cosas por separado es más seguro que dejar
que un agente complete el vacío con una suposición.

## Convertir incertidumbre en conocimiento explícito

![Riesgos, incógnitas y candidatos de modernización se vuelven conocimiento explícito](/blog/legacy-ai/uncertainty.webp)

El flujo legacy de Kaddo empieza construyendo una imagen más clara del sistema a partir de señales
técnicas, contexto existente y análisis asistido por agentes. De ahí surgen tres clases de
conocimiento:

- **Riesgos conocidos**: áreas donde un cambio podría tener consecuencias importantes.
- **Incógnitas**: preguntas que aún no podemos responder con confianza.
- **Candidatos de modernización**: oportunidades que merecen validación, no compromisos de
  implementación.

En lugar de afirmar que un módulo debe reemplazarse, podemos registrar que parece un candidato porque
concentra dependencias y presenta determinados riesgos. La segunda formulación conserva la
incertidumbre, deja espacio para validar y evita convertir una hipótesis temprana en una decisión
arquitectónica. Esto importa especialmente con IA: los modelos producen explicaciones plausibles;
en legacy también debe ser visible cuándo esas explicaciones siguen siendo hipótesis.

## La arquitectura actual viene antes que la futura

![La arquitectura actual y las capacidades del producto guían una modernización segura](/blog/legacy-ai/current-state.webp)

Al modernizar, es tentador saltar a la arquitectura objetivo: servicios, contenedores, eventos o
serverless. Pero una arquitectura objetivo tiene poco valor si todavía no entendemos la que existe
hoy. Antes de decidir cómo modernizar, deberíamos poder responder qué capacidades soporta cada
módulo, quién depende de él, qué integraciones son críticas, dónde están las zonas de mayor riesgo y
qué falta por conocer.

Por eso Kaddo relaciona el estado actual del sistema con las capacidades de producto. No busca crear
diagramas por crear, sino entender qué partes del software sostienen determinado valor y cuáles
merecen mayor cuidado. En legacy, el `current state` es la base para decidir si el `target state`
tiene sentido.

## Modernizar no significa reescribir

![La modernización debe preservar comportamiento y validar impacto antes de reemplazar](/blog/legacy-ai/modernization.webp)

Los agentes pueden hacer una reescritura más atractiva porque producen código rápido. Pero escribir
código rara vez es lo más difícil de reemplazar en un sistema legacy. El reto es reproducir el
comportamiento acumulado: reglas de negocio que nunca llegaron a un documento, validaciones,
consultas, integraciones y expectativas de usuarios.

La IA puede ayudar a descubrir oportunidades, pero no recupera automáticamente el conocimiento
perdido. Por eso los candidatos de modernización son candidatos: antes de convertirlos en trabajo
real hay que entender su impacto, dependencias y valor. La decisión de ejecutarlos sigue necesitando
contexto y criterio humano.

## Avanzar con cambios pequeños y contexto relevante

No hace falta comprender todo el legacy antes de tocar nada; eso puede convertirse en un proyecto
interminable. Es más útil realizar cambios pequeños que aporten valor y permitan aprender: validar
una hipótesis, confirmar una dependencia o comprobar una integración. El roadmap puede ordenar esos
pasos para que los primeros cambios tengan riesgo controlado y produzcan conocimiento útil para los
siguientes.

Ese conocimiento debe llegar a quien implementa. Cuando un Work Item está listo, el
[Implementation Handoff](/es/workflow/) incorpora riesgos, incógnitas y candidatos relevantes para
las áreas que se modificarán. El agente no necesita toda la historia del sistema: necesita el
contexto relevante para la decisión que está tomando. Del mismo modo, `kaddo guard` hace visible
cuando archivos modificados intersectan con áreas de riesgo conocidas; no bloquea el cambio, pero
evita que esa memoria se pierda justo cuando hace falta.

## Implementar no es lo mismo que terminar

En un sistema que conocemos parcialmente, que un agente modifique código y ejecute algunas pruebas
no basta para declarar terminado el trabajo. La implementación describe lo que ocurrió; la
verificación demuestra si corresponde con lo que se necesitaba.

Kaddo recoge evidencia de implementación: archivos y áreas modificadas, validaciones ejecutadas,
decisiones tomadas, desviaciones del plan y nuevos gaps de conocimiento. Después, `verify` contrasta
esa evidencia con los criterios de aceptación y la intención original del Work Item. La pregunta deja
de ser “¿terminaste?” y pasa a ser “¿qué cambió y qué evidencia tenemos de que cumple lo esperado?”.

## Cada cambio debería aumentar el conocimiento del sistema

![El aprendizaje de cada cambio regresa como contexto para el siguiente](/blog/legacy-ai/learning-loop.webp)

Supongamos que durante un cambio descubrimos que una tabla aparentemente interna también la usa un
proceso nocturno. Si ese hallazgo queda solo en una conversación, la próxima persona tendrá que
aprenderlo de nuevo. Debe regresar al proyecto.

Por eso Kaddo incorpora `learn` al lifecycle. Los aprendizajes de un Work Item pueden actualizar
riesgos, resolver incógnitas, reclasificar hallazgos o agregar restricciones. El ciclo se vuelve:

```text
Entender -> Cambio pequeño -> Verificar -> Aprender -> Mejor contexto
```

En legacy, ese patrón permite que el conocimiento crezca al mismo ritmo que la modernización. No se
trata de detener el proyecto para producir documentación perfecta, sino de aprender mientras se
evoluciona el sistema.

## La modernización empieza reduciendo incertidumbre

Kaddo no convierte automáticamente un monolito en microservicios ni reemplaza el juicio del equipo.
El CLI reúne señales y evidencia; los agentes ayudan a interpretar, formular hipótesis e identificar
riesgos; las personas conservan las decisiones de impacto real. El valor está en la continuidad: que
el conocimiento descubierto durante el análisis no desaparezca en la implementación y que los
aprendizajes vuelvan a estar disponibles para el siguiente cambio.

Un sistema legacy empieza a dejar de serlo cuando recuperamos la capacidad de entenderlo, cambiarlo
y aprender de él sin depender del miedo a romper lo que ya funciona. Consulta el
[flujo completo para proyectos legacy](/es/use-cases/legacy-project/) para llevar este enfoque a la
práctica.

