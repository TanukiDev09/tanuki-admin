# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-11-06

### ✨ Nuevas Características (1.1.0)

- **Saldo de caja real (todas las cuentas)**:
  - **Cierres documentados**: nueva colección `reconciliations` (modelo `Reconciliation`) con el cierre mensual de cada cuenta (extracto Davivienda y reportes de MercadoPago/ePayco).
  - **Gráfica "Plata en caja mes a mes"**: reemplaza la acumulación de ingresos menos egresos en la vista anual. La línea es el saldo de caja a fin de mes (nunca negativo) y las barras son lo que subió o bajó en el mes. Los traslados entre cuentas propias no cuentan como flujo.
  - **Meses con saldo inicial no documentado**: el saldo de cierre se muestra; el flujo no se inventa (sin barra) y se informa el rango estimado.
  - **Saldos de apertura/cierre**: `/api/finance/summary` devuelve `cash` y reemplaza `balances` en la vista consolidada (sin filtros). Con filtros de centro de costo, autor o cuenta se conserva el cálculo anterior.
  - **Lógica pura y probada**: `src/lib/finance/cashBalance.ts` con pruebas unitarias.
  - **Tres vistas, cada una con lo suyo**: la vista global muestra la historia completa de caja (todos los años con cierres documentados), la anual el año y la mensual el mes. En la vista mensual, un mes con flujo no determinable muestra las entradas y salidas del día en vez del saldo acumulado.
  - **Indicadores de Sostenibilidad**: usan la caja real como base y dejan fuera de los promedios los meses con flujo no determinable y el mes en curso (`calculateHealthMetrics` recibe `cashBase` y `excludeMonths`).
  - **Historia de caja completa**: la gráfica "Historia Financiera" (vista global) cubre desde el primer movimiento (mayo 2018) hasta hoy. Antes del primer cierre documentado el saldo se reconstruye hacia atrás restando el flujo de los movimientos cargados (`basis: 'calculado'`), por lo que esos meses son aproximados.
  - **Resumen Anual para años anteriores**: los años sin cierre de diciembre/enero documentado ya usan la gráfica de caja (antes caían a la gráfica vieja de ingresos y egresos). La serie anual se recorta de la historia completa con `sliceCashYear`, y las tarjetas de caja, saldos e indicadores de sostenibilidad usan esa misma serie.

- **Dashboard operativo por libro** (`/dashboard/catalog/[id]`): el detalle pasa de una columna larga a una franja de cifras y cuatro pestañas, pensado para decidir reimpresiones y reposiciones. Solo operación y logística, sin finanzas.
  - **Franja de cifras** (`BookKpiStrip`): stock total, cobertura de bodega propia, cobertura combinada, rotación, tasa de devolución y costo unitario estimado.
  - **Alertas** (`BookAttention`): solo aparece cuando hay algo que decidir (reimprimir ya, puntos agotados o sobre-abastecidos).
  - **Pestaña Resumen**: ventas históricas, finanzas del centro de costo y contratos (lo que antes estaba en la página).
  - **Pestaña Reimpresión**: semáforo de reimpresión (`Reimprimir ya` / `Planear`) según la cobertura de la bodega propia frente al tiempo de reimpresión elegido en pantalla (`BookReprint`), y gráfica de demanda mensual por canal de los últimos 12 meses (`BookDemandChart`).
  - **Pestaña Puntos de venta**: rotación y estado de cada punto (`Dormido`, `Agotado`, `Reponer`, `Sobre-stock`, `Estable`) en `BookPosRotation`, y ventas por canal (puntos de venta vs. venta directa) con la participación de cada punto y su stock en consignación en `BookPointsOfSale`.
  - **Pestaña Movimientos**: ciclo de vida de los ejemplares (`BookUnitFlow`), control de consignación con remitido, devuelto, liquidado y última liquidación por punto (`BookConsignment`) y kardex corto con enlace al historial filtrado por libro (`BookKardex`).
  - **Obras completas**: no tienen inventario propio; la pestaña Reimpresión muestra una tabla por volumen y marca el que limita la obra (`BookVolumes`).
  - **Costo unitario estimado**: último precio unitario pagado a la imprenta, tomado del egreso que incluye el libro (por línea, por total o por egresos de impresión del centro de costo). No es un costo de producción desglosado.
