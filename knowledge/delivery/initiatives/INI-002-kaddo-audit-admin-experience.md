---
type: initiative
id: INI-002
title: 'Kaddo Audit: Admin Experience'
status: planned
knowledge_level: K3
domains:
  - Tech
  - Delivery
  - Product Experience
related_capabilities: []
created_at: '2026-11-27'
external_links: []
candidates:
  - id: AUD-ADMIN-C1
    title: Audit API Contracts & Core Integration
    type: feature
    suggested_knowledge_level: K3
    expected_value: 'Una API coherente sobre el motor existente, sin duplicación de lógica.'
    notes: >-
      **Type:** Feature  

      **Knowledge Level:** K3  

      **Priority:** High  

      **Dependencies:** INI-001, WI-101


      Implementar los adaptadores de Admin Server para consulta de ejecuciones,
      hallazgos, comparaciones y previews, reutilizando Core.


      Incluye definir las operaciones controladas de ejecución y asociación, sus
      validaciones y los contratos que consumirá el frontend.


      **Expected value:** Una API coherente sobre el motor existente, sin
      duplicación de lógica.


      **Source signals:** EP-001 AC-9, AC-10.
    source_signals:
      - EP-001 AC-9
      - EP-001 AC-10
    dependencies:
      - INI-001
      - WI-101
    materialized_as: WI-102
  - id: AUD-ADMIN-C2
    title: Audit Explorer & Navigation
    type: feature
    suggested_knowledge_level: K2
    expected_value: Centralizar la consulta de auditorías dentro de Kaddo Admin.
    notes: >-
      **Type:** Feature  

      **Knowledge Level:** K2  

      **Priority:** High  

      **Dependencies:** AUD-ADMIN-C1


      Incorporar la sección Audit a Admin, con listado de ejecuciones, métricas,
      estados, empty states y navegación al detalle.


      **Expected value:** Centralizar la consulta de auditorías dentro de Kaddo
      Admin.


      **Source signals:** EP-001 AC-4, AC-9.
    source_signals:
      - EP-001 AC-4
      - EP-001 AC-9
    dependencies:
      - AUD-ADMIN-C1
    materialized_as: WI-103
  - id: AUD-ADMIN-C3
    title: Audit Execution Experience
    type: feature
    suggested_knowledge_level: K3
    expected_value: Ejecutar auditorías desde Admin sin utilizar manualmente el CLI.
    notes: >-
      **Type:** Feature  

      **Knowledge Level:** K3  

      **Priority:** High  

      **Dependencies:** AUD-ADMIN-C1, AUD-ADMIN-C2


      Construir el flujo visual para seleccionar el alcance, iniciar auditorías
      y presentar su resultado.


      Reutilizar la ejecución de Core bajo las restricciones existentes, con
      manejo explícito de errores, estados y confirmaciones.


      **Expected value:** Ejecutar auditorías desde Admin sin utilizar
      manualmente el CLI.


      **Source signals:** EP-001 AC-1, AC-3, AC-9, AC-10.
    source_signals:
      - EP-001 AC-1
      - EP-001 AC-3
      - EP-001 AC-9
      - EP-001 AC-10
    dependencies:
      - AUD-ADMIN-C1
      - AUD-ADMIN-C2
  - id: AUD-ADMIN-C4
    title: Findings & Evidence Explorer
    type: feature
    suggested_knowledge_level: K2
    expected_value: Facilitar el análisis técnico y la interpretación de riesgos.
    notes: >-
      **Type:** Feature  

      **Knowledge Level:** K2  

      **Priority:** High  

      **Dependencies:** AUD-ADMIN-C1, AUD-ADMIN-C2


      Implementar filtros, detalle de hallazgos, evidencia, procedencia,
      recomendaciones y referencias a conocimiento existente.


      Diferenciar severidad y confianza, y visualizar cobertura parcial.


      **Expected value:** Facilitar el análisis técnico y la interpretación de
      riesgos.


      **Source signals:** EP-001 AC-4, AC-5, AC-9.
    source_signals:
      - EP-001 AC-4
      - EP-001 AC-5
      - EP-001 AC-9
    dependencies:
      - AUD-ADMIN-C1
      - AUD-ADMIN-C2
  - id: AUD-ADMIN-C5
    title: Audit Comparison Experience
    type: feature
    suggested_knowledge_level: K2
    expected_value: Visualizar la evolución de hallazgos entre ejecuciones.
    notes: >-
      **Type:** Feature  

      **Knowledge Level:** K2  

      **Priority:** Medium  

      **Dependencies:** AUD-ADMIN-C1, AUD-ADMIN-C2, WI-101


      Implementar la selección y comparación de dos auditorías, utilizando las
      clasificaciones calculadas por `compareAuditRuns`.


      Mostrar advertencias de comparabilidad, diferencias y hallazgos no
      verificables.


      **Expected value:** Visualizar la evolución de hallazgos entre
      ejecuciones.


      **Source signals:** EP-001 AC-8, AC-9.
    source_signals:
      - EP-001 AC-8
      - EP-001 AC-9
    dependencies:
      - AUD-ADMIN-C1
      - AUD-ADMIN-C2
      - WI-101
  - id: AUD-ADMIN-C6
    title: Remediation Planning & Work Item Linking
    type: feature
    suggested_knowledge_level: K3
    expected_value: Convertir los hallazgos en acciones trazables sin crear trabajo duplicado.
    notes: >-
      **Type:** Feature  

      **Knowledge Level:** K3  

      **Priority:** High  

      **Dependencies:** AUD-ADMIN-C1, AUD-ADMIN-C4, WI-099, WI-100


      Integrar previews de remediación y permitir vincular hallazgos con Work
      Items existentes mediante aprobación explícita.


      Preservar asociaciones, evidencias y navegación contextual hacia Planning.


      **Expected value:** Convertir los hallazgos en acciones trazables sin
      crear trabajo duplicado.


      **Source signals:** EP-001 AC-6, AC-7, AC-9, AC-10.
    source_signals:
      - EP-001 AC-6
      - EP-001 AC-7
      - EP-001 AC-9
      - EP-001 AC-10
    dependencies:
      - AUD-ADMIN-C1
      - AUD-ADMIN-C4
      - WI-099
      - WI-100
  - id: AUD-ADMIN-C7
    title: 'End-to-End Validation, UX & Documentation'
    type: chore
    suggested_knowledge_level: K2
    expected_value: >-
      Entregar una experiencia integrada, verificable y consistente con el
      producto.
    notes: >-
      **Type:** Chore  

      **Knowledge Level:** K2  

      **Priority:** High  

      **Dependencies:** AUD-ADMIN-C2, C3, C4, C5, C6


      Validar el recorrido completo de Audit en Admin, su coherencia con CLI y
      las operaciones de Core.


      Incluye pruebas de integración, E2E, estados vacíos y de error,
      accesibilidad, responsive layout, light/dark mode y documentación EN/ES.


      **Expected value:** Entregar una experiencia integrada, verificable y
      consistente con el producto.


      **Source signals:** EP-001 AC-9, AC-10.
    source_signals:
      - EP-001 AC-9
      - EP-001 AC-10
    dependencies:
      - AUD-ADMIN-C2
      - AUD-ADMIN-C3
      - AUD-ADMIN-C4
      - AUD-ADMIN-C5
      - AUD-ADMIN-C6
