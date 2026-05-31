---
title: Domain Owners
description: Asigna dominios a dueños para las notificaciones de guard.
---

Declara los dueños de dominio en `.kaddo/config.yml`:

```yaml
owners:
  payments: "@alice"
  orders: "@bob"
```

Lístalos:

```bash
kaddo owners                 # todos los dominios
kaddo owners --domain payments
```

Cuando `kaddo guard` relaciona el código tocado con los dominios de un artefacto,
se muestran los dueños afectados (e incluidos en el JSON de `--ci` bajo
`domain_owners`), para que la persona correcta sepa que el conocimiento podría
necesitar revisión.
