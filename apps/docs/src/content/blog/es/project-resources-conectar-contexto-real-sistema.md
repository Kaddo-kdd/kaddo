---
title: 'Project Resources en Kaddo: conectar el contexto real del sistema'
description: Project Resources hace visibles las dependencias externas que condicionan un sistema, para que personas y agentes conecten módulos, capacidades y Work Items con el contexto real.
publishedAt: 2026-10-07
author: Julian Dario Luna Patiño
tags:
  - knowledge-driven-development
  - ai-assisted-development
  - project-resources
  - context-engineering
  - multirepo
locale: es
cover: /blog/project-resources/cover.webp
featured: false
translationKey: project-resources-real-context
---

> Publicado originalmente en [AWS Builder Center](https://builder.aws.com/content/3KNMYqCefLOjsoyFfnnkfRSq0Un/project-resources-en-kaddo-conectar-el-contexto-real-del-sistema). Sexto artículo de la serie Knowledge Driven Development (KDD).

Cuando hablamos de contexto para agentes de IA, es normal pensar primero en código, documentación,
arquitectura o Work Items. Sin embargo, un sistema real no vive únicamente dentro del repositorio.
Depende de bases de datos, APIs, colas, almacenamiento, componentes compartidos y servicios externos
que condicionan cómo funciona y cómo puede evolucionar.

Ese contexto suele estar distribuido entre variables de entorno, infraestructura, documentación y
conocimiento del equipo. Podemos entender qué hace un módulo y aun así no saber de qué depende para
operar. **Project Resources** de Kaddo hace visibles esas dependencias como parte del conocimiento del
proyecto.

![El contexto de un sistema incluye dependencias externas, no solo el código del repositorio](/blog/project-resources/external-context.webp)

## Conocer la tecnología no es lo mismo que conocer los recursos

Saber que un proyecto usa PostgreSQL, Redis, Kafka o S3 ayuda a entender el stack, pero no explica
cómo participan esas tecnologías en el sistema. Conocer PostgreSQL no dice qué base de datos usa un
módulo, para qué, qué otras partes dependen de ella ni qué podría verse afectado si cambia.

Imaginemos un sistema de órdenes con los módulos de checkout, órdenes y notificaciones. La
arquitectura puede explicar cómo se comunican y el producto puede identificar la capacidad de crear
una orden. Aun así, el flujo real puede depender de una base de datos, una cola de eventos,
almacenamiento de comprobantes y un proveedor de pagos. Todos forman parte de la arquitectura real,
aunque no vivan como código en el mismo repositorio.

![Los recursos externos completan la arquitectura que el código por sí solo no muestra](/blog/project-resources/resources-vs-tech.webp)

## Project Resources como conocimiento del sistema

La intención no es convertir Kaddo en una herramienta para administrar infraestructura. El objetivo es
representar los recursos que importan para entender el sistema y conectarlos con el resto de su
conocimiento.

Una base de datos puede vivir en AWS, Azure, GCP o infraestructura propia. Para Kaddo importa que
existe, su propósito, su alcance y qué módulos dependen de ella. Lo mismo aplica a una API externa,
cola, bucket o servicio compartido. Así podemos conectar qué hace un módulo, de qué depende, qué
recursos utiliza y qué trabajo podría verse afectado cuando uno cambia.

## El valor está en las relaciones

Un recurso aislado aporta información limitada. Lo útil aparece al relacionarlo con capacidades,
módulos y Work Items. Si el módulo de pagos depende de un proveedor externo y un Work Item modifica
los reintentos, esa relación cambia cómo conviene refinar e implementar el cambio.

El Knowledge Graph se acerca entonces al sistema real: no solo muestra módulos conectados entre sí,
sino módulos que dependen de recursos compartidos y capacidades que atraviesan varias partes de la
solución. Esto ayuda a detectar impacto antes de modificar código.

![Las relaciones entre módulos, capacidades, Work Items y recursos hacen visible el impacto](/blog/project-resources/relationships.webp)

## Menos tiempo redescubriendo dependencias

Sin este conocimiento, cada agente debe descubrir otra vez las dependencias. Puede encontrar una
variable como **ORDERS_DATABASE_URL**, una llamada a una API o un productor de eventos, pero aún debe
inferir qué significan y qué impacto tienen. Ese recorrido se repite y depende demasiado de señales
locales.

Cuando los recursos forman parte del conocimiento estructurado, el punto de partida cambia. El agente
puede razonar sobre cómo interactúa el cambio con esas dependencias, en vez de tener que descubrir
primero que existen. Es una aplicación práctica de la [eficiencia de contexto](/es/token-efficiency/):
reducir exploración innecesaria, no llenar el contexto sin criterio.

![El conocimiento estructurado reduce la exploración repetida de dependencias](/blog/project-resources/exploration.webp)

## Mejor refinement, no más burocracia

Esta conexión es especialmente útil al refinar un Work Item. Pensemos en permitir que una orden se
reintente cuando falle un pago. Mirar solo el módulo de órdenes puede llevar a una solución local.
Al incorporar los recursos, aparecen preguntas necesarias: ¿el proveedor de pagos soporta
idempotencia?, ¿hay una cola entre componentes?, ¿dónde persiste el estado del intento?, ¿otros
módulos consumen los eventos que van a cambiar?

El Work Item describe mejor el cambio real: no solo qué código tocar, sino qué parte del sistema se
altera y qué dependencias deben considerarse antes de construir. Los roles de recurso conectan esa
información al Implementation Handoff sin cargar al agente con todo el inventario del proyecto.

![Los recursos relevantes dan al refinement una visión de sistema antes de implementar](/blog/project-resources/refinement.webp)

## En multirepo es todavía más importante

Cuando una solución se distribuye entre repositorios, entender dependencias no es opcional. Un
repositorio puede conocer su implementación y aun así ignorar que comparte una base de datos, cola o
servicio externo con otros módulos.

Kaddo mantiene una visión global desde un core mientras cada módulo conserva contexto técnico propio.
Project Resources conecta esos módulos mediante las dependencias que realmente comparten. Dos
repositorios que parecían independientes pueden depender del mismo recurso; conocerlo cambia la
evaluación de impacto y evita soluciones correctas localmente, pero incompletas a nivel de sistema.

![Un catálogo de recursos compartidos conecta el contexto de varios repositorios](/blog/project-resources/multirepo.webp)

## Conocer no significa tener acceso

Representar un recurso no implica guardar secretos, credenciales o información sensible. Saber que un
módulo utiliza una base de datos es conocimiento; tener su contraseña es acceso. Kaddo registra lo
suficiente para razonar sobre propósito, interfaces y límites, mientras que las credenciales siguen en
las herramientas diseñadas para protegerlas.

Esta frontera es central: Project Resources es conocimiento de solo lectura. Kaddo no se conecta a
AWS, Supabase u otros proveedores, no ejecuta interfaces ni almacena valores de secretos.

![El contexto describe dependencias y límites sin convertir el repositorio en un almacén de secretos](/blog/project-resources/knowledge-and-access.webp)

## De documentos a un modelo vivo

Business explica por qué existe el sistema; Product, qué capacidades entrega; Tech, cómo está
construido; y Delivery, cómo queremos evolucionarlo. Los módulos muestran dónde viven las
responsabilidades. Project Resources hace visibles las dependencias que los conectan con servicios,
datos e infraestructura. Los Work Items convierten ese contexto en trabajo y el lifecycle acompaña el
cambio hasta su verificación y aprendizaje.

El objetivo no es agregar otra categoría de documentación. Es construir mejores conexiones entre lo
que ya sabemos del sistema para responder con más confianza qué parte del producto cambia, de qué
depende y qué otras áreas podrían verse afectadas.

![El conocimiento estructurado se convierte en un modelo vivo del sistema](/blog/project-resources/living-model.webp)

Lee la [documentación de Project Resources](/es/project-resources/) para modelarlos en tu proyecto.