priority: high
source: manual
epic: EP-001
---

# Initiative — Kaddo Audit: Admin Experience

**Type:** Initiative  
**Epic:** EP-001 — Kaddo Audit: Technical Assessment & Remediation Planning  
**Status:** Planned  
**Priority:** High  
**Knowledge Level:** K3  
**Domains:** Tech, Delivery, Product Experience  
**Dependencies:** INI-001 — Kaddo Audit MVP (completed), WI-101 — Audit Compare (completed)  
**ID:** Asignar mediante Kaddo.

## 1. Context & Problem

Kaddo Audit ya dispone de un motor de auditoría técnica construido sobre contratos compartidos en Core, con capacidades para ejecutar análisis, consultar hallazgos, generar reportes, comparar auditorías y previsualizar remediaciones.

Estas capacidades están disponibles principalmente mediante CLI.

Actualmente, Kaddo Admin no proporciona una experiencia dedicada para gestionar auditorías técnicas. Un usuario que trabaja desde la interfaz visual debe recurrir a comandos para ejecutar análisis, inspeccionar resultados y relacionar hallazgos con Work Items.

Esto fragmenta la experiencia del producto y limita la accesibilidad de Audit para usuarios que prefieren interactuar visualmente con el conocimiento y la planificación.

## 2. Objective

