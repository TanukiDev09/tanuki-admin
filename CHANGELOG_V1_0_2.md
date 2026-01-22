# Changelog - Versión 1.0.2 (Tanuki Admin)

Esta versión se enfoca en el fortalecimiento de la calidad del código, la mantenibilidad a largo plazo, la estandarización de las reglas de desarrollo y mejoras en la visualización financiera.

## [1.0.2] - 2026-01-22

### ✨ Nuevas Características

- **Visualización Financiera Flexible**:
  - **Toggle Ingresos/Gastos**: Nueva funcionalidad para alternar entre la visualización de repartición de ingresos y gastos en las gráficas de categorías y centros de costo.
  - **Identificación de Categorías**: Resolución inteligente de IDs de categorías, mostrando nombres legibles o referencias cortas en lugar de hashes largos.
- **Precisión de Datos**:
  - **Filtro UTC Estricto**: Corrección en los límites de fechas para evitar la "contaminación" de reportes con movimientos de años adyacentes debido a diferencias horarias.

### 🛠️ Calidad Técnica & Estándares de Código

- **Límite de Líneas por Componente**:
  - Se ha implementado una regla estricta en ESLint (`max-lines`) que limita los archivos `.tsx` a un máximo de **700 líneas**.
  - Objetivo: Fomentar la componetización y evitar "archivos monstruo".
- **Refactorización Mayor**:
  - Desacople del dashboard financiero en componentes dedicados (`GlobalView`, `MonthlyView`, `AnnualView`).
- **Estandarización de Formato**:
  - Aplicación de `Prettier`, `ESLint` y `Stylelint` en todo el workspace para garantizar consistencia.

### 🐛 Correcciones

- Arreglado bug donde los nombres de categorías no se mostraban en reportes antiguos (Enero 2019).
- Corregida la comparación de tipos en la tabla de movimientos financieros.
- Ajustados estilos SCSS para cumplir con el orden de propiedades estándar.

---

### ♿ Sesión: Accesibilidad WCAG AAA & Estabilidad

**Fecha:** 2026-01-22

#### 🌟 Logros de Accesibilidad
- **Cumplimiento WCAG AAA 1.4.9 (Imágenes de Texto)**:
  - Implementación de un sistema de utilidades centralizado (`src/lib/accessibility.ts`) para garantizar que todos los textos alternativos sean descriptivos y concisos (máximo 8 palabras).
  - Refactorización de componentes de inventario, catálogo y creadores para cumplir con los estándares más estrictos de accesibilidad.
- **Automatización de Pruebas**:
  - Ejecución exitosa de **210 tests de accesibilidad** con un 100% de éxito en todas las rutas críticas.
  - Mejora de la estabilidad de los tests para manejar dinámicamente elementos ausentes.
- **Limpieza de Linters en Tests**:
  - Resolución del 100% de las advertencias de ESLint en la suite de pruebas de Cypress.

#### 🛠️ Correcciones de Estabilidad
- **Regresión Crítica en Detalle de Libro**:
  - Corregido error de ejecución `Cannot read properties of undefined (reading 'toFixed')` en el componente `BookFinancials`.
  - Actualización robusta de la API de finanzas (`/api/finance/summary`) para garantizar el envío de métricas de margen de beneficio.

---

*Nota: Esta versión asegura una base sólida y estandarizada para el crecimiento futuro de Tanuki Admin.*
