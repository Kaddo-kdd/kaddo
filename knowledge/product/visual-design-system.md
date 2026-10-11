---
title: Sistema visual de Kaddo
status: active
updated_at: '2026-10-11'
---

# Sistema visual de Kaddo

## Propósito

Kaddo comunica conocimiento conectado y verificable. El sitio, el Blog y el Admin comparten una
jerarquía clara, una base cálida y acentos de alta intención; las interfaces operativas priorizan la
legibilidad de datos por encima de la decoración.

## Fundación

| Token | Valor | Uso |
| --- | --- | --- |
| Night Blue | `#141B2D` | Jerarquía, navegación y terminales técnicos |
| Amber | `#F4B942` | Acciones principales, foco y énfasis |
| Warm White | `#F8F6F0` | Fondo principal claro |
| Soft Black | `#232122` | Texto de lectura |
| Technical Gray | `#6B7280` | Metadatos y texto secundario |

- Display: Poppins semibold/extra bold para títulos y señales de jerarquía.
- UI y cuerpo: Inter regular/semibold.
- Las superficies usan blanco cálido, radio de 10–16 px y sombra discreta.
- El modo claro es la presentación predeterminada. El modo oscuro conserva contraste y es una
  preferencia explícita del usuario en Admin.

## Uso por superficie

- **Website y documentación:** narrativa visual con ilustraciones conceptuales solamente cuando aclaran
  contexto, evidencia o arquitectura. No son decoración obligatoria de cada sección.
- **Blog:** portada editorial, tarjetas con relación visual consistente y metadatos en gris técnico.
- **Admin:** sidebar Night Blue, área de trabajo clara, ámbar para selección/acción primaria y estados
  semánticos diferenciados. Los datos visibles siempre proceden del proyecto.

## Accesibilidad y movimiento

- Los controles tienen foco visible y contraste basado en tokens semánticos.
- Las acciones no dependen exclusivamente del color: mantienen texto, estado y estructura.
- Las transiciones y animaciones se reducen cuando el sistema del usuario solicita movimiento reducido.
- Las rejillas operativas se repliegan a una columna o permiten desplazamiento horizontal en pantallas
  estrechas, sin ocultar acciones ni datos.