Incorporar Kaddo Audit dentro de Kaddo Admin mediante una experiencia visual que permita ejecutar, consultar, analizar y comparar auditorías técnicas, además de vincular hallazgos con Work Items existentes.

La implementación debe aprovechar los contratos y capacidades existentes de Core, asegurando consistencia entre CLI y Admin.

Admin no debe implementar un segundo motor de auditoría.

## 3. Expected Outcome

Un usuario puede abrir Kaddo Admin y completar el siguiente recorrido:

1. Acceder al módulo Audit.
2. Consultar auditorías anteriores y su estado.
3. Ejecutar una nueva auditoría, definiendo el alcance.
4. Visualizar los resultados, hallazgos y limitaciones.
5. Filtrar y examinar la evidencia de cada hallazgo.
6. Comparar dos auditorías para evaluar cambios.
7. Consultar recomendaciones de remediación.
8. Asociar hallazgos con Work Items existentes mediante aprobación explícita.
9. Navegar desde el hallazgo al Work Item relacionado.

Todo esto sin ejecutar manualmente comandos CLI.

## 4. Functional Scope

### 4.1. Audit Explorer

Incorporar una sección **Audit** en la navegación principal de Kaddo Admin.

Debe presentar:

- Historial de auditorías.
- Fecha e identificador de ejecución.
- Estado: completed, partial o failed.
- Alcance evaluado.
- Cantidad de hallazgos.
- Distribución por severidad.
- Cobertura y limitaciones.
- Acciones para consultar, ejecutar o comparar auditorías.

Si no existen auditorías, mostrar una experiencia inicial que permita ejecutar la primera.

La interfaz debe seguir el sistema visual existente de Kaddo Admin, con compatibilidad para light mode y dark mode.

### 4.2. Execute Audit

Permitir ejecutar una auditoría desde Admin.

El usuario puede definir:

- Proyecto completo.
- Módulos seleccionados.
- Rutas específicas, cuando el motor las admita.

La ejecución debe utilizar el motor existente y los contratos canónicos de Audit.

El sistema debe:

- Mostrar el alcance que se ejecutará.
- Requerir una acción explícita del usuario para iniciar.
- Mostrar estado de ejecución y resultado.
- Gestionar errores y cobertura parcial.
- Evitar ejecuciones duplicadas por reintentos de interfaz.
- Permitir consultar el resultado una vez finalizado.

La operación debe conservar las mismas restricciones de ejecución y conectividad del motor existente, sin introducir permisos implícitos por utilizar Admin.

La publicación de reportes canónicos continúa requiriendo autorización independiente.

### 4.3. Findings Explorer

Construir una vista que permita analizar los hallazgos de una ejecución.

Información requerida:

- Identificador estable.
- Título y descripción.
- Categoría.
- Severidad.
- Confianza.
- Estado.
- Archivo, línea o componente afectado, cuando exista.
- Evidencia y procedencia.
- Impacto disponible.
- Recomendación.
- Relaciones con ADRs, capacidades, riesgos y Work Items.

