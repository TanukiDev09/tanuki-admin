# Changelog - Versión 1.0.1 (Tanuki Admin)

Esta versión se centra en una mejora significativa de la experiencia de usuario (UX) y la capacidad de análisis de datos en el Dashboard de Movimientos Financieros.

## [1.0.1] - 2026-01-19

### ✨ Nuevas Características

- **Filtros Avanzados de Movimientos**: Se ha implementado un sistema robusto de filtrado que permite segmentar por:
  - **Rango de Montos**: Filtrado preciso por montos mínimos y máximos.
  - **Unidad y Cantidad**: Soporte para filtrar por unidades de medida y rangos de cantidad, incluyendo la capacidad de filtrar registros con cantidad "Sin definir".
  - **Categoría y Centro de Costo**: Filtros dropdown totalmente integrados.
  - **Canal de Pago**: Nuevo filtro dinámico basado en los canales existentes en la base de datos.
  - **Búsqueda Global**: Búsqueda optimizada por descripción, beneficiario y referencia.
- **Ordenamiento Dinámico**: Opción para organizar los resultados por fecha de forma ascendente o descendente (Más recientes / Más antiguos).

### 🚀 Mejoras de UX/UI

- **Rediseño del Panel de Filtros**:
  - **Estandarización Radix UI**: Todos los selectores ahora utilizan componentes de Radix UI para una experiencia fluida y profesional.
  - **Agrupación de Rangos**: Los inputs de rango (Mín/Máx) ahora están visualmente agrupados para reducir el ruido visual.
  - **Layout en Grilla**: Organización lógica en 3 filas que mantiene el balance visual incluso con múltiples filtros activos.
  - **Tipografía Premium**: Etiquetas refinadas con jerarquía visual mejorada.
- **Optimización de Selectores**: Los componentes `CategorySelect` y `CostCenterSelect` ahora soportan la prop `allowCreation={false}` para evitar la creación accidental desde el área de filtros.

### 🛠️ Mejoras Técnicas & Calidad de Código

- **Refactorización de Backend**: La lógica de construcción de queries en `buildQuery` se ha descompuesto en micro-funciones, reduciendo drásticamente su complejidad cognitiva y mejorando la mantenibilidad.
- **Type Safety**: Se ha logrado un estado de `typecheck` limpio (Exit code 0), eliminando el uso de tipos `any` innecesarios y corrigiendo inconsistencias en las props de componentes.
- **Calidad de Estilos**: Corrección de inconsistencias en el orden de propiedades CSS/SCSS siguiendo el estándar de `stylelint`.
- **Rendimiento**: Carga concurrente de metadatos (unidades y canales) al inicializar el dashboard.

### 🐛 Correcciones de Errores

- **TypeErrors**: Se corrigió el error `onChange is not a function` mediante la estandarización a `onValueChange`.
- **Alineación de Etiquetas**: Se eliminaron etiquetas duplicadas y se corrigieron desalineaciones en dispositivos medianos y grandes.
- **Mapeo de Tipos**: Corrección en el backend para normalizar tipos de movimiento (Ingreso/Egreso vs INCOME/EXPENSE).

---

## [1.0.1] - 2026-01-19 (Sesión 2)

### 📱 Diseño Responsivo & Móvil

- **Tabla Stacked Responsive**: La tabla de movimientos ahora se adapta automáticamente a cards apiladas en dispositivos móviles (< 1024px), eliminando el scroll horizontal y mejorando la legibilidad.
- **Filtros Colapsables**: Optimización masiva del espacio vertical en móviles mediante un sistema de filtros colapsables. Solo la búsqueda es visible por defecto, con un toggle para mostrar las opciones avanzadas.
- **Mobile-First**: Reescritura de estilos SCSS siguiendo un enfoque mobile-first para asegurar consistencia y rendimiento.

### ✨ Mejoras Funcionales

- **Paginación Implementada**: Sistema completo de paginación para la lista de movimientos.
  - Controles de navegación (Anterior/Siguiente) y estado visual de página actual.
  - Indicador de metadatos ("Mostrando X de Y resultados").
  - Reset automático a la página 1 al aplicar nuevos filtros.
- **Columnas de Datos**: Se añadieron las columnas "Cantidad" y "Centro Costo" para mayor contexto, reemplazando la columna "Estado" menos relevante.

### 🔧 Calidad de Código

- **Corrección de Linter SCSS**: Resolución automatizada y manual de errores de estilo CSS (`stylelint`), asegurando el orden correcto de propiedades y espaciado estándar.

---

## [1.0.1] - 2026-01-20 (Sesión 3)

### ✨ Canales de Venta & Puntos de Venta

- **Implementación de Canales de Venta**: Se añadió la clasificación de movimientos por canales:
  - **Venta Directa, Feria y Librería**.
  - **Asociación de Puntos de Venta (POS)**: Integración con el modelo de Puntos de Venta para registrar el origen específico de los ingresos por librería.
- **Nuevo Componente `POSSelect`**: Selector premium que permite:
  - Búsqueda de puntos de venta activos.
  - Creación rápida de nuevos puntos de venta mediante un modal integrado.