- **Nuevos endpoints**:
  - `GET /api/books/[id]/operations`: cobertura, rotación, estado por punto de venta, ciclo de vida, demanda mensual, últimos movimientos y costo unitario.
  - `GET /api/books/[id]/points-of-sale`: ventas por canal y participación de cada punto de venta con su stock actual.
  - `GET /api/inventory/movements?bookId=`: historial de movimientos filtrado por libro. La página `/dashboard/inventory/movements` lo usa desde el enlace del detalle y muestra un aviso con "Ver todos".
- **Lógica pura y probada**: `src/lib/inventory/bookOperations.ts`, `unitCost.ts`, `unitCostQuery.ts` y `src/lib/finance/salesChannels.ts` (`buildBookPointsOfSaleStats`), con pruebas unitarias; el hook `useBookOperations` carga los datos una sola vez para todas las pestañas.

### 🚀 Mejoras & UX (1.1.0)

- **Gráficas con scroll horizontal**: "Historia Financiera" (`CashBalanceChart`, prop `scrollable`) y "Evolución del Resultado" (`RunwayProjectionChart`) tienen ancho fijo por mes y scroll horizontal dentro de su contenedor; abren posicionadas en el mes más reciente.

- **Listado del catálogo en tarjetas** (`BookManagementTable`): cada libro es una tarjeta con portada, título, autor, precio, stock (con etiqueta "sin stock" o "bajo" y, en obras completas, stock calculado de sus volúmenes), ejemplares vendidos y facturado. Reemplaza la tabla con encabezados ordenables por un selector de orden (nombre A→Z / Z→A, más / menos vendidos, mayor / menor facturación).
- **Estilo de navegación**: `Sidebar`, `NavLinks` y `AppHeader` usan los tokens de `_variables.scss` (bordes, pesos de fuente y espaciado) en lugar de valores sueltos, con un aspecto más plano; `dashboard.scss` se ajusta en consecuencia.

### 🐛 Correcciones (1.1.0)

- **Ventas del libro con facturas antiguas**: `/api/books` y `/api/books/[id]/sales` suman cantidades e ingresos con `$toDouble`, de modo que las facturas con `Decimal128` o texto ya no dejan en cero o descuadran los ejemplares vendidos y lo facturado.
- **Historial de movimientos**: se tolera la ausencia de bodega en un movimiento (`warehouseId` nulo) sin romper el filtro por bodega.

### 🛠️ Calidad Técnica (1.1.0)

- **Pruebas nuevas**: `bookOperations.test.ts`, `unitCost.test.ts`, `salesChannels.test.ts`, `BookOperations.test.tsx` y `BookMovementsTab.test.tsx`.
- **Documentación**: `docs/modules/catalog.md` reescrito con el listado, las pestañas del detalle, los endpoints nuevos y las definiciones (venta directa desde la bodega propia, cobertura, rotación, señal de reimpresión, estados de punto de venta).

## [1.0.5] - 2026-05-08

### ✨ Nuevas Características (1.0.5)

- **Gestión Avanzada de Centros de Costo (Dashboard de Rendimiento)**:
  - **Visualización Analítica**: Gráficos interactivos de participación de ingresos y egresos (Pie Charts) y evolución histórica (Area Charts) utilizando Recharts con diseño responsivo y adaptativo.
  - **KPIs de Rendimiento**: Métricas dinámicas por Centro de Costo (Ingresos, Egresos, Balance Neto) que facilitan el análisis detallado de la rentabilidad del negocio.
- **Historial de Movimientos de Inventario & Bodegas**:
  - **Trazabilidad de Traslados**: Tabla interactiva premium de movimientos físicos de stock con filtros avanzados de fecha, bodega de origen, bodega de destino, y tipo de traslado para auditar la logística.

### 🚀 Mejoras & UX (1.0.5)

- **Refactorización de Alta Mantenibilidad en Facturas**:
  - **Desacople de Lógica y UI**: Extracción de `invoice-schema.ts` (esquema Zod, tipado unificado `InvoiceFormValues` e inicializadores) y `InvoiceCustomerSection.tsx` (tarjeta de cliente autocontenida).
  - **Reducción de Código**: Reducción de `InvoiceForm.tsx` de 921 a 598 líneas (reducción del 35%), logrando un estricto cumplimiento del límite de la regla `max-lines` (máximo 700 líneas) sin utilizar directivas de elusión de linter.
- **Robustez en Tablas de Datos**:
  - **Casteo Seguro**: Sustitución de directivas de exclusión de linter y tipado laxo (`item as any`) en `DataTable.tsx` por tipos robustos de TypeScript (`item as unknown as Record<string, unknown>`), eliminando advertencias y errores en la capa visual.