Filtros:

- Severidad.
- Categoría.
- Confianza.
- Módulo.
- Estado, cuando esté disponible en el contrato persistido.

Distinguir claramente hallazgos confirmados, inferencias y áreas no evaluadas.

No presentar un análisis parcial como una auditoría limpia.

### 4.4. Audit Comparison

Incorporar una experiencia visual para comparar dos ejecuciones persistidas mediante el motor existente de `audit compare`.

Permitir seleccionar una auditoría base y una posterior.

Mostrar:

- Hallazgos persistentes.
- Hallazgos nuevos.
- Hallazgos resueltos.
- Hallazgos no verificables.
- Cambios de severidad, confianza, estado y evidencia.
- Advertencias sobre diferencias de cobertura, herramientas y alcance.

La interfaz debe conservar las clasificaciones conservadoras calculadas por Core.

No reinterpretar un hallazgo `unverifiable` como resuelto o nuevo.

### 4.5. Remediation Planning

Integrar la previsualización disponible mediante `audit plan`.

La experiencia debe mostrar acciones recomendadas para cada hallazgo, incluyendo:

- Severidad y confianza.
- Evidencia.
- Recomendación de remediación.
- Work Items existentes relacionados.
- Asociaciones previamente aprobadas.
- Sugerencias pendientes de revisión.

Permitir seleccionar un Work Item existente y confirmar su asociación con el hallazgo.

La asociación debe utilizar la operación canónica, preservar la revisión del Work Item y evitar duplicados.

El preview no debe modificar Planning.

No crear automáticamente Initiatives, Epics o Work Items. La generación de nuevas entidades de remediación se abordará mediante una evolución posterior de Planning.

### 4.6. Planning Integration

Desde el detalle de un hallazgo, permitir navegar al Work Item asociado, conservando el contexto de origen.

Cuando existan relaciones aprobadas, mostrarlas tanto en Audit como en la experiencia de Work Items, reutilizando las convenciones de navegación existentes.

No modificar el lifecycle de Work Items o Initiatives como consecuencia de ejecutar una auditoría.

### 4.7. API & Shared Core

Incorporar los contratos necesarios en Admin Server para consumir las capacidades existentes de Core.

La API debe permitir:

- Listar auditorías.
- Consultar una auditoría específica.
- Consultar hallazgos filtrados.
- Ejecutar una auditoría mediante una operación controlada.
- Comparar ejecuciones.
- Consultar un preview de remediación.
- Vincular un hallazgo con un Work Item mediante confirmación.

Reutilizar las funciones de Core y sus contratos. Solo incorporar nuevos adaptadores cuando sean necesarios para el entorno Admin.

Mantener las validaciones de sesión, identificadores, rutas y permisos que correspondan.

No ejecutar comandos arbitrarios recibidos desde el navegador.

## 5. Work Item Candidates

Los siguientes candidatos constituyen una descomposición inicial. Deben revisarse y refinarse antes de materializarlos.

### AUD-ADMIN-C1 — Audit API Contracts & Core Integration

**Type:** Feature  
**Knowledge Level:** K3  
**Priority:** High  
**Dependencies:** INI-001, WI-101

Implementar los adaptadores de Admin Server para consulta de ejecuciones, hallazgos, comparaciones y previews, reutilizando Core.

Incluye definir las operaciones controladas de ejecución y asociación, sus validaciones y los contratos que consumirá el frontend.

**Expected value:** Una API coherente sobre el motor existente, sin duplicación de lógica.

**Source signals:** EP-001 AC-9, AC-10.

### AUD-ADMIN-C2 — Audit Explorer & Navigation

**Type:** Feature  
**Knowledge Level:** K2  
**Priority:** High  
**Dependencies:** AUD-ADMIN-C1

Incorporar la sección Audit a Admin, con listado de ejecuciones, métricas, estados, empty states y navegación al detalle.

