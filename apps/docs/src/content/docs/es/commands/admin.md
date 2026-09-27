---
title: kaddo admin
description: Lanza la interfaz web admin local para un proyecto Kaddo.
---

`kaddo admin` inicia un servidor web local que proporciona un dashboard admin interactivo
sobre el proyecto Kaddo actual. Reúne observabilidad del proyecto, gestión de Work Items,
gestión de Integraciones y exploración del Sistema en una interfaz de navegador.

## Uso

```bash
kaddo admin
kaddo admin --port 8080
kaddo admin --host 0.0.0.0
kaddo admin --no-open
```

## Opciones

| Flag | Por defecto | Descripción |
|---|---|---|
| `--port <number>` | `4173` | Puerto del servidor admin |
| `--host <address>` | `127.0.0.1` | Host de escucha |
| `--no-open` | `false` | No abrir el navegador automáticamente |

## Secciones

El dashboard admin contiene seis secciones:

### Overview

Resumen del proyecto, nivel de readiness, estado de capas de conocimiento, lista de módulos, progreso de ruta y findings.

### Knowledge

Navega todas las capas de conocimiento y sus artefactos. Filtra por capa, estado o búsqueda.

### Work Items

Gestión completa del ciclo de vida de Work Items — crear borradores, ver detalles, editar campos y seguir transiciones de estado. Búsqueda, filtro por estado o módulo.

### System Explorer

Grafo interactivo de la topología semántica del sistema. Alterna overlays de Knowledge, Delivery e Implementation. Deep-link a nodos. Para Work Items refinados, visualiza la clasificación de impacto del sistema (afectado, revisado, desconocido) proyectada sobre el grafo.

### Integrations

Gestiona integraciones externas (Jira, GitHub, etc.): agregar, configurar, verificar conectividad, habilitar/deshabilitar, establecer credenciales y eliminar. Soporta el catálogo de proveedores con configSchema y secretSchema.

### External Work Items

Descubre work items en todas las integraciones habilitadas. Filtra por tipo, estado o búsqueda. Importa items como Work Items en borrador con detección de duplicados. Paginación con Load More.

## Seguridad

- Autenticación de sesión: local, efímera, basada en cookies (SameSite=strict, HttpOnly)
- Protección CSRF: verificación de mismo origen en todas las solicitudes que modifican estado
- Validación de entrada: IDs de integración y nombres de secretos validados del lado del servidor contra path traversal
- Secretos: nunca expuestos en respuestas de API (solo presencia booleana)
- ErrorBoundary: un crash en una sección no afecta a las demás

## Arquitectura

- El servidor admin consume la lógica de dominio de Kaddo Core — nunca la duplica
- Git sigue siendo la fuente canónica de verdad; SQLite es almacenamiento operativo
- El frontend usa el Kaddo Design System con tokens de color semánticos y de dominio
- Todos los datos fluyen a través de una API REST en `/api/v1/admin/`

## Limitaciones conocidas

- Un solo usuario, una sola máquina — no diseñado para despliegue de equipo
- La edición de Work Items está limitada a los campos soportados por la Admin API
- El rendimiento del System Explorer degrada por encima de ~500 nodos

## Requisitos

- Node.js >= 22.5 (para el módulo built-in `node:sqlite`)
- El proyecto debe estar inicializado con `kaddo init`
- El frontend admin debe estar compilado (`pnpm -r build`)
