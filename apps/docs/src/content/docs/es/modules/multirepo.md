---
title: Descriptor multirepo
description: Describe un repo como un módulo dentro de un sistema mayor.
---

En un esquema multirepo, cada repositorio puede describirse a sí mismo como un
módulo para que su conocimiento se componga a través del sistema.

```bash
kaddo module --init   # crea architecture/module.yml de forma interactiva
kaddo module --show   # imprime el descriptor actual
```

El descriptor (`architecture/module.yml`) registra el nombre del módulo, sus
dominios y los contratos que expone o consume — la semilla del conocimiento
entre repos.
