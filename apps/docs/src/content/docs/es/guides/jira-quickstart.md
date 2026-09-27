---
title: Jira — Inicio Rápido
description: Conecta Jira a Kaddo e importa work items en menos de cinco minutos.
---

Esta guía muestra cómo conectar una instancia de Jira a Kaddo e importar tu primer work item.

## Prerrequisitos

- Proyecto Kaddo inicializado (`kaddo init`)
- Una instancia de Jira (Cloud o Server) con acceso API
- Un API token de Jira ([crea uno aquí](https://id.atlassian.com/manage-profile/security/api-tokens) para Cloud)

## Paso 1 — Agregar la integración Jira

### Vía Admin UI

1. Ejecuta `kaddo admin` y abre Integrations
2. Clic en "+ Add Integration"
3. Selecciona **Jira** del catálogo de proveedores
4. Completa:
   - **Integration ID**: ej. `my-jira`
   - **Base URL**: URL de tu instancia Jira (ej. `https://empresa.atlassian.net`)
   - **Email**: tu email de cuenta Jira
   - **API Token**: tu token API de Jira (almacenado cifrado, nunca expuesto en respuestas API)
5. Clic en "Verify & Save" — Kaddo prueba la conexión antes de confirmar

### Vía CLI

```bash
kaddo integrations create --id my-jira --adapter jira
kaddo integrations set-config my-jira baseUrl https://empresa.atlassian.net
kaddo integrations set-secret my-jira email tu@empresa.com
kaddo integrations set-secret my-jira apiToken TU_TOKEN
kaddo integrations enable my-jira
kaddo integrations status my-jira
```

## Paso 2 — Configurar filtros (opcional)

Por defecto, Kaddo descubre todos los items a los que el API token tiene acceso. Acota el alcance con JQL:

- **Admin UI**: Ve al detalle de la integración → sección Filters
- **CLI**: `kaddo integrations set-filter my-jira jql "project = PROJ AND status != Done"`

## Paso 3 — Descubrir e importar

### Vía Admin UI

1. Ve a **External Work Items**
2. Los items de Jira aparecen agrupados bajo la integración
3. Filtra por tipo (Bug, Task, Story, Epic) o estado
4. Clic en **Import** en cualquier item → elige un tipo de Work Item Kaddo → "Import as Draft"
5. Kaddo detecta duplicados — los items ya importados muestran el badge "Imported"

### Vía CLI

```bash
kaddo integrations discover my-jira
kaddo integrations import my-jira PROJ-123 --type feature
```

## Qué sucede al importar

1. Kaddo crea un Work Item en **Draft** en `knowledge/delivery/work-items/draft/`
2. Los datos originales externos se almacenan como snapshot para procedencia
3. El detalle del Work Item muestra la integración fuente, ID externo y timestamp de última sincronización
4. El item importado se marca en External Work Items — la reimportación es bloqueada

## Solución de problemas

| Problema | Solución |
|---|---|
| Estado `unauthorized` | Verifica email + API token; asegura que el token tenga acceso de lectura |
| Estado `invalid-config` | Verifica el formato de base URL (incluye `https://`) |
| No se descubren items | Verifica el filtro JQL; asegura que el token tenga acceso al proyecto |
| Error "Invalid JQL" | Kaddo normaliza el error — verifica la sintaxis JQL en Jira |