- **Edición Interactiva en Detalle de Centro de Costo**:
  - **Integración de Modales**: Activación e integración directa del componente modal `CostCenterModal` en la vista de análisis detallado (`/dashboard/cost-centers/[id]`), habilitando la edición de atributos clave y el refresco dinámico de datos financieros al guardar.

### 🛠️ Calidad Técnica (1.0.5)

- **Pipeline de Automatización de Calidad (`release-production`)**:
  - **Skill de Cierre**: Creación del módulo agéntico reutilizable que automatiza: auditorías de seguridad en archivos `.env` (fuga de secretos en `NEXT_PUBLIC_`), chequeos de estilo con Prettier y Stylelint, análisis linter de ESLint con tolerancia cero, ejecución de pruebas unitarias con Jest, validaciones de índices de MongoDB y benchmarks de consultas, y compilación final de Next.js.
  - **Pruebas de Accesibilidad Automatizadas**: Integración completa con Cypress + Axe-core para validar automáticamente 40 rutas del sistema, garantizando el cumplimiento estricto del estándar de accesibilidad premium **WCAG AAA** (relación de contraste 7:1, reflow responsivo, navegación semántica y landmarks correctos).
- **Saneamiento de Ciclo de Vida y Tipados**:
  - **Estructuración de React Hooks**: Refactorización de la vista detallada de centros de costo para garantizar el cumplimiento de las reglas de hooks de React (evitando anidamientos no válidos) y el saneamiento completo de tipos TypeScript de cara a producción.
- **Compilador y Caché Limpios**:
  - **Prevención de Tipos Huérfanos**: Saneamiento automático del directorio `.next/` antes del paso a producción para eliminar referencias e interfaces de rutas obsoletas heredadas de otras ramas del repositorio.

## [1.0.4] - 2026-02-20

### ✨ Nuevas Características (1.0.4)

- **Importación de Facturas XML (DIAN)**:
  - **Procesamiento UBL 2.1**: Soporte completo para el estándar de factura electrónica de la DIAN Colombia.
  - **Carga Masiva Web**: Nueva interfaz premium con wizard de 3 pasos (Cargar → Procesar → Confirmar) y efectos glassmorphism.
  - **Script de Automatización Python**: Herramienta de línea de comandos para importación recursiva de carpetas completas de XML.
  - **Detección de Newsletter**: Identificación automática de suscriptores basada en el tipo de documento y actividad de compra.
- **Control Financiero de Alta Precisión**:
  - **Monto Total Fijo**: Bloqueo del monto principal en movimientos para garantizar la integridad de la distribución.
  - **Validación en Tiempo Real**: Feedback visual dinámico (Badges y alertas) sobre faltantes o sobrantes en asignaciones.
  - **Tolerancia Inteligente**: Margen de ± $5 para evitar bloqueos por discrepancias de redondeo decimal.
- **Analítica Avanzada**:
  - **Gráficos de Participación**: Nuevas visualizaciones (Donut Charts) para la contribución de centros de costo en ingresos y gastos.
  - **Métricas de Sostenibilidad**: Integración de Runway y Burn Rate por centro de costo.

### 🚀 Mejoras & UX (1.0.4)

- **Refactor de Interfaz (Two-Line Layout)**: Optimización del listado de ítems en facturas para mejorar la legibilidad y evitar truncado de texto.
- **Automatización Inteligente**: Auto-asignación de Centro de Costo al seleccionar libros del catálogo.
- **Persistencia de Sesión**: Mejoras en el middleware para una experiencia de usuario más fluida entre pestañas.

### 🛠️ Calidad Técnica (1.0.4)

- **Seguridad "Zero Hardcode"**: Auditoría y limpieza total de credenciales en el código fuente.
- **Optimización de Base de Datos**: Estrategia de índices y search indexes para consultas masivas en movimientos y deudas.
- **Sincronización de Datos**: Mejora en la preservación de descripciones originales al vincular productos del catálogo.

---

## [1.0.3] - 2026-01-31

### ✨ Nuevas Características (1.0.3)

- **Módulo de Deudas (Lanzamiento)**:
  - **Dashboard Consolidado**: Seguimiento en tiempo real de activos (Por Cobrar) y pasivos (Por Pagar) con balance neto.
  - **Gestión por Entidad**: Vistas detalladas para obligaciones agrupadas por cliente o proveedor.
  - **Detalle de Obligación**: Ficha técnica con historial de pagos y progreso visual.
- **Gestión de Movimientos**:
  - **Borrado Mandatorio**: Funcionalidad de eliminación de movimientos condicionada al permiso `DELETE` del módulo `FINANCE`.
  - **Navegación Inteligente (Smart Back)**: Redirección automática basada en el contexto de origen del usuario al eliminar registros.

