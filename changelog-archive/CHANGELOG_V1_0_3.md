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

## [1.0.3-rev] - 2026-01-29

### 💸 Implementación del Módulo de Deudas (Lanzamiento)

- **Creación del Módulo**: Se ha diseñado e implementado desde cero el sistema de gestión de deudas, incluyendo:
    - **Dashboard de Deudas**: Vista consolidada de activos (Por Cobrar) y pasivos (Por Pagar) con balance neto en tiempo real.
    - **Gestión por Entidad**: Vistas detalladas para gestionar todas las obligaciones agrupadas por cliente o proveedor.
    - **Detalle de Obligación**: Ficha técnica completa de cada deuda con historial de pagos y progreso visual.
- **Estética "Premium Light"**: El módulo nace con un lenguaje visual moderno, sólido y de alta claridad, evitando el uso de temas oscuros para maximizar la legibilidad profesional.
- **Arquitectura de Alto Nivel**: Implementación basada en **SASS/BEM** para una mantenibilidad superior y total independencia de frameworks de utilidad.

### 🧭 Navegación Solid Premium

- **Sidebar & MobileNav**: Consolidación de la navegación global a un estilo "Solid Light" (100% opacidad) para acompañar el lanzamiento del nuevo módulo.

### ♿ Accesibilidad WCAG AAA nativa

- **Certificación de Contraste AAA**: Toda la interfaz del módulo de deudas ha sido auditada y ajustada para cumplir con el estándar de contraste enriquecido (7:1).
- **Semántica y Landmarks**: Estructura de navegación optimizada desde su creación para ser plenamente inclusiva y compatible con tecnologías de asistencia.

---

## [1.0.3-hotfix] - 2026-01-31

### 🛡️ Seguridad y Estabilidad
- **Actualización de Next.js**: Migración a **v16.1.5** para corregir vulnerabilidades críticas de Denegación de Servicio (DoS) y consumo excesivo de memoria.
- **Parche de lodash-es**: Implementación de `overrides` para forzar la versión **4.17.23**, resolviendo riesgos de Prototype Pollution.

### 📊 Correcciones en Salud Financiera (Dashboard)
- **Precisión Anual**: Se corrigió el error donde el histórico anual empezaba erróneamente en $0; ahora incorpora el **Saldo Inicial** del periodo previo desde la API.
- **Indicadores Inteligentes**: Ajuste de las métricas de sostenibilidad (Runway & Burn Rate). En el año actual, los promedios ahora se limitan solo a los meses transcurridos, evitando datos diluidos por meses futuros vacíos.
- **Unificación de Métricas**: Los indicadores de salud (Score, Runway, Gasto Neto) ahora están disponibles de forma consistente en todas las vistas (Mensual y Anual).

### 🛠️ Linter y Refactorización Interna
- **Estado 'Clean'**: Se han resuelto todos los errores y advertencias de *linting* del proyecto (0 problemas reportados).
- **Adiós al tipo 'any'**: Limpieza masiva de declaraciones `any` en favor de interfaces estrictas y tipos `unknown` más seguros.
- **Simplificación de API**: Refactorización profunda de los servicios financieros para reducir su complejidad cognitiva, facilitando el mantenimiento futuro.

### 🧭 Mejoras en UX de Navegación
- **Sincronización de Períodos**: Se corrigió el salto de navegación donde pasar de diciembre a enero no actualizaba correctamente el año debido a condiciones de carrera en el estado de la URL.
- **Reseteo de Paginación**: Al cambiar de mes o año, el sistema ahora reinicia automáticamente la vista a la **página 1**, evitando listas vacías accidentales.