**Expected value:** Centralizar la consulta de auditorías dentro de Kaddo Admin.

**Source signals:** EP-001 AC-4, AC-9.

### AUD-ADMIN-C3 — Audit Execution Experience

**Type:** Feature  
**Knowledge Level:** K3  
**Priority:** High  
**Dependencies:** AUD-ADMIN-C1, AUD-ADMIN-C2

Construir el flujo visual para seleccionar el alcance, iniciar auditorías y presentar su resultado.

Reutilizar la ejecución de Core bajo las restricciones existentes, con manejo explícito de errores, estados y confirmaciones.

**Expected value:** Ejecutar auditorías desde Admin sin utilizar manualmente el CLI.

**Source signals:** EP-001 AC-1, AC-3, AC-9, AC-10.

### AUD-ADMIN-C4 — Findings & Evidence Explorer

**Type:** Feature  
**Knowledge Level:** K2  
**Priority:** High  
**Dependencies:** AUD-ADMIN-C1, AUD-ADMIN-C2

Implementar filtros, detalle de hallazgos, evidencia, procedencia, recomendaciones y referencias a conocimiento existente.

Diferenciar severidad y confianza, y visualizar cobertura parcial.

**Expected value:** Facilitar el análisis técnico y la interpretación de riesgos.

**Source signals:** EP-001 AC-4, AC-5, AC-9.

### AUD-ADMIN-C5 — Audit Comparison Experience

**Type:** Feature  
**Knowledge Level:** K2  
**Priority:** Medium  
**Dependencies:** AUD-ADMIN-C1, AUD-ADMIN-C2, WI-101

Implementar la selección y comparación de dos auditorías, utilizando las clasificaciones calculadas por `compareAuditRuns`.

Mostrar advertencias de comparabilidad, diferencias y hallazgos no verificables.

**Expected value:** Visualizar la evolución de hallazgos entre ejecuciones.

**Source signals:** EP-001 AC-8, AC-9.

### AUD-ADMIN-C6 — Remediation Planning & Work Item Linking

**Type:** Feature  
**Knowledge Level:** K3  
**Priority:** High  
**Dependencies:** AUD-ADMIN-C1, AUD-ADMIN-C4, WI-099, WI-100

Integrar previews de remediación y permitir vincular hallazgos con Work Items existentes mediante aprobación explícita.

Preservar asociaciones, evidencias y navegación contextual hacia Planning.

**Expected value:** Convertir los hallazgos en acciones trazables sin crear trabajo duplicado.

**Source signals:** EP-001 AC-6, AC-7, AC-9, AC-10.

### AUD-ADMIN-C7 — End-to-End Validation, UX & Documentation

**Type:** Chore  
**Knowledge Level:** K2  
**Priority:** High  
**Dependencies:** AUD-ADMIN-C2, C3, C4, C5, C6

Validar el recorrido completo de Audit en Admin, su coherencia con CLI y las operaciones de Core.

Incluye pruebas de integración, E2E, estados vacíos y de error, accesibilidad, responsive layout, light/dark mode y documentación EN/ES.

**Expected value:** Entregar una experiencia integrada, verificable y consistente con el producto.

**Source signals:** EP-001 AC-9, AC-10.

## Success Criteria
- SC-01: El usuario puede acceder a Audit desde la navegación principal de Kaddo Admin y consultar las auditorías persistidas.

- SC-02: Puede ejecutar una auditoría desde Admin, seleccionar el alcance y consultar su resultado utilizando el motor compartido.

- SC-03: Puede analizar hallazgos mediante filtros, evidencias, procedencia, severidad, confianza y recomendaciones.

- SC-04: Puede comparar dos auditorías conservando las clasificaciones y advertencias de Core, incluidas las diferencias no verificables.

- SC-05: Puede previsualizar acciones de remediación y asociar hallazgos a Work Items existentes únicamente mediante confirmación explícita.