- **Inteligencia de Formulario**:
  - **Auto-completado de Beneficiario**: Al seleccionar una librería, el sistema sugiere automáticamente el nombre del punto de venta como beneficiario/pagador, optimizando la carga de datos.
  - **Lógica Condicional**: Los campos se adaptan dinámicamente según el canal seleccionado (ej. ocultar Canal de Pago si es una venta por Librería).

### 🚀 Refinamiento del Listado de Movimientos

- **Columna de Canales**: Nueva columna en la tabla principal que muestra el canal de venta y el punto de venta asociado mediante un sistema de Badges.
- **Filtrado por Canal**: Integración de un nuevo filtro avanzado para segmentar movimientos por su canal de origen.

### 🔧 Calidad & Estabilidad

- **Type Safety Robusto**: Corrección integral de errores de tipos en los formularios de creación y edición, asegurando el cumplimiento estricto de los DTOs.
- **Refactorización de UI**: Extracción del componente `MovementTableRow` para reducir la complejidad cognitiva y mejorar la mantenibilidad del dashboard.
- **Linter Clean**: Estado final de linters (JS/CSS) totalmente limpio.
---

## [1.0.1] - 2026-01-20 (Sesión 4)

### ✨ Dashboard de Bodegas: Filtros & UI Premium

- **Sistema de Filtrado Avanzado**: Implementación de una barra de filtros robusta para el listado de bodegas:
  - **Búsqueda Global**: Filtrado por nombre, código y ciudad directamente desde la barra de búsqueda.
  - **Filtros por Atributos**: Selectores especializados para filtrar por tipo de bodega (Editorial, POS, General), ciudad (dinámico) y estado de disponibilidad.
  - **Reset Inteligente**: Botón "Limpiar filtros" que aparece dinámicamente cuando hay filtros activos.
- **Rediseño UI/UX Premium**:
  - **Estética Glassmorphism**: Panel de filtros con efectos de transparencia, desenfoque de fondo (blur) y gradientes sutiles.
  - **Micro-interacciones**: Animaciones fluidas al interactuar con los campos de búsqueda y selectores.
  - **Layout Responsivo**: Diseño optimizado que se adapta perfectamente a diferentes tamaños de pantalla, manteniendo la elegibilidad y facilidad de uso.

### 🔧 Calidad técnica corregida

- **Compatibilidad de Unidades**: Corrección de error crítico en SASS por mezcla de unidades incompatibles (`rem` + `px`).
- **Validación de Estilos**: Reordenamiento integral de propiedades CSS siguiendo las reglas de `stylelint` para mantener la consistencia del sistema de diseño.
- **Limpieza de Código**: Corrección de errores de parsing y fragmentos redundantes en componentes React.
- **Linters & Typecheck**: Verificación completa aprobada (Zero errors).

---

## [1.0.1] - 2026-01-20 (Sesión 5)

### ✨ Dashboard de Categorías: Filtro por Tipo

- **Filtro por Tipo de Categoría**: Implementación de un selector avanzado en el dashboard de categorías para segmentar por:
  - **Ingreso, Egreso y Ambos**.
  - **Integración con Búsqueda**: El filtro funciona de forma combinada con la barra de búsqueda global.
- **Mejoras de UI/UX**:
  - **Diseño Responsivo**: Reorganización del panel de controles para asegurar una visualización óptima en todos los dispositivos.
  - **Estandarización Radix UI**: Uso de componentes de selección premium para mantener la consistencia visual con el resto del sistema.

### 🔧 Calidad & Mantenibilidad

- **Linter & Stylelint Clean**: Verificación y corrección de orden de propiedades CSS/SCSS, asegurando un reporte de linters libre de errores.
- **Type Safety**: Verificación de tipos mediante `tsc` para garantizar la integridad de los datos en el filtrado.

---

## [1.0.1] - 2026-01-21 (Sesión 6)

### 🔗 Vinculación Bilateral Finanzas-Inventario

- **Sincronización Automática**: Implementación de un sistema de enlace bidireccional entre movimientos financieros y de inventario.
  - Al crear una liquidación de inventario, se puede vincular a un ingreso financiero existente.
  - Al crear un ingreso financiero, se puede vincular a una liquidación de inventario.
  - La actualización en un lado se refleja automáticamente en el otro.
- **Buscadores Avanzados**: Nuevos componentes `MovementSearchSelect` e `InventoryMovementSearchSelect` integrados en los formularios de creación y edición.
- **Visualización de Enlaces**:
  - **Finanzas**: Indicador visual (icono de paquete) en la tabla de movimientos para registros con inventario asociado.
  - **Inventario**: Botón de enlace externo directo al detalle del movimiento financiero.

### 🛠️ Calidad de Código & Refactorización

- **Reducción de Complejidad**: Refactorización profunda de los controladores de API (`/api/finance/movements` y `/api/inventory/movements`) extrayendo lógica de negocio a funciones auxiliares para reducir la complejidad cognitiva.
- **Type Safety Estricto**: Eliminación sistemática de tipos `any` implícitos y explícitos, asegurando un código más robusto y mantenible.
- **Limpieza de Código**:
  - Extracción de la lógica de filtrado de `MovementsPage` a un nuevo componente `MovementFilters`, mejorando la legibilidad.
  - Eliminación de importaciones y código muerto en múltiples componentes.
- **Zero Linter Errors**: El proyecto cumple al 100% con las reglas de ESLint, Stylelint y TypeScript.

