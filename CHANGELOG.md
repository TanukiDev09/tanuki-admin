# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2026-01-21

### ✨ Nuevas Características

- **Gestión Financiera Avanzada**:
  - **Multiniveles de Costos**: Asignación de un movimiento a múltiples centros de costo con validación de sumas en tiempo real.
  - **Filtros Potenciados**: Segmentación por canal de pago, unidad, rangos de monto y búsqueda global optimizada.
  - **Canales de Venta**: Clasificación por Venta Directa, Feria o Librería, con integración de Puntos de Venta (POS).
- **Inventario & Logística**:
  - **Vinculación Bilateral**: Enlace automático entre movimientos financieros y liquidaciones de inventario.
  - **Datos Editoriales**: Gestión centralizada de datos de la editorial (NIT, Dirección) reflejados en reportes PDF.
  - **Trazabilidad**: Nuevo detalle de movimiento con diagrama de flujo logístico y consecutivos de remisión automáticos.
- **Dashboard de Categorías**: Nuevo filtro por tipo (Ingreso/Egreso) integrado con la búsqueda.

### 🚀 Mejoras de UX/UI

- **Experiencia de Usuario Premium**:
  - **Diseño Glassmorphism**: Paneles de filtros con efectos de transparencia y micro-interacciones.
  - **Tablas Responsivas**: Adaptación automática a vista "stacked" en móviles (< 1024px).
  - **Radix UI**: Estandarización de todos los selectores y modales para mayor accesibilidad y consistencia.
- **Reportes PDF Profesionales**: Diseño en escala de grises, formato carta, conteo de ejemplares y firmas dinámicas.

### 🛠️ Calidad Técnica

- **Estabilidad y Seguridad**:
  - **Type Safety**: Cobertura total de TypeScript (Zero `any`).
  - **Linter Compliance**: Código 100% libre de errores de ESLint y Stylelint.
  - **Accesibilidad**: Cumplimiento WCAG AAA en contrastes y navegación.
- **Optimización**: Reducción de complejidad cognitiva en controladores API y componentes clave.

### 🐛 Correcciones

- Solucionado error de persistencia de montos (`Decimal128`) en edición.
- Corregidos errores de hidratación en `layout.tsx`.
- Resueltos problemas de autorización (401) en diversas rutas de API.
- Fix de contrastes de color en el dashboard de colecciones.

---

## [1.0.0] - 2026-01-19

### Versión Inicial

Lanzamiento oficial de la plataforma **Tanuki Admin**, un sistema integral de gestión administrativa para editoriales y distribuidoras.

- **Dashboard Premium**: Interfaz moderna y responsiva con visualización de salud financiera, KPIs en tiempo real y gráficos dinámicos de rentabilidad por libro.
- **Gestión de Catálogo**: Administración completa de libros, autores y creadores, con integración de almacenamiento en la nube (Vercel Blob).
- **Inteligencia Financiera**: Registro detallado de movimientos, centros de costo y gestión de contratos (convenios) con autores.
- **Logística e Inventario**: Control multi-bodega, seguimiento de entradas/salidas y gestión de Puntos de Venta (POS).
- **Seguridad y Permisos**: Sistema robusto de autenticación JWT y matriz granular de permisos por usuario.
- **Infraestructura Técnica**: Basado en Next.js 16, Mongoose y un sistema de diseño híbrido (SASS/BEM + Tailwind).

---

[1.0.0]: https://github.com/TanukiDev09/tanuki-admin/releases/tag/v1.0.0
