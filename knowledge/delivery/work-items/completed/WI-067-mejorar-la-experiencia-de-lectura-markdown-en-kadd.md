---
type: feature
id: WI-067
title: Mejorar la experiencia de lectura Markdown en Kaddo Admin
status: completed
completed_at: '2026-10-15'
work_type: feature
code:
  - packages/admin/src/components/MarkdownRenderer.tsx
  - packages/admin/src/components/markdown.css
  - packages/admin/tests/markdown-renderer.test.ts
implementation_evidence:
  repositories:
    admin:
      role: core
      status: completed
      changed_paths:
        - packages/admin/src/components/MarkdownRenderer.tsx
        - packages/admin/src/components/markdown.css
        - packages/admin/tests/markdown-renderer.test.ts
      validations:
        - command: pnpm --filter @kaddo/admin exec vitest run tests/
          status: passed
          reason: >-
            66 verdes (9 archivos), incluido markdown-renderer.test.ts (5
            casos): jerarquía H1–H6 bajo .kaddo-markdown, inline vs bloque (con
            y sin lenguaje) sin pre anidados, task lists/tablas
            envueltas/blockquotes/ HR, sanitización (sin javascript:/sin script,
            contenido preservado), enlaces externos seguros y Mermaid sin fallo.
        - command: pnpm --filter @kaddo/admin build
          status: passed
          reason: >-
            tsc + vite limpios; capa markdown.css aislada bajo .kaddo-markdown
            sin estilos globales sobre otras pantallas del Admin.
        - command: 'Revisión visual local (kaddo admin 127.0.0.1:4173) — Commit Gate'
          status: passed
          reason: >-
            Business Knowledge extenso, Work Item Full Definition (WI-065/024),
            tabla GFM, bloque sin lenguaje, flowchart Mermaid (WI-045) en
            light/dark y a 375px; headings escalables y tabla sin overflow de
            página. Aprobado por el usuario antes del commit.
implementation_status: completed
validation_status: passed
released_in: v3.127.0
created_at: '2026-10-15'
source:
  type: external
  imported_at: '2026-10-15'
  source_format: markdown-frontmatter
  source_hash: 63ce52f444ab98719f916649a00156cea9d6b82e292c989a3891d7c8e0793384
  inferred: false
generated_by: kaddo-admin
knowledge_level: K2
domains:
  - Product
  - Delivery
affected_modules:
  - admin
scope_confidence:
  level: high
  reasons:
    - >-
      Cambio de presentación sobre el renderer compartido (MarkdownRenderer.tsx)
      + capa CSS; no toca Core, parsers ni conocimiento canónico.
    - >-
      18 ACs explícitos, consumidores identificados y Commit Gate (revisión
      visual local antes de commitear).
    - Estado actual verificado en el código: 'tokens, consumidores y bugs concretos localizados.'
refined_by: work-item-refinement (manual)
summary: >-
  Kaddo Admin permite consultar documentos Markdown de Knowledge, la definición
  completa de Work Items y reportes generados. Usuarios reportan problemas de
  **legibilidad**: contenido demasiado compacto, encabezados sin jerarquía
  visual, y elementos Markdown sin estilos que facil…
original_snapshot:
  title: Mejorar la experiencia de lectura Markdown en Kaddo Admin
  description: >-
    Kaddo Admin permite consultar documentos Markdown de Knowledge, la
    definición completa de Work Items y reportes generados. Usuarios reportan
    problemas de **legibilidad**: contenido demasiado compacto, encabezados sin
    jerarquía visual, y elementos Markdown sin estilos que facil…
  type: feature
  status: draft
ready_at: '2026-10-15'
verified_at: '2026-10-15'
---

# Mejorar la experiencia de lectura Markdown en Kaddo Admin

## Intent

