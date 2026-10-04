---
title: Escribir un artículo del blog
description: Cómo crear y publicar un artículo del blog de Kaddo — ubicación de archivos, schema del frontmatter, drafts, artículos bilingües y SEO.
---

El blog de Kaddo es una superficie editorial separada de esta documentación. Los artículos son
archivos Markdown versionados en el repositorio y renderizados mediante rutas de Astro,
independientes de la colección de documentación de Starlight.

## Dónde viven los artículos

```text
apps/docs/src/content/blog/
├── en/
│   └── mi-articulo.md        → /blog/mi-articulo/
└── es/
    └── mi-articulo.md        → /es/blog/mi-articulo/
```

El idioma es la subcarpeta (`en/` o `es/`). Un archivo en inglés y uno en español **con el mismo
nombre** comparten un slug, lo que permite a Kaddo generar la relación `hreflang` correcta entre
ambos. Un idioma puede existir por sí solo — un artículo en inglés no requiere traducción al español
para publicarse.

## Frontmatter

```yaml
---
title: ¿Qué es Knowledge-Driven Development?
description: Resumen de una frase usado para la meta description y la tarjeta.
publishedAt: 2026-10-04
updatedAt: 2026-10-10        # opcional
author: Julian Dario Luna Patiño
tags:
  - knowledge-driven-development
  - ai-assisted-development
locale: es                   # en | es (debe coincidir con la subcarpeta)
cover: /banner.png           # opcional; ruta relativa al sitio o URL absoluta
draft: false                 # opcional; true lo oculta de producción
featured: false              # opcional; true lo destaca en el índice
---
```

`title`, `description` y `publishedAt` son obligatorios. Las fechas se escriben como `YYYY-MM-DD` y
se renderizan en UTC.

## Drafts

Un artículo con `draft: true` es visible en desarrollo local (`pnpm -C apps/docs dev`) pero se excluye
del build de producción: sin ruta, sin entrada en el índice, sin página de tag, sin ítem de RSS, sin
entrada en el sitemap. Úsalo para preparar contenido antes de publicar.

## Tags y enlaces internos

Los tags producen páginas navegables en `/blog/tags/<tag>/`. Enlaza naturalmente desde un artículo
hacia la documentación usando rutas canónicas, p. ej. `[Primeros pasos](/es/getting-started/)`. El
blog explica el problema y el concepto; los docs explican cómo Kaddo lo resuelve.

## Qué obtienes automáticamente

Cada artículo publicado genera su `<title>`, meta description, URL canónica en `kaddo.org`, metadata
Open Graph y Twitter Card, JSON-LD `BlogPosting`, y entradas en el sitemap y en el feed RSS
(`/blog/rss.xml`, `/es/blog/rss.xml`). Los artículos relacionados se derivan de forma determinística
a partir de los tags compartidos.

## Verificar

```bash
pnpm -C apps/docs build
```

Luego confirma que `/blog/`, `/blog/<slug>/` y `/es/blog/` se construyen, y que cualquier artículo con
`draft: true` no se genera.
