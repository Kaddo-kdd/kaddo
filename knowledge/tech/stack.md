---
type: stack
project_state: ai-assisted
generated_by: WI-008
template_version: 1
---

> Idioma del proyecto: **español**. Escribe este conocimiento en español. Mantén en inglés el código, los nombres de archivo, los comandos y las claves de configuración.

# Stack

## Runtime y lenguaje

- **Node.js** >= 18 (22.5.0 para desarrollo del CLI)
- **TypeScript** — estricto en todos los paquetes, compilado con `tsup`

## Gestor de paquetes

- **pnpm** — workspaces para monorepo, `pnpm-workspace.yaml` en la raíz

## Backend / CLI

| Librería | Uso |
|---|---|
| `commander` | Framework de comandos CLI |
| `fastify` | Servidor HTTP para Admin Server |
| `zod` | Validación de schemas y tipos runtime |
| `yaml` | Parsing de archivos YAML (config, modules, knowledge) |
| `glob` | Búsqueda de archivos por patrón |
| `chalk` | Colores en la terminal |

## Frontend (Admin UI)

| Librería | Uso |
|---|---|
| `react` 18 | Framework de UI |
| `vite` | Bundler y dev server |
| `tailwindcss` | Estilos utilitarios |
| `@tanstack/react-query` | Cache y estado del servidor |
| `@tanstack/react-router` | Enrutamiento con tipado |
| `@xyflow/react` | Visualización de grafos de conocimiento |
| `recharts` | Gráficos y charts |

## Protocolo de IA

| Librería | Uso |
|---|---|
| `@modelcontextprotocol/sdk` | Servidor MCP — tools, resources, prompts |

## Integración con externos

| Librería | Uso |
|---|---|
| `jira.js` | Cliente Jira Cloud (adaptador) |

## Testing

| Herramienta | Uso |
|---|---|
| `vitest` | Tests unitarios e integración en todos los paquetes |
| `playwright` | Tests E2E para Admin UI |

## Build y CI

| Herramienta | Uso |
|---|---|
| `tsup` | Compilación TypeScript → JS (ESM) para CLI, admin-server, mcp, integrations |
| `vite build` | Build de producción para Admin UI |
| GitHub Actions | CI: lint, test, build en cada push |

## Compilación de tipos

- Todos los paquetes usan `tsconfig.json` con `"strict": true`
- El CLI es el punto central de distribución: empaqueta admin + admin-server en su dist
