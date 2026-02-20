# Changelog v1.0.4

## Sistema de Importación de Facturas XML DIAN

### Nuevas Funcionalidades

#### 📄 DIAN XML Import

Sistema completo para procesar facturas electrónicas XML de la DIAN en formato UBL 2.1. Permite importar facturas de manera masiva o individual con extracción automática de todos los datos relevantes.

#### 🔄 Carga Masiva con Python

Script de Python (`scripts/process_dian_invoices.py`) para importar carpetas completas de archivos XML de manera eficiente. Incluye:

- Procesamiento recursivo de carpetas y subcarpetas
- Manejo robusto de errores (continúa si un archivo falla)
- Vista previa de 2 ejemplos antes de importar
- Confirmación antes de guardar en base de datos
- Salida con colores para mejor legibilidad

**Uso:**

```bash
python scripts/process_dian_invoices.py --folder data/Facturas-2025 --import
```

#### 🎨 Interfaz Web Premium

Nueva página `/dashboard/invoices/upload-xml` con diseño moderno y UX excepcional:

- Drag & drop intuitivo para archivos XML
- Carga individual o por lotes
- Wizard de 3 pasos: Cargar → Procesar → Confirmar
- Vista previa de datos de factura en tiempo real
- Efectos glassmorphism y animaciones suaves
- Indicadores de progreso y estado
- Diseño responsivo

#### 📧 Detección Automática de Newsletter

El sistema identifica automáticamente cuando un cliente se ha suscrito al newsletter:

- **Regla**: Persona natural (cédula) + orden de compra = suscripción al newsletter
- Badge visual en la interfaz
- Campo `newsletterSignup` en la base de datos
- Útil para campañas de marketing

#### 🗄️ Campos Extendidos en Facturas

Nuevos campos opcionales en el modelo de factura para datos DIAN:

- `cufe` - Código Único de Factura Electrónica
- `orderReference` - Número de orden de compra
- `newsletterSignup` - Indicador de suscripción
- `customerDocumentType` - Tipo de documento (CC, NIT, etc.)
- `customerAddress`, `customerCity` - Datos de ubicación
- `customerEmail`, `customerPhone` - Datos de contacto
- `dianData` - Metadata completa de DIAN (autorización, software, etc.)

Todos los campos son opcionales y compatibles con facturas existentes.

### Documentación

📚 **Documentación completa disponible en:**

- `docs/dian-xml-structure.md` - Estructura detallada del XML DIAN
- `docs/dian-xml-import-guide.md` - Guía de uso paso a paso

### Notas Técnicas

- **Formato soportado**: UBL 2.1 (estándar DIAN Colombia)
- **Base de datos**: Campos indexados para consultas eficientes
- **Seguridad**: Los archivos XML no se almacenan, solo se procesan
- **Duplicados**: Sistema de upsert previene duplicación de facturas

---

## Control de Movimientos Financieros: Monto Fijo y Validación

### Nuevas Funcionalidades

#### 🔒 Monto Total Fijo

Se ha implementado un cambio fundamental en los formularios de creación y edición de movimientos financieros. El campo **"Monto"** ahora es un valor fijo y no es recalculado automáticamente por las asignaciones de ítems o centros de costo. Esto previene cambios accidentales en el valor total de la transacción mientras se detallan sus componentes.

#### ⚖️ Feedback de Asignación en Tiempo Real

Nuevo sistema de validación visual para la distribución de valores:

- **Indicadores de Discrepancia**: Los formularios ahora muestran claramente si la suma de los ítems detallados o de los centros de costo coincide con el total del movimiento.
- **Alertas de Saldo**: Informa específicamente al usuario cuánto dinero **falta** o **sobra** en la distribución actual ("Faltan $X" o "Sobran $X").
- **Badges de Estado Premium**: Indicadores con estados de éxito (verde) y advertencia (rojo) para guiar al usuario hasta lograr un balance exacto.

#### 💄 Mejoras en la Interfaz (UI)

- **Barras de Resumen**: Rediseño de las secciones de resumen en las tablas de asignación para mostrar siempre el monto objetivo vs. el monto distribuido.
- **Diseño Responsivo**: Adaptación de los mensajes de error y validación para mantener la legibilidad en dispositivos móviles.

---

#### 🧩 Refactor de Interfaz: Layout de Dos Líneas

- **Optimización de Densidad**: Rediseño del listado de ítems en facturas para usar una estructura de rejilla de dos líneas.
- **Legibilidad Mejorada**: Mayor espacio para campos críticos como `BookSelect` y `CostCenterSelect`, eliminando el truncado de texto en pantallas pequeñas y brindando aire visual en escritorio.
- **Responsive Design Enhanced**: Adaptación fluida de la tabla de ítems para mantener la profesionalidad en todas las resoluciones mediante un sistema de cards en móvil.

#### 🧠 Automatización e Inteligencia de Datos

- **Auto-asignación de Centro de Costo**: Al seleccionar un libro del catálogo en el formulario de facturas, el sistema asocia automáticamente su centro de costo predefinido.
- **Vínculos Inteligentes**: Conservación de la descripción original del ítem al vincular productos, permitiendo personalización sin perder la referencia interna al catálogo.

---

## Panel de Control y Analítica

### Nuevas Funcionalidades

#### 📊 Analítica de Centros de Costo

- **Visualización de Participación**: Nuevos gráficos dinámicos para visualizar la contribución porcentual de cada centro de costo en ingresos y egresos totales.
- **Dashboard de Salud**: Integración de métricas de sostenibilidad (Runway, Burn Rate) por categorías y centros de costo.

---

## Infraestructura, Seguridad y Performance

### Mejoras Técnicas

#### 🛡️ Seguridad y Robustez

- **Tolerancia Financiera**: Implementación de un margen de tolerancia inteligente (± $5) en las validaciones de montos para evitar bloqueos por discrepancias ínfimas de precisión decimal en cálculos complejos.
- **Seguridad "Zero Hardcode"**: Limpieza profunda de credenciales y cadenas de conexión MongoDB en el código fuente, asegurando que toda configuración sensible resida exclusivamente en variables de entorno.

#### ⚡ Performance y Escalabilidad

- **Optimización de MongoDB**: Implementación de una nueva estrategia de índices y search indexes para acelerar las consultas de búsqueda y filtrado en los módulos de movimientos y deudas.
- **Middleware Optimizado**: Refactorización del middleware de autenticación para garantizar una persistencia de sesión más robusta y mejor manejo de redirecciones.

---

_Versión 1.0.4 - Sistema de Importación DIAN, Analítica Avanzada & Infraestructura Segura_
