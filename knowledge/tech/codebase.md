---
type: codebase
project_state: ai-assisted
generated_by: kaddo-bootstrap
template_version: 1
refined_by: architecture-agent
---

> Idioma del proyecto: **español**. Escribe este conocimiento en español. Mantén en inglés el código, los nombres de archivo, los comandos y las claves de configuración.

# Codebase Map

## Repository structure

El proyecto es un monorepo administrado con `pnpm` que contiene las siguientes carpetas principales:

- `packages/`: Contiene los distintos paquetes y bibliotecas de Kaddo.
  - `packages/cli/`: Cliente de línea de comandos y utilidades principales.
  - `packages/admin/`: Aplicación frontend en React para la interfaz de administración.
  - `packages/admin-server/`: API REST en Fastify que respalda el frontend de administración.
  - `packages/mcp/`: Servidor Model Context Protocol para interactuar con IAs.
  - `packages/integrations/`: Capa base y modelos normalizados para conectar con sistemas externos.
- `apps/`: Directorio que contiene aplicaciones de alto nivel, como `docs` (documentación).
- `.github/`: Flujos de trabajo de GitHub Actions.
- `knowledge/`: Base de conocimiento gestionada por Kaddo (estado, base de código, capacidades).
- `scripts/`: Herramientas y utilidades para tareas de construcción y sincronización del repositorio.
- `.kaddo/`: Directorio oculto que contiene artefactos y configuraciones de Kaddo.

## Entry points

- **CLI Principal**: `packages/cli/dist/index.js` (binario `kaddo`).
- **Servidor MCP**: `packages/mcp/dist/index.js` (binario `kaddo-mcp`).
- **Servidor Admin**: `packages/admin-server/dist/index.js`.
- **Admin UI**: Punto de entrada de Vite en `packages/admin`.

## Important modules

- **@kaddo/cli**: Orquesta los comandos y maneja la lógica de validación e interacción en la terminal.
- **@kaddo/admin**: Interfaz de visualización de conocimiento con soporte para enrutamiento y gráficos interactivos (`@xyflow/react`).
- **@kaddo/mcp**: Extiende las capacidades del proyecto para que los agentes de IA descubran contexto y recursos (herramientas, rutinas) sobre la base de código.

## How to run

- Instalar dependencias: `pnpm install`
- Construir todos los paquetes: `pnpm run build`
- Iniciar el entorno de desarrollo (observando cambios en paquetes TS): En los distintos paquetes, por lo general se puede usar `pnpm dev` (que internamente ejecuta `tsup --watch` o `vite`).

## How to test

- Para las pruebas unitarias en todo el espacio de trabajo, ejecutar `pnpm run test` desde la raíz (el cual llama a `vitest run --config vitest.config.ts`).
- Para las pruebas E2E del frontend, navegar a `packages/admin` y ejecutar `pnpm run test:e2e` (Playwright).
- Herramientas de formateo y linting estático están disponibles vía `pnpm run lint` y `pnpm run format` en la raíz.

## Resolved questions

- [resolved] Los scripts centrales para desarrollo concurrente están en el `package.json` raíz:
  `pnpm run build` construye todos los paquetes, y cada paquete expone `pnpm dev` (que
  ejecuta `tsup --watch` o `vite` según corresponda). No existe un script único que arranque
  CLI + Admin UI concurrentemente — se ejecutan en terminales separadas.
