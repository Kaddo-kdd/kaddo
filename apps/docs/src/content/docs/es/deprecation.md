---
title: Deprecación controlada
description: Retira funcionalidad legacy con evidencia, ambientes por etapas y una frontera de producción controlada por humanos.
---

La Deprecación controlada convierte una eliminación riesgosa en un lifecycle trazable. Kaddo registra
el conocimiento necesario para decidir qué puede retirarse; nunca concluye que algo no se usa solo
porque una búsqueda de código no encontró referencias.

## Lifecycle

Crea un Deprecation Plan versionado bajo `knowledge/legacy/deprecations/`. Cada target avanza por
`candidate` → `usage-validated` → `soft-deprecated` → `disabled` → `removed-devtest` →
`production-ready` → `production-changed` → `observing` → `completed`.

La evidencia de uso mantiene separadas las señales estáticas, runtime, base de datos, consumidores
externos y revisión humana. La evidencia ausente sigue siendo desconocida; nunca prueba ausencia de uso.

## Despliegue seguro

1. Identifica el target y sus módulos, resources y targets dependientes.
2. Valida uso, blast radius, reversibilidad y orden de retiro.
3. Aplica primero una soft deprecation, observa criterios de salida y retira en development y test.
4. Verifica el resultado y genera un Production Runbook cuando producción esté afectada.

Producción permanece bajo control humano. Kaddo puede preparar el runbook y registrar evidencia, pero
nunca ejecuta cambios destructivos de producción de forma autónoma.

## Resources y proyectos multirepo

Un target puede referenciar un Project Resource y un módulo de un proyecto multirepo. El Knowledge
Graph expone relaciones de plan, target, módulo/resource, Work Item y `depends_on_removal`, para
inspeccionar waves antes de actuar.

## Comandos

```bash
kaddo deprecation list
kaddo deprecation show DEP-001
kaddo deprecation status DEP-001
kaddo graph export --scope all --format json
```

La sección **Deprecations** de Admin ofrece la misma vista de solo lectura: summary, pipeline de
lifecycle, matriz de ambientes, waves de retiro y runbooks relacionados.

## Iniciar una deprecación: Admin vs LLM/MCP

Hay dos formas de empezar, para dos situaciones distintas.

**Admin — capturar una intención conocida.** Cuando ya sabes una cosa que quieres retirar, abre
Admin → Deprecations → **New Deprecation** y da solo un título y una breve descripción de qué quieres
retirar. Kaddo crea un plan en **draft** con cero targets. Crear un plan registra la intención de
*investigar* el retiro — no autoriza la eliminación, no cambia targets ni toca código, recursos o
ambientes. Admin muestra entonces que el plan requiere refinamiento (sin targets, análisis no realizado,
dependencias desconocidas, waves no calculadas).

Una **intención capturada** y un **plan refinado** son etapas distintas, y Admin muestra el detalle de
forma progresiva. Un plan con cero targets muestra solo la tarjeta de intención capturada y un empty
state de refinamiento — las vistas operativas (pipeline, retirement waves, matriz de ambientes, board,
targets) aparecen a medida que el plan gana conocimiento: las vistas de targets cuando se descubren
targets, y las retirement waves cuando existe un orden de dependencias real. La ausencia de análisis
nunca se muestra como ausencia de dependencias (`not analyzed ≠ none`, `0 targets ≠ 0 dependencies`).

**LLM/MCP — descubrir, agrupar y refinar varias.** Cuando tienes varias cosas potencialmente obsoletas,
o no estás seguro de si van juntas, usa un agente conectado por MCP. El agente analiza las relaciones y
propone cómo agruparlas antes de crear nada:

- **Mismo outcome de retiro → un plan con varios targets.** Por ejemplo, retirar el flujo legacy de
  créditos puede abarcar la pantalla vieja, `CalculateOldCredit()`, `/legacy/credit`, `sp_OldCredit` y
  `OLD_CREDIT_RULES` — un `DEP` con varios targets.
- **Outcomes independientes → planes separados.** Créditos legacy, reportes legacy y el sincronizador
  viejo de clientes son tres `DEP` distintos. La agrupación es por el outcome de retiro, no por
  compartir un repositorio.

Frases en lenguaje natural como "vamos a deprecar X", "esta pantalla ya no debería existir" o "apaguemos
ese job viejo" se interpretan como intención de *investigar un retiro seguro* — nunca como autorización
para eliminar de inmediato. Cuando una solicitud menciona varios elementos, el agente primero decide si
son targets de un mismo outcome o planes separados, y muestra la propuesta de agrupación para revisión
humana. Admin crea un plan a la vez (sin creación masiva); orquestar múltiples propuestas es trabajo del
agente. En ambos casos, materializar targets sigue siendo `proposal → preview → confirmación humana →
Core`, y Admin sigue siendo la superficie para seguir el lifecycle después.
