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
