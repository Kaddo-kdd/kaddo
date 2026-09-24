---
title: Kaddo Power para Kiro
description: Instala Kaddo como un Power de Kiro con Skills portables, guía del flujo KDD y acceso MCP bajo demanda al conocimiento del proyecto.
---

![Logo de Kaddo Power](/kaddo-power-icon.png)

**kaddo-power** es la integración oficial de Kaddo para
[Kiro Powers](https://kiro.dev/docs/powers/). Empaqueta Skills portables de Kaddo, guía específica
para el flujo de Kiro y el servidor publicado `@kaddo/mcp` como un paquete Agent Plugins 1.0.

El Power no reemplaza Kaddo Core, el CLI ni el conocimiento del proyecto. Ayuda a Kiro a descubrir
el contexto estructurado correcto antes de explorar archivos de código.

```text
Conocimiento Kaddo -> kaddo-power -> activación en Kiro -> flujo enfocado
                             |
                             +-> @kaddo/mcp -> recursos y herramientas del ciclo de vida
```

## Instalar desde GitHub

1. Abre el panel **Powers** en Kiro.
2. Elige **Add Custom Power**.
3. Selecciona **Import power from GitHub**.
4. Ingresa `https://github.com/Kaddo-kdd/kaddo/tree/main/kaddo-power`.
5. Revisa las Skills y el comando MCP incluidos, y habilita **kaddo-power**.

Si tienes instalado un Power anterior llamado `agent-plugin` o `Kaddo Power`, elimínalo antes de
instalar la ruta actual. Kiro deriva el nombre visible de un Power personalizado desde esa ruta.

Para un checkout local, elige **Import power from a folder** y selecciona `kaddo-power/`.

## Requisitos

- Kiro con soporte para Agent Plugins.
- Node.js 18 o superior con `npx` disponible.
- Un repositorio inicializado con Kaddo.
- `KADDO_PROJECT_DIR` asociado al repositorio cuando el cliente no proporciona la raíz del proyecto.

Inicializa el conocimiento del proyecto cuando sea necesario:

```bash
npx -y @kaddo/cli init
npx -y @kaddo/cli scan
```

## Qué incluye

| Componente | Propósito |
| --- | --- |
| `plugin.json` | Identidad portable, versión y palabras clave de activación |
| `skills/` | Agent Skills generadas desde las definiciones canónicas de Kaddo |
| `mcp.json` | Acceso bajo demanda al servidor publicado `@kaddo/mcp` |
| `dev.kiro/steering/` | Onboarding, recursos y límites operativos específicos de Kiro |

El plugin incluye Skills para escribir ADRs, refinar Work Items, sugerir ownership, revisar metadata
del grafo, escribir cápsulas, capturar aprendizajes, planificar implementaciones y refinar contexto
de módulos.

## Power vs. adaptador Kiro

El Power y el [adaptador Kiro](../kiro-adapter/) son complementarios:

| Integración | Úsala cuando |
| --- | --- |
| `kaddo-power` | Quieres activación dinámica, Skills portables y descubrimiento MCP incluido |
| `kaddo adapters install kiro` | Quieres instrucciones persistentes en un `AGENTS.md` raíz generado |

Instalar el Power no genera ni modifica `AGENTS.md`. Instalar el adaptador no instala un Kiro Power.

## Límites de seguridad

El Power guía a Kiro para leer primero el conocimiento estructurado y después verificar los detalles
relevantes de implementación. No autoriza al agente a marcar Work Items como ready, aceptar
decisiones, ampliar alcance, hacer commit, push o acciones irreversibles sin confirmación humana.

Kaddo sigue siendo la fuente de verdad. Los archivos generados bajo `.kaddo/` deben regenerarse con
Kaddo en lugar de editarse manualmente.

## Logo

El logo cuadrado oficial está incluido en `kaddo-power/assets/icon.png` y se usa en esta
documentación. Agent Plugins 1.0 no define metadata portable para íconos, por lo que una importación
personalizada en Kiro todavía puede mostrar el ícono predeterminado. Un listado de catálogo puede
usar el recurso incluido.

## Actualizar

Abre **Powers**, selecciona **kaddo-power** y elige **Check for updates**. La versión en
`plugin.json` permite que Kiro detecte contenido actualizado del paquete.

