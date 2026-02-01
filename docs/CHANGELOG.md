# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.3] - 2026-01-31

### ✨ Nuevas Características

- **Módulo de Deudas (Lanzamiento)**:
  - **Dashboard Consolidado**: Seguimiento en tiempo real de activos (Por Cobrar) y pasivos (Por Pagar) con balance neto.
  - **Gestión por Entidad**: Vistas detalladas para obligaciones agrupadas por cliente o proveedor.
  - **Detalle de Obligación**: Ficha técnica con historial de pagos y progreso visual.
- **Gestión de Movimientos**:
  - **Borrado Mandatorio**: Funcionalidad de eliminación de movimientos condicionada al permiso `DELETE` del módulo `FINANCE`.
  - **Navegación Inteligente (Smart Back)**: Redirección automática basada en el contexto de origen del usuario al eliminar registros.

### 🚀 Mejoras & UX

- **Experiencia Visual Premium**:
  - **Estética "Premium Light"**: Nuevo lenguaje visual de alta claridad y profesionalismo, optimizado para legibilidad.
  - **Navegación Solid**: Consolidación de Sidebar y MobileNav a estilo "Solid Light" (100% opacidad).
- **Inteligencia en Salud Financiera**:
  - **Métricas Sostenibles**: Ajuste dinámico de Runway y Burn Rate limitando promedios solo a meses transcurridos.
  - **Unificación de Indicadores**: Score, Runway y Gasto Neto disponibles consistentemente en vistas Mensual y Anual.
- **Flujos de Usuario**:
  - **Confirmación de Seguridad**: Diálogos preventivos en acciones destructivas.
  - **Reseteo Automático**: Reinicio de paginación al cambiar de periodo para evitar listas vacías.

### 🛠️ Calidad Técnica

- **Accesibilidad WCAG AAA Nativa**:
  - **Contraste Enriquecido**: Certificación de contraste 7:1 en todo el módulo de deudas.
  - **Semántica Optimizada**: Estructura de navegación y landmarks totalmente compatibles con tecnologías de asistencia.
- **Robustez del Codebase**:
  - **Strict Typing**: Eliminación masiva de `any` en favor de interfaces estrictas y tipos `unknown` seguros.
  - **Arquitectura SASS/BEM**: Implementación modular y mantenible sin dependencias de frameworks de utilidad.
  - **Simplificación de API**: Refactorización de servicios financieros para reducir complejidad cognitiva.

### 🛡️ Seguridad y Estabilidad

- **Protección de Infraestructura**:
  - **Next.js v16.1.5**: Actualización crítica para mitigar vulnerabilidades DoS y fugas de memoria.
  - **Parche de Dependencias**: Override forzado de `lodash-es` a la versión 4.17.23 para prevenir Prototype Pollution.

### 🐛 Correcciones

- **Precisión Financiera**: Corregido el inicio del histórico anual ($0) mediante la integración del Saldo Inicial del periodo previo.
- **Sincronización Temporal**: Solución a condiciones de carrera en la URL que impedían la actualización correcta del año al pasar de diciembre a enero.

---

## [1.0.2] - 2026-01-27

### ✨ Nuevas Características

- **Inteligencia Financiera & Control**:
  - **Visualización Flexible**: Toggle para alternar entre ingresos y gastos en gráficas de categorías y centros de costo.
  - **Control de Saldo Mensual**: Seguimiento de Saldo Mes Anterior y Nuevo Saldo proyectado.
  - **Gestión Documental**: Sistema de carga de facturas (PDF/Imágenes) integrado con Vercel Blob.
  - **Totalizador en Tiempo Real**: Resumen dinámico de títulos y ejemplares en modales de movimiento.
- **Inventario Avanzado**:
  - **Segmentación por Bodega**: Visualización discriminada de stock entre Bodega Editorial y puntos de venta externos.
  - **Resolución de Identidades**: Sustitución de hashes técnicos por nombres de categorías y libros legibles en todo el sistema.

### 🚀 Mejoras & UX

- **Experiencia Visual Premium**:
  - **Flujo de Caja Rediseñado**: Nueva gráfica de saldo acumulado con gradientes, Tooltips interactivos y escala optimizada.
  - **Navegación Lógica**: Reorganización total de Sidebar y Mobile Nav bajo un flujo consistente: Catálogo → Logística → Finanzas → Administración.
  - **Interfaz "Spreadsheet"**: Tabla de ítems con anchos fijos y resaltado minimalista para eliminar ruido visual.
- **Refinamiento de Interfaz**:
  - **Estandarización de Iconografía**: Sincronización completa de iconos Lucide en todos los módulos.
  - **Legibilidad de Divisas**: Formateo mejorado de montos secundarios para evitar recortes en dispositivos móviles.
  - **Simplificación Estética**: Optimización de StatCards y eliminación de efectos distractores para un enfoque profesional en los datos.

### 🛠️ Calidad Técnica

- **Robustez de Datos & Precisión**:
  - **Aritmética de Alta Precisión**: Migración a `big.js` y `Decimal128` (MongoDB) para eliminar errores de redondeo financiero.
  - **Normalización de Capas**: Implementación de una capa intermedia en el API para estandarizar tipos de base de datos a constantes de frontend.
  - **Filtros Estrictos**: Aplicación de límites UTC para evitar contaminación de datos por zonas horarias.
- **Estándares de Desarrollo**:
  - **Zero Lint Policy**: Resolución del 100% de advertencias, logrando un codebase con 0 errores de ESLint, Stylelint y TypeScript.
  - **Arquitectura Limpia**: Límite estricto de 700 líneas por componente `.tsx` y desacople del dashboard en sub-vistas especializadas.
  - **Accesibilidad WCAG AAA**: Cumplimiento del estándar 1.4.9 (Imágenes de texto) y automatización de 210 pruebas de a11y.

### 🐛 Correcciones

- **Estabilidad**: Corregida regresión crítica `toFixed` en detalles de libro y errores 500 en el API de resumen.
- **Lógica Financiera**: Arreglado error en cálculos históricos de saldo inicial y visualización de categorías de 2019.
- **Inventario**: Resuelto bug en la búsqueda de bodegas que ignoraba términos de filtrado y sincronización de stock de libros inactivos.
- **Build & Estilos**: Corrección de fallos en el despliegue de Vercel (Recharts type errors) y errores de compilación SCSS por variables/mixins inexistentes.

---

## [1.0.1] - 2026-01-21

### ✨ Nuevas Características (1.0.1)

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

### 🛠️ Calidad Técnica (1.0.1)

- **Estabilidad y Seguridad**:
  - **Type Safety**: Cobertura total de TypeScript (Zero `any`).
  - **Linter Compliance**: Código 100% libre de errores de ESLint y Stylelint.
  - **Accesibilidad**: Cumplimiento WCAG AAA en contrastes y navegación.
- **Optimización**: Reducción de complejidad cognitiva en controladores API y componentes clave.

### 🐛 Correcciones (1.0.1)

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
