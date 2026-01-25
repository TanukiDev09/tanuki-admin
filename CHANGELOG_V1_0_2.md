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

### 📊 Sesión: Dashboard Financiero & Normalización de Datos

**Fecha:** 2026-01-23

#### 🌟 Nuevas Características
- **Control de Saldo Mensual**:
  - Implementación de bloques de **Saldo Mes Anterior** y **Nuevo Saldo** en el dashboard financiero.
  - Ahora es posible visualizar con cuánto dinero arrancó la editorial el mes y cuál es el saldo proyectado al final del periodo.
- **Gráfico de Flujo de Caja Acumulado**:
  - Cambio de visualización de balance neto diario a **saldo en caja acumulado**.
  - Mejora estética radical con gradientes cyan/teal, puntos de datos resaltados y Tooltips interactivos con el "Saldo en Caja".
  - Ajuste de escala Y proporcional partiendo desde $0 para evitar distorsiones visuales.

#### 🛠️ Calidad Técnica & Correctividad
- **Normalización de Tipos de Movimiento**:
  - Implementación de una capa de normalización en el API de finanzas (`/api/finance/summary`) para convertir tipos de base de datos (`Ingreso`/`Egreso`) a constantes de frontend (`INCOME`/`EXPENSE`).
  - Asegurada la consistencia en la actualización de movimientos (API `PUT`) para mantener el formato de base de datos estandarizado.
- **Limpieza de Linters & Build**:
  - Resolución de errores de inmutabilidad en React (reemplazo de reasignaciones en `map` por `reduce`).
  - **Corrección de Error de Compilación**: Ajustada la definición del `formatter` del Tooltip en Recharts para aceptar parámetros opcionales, solucionando el fallo en el despliegue de Vercel.
  - Resolución de advertencias de Stylelint sobre orden de propiedades y formato de colores en SCSS.
- **Orden Cronológico**: Se cambió el orden predeterminado en la tabla de movimientos del dashboard a cronológico (más antiguo a más reciente), facilitando el seguimiento secuencial del flujo de caja.
- **Corrección de Cálculos Históricos**:
  - Arreglado bug crítico en el cálculo del balance inicial que utilizaba `month - 2` en lugar de `month - 1`.
  - Verificada la consistencia de datos entre Mayo y Junio 2018 (Balance Final Mayo == Balance Inicial Junio).

#### 🎨 UX/UI
- **Simplificación de StatCards**:
  - Reducción del peso visual general: padding ajustado, tipografía optimizada e iconos más discretos.
  - Eliminación de efectos "glassmorphism" excesivos, sombras pesadas y animaciones distractores para un enfoque profesional en los datos.

---

### 🧮 Sesión: Precisión Financiera & Pulido de Interfaz

**Fecha:** 2026-01-23

#### 🌟 Logros de Precisión & Fiabilidad
- **Aritmética de Alta Precisión**:
  - Implementación de `big.js` (vía `src/lib/math.ts`) para todos los cálculos financieros del sistema, eliminando errores de redondeo de punto flotante.
  - Actualización del modelo de MongoDB `Movement` para utilizar `Decimal128` en campos críticos (`amount`, `exchangeRate`, `amountInCOP`, `quantity`, `unitValue`).
- **Estabilidad del API de Resumen**:
  - Resolución de errores 500 y referencias nulas en el API de Salud Financiera.
  - Optimización de agregaciones diarias y proyecciones de caja con validaciones matemáticas robustas.
- **Seguridad de Tipos (TypeScript)**:
  - Resolución del 100% de los errores de tipos introducidos por el cambio a strings numéricos de alta precisión, garantizando un build estable.

#### 🎨 UX/UI & Pulido Visual
- **Formateo de Divisas**: 
  - Ajuste en la visualización de montos secundarios (ej: `$ 1 637 580 (¥ 59 500)`) añadiendo un espacio antes del paréntesis para mejorar la partición de palabras y el ajuste de texto en dispositivos móviles.
- **Sistema de Colores de Categoría**:
  - Implementación de paletas curadas (`WARM_COLORS`, `COLD_COLORS`, `NEUTRAL_COLORS`) para una organización visual coherente.
  - Integración de Selector de Color en los modales de creación/edición de categorías.
  - Unificación visual en tablas, badges y gráficos de finanzas siguiendo los colores semánticos asignados.
- **Mejora en Flujo de Edición**:
  - Cambio en la redirección post-edición de movimientos a `router.back()`, permitiendo al usuario regresar contextualmente a su vista previa.

---

### 📦 Sesión: Desglose de Inventario & Consistencia de Datos

**Fecha:** 2026-01-25

#### 🌟 Nuevas Características
- **Desglose de Stock por Bodega**:
  - Implementación de visualización discriminada de unidades en el dashboard de inventario.
  - Nuevas tarjetas de estadísticas para **Bodega Editorial** (oficina central) y **Otras Bodegas** (puntos de venta y terceros).
  - Rediseño de la sección de estadísticas a una cuadrícula de 2x3 para acomodar los nuevos totales sin perder claridad.

#### 🛠️ Calidad Técnica & Correctividad
- **Robustez en Cálculo de "Sin Stock"**:
  - Refactorización completa del API de estadísticas de inventario (`/api/inventory/stats`) para utilizar una única agregación basada en el catálogo de libros activos.
  - Se corrigió el error donde libros inactivos afectaban los contadores de stock bajo/nulo.
  - Sincronización de la lógica entre las tarjetas de resumen y la Matriz de Inventario para garantizar consistencia total de datos.
- **Filtro de Catálogo Activo**:
  - Actualización del API de la matriz de inventario para filtrar automáticamente por libros activos, eliminando ruido visual de productos obsoletos.

#### 🎨 UX/UI
- **Corrección de Recorte en Movimientos**:
  - Resolución de bug visual en la lista de últimos movimientos donde los items se cortaban debido a un `max-height` restrictivo.
  - Optimización del espaciado y alineación vertical en las tablas de movimientos para mejorar la legibilidad de traslados con múltiples libros.

---

*Nota: Esta versión asegura una base sólida y estandarizada para el crecimiento futuro de Tanuki Admin.*
