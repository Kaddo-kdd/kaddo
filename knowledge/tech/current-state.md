---
type: current-state
project_state: ai-assisted
generated_by: kaddo-bootstrap
template_version: 1
refined_by: architecture-agent, WI-008
---

> Idioma del proyecto: **español**. Escribe este conocimiento en español. Mantén en inglés el código, los nombres de archivo, los comandos y las claves de configuración.

# Current State

## System Overview

Kaddo es una herramienta CLI en formato monorepo orientada al Knowledge Driven Development. El sistema incluye utilidades de línea de comandos, un servidor de interfaz de programación de aplicaciones (API), una interfaz web de administración, adaptadores de integración y un servidor de Model Context Protocol (MCP) para interactuar con modelos de IA.

## Modules

El proyecto está compuesto por los siguientes módulos principales dentro del espacio de trabajo de pnpm:

- `@kaddo/cli` (`packages/cli`): El núcleo de las utilidades de Kaddo, construido sobre Commander, con soporte para operaciones interactivas y validaciones.
- `@kaddo/admin` (`packages/admin`): Interfaz de usuario (SPA) construida con React, Vite y TailwindCSS para visualización y administración.
- `@kaddo/admin-server` (`packages/admin-server`): Servidor REST construido con Fastify que expone la funcionalidad del core para la interfaz de administración.
- `@kaddo/mcp` (`packages/mcp`): Servidor MCP que expone el conocimiento del proyecto, recursos, herramientas y prompts a los clientes AI.
- `@kaddo/integrations` (`packages/integrations`): Capa fundacional de adaptadores para la integración de Kaddo con sistemas externos.

## Dependencies and Integrations

Las principales dependencias y herramientas incluyen:
- **Runtime y Lenguaje**: Node.js (>=18, 22.5.0 para CLI) y TypeScript.
- **Backend / CLI**: Commander, Fastify, Zod, Yaml.
- **Frontend**: React, Vite, Tailwind CSS, `@tanstack/react-query`, `@tanstack/react-router`, `@xyflow/react` para gráficos y flujos.
- **Protocolo de IA**: `@modelcontextprotocol/sdk`.

## Data Stores

Kaddo opera principalmente sobre el sistema de archivos del proyecto (`.kaddo/`, `knowledge/`). Los adaptadores de integración permiten leer y sincronizar datos de sistemas de trabajo externos.

## Infrastructure

- Gestor de paquetes: `pnpm` (espacios de trabajo).
- Compilación de paquetes (Backend/CLI): `tsup`.
- Pruebas y CI: Vitest para pruebas unitarias, Playwright para E2E en el frontend, y GitHub Actions (`.github/workflows/`) para la integración continua.

## Implicit Decisions (candidates)

- Se optó por una arquitectura de monorepo gestionada por pnpm para mantener en sintonía el CLI, el servidor, la interfaz de usuario web y el servidor MCP.
- Adopción de React con Vite y bibliotecas de visualización basadas en nodos (XYFlow) para la UI de administración.
- Separación estricta entre el cliente de línea de comandos, la UI y el servidor API para facilitar el desacoplamiento de lógicas.

## Resolved Questions

- [resolved] El CLI empaqueta Admin UI y Admin Server en su distribución: `scripts/copy-admin.mjs`
  copia los artefactos de build de `@kaddo/admin` y `@kaddo/admin-server` al dist del CLI.
  Al ejecutar `kaddo admin`, el servidor Fastify se levanta sirviendo la SPA empaquetada.
- [resolved] Los adaptadores de integración se configuran a través de la Admin UI o CLI
  (`kaddo integration create`). Cada proveedor define un `configSchema` y `secretSchema` en
  su `AdapterDefinition`. Los secrets se almacenan cifrados con `SecretProvider` y las
  credenciales nunca se exponen en la API.
- [resolved] El versionado es conjunto: los 5 paquetes comparten la misma versión (actualmente
  3.94.0) y se bumpen simultáneamente en cada release. No se publican a npm — el CLI se
  distribuye como binario.
- [resolved] No hay dependencias de infraestructura en la nube. Kaddo opera exclusivamente
  sobre el sistema de archivos local del proyecto.