Kaddo Admin permite consultar documentos Markdown de Knowledge, la definición completa de Work Items y
reportes generados. Usuarios reportan problemas de **legibilidad**: contenido demasiado compacto,
encabezados sin jerarquía visual, y elementos Markdown sin estilos que faciliten la lectura — especial
en documentos extensos (párrafos/listas/títulos/tablas/código percibidos como un flujo continuo sin
separación). El componente compartido `MarkdownRenderer.tsx` usa `react-markdown` + `remark-gfm` +
`rehype-sanitize` + `MermaidDiagram`, con estilos puntuales (enlaces/código/tablas/citas) pero **sin un
sistema tipográfico completo**; además Tailwind v4 normaliza/elimina apariencias por defecto de
encabezados, listas, etc. La solución va sobre el **renderizador compartido y su capa de estilos**, sin
tocar el conocimiento canónico.

## Goal

Experiencia de lectura Markdown consistente, accesible e integrada con Kaddo Admin: (1) identificar
títulos/subtítulos/secciones; (2) leer párrafos extensos sin fatiga; (3) distinguir listas/tablas/
código/citas/elementos especiales; (4) navegar documentos largos con claridad; (5) consistencia
light/dark; (6) correcto en desktop/tablet/móvil; (7) preservar contenido y capacidades actuales. No es
un editor Markdown — es mejorar la representación visual de documentos existentes.

## Commit Gate (obligatorio)

No commitear/pushear/release automáticamente. Antes de pedir autorización: (1) build+tests; (2) levantar
Admin local; (3) mostrar un Business Knowledge extenso; (4) un Work Item en Full Definition; (5) un doc
con tablas y código; (6) un doc con Mermaid; (7) verificar light/dark; (8) verificar responsive; (9)
presentar diferencias antes/después (idealmente capturas); (10) **solicitar confirmación explícita**.
Compilar/pasar tests NO equivale a aprobación.

## Scope

1. **Sistema tipográfico Markdown compartido** — clase raíz reutilizable `kaddo-markdown` + hoja
   dedicada (p. ej. `packages/admin/src/components/markdown.css`, ubicación según la estructura actual).
   Principios: usar tokens del Design System; **evitar estilos globales** sobre `h1/p/ul/table`…;
   separar contenido Markdown de componentes de Admin; sin estilos inline extensivos; CSS mantenible;
   preservar semántica HTML; evitar dependencias nuevas si CSS/componentes bastan. Reutilizar
   `--font-sans`, `--font-mono`, `--foreground`, `--foreground-muted`, `--surface`, `--surface-muted`,
   `--border`, `--primary` y demás tokens semánticos.
2. **Headings H1–H6 con jerarquía** — diferenciar por tamaño/peso/line-height/espaciado superior e
   inferior/contraste. H1 título principal, H2 sección, H3 subsección, H4–H6 jerarquía reconocible sin
   tamaños excesivos; separación visible respecto a lo anterior, cercanía con lo que introducen. No:
   todos del mismo tamaño; solo negrilla; convertir en tarjetas; decorar todos con líneas/bordes;
   romper proporciones en móvil; reescribir el contenido.
3. **Legibilidad de párrafos** — espaciado vertical consistente, line-height ~1.65–1.8, texto 15–16px,
   longitud de línea ~70–85 car., contraste adecuado (referencias, no requisitos rígidos). No limitar
   ancho de tablas/código/diagramas; contenedor de lectura para documentos extensos; ni pegados ni con
   exceso de espacio; conservar saltos y estructura; no resumir/modificar contenido.
4. **Listas y checklists** — unordered/ordered/nested/task/mixed con marcadores visibles, indentación
   consistente, espacio entre ítems, jerarquía en anidadas, checkboxes alineadas. Restaurar estilos
   afectados por CSS resets; no convertir en componentes interactivos; checkboxes **solo lectura**; no
   persistir cambios; evitar conflictos listas anidadas/tablas.
5. **Code blocks** — inline, fenced con/sin lenguaje, comandos, JSON/YAML/SQL/TS…, bloques extensos.
   Inline discreto (`kaddo guard --record`); bloques con fondo diferenciado, padding, monoespaciada,
   contenedor coherente, scroll horizontal cuando haga falta, indentación/saltos respetados, contraste
   light/dark. El renderer identifica por `language-*`: garantizar que **bloques sin lenguaje** salgan
   como bloque (no inline), sin `pre` anidados, preservando `language-mermaid`. Syntax highlighting
   completo NO es obligatorio aquí; primero legibilidad.