- SC-06: Las operaciones de consulta son de solo lectura y las operaciones que generan efectos requieren acciones y autorizaciones apropiadas.

- SC-07: Admin y CLI consumen las mismas estructuras y resultados de Core, sin motores de auditoría paralelos.

- SC-08: La experiencia completa cuenta con pruebas unitarias, de integración y E2E, documentación actualizada y validación visual local.

## 7. Out of Scope

- Implementar nuevos analizadores de código, seguridad o dependencias.
- Incorporar adaptadores Rust.
- Corregir los hallazgos técnicos de los analizadores existentes; estos se gestionan en trabajos de estabilización independientes.
- Rediseñar el contrato canónico `AuditRun` o `AuditFinding` sin necesidad comprobada.
- Implementar el flujo de auditoría mediante MCP.
- Crear automáticamente Work Items, Initiatives o Epics.
- Aplicar remediaciones o modificar código automáticamente.
- Generar comparaciones semánticas no soportadas por Core.
- Introducir un motor de ejecución arbitraria de comandos.
- Crear un sistema de monitoreo continuo o programación recurrente de auditorías.
- Rediseñar todo Kaddo Admin.

## 8. Implementation Constraints

- Core debe seguir siendo la fuente de verdad.
- No duplicar reglas de severidad, comparabilidad, correlación o priorización en el frontend.
- Conservar la semántica de cobertura parcial y resultados no verificables.
- No modificar automáticamente artefactos canónicos de conocimiento o Planning.
- Las operaciones de ejecución deben estar limitadas al proyecto configurado y a los analizadores permitidos.
- Preservar seguridad de rutas, autorización y validaciones de Admin Server.
- Evitar sobreescrituras y ejecuciones duplicadas.
- Reutilizar componentes, tokens visuales y patrones de navegación existentes en Kaddo Admin.
- Mantener separadas las operaciones de lectura, ejecución, publicación y asociación de hallazgos.

## 9. Validation Strategy

Verificar progresivamente:

1. Contratos y endpoints contra auditorías persistidas de prueba.
2. Explorador con auditorías completas, parciales y fallidas.
3. Ejecución de auditoría desde Admin.
4. Exploración de hallazgos confirmados e inferidos.
5. Comparación de auditorías con hallazgos persistentes, no verificables y diferencias de cobertura.
6. Preview de remediación sin escrituras.
7. Asociación aprobada con un Work Item y navegación contextual.
8. Regresiones de CLI, Planning y lifecycle.
9. Validación visual en light mode, dark mode y pantallas de distintos tamaños.

Las pruebas no deben depender de vulnerabilidades públicas activas ni requerir llamadas externas no autorizadas.

## 10. Completion & Human Review

La Initiative se considerará lista para revisión de cierre cuando:

- Los candidatos comprometidos estén materializados y ejecutados.
- Sus Success Criteria tengan evidencias verificables.
- Exista una prueba funcional de extremo a extremo.
- Admin y CLI demuestren resultados coherentes.
- La interfaz se haya ejecutado y revisado localmente.
- La documentación esté actualizada.
- Se hayan identificado claramente las limitaciones del motor que permanecen fuera del alcance.

**Integration Gate:** Antes de cada commit o push, presentar los cambios, resultados de pruebas y validación visual local, y solicitar autorización humana explícita.

No completar automáticamente la Initiative al finalizar sus Work Items. El cierre debe apoyarse en sus resultados verificables y una decisión humana.

## 11. Expected Business & Product Value

Kaddo Audit deja de ser una capacidad principalmente técnica del CLI y se convierte en una experiencia accesible desde Kaddo Admin.

Esto permite que desarrolladores, arquitectos y líderes técnicos consulten riesgos, comprendan evidencia, comparen resultados y relacionen hallazgos con trabajo planificado desde una misma interfaz.

La diferenciación de Kaddo permanece en convertir el análisis técnico en conocimiento y trabajo trazable, no simplemente en presentar otro dashboard de vulnerabilidades.
