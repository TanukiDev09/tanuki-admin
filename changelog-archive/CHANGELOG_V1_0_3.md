# Changelog - Versión 1.0.3 (Tanuki Admin)

Esta versión incluye mejoras en la gestión de movimientos financieros y optimizaciones de navegación.

## [1.0.3] - 2026-01-28

### ✨ Gestión de Movimientos Financieros

- **Borrado de Movimientos**: Se ha implementado la funcionalidad para eliminar movimientos financieros directamente desde la vista de detalle.
- **Permisos Granulares**: El botón de eliminación está condicionado al permiso `DELETE` del módulo `FINANCE`, asegurando que solo usuarios autorizados puedan realizar esta acción.
- **Navegación Inteligente (Smart Back)**: Al eliminar un movimiento, el sistema ahora rastrea el historial:
  - Si el usuario llegó desde otra sección de la app (ej. Salud Financiera), regresa automáticamente a esa vista manteniendo el contexto.
  - Si no hay historial interno, redirige al listado general de movimientos.

### 🎨 Mejoras de Interfaz (UI)

- **Layout de Acciones**: Rediseño de la cabecera en el detalle de movimientos para agrupar los botones de "Editar" y "Eliminar" de forma coherente y responsiva.
- **Confirmación de Seguridad**: Implementación de diálogos de confirmación antes de proceder con el borrado para prevenir pérdidas accidentales de datos.

---