6. **Tablas GFM** — encabezados distinguibles, padding uniforme, separación entre filas, alineación
   legible, texto largo controlado, **scroll horizontal localizado** (no de toda la página),
   multi-columna. No romper layout; no texto ilegible; no truncar; mantener semántica table/thead/tbody/
   th/td; permitir seleccionar/copiar.
7. **Blockquotes, links, separadores** (+ bold/italic/strikethrough) — blockquotes con borde lateral/
   padding/fondo sutil opcional/legible (no interpretarlas como warnings); links con contraste/hover/
   focus visible/seguro externos/internos preservados; HR que separan sin dominar.
8. **Mermaid** — mantener `MermaidDiagram`, sin regresiones, espacio alrededor, tema del Admin,
   diagramas grandes sin romper layout, legibles en móvil, estados de error preservados. No segundo
   motor; no imágenes estáticas.
9. **Imágenes y Markdown rico** — respetar ancho del contenedor, aspect ratio, sin overflow, alt text,
   sin esquemas de URL inseguros, preservar sanitización. No carga/gestión de imágenes aquí.
10. **Integración en el renderer compartido** — aplicar estilos en `MarkdownRenderer.tsx`; verificar
    consumidores: `KnowledgeArtifact.tsx` (Business/Product/Technical/Delivery/ADRs), `WorkItemDetail.tsx`
    (vista Full definition: Scope/ACs/Implementation Evidence/Verification/DoD/Learning/secciones
    futuras; Overview estructurado intacto), `PocFinalReport.tsx` (misma tipografía, sin estilos
    paralelos). Identificar otros consumidores reales; no duplicar implementaciones.
11. **Responsive** — desktop/tablet/móvil: contenedores adaptables, márgenes al viewport, tablas con
    scroll localizado, code sin overflow global, imágenes responsivas, encabezados escalables, diagramas
    contenidos, sin superposición. Una línea larga de código no debe forzar el ancho de toda la app.
12. **Light/Dark** — usar tokens de color; contraste en títulos/párrafos; diferenciar fondos de código/
    citas; tablas legibles; links reconocibles; verificar el cambio de tema desde Admin. Sin paleta
    aparte ni colores hardcoded que se vuelvan ilegibles.
13. **Seguridad e integridad** — Markdown sigue siendo contenido no confiable: mantener `rehype-sanitize`;
    no `rehype-raw` sin justificación+revisión; sin scripts; sin `javascript:`; enlaces externos
    seguros; no ejecutar código; no alterar artifacts; solo lectura. Es cambio de presentación, no de
    ejecución.
14. **Tests automatizados** — ampliar los del renderer compartido con pruebas de comportamiento real +
    un **fixture** con H1–H6, párrafos, listas anidadas/numeradas/checklists, links, inline code, código
    con/sin lenguaje, tablas pequeñas/extensas, blockquotes, separadores, Mermaid, contenido largo,
    cadenas sin espacios, Markdown potencialmente inseguro. Esperado: HTML semántico correcto, clases/
    estilos esperados, sin pérdida de contenido, GFM/Mermaid intactos, entradas inseguras sanitizadas,
    sin `pre` anidados.
15. **Regresión visual y revisión local** — validar con Playwright/herramientas UI existentes:
    (A) Business Knowledge con múltiples encabezados; (B) Work Item Full Definition extenso con ACs;
    (C) doc técnico con tablas/JSON/YAML/código; (D) doc con Mermaid; (E) POC final report; (F) repetir
    en light/dark y desktop/móvil.
16. **Documentación** — actualizar la doc interna del componente: clase raíz, convenciones tipográficas,
    uso de tokens, tablas, code blocks, Mermaid, seguridad, cómo incorporar nuevos consumidores.

## Out of scope

Editor/WYSIWYG Markdown; cambiar archivos canónicos; modificar parsers Core o el modelo de Knowledge;
sistema paralelo de render; reemplazar Mermaid; syntax highlighting avanzado como requisito; nuevas
rutas; TOC automática; comentarios/colaboración; IA para resumir/reestructurar; rediseño completo de la
identidad de Admin; cambiar fórmulas/contratos de Reports; personalización tipográfica por usuario.

## Acceptance criteria

