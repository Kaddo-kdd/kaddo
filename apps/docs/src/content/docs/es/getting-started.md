---
title: Primeros pasos
description: Instala Kaddo e inicialízalo en tu proyecto.
---

## Instalación

```bash
npx kaddo init
```

O instala globalmente:

```bash
npm install -g kaddo
kaddo --help
```

## Inicializar

```bash
kaddo init
```

Crea:

```
architecture/
  knowledge.md      ← estado actual del producto
  roadmap.md        ← intenciones y prioridades
  work-items/       ← un archivo por work item
.kaddo/
  config.yml        ← configuración del proyecto
```

## Siguientes pasos

1. Ejecuta `kaddo scan` para detectar tu stack y sugerir dominios.
2. Ejecuta `kaddo create feature` para crear tu primer Work Item.
3. Agrega globs en `code:` del front matter para activar Guard Lite.
4. Ejecuta `kaddo guard` antes de hacer commit.
