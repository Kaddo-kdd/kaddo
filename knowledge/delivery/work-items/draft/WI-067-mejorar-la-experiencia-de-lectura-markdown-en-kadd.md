---
type: feature
id: WI-067
title: Mejorar la experiencia de lectura Markdown en Kaddo Admin
status: draft
work_type: feature
created_at: '2026-10-15'
source:
  type: external
  imported_at: '2026-10-15'
  source_format: markdown-frontmatter
  source_hash: 63ce52f444ab98719f916649a00156cea9d6b82e292c989a3891d7c8e0793384
  inferred: false
generated_by: kaddo-admin
knowledge_level: K2
domains: [Product, Delivery]
affected_modules: [admin]
scope_confidence:
  level: high
  reasons:
    - Cambio de presentación sobre el renderer compartido (MarkdownRenderer.tsx) + capa CSS; no toca Core, parsers ni conocimiento canónico.
    - 18 ACs explícitos, consumidores identificados y Commit Gate (revisión visual local antes de commitear).
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

- [ ] AC-01: sistema tipográfico reutilizable y aislado para Markdown.
- [ ] AC-02: H1–H6 con jerarquía visual y espaciado consistente.
- [ ] AC-03: párrafos extensos legibles, no pegados.
- [ ] AC-04: listas/numeraciones/checklists con marcadores e indentación correctos.
- [ ] AC-05: inline, bloques con lenguaje y sin lenguaje renderizan correctamente.
- [ ] AC-06: tablas GFM legibles sin overflow del layout.
- [ ] AC-07: citas, enlaces y separadores con estilos consistentes.
- [ ] AC-08: diagramas Mermaid mantienen su funcionamiento.
- [ ] AC-09: imágenes y contenido extenso respetan límites responsivos.
- [ ] AC-10: funciona en light y dark mode.
- [ ] AC-11: Knowledge Artifact, Work Item Full Definition y POC Final Report comparten la experiencia.
- [ ] AC-12: no se alteran artifacts ni se transforma la semántica del contenido.
- [ ] AC-13: se mantiene sanitización y seguridad de enlaces.
- [ ] AC-14: pruebas de render Markdown + regresión GFM/Mermaid.
- [ ] AC-15: validación visual de documentos reales en desktop y mobile.
- [ ] AC-16: sin estilos globales que afecten otras pantallas del Admin.
- [ ] AC-17: implementación documentada y reutilizando tokens del Design System.
- [ ] AC-18: resultado visualizado localmente y con aprobación antes del commit.

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