- [x] AC-01: sistema tipográfico reutilizable y aislado para Markdown.
- [x] AC-02: H1–H6 con jerarquía visual y espaciado consistente.
- [x] AC-03: párrafos extensos legibles, no pegados.
- [x] AC-04: listas/numeraciones/checklists con marcadores e indentación correctos.
- [x] AC-05: inline, bloques con lenguaje y sin lenguaje renderizan correctamente.
- [x] AC-06: tablas GFM legibles sin overflow del layout.
- [x] AC-07: citas, enlaces y separadores con estilos consistentes.
- [x] AC-08: diagramas Mermaid mantienen su funcionamiento.
- [x] AC-09: imágenes y contenido extenso respetan límites responsivos.
- [x] AC-10: funciona en light y dark mode.
- [x] AC-11: Knowledge Artifact, Work Item Full Definition y POC Final Report comparten la experiencia.
- [x] AC-12: no se alteran artifacts ni se transforma la semántica del contenido.
- [x] AC-13: se mantiene sanitización y seguridad de enlaces.
- [x] AC-14: pruebas de render Markdown + regresión GFM/Mermaid.
- [x] AC-15: validación visual de documentos reales en desktop y mobile.
- [x] AC-16: sin estilos globales que afecten otras pantallas del Admin.
- [x] AC-17: implementación documentada y reutilizando tokens del Design System.
- [x] AC-18: resultado visualizado localmente y con aprobación antes del commit.

## Entry points (grounding técnico — verificado contra el código actual)

Estado real confirmado al refinar (`packages/admin/src/`):

- **Renderer** `components/MarkdownRenderer.tsx` (102 líneas): `react-markdown` + `remark-gfm` +
  `rehype-sanitize` + `MermaidDiagram`. El contenido se envuelve en
  `<div style={{ lineHeight: 1.7, color: 'var(--foreground)' }}>` **sin clase raíz** → headings, `p`,
  `ul/ol/li`, `hr` **no tienen override** y caen al reset de Tailwind v4 (de ahí la falta de jerarquía).
  Hay overrides inline para `a`, `code`, `table/th/td`, `blockquote`. **Fix base**: añadir
  `className="kaddo-markdown"` al wrapper y mover la tipografía a `components/markdown.css` (nuevo),
  reutilizando tokens.
- **Bug bloque sin lenguaje (AC-05)**: en el override de `code`, `const isBlock =
  className?.startsWith('language-')` → un fenced block **sin** lenguaje no tiene `className` y se
  renderiza como **inline**. Detectar bloque de forma robusta (vía `pre`/salto de línea) sin generar
  `pre` anidados; preservar `className === 'language-mermaid'`.
- **Tokens** `design-system/tokens.css`: existen `--font-sans`, `--font-mono`, `--foreground`,
  `--foreground-muted`, `--surface`, `--surface-muted`, `--border`, `--primary`, `--radius` → reusar (no
  crear paleta nueva).
- **CSS global** `index.css`: importar ahí `markdown.css` (o junto al componente), **scoped** bajo
  `.kaddo-markdown` para no afectar otras pantallas (AC-16).
- **Consumidores reales** (verificados): `routes/KnowledgeArtifact.tsx` (2 usos),
  `routes/WorkItemDetail.tsx` (vista Full definition, `wi.markdownBody`),
  `components/PocFinalReport.tsx` (`report.reportContent`). Todos usan el mismo `MarkdownRenderer`, así
  que un único cambio los cubre (AC-11); el Overview estructurado de WorkItemDetail no usa el renderer y
  queda intacto.
- **Tests** `tests/markdown-renderer.test.ts` (existe, básicos) → ampliar con fixture y asserts de
  estructura/clases/sanitización (AC-14).

## Validation

- Unit (`markdown-renderer.test.ts` + fixture): HTML semántico correcto para H1–H6/párrafos/listas
  anidadas/numeradas/checklists/links/inline/bloques con y **sin** lenguaje/tablas/blockquotes/HR/
  Mermaid/cadenas largas; sin pérdida de contenido; GFM/Mermaid intactos; entradas inseguras
  sanitizadas; sin `pre` anidados.