### 🚀 Mejoras & UX (1.0.3)

- **Experiencia Visual Premium**:
  - **Estética "Premium Light"**: Nuevo lenguaje visual de alta claridad y profesionalismo, optimizado para legibilidad.
  - **Navegación Solid**: Consolidación de Sidebar y MobileNav a estilo "Solid Light" (100% opacidad).
- **Inteligencia en Salud Financiera**:
  - **Métricas Sostenibles**: Ajuste dinámico de Runway y Burn Rate limitando promedios solo a meses transcurridos.
  - **Unificación de Indicadores**: Score, Runway y Gasto Neto disponibles consistentemente en vistas Mensual y Anual.
- **Flujos de Usuario**:
  - **Confirmación de Seguridad**: Diálogos preventivos en acciones destructivas.
  - **Reseteo Automático**: Reinicio de paginación al cambiar de periodo para evitar listas vacías.

### 🛠️ Calidad Técnica (1.0.3)

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

### 🐛 Correcciones (1.0.3)

- **Precisión Financiera**: Corregido el inicio del histórico anual ($0) mediante la integración del Saldo Inicial del periodo previo.
- **Sincronización Temporal**: Solución a condiciones de carrera en la URL que impedían la actualización correcta del año al pasar de diciembre a enero.

---

## [1.0.2] - 2026-01-27

### ✨ Nuevas Características (1.0.2)

- **Inteligencia Financiera & Control**:
  - **Visualización Flexible**: Toggle para alternar entre ingresos y gastos en gráficas de categorías y centros de costo.
  - **Control de Saldo Mensual**: Seguimiento de Saldo Mes Anterior y Nuevo Saldo proyectado.
  - **Gestión Documental**: Sistema de carga de facturas (PDF/Imágenes) integrado con Vercel Blob.
  - **Totalizador en Tiempo Real**: Resumen dinámico de títulos y ejemplares en modales de movimiento.
- **Inventario Avanzado**:
  - **Segmentación por Bodega**: Visualización discriminada de stock entre Bodega Editorial y puntos de venta externos.
  - **Resolución de Identidades**: Sustitución de hashes técnicos por nombres de categorías y libros legibles en todo el sistema.

### 🚀 Mejoras & UX (1.0.2)

- **Experiencia Visual Premium**:
  - **Flujo de Caja Rediseñado**: Nueva gráfica de saldo acumulado con gradientes, Tooltips interactivos y escala optimizada.
  - **Navegación Lógica**: Reorganización total de Sidebar y Mobile Nav bajo un flujo consistente: Catálogo → Logística → Finanzas → Administración.
  - **Interfaz "Spreadsheet"**: Tabla de ítems con anchos fijos y resaltado minimalista para eliminar ruido visual.
- **Refinamiento de Interfaz**:
  - **Estandarización de Iconografía**: Sincronización completa de iconos Lucide en todos los módulos.
  - **Legibilidad de Divisas**: Formateo mejorado de montos secundarios para evitar recortes en dispositivos móviles.
  - **Simplificación Estética**: Optimización de StatCards y eliminación de efectos distractores para un enfoque profesional en los datos.

### 🛠️ Calidad Técnica (1.0.2)

- **Robustez de Datos & Precisión**:
  - **Aritmética de Alta Precisión**: Migración a `big.js` y `Decimal128` (MongoDB) para eliminar errores de redondeo financiero.
  - **Normalización de Capas**: Implementación de una capa intermedia en el API para estandarizar tipos de base de datos a constantes de frontend.
  - **Filtros Estrictos**: Aplicación de límites UTC para evitar contaminación de datos por zonas horarias.
- **Estándares de Desarrollo**:
  - **Zero Lint Policy**: Resolución del 100% de advertencias, logrando un codebase con 0 errores de ESLint, Stylelint y TypeScript.
  - **Arquitectura Limpia**: Límite estricto de 700 líneas por componente `.tsx` y desacople del dashboard en sub-vistas especializadas.
  - **Accesibilidad WCAG AAA**: Cumplimiento del estándar 1.4.9 (Imágenes de texto) y automatización de 210 pruebas de a11y.

### 🐛 Correcciones (1.0.2)

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

[1.0.5]: https://github.com/TanukiDev09/tanuki-admin/releases/tag/v1.0.5
[1.0.0]: https://github.com/TanukiDev09/tanuki-admin/releases/tag/v1.0.0
