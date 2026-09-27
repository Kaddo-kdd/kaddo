---
title: Guía del Admin MVP
description: Guía completa de la interfaz web Kaddo Admin — configuración, secciones y uso diario.
---

Esta guía cubre la interfaz web de Kaddo Admin desde el primer lanzamiento hasta el uso diario.

## Inicio rápido

```bash
# Compilar una vez (necesario después de instalar o actualizar)
pnpm -r build

# Lanzar el admin
kaddo admin
```

El navegador se abre en `http://127.0.0.1:4173`. Una cookie de sesión se establece automáticamente — no se requiere login.

## Navegando las seis secciones

### 1. Overview

La página de inicio. Muestra readiness del proyecto, salud de las capas de conocimiento, findings activos y el siguiente paso recomendado. Úsala como tu revisión matutina.

### 2. Knowledge

Navega los artefactos de conocimiento organizados por capa (Business, Product, Tech, Delivery). Cada tarjeta de capa muestra cantidad de artefactos y estado (completo, placeholder, faltante). Haz clic en una capa para ver sus artefactos; haz clic en un artefacto para ver su contenido completo y metadatos.

### 3. Work Items

El ciclo de vida del Work Item comienza aquí:

1. **Crear** — Clic en "+ Create Work Item", describe la intención, elige un tipo
2. **Ver** — Estado, módulos afectados, entidades del sistema, procedencia de fuentes externas
3. **Editar** — Modifica campos en Work Items en borrador o listos
4. **Filtrar** — Por estado (activos, completados, archivados), módulo o búsqueda libre

### 4. System Explorer

Un grafo interactivo de la topología semántica de tu proyecto. Los nodos representan entidades del sistema (servicios, modelos, controllers, etc.) y las aristas muestran relaciones.

- **Overlays**: Alterna las capas Knowledge, Delivery e Implementation
- **Búsqueda**: Encuentra nodos por nombre o tipo
- **Impacto de Work Item**: Agrega `?workItem=WI-001` para ver qué entidades afecta un Work Item, con centrado automático
- **Deep-link**: `?node=entityId` enfoca un nodo específico

### 5. Integrations

Conecta herramientas externas:

1. Clic en "+ Add Integration" para abrir el catálogo de proveedores
2. Elige un proveedor (Jira, GitHub, etc.)
3. Ingresa un ID, configura campos, establece credenciales
4. "Verify & Save" prueba la conectividad antes de confirmar
5. Habilita/deshabilita integraciones sin perder configuración

Eliminar muestra un diálogo de confirmación — los Work Items ya importados no se afectan.

### 6. External Work Items

Una vez las integraciones están habilitadas, descubre sus items:

1. Los items aparecen agrupados por integración
2. Filtra por tipo, estado, etiqueta o búsqueda
3. Clic en "Import" para crear un Work Item en borrador — la detección de duplicados previene reimportación
4. "Load More" para resultados paginados

## Limitaciones del MVP

- **Un solo usuario**: diseñado para un desarrollador en localhost, no para despliegue de equipo
- **Sin sincronización en tiempo real**: los datos se refrescan al navegar o con clic manual en "Refresh"
- **System Explorer**: rendimiento óptimo bajo ~500 nodos
- **Edición de Work Items**: limitada a campos de la Admin API (edición completa vía CLI o agentes)