- `pnpm --filter @kaddo/admin build` (tsc + vite) limpio; sin estilos globales que afecten otras
  pantallas.
- Revisión visual local (Admin): Business Knowledge extenso, Work Item Full Definition, doc con tablas/
  código, doc con Mermaid, POC final report — en **light/dark** y **desktop/móvil**; capturas
  antes/después. (Commit Gate.)

## Implementation guidance

Archivos: `packages/admin/src/components/MarkdownRenderer.tsx`, `.../components/markdown.css` (nuevo),
`.../index.css`, `.../design-system/tokens.css`. Consumidores: `routes/KnowledgeArtifact.tsx`,
`routes/WorkItemDetail.tsx`, `components/PocFinalReport.tsx`. Tests:
`packages/admin/tests/markdown-renderer.test.ts` (+ Playwright existentes). Enfoque: (1) inspeccionar el
HTML real de react-markdown + resets de Tailwind; (2) estilos tipográficos aislados; (3) corregir código
con/sin lenguaje; (4) revisar GFM/Mermaid/sanitización; (5) comprobar consumidores; (6) fixtures; (7)
validar con documentos reales; (8) ajustar espaciado/tamaño/contraste por revisión local. Priorizar CSS/
componentes existentes sobre nuevas dependencias.

## Definition of Done

Jerarquía visual clara; documentos extensos fáciles de recorrer; listas/tablas/código correctos; Mermaid/
GFM intactos; estilo consistente entre Knowledge, Work Items y POC Reports; light/dark validados; sin
overflow en móvil; tests aprobados; sin regresiones de sanitización; documentación actualizada;
Implementation Evidence; revisión local del usuario. **Commit Gate** respetado.

## Guiding principle

El conocimiento no solo debe estar disponible: debe poder leerse y comprenderse fácilmente. Admin debe
presentar la documentación técnica con una jerarquía visual que ayude a encontrar información, entender
decisiones y recorrer documentos extensos sin esfuerzo innecesario.

## Learning

La legibilidad del Markdown dependía de **dos** cosas y una sola no bastaba. La primera: el `MarkdownRenderer`
envolvía el contenido sin una **clase raíz**, así que `h1–h6`, `p`, `ul/ol/li` y `hr` caían directo al reset
de Tailwind v4 y se percibían como un flujo plano. La corrección de base fue mínima y de bajo riesgo —
añadir `className="kaddo-markdown"` y mover toda la tipografía a una hoja dedicada (`markdown.css`) **scoped**
bajo esa clase y compuesta solo con tokens (`--foreground`, `--surface-muted`, `--border`, `--primary`…) —,
pero es la que devuelve jerarquía, ritmo vertical y contraste sin crear una paleta aparte y sin tocar otras
pantallas del Admin (AC-16). Al apoyarse en tokens, light/dark salieron "gratis".

La segunda fue un bug sutil en la detección de bloques de código: `isBlock = className?.startsWith('language-')`
clasificaba como **inline** cualquier fenced block **sin** lenguaje (JSON/YAML/texto plano se veían como una
línea gris). Detectar el bloque por la presencia de salto de línea (además del `language-*`) y **desenvolver**
el `pre` de react-markdown para que el `code` sea dueño del único `<pre>` resolvió a la vez el render y los
`<pre>` anidados, preservando `language-mermaid`. Lección transversal: en react-markdown conviene razonar sobre
el HTML **real** que emite (pre>code, `node.properties.className` como array) antes de estilizar.

Como los tres consumidores (`KnowledgeArtifact`, `WorkItemDetail` Full definition, `PocFinalReport`) comparten
el mismo renderer, un único cambio cubrió toda la superficie de lectura (AC-11) — identificar eso antes de
implementar evitó estilos paralelos. El **Commit Gate** demostró su valor: compilar y pasar tests no probaba la
experiencia; solo verlo en Admin (Business Knowledge extenso, Full Definition, tabla GFM, bloque sin lenguaje,
flowchart Mermaid) en light/dark y a 375px, con aprobación explícita, cerró el WI. La envoltura de tablas en
`.kaddo-table-wrap` da scroll **localizado** sin forzar el ancho de la app en móvil. Liberado en **v3.127.0**.
