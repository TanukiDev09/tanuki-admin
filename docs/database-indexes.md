# Índices de Base de Datos MongoDB

## Descripción General

Este documento describe todos los índices creados en la base de datos MongoDB para optimizar el rendimiento de las consultas del proyecto Tanuki Admin.

## Colecciones y sus Índices

### 📚 Books

**Propósito:** Optimizar búsquedas de libros por título, ISBN, género, colecciones y creadores.

| Índice | Tipo | Campos | Propósito |
|--------|------|--------|-----------|
| `search_title_isbn` | Text | `title`, `isbn` | Búsqueda full-text en título e ISBN |
| `genre_active` | Compound | `genre`, `isActive` | Filtrar libros activos por género |
| `collection_active` | Compound | `collectionName`, `isActive` | Filtrar libros activos por colección |
| `authors_idx` | Single | `authors` | Búsquedas por autor |
| `illustrators_idx` | Single | `illustrators` | Búsquedas por ilustrador |
| `translators_idx` | Single | `translators` | Búsquedas por traductor |
| `created_desc` | Single | `createdAt` (desc) | Ordenar por fecha de creación |
| `active_created` | Compound | `isActive`, `createdAt` (desc) | Listar libros activos ordenados |

### 📄 Invoices

**Propósito:** Optimizar búsquedas de facturas por cliente, fecha, estado y centros de costo.

| Índice | Tipo | Campos | Propósito |
|--------|------|--------|-----------|
| `search_customer_number` | Text | `customerName`, `customerTaxId`, `number` | Búsqueda full-text de clientes y números |
| `date_status` | Compound | `date` (desc), `status` | Filtrar por fecha y estado |
| `status_date` | Compound | `status`, `date` (desc) | Filtrar por estado y ordenar por fecha |
| `items_costcenter_date` | Compound | `items.costCenter`, `date` (desc) | Facturas por centro de costo |
| `items_bookid_date` | Compound | `items.bookId`, `date` (desc) | Facturas por libro |
| `customer_taxid_status` | Compound | `customerTaxId`, `status` | Búsqueda por NIT y estado |
| `customer_name` | Single | `customerName` | Búsqueda por nombre de cliente |
| `date_asc` | Single | `date` (asc) | Encontrar factura más antigua |
| `order_reference` | Single | `orderReference` | Búsqueda por referencia de orden |
| `items_type` | Single | `items.type` | Filtrar por tipo de item |

**Índices Existentes:**
- `date` (desc)
- `status`
- `costCenters`
- `inventoryMovement`
- `newsletterSignup`
- `cufe` (unique, sparse)

### 💰 Movements

**Propósito:** Optimizar consultas de movimientos financieros por fecha, tipo, categoría y centro de costo.

| Índice | Tipo | Campos | Propósito |
|--------|------|--------|-----------|
| `search_description_beneficiary` | Text | `description`, `beneficiary`, `notes` | Búsqueda full-text |
| `date_type` | Compound | `date` (desc), `type` | Filtrar por fecha y tipo |
| `date_category` | Compound | `date` (desc), `category` | Filtrar por fecha y categoría |
| `date_costcenter` | Compound | `date` (desc), `costCenter` | Filtrar por fecha y centro de costo |
| `category_date` | Compound | `category`, `date` (desc) | Agrupar por categoría |
| `payment_channel` | Single | `paymentChannel` | Filtrar por canal de pago |
| `unit_idx` | Single | `unit` | Consultas distinct y filtros |
| `allocations_costcenter` | Single | `allocations.costCenter` | Filtrar por asignaciones |
| `debt_id` | Single | `debtId` | Vincular con deudas |
| `point_of_sale` | Single | `pointOfSale` | Filtrar por punto de venta |
| `fiscal_year_type` | Compound | `fiscalYear`, `type` | Reportes anuales |
| `type_date` | Compound | `type`, `date` (desc) | Filtrar por tipo |

### 💳 Debts

**Propósito:** Optimizar búsquedas de deudas por entidad, tipo y estado.

| Índice | Tipo | Campos | Propósito |
|--------|------|--------|-----------|
| `entity_status` | Compound | `entityId`, `status` | Deudas por entidad y estado |
| `type_status` | Compound | `type`, `status` | Deudas por tipo y estado |
| `entity_type_status` | Compound | `entityId`, `type`, `status` | Filtro completo |

**Índices Existentes:**
- `type`
- `status`
- `entityId`, `type`
- `dueDate`
- `source.id`

### 🏢 External Entities

**Propósito:** Optimizar búsquedas de entidades externas.

| Índice | Tipo | Campos | Propósito |
|--------|------|--------|-----------|
| `search_name` | Text | `name` | Búsqueda full-text por nombre |
| `tax_id` | Single | `taxId` | Búsqueda por NIT |

### 🏪 Points of Sale

**Propósito:** Optimizar listados y búsquedas de puntos de venta.

| Índice | Tipo | Campos | Propósito |
|--------|------|--------|-----------|
| `created_desc` | Single | `createdAt` (desc) | Ordenar por fecha de creación |
| `identification_number` | Single | `identificationNumber` | Búsqueda por NIT |
| `code_idx` | Single | `code` | Búsqueda por código |

### 👤 Creators

**Propósito:** Optimizar búsquedas de creadores (autores, ilustradores, traductores).

| Índice | Tipo | Campos | Propósito |
|--------|------|--------|-----------|
| `search_name` | Text | `name` | Búsqueda full-text por nombre |

### 📦 Inventory Movements

**Propósito:** Optimizar consultas de movimientos de inventario.

| Índice | Tipo | Campos | Propósito |
|--------|------|--------|-----------|
| `date_type` | Compound | `date` (desc), `type` | Filtrar por fecha y tipo |
| `financial_movement` | Single | `financialMovementId` | Vincular con movimientos financieros |

### 🏷️ Categories

**Propósito:** Optimizar búsquedas de categorías.

| Índice | Tipo | Campos | Propósito |
|--------|------|--------|-----------|
| `name_idx` | Single | `name` | Búsqueda por nombre |

### 📋 Inventory Items

**Índices Existentes:**
- `warehouseId`, `bookId` (unique, compound)
- `bookId`
- `quantity`

### 🔐 Permissions

**Índices Existentes:**
- `userId`, `module` (unique, compound)
- `userId`
- `module`

### 👥 Users

**Índices Existentes:**
- `email` (unique)
- `role`
- `isActive`

## Scripts de Gestión

### Crear Índices

```bash
npm run db:create-indexes
# o
npx tsx scripts/db/create-indexes.ts
```

Este script:
- Conecta a MongoDB
- Verifica índices existentes
- Crea solo los índices faltantes
- Muestra resumen de operaciones

### Verificar Índices

```bash
npm run db:check-indexes
# o
npx tsx scripts/db/check-indexes.ts
```

Este script:
- Lista todos los índices en cada colección
- Muestra tamaño de índices
- Muestra estadísticas de colecciones

### Benchmark de Consultas

```bash
npm run db:benchmark
# o
npx tsx scripts/db/benchmark-queries.ts
```

Este script:
- Ejecuta consultas comunes
- Mide tiempo de ejecución
- Verifica uso de índices
- Muestra estadísticas comparativas

## Consideraciones de Rendimiento

### Ventajas

- ✅ **Consultas más rápidas:** Los índices reducen significativamente el tiempo de consulta
- ✅ **Mejor escalabilidad:** El rendimiento se mantiene con crecimiento de datos
- ✅ **Ordenamiento eficiente:** Los índices permiten ordenar sin Collection Scan

### Desventajas

- ⚠️ **Espacio en disco:** Cada índice ocupa ~20-30% del tamaño de la colección
- ⚠️ **Escrituras más lentas:** Los índices deben actualizarse en cada insert/update
- ⚠️ **Memoria RAM:** MongoDB intenta mantener índices en memoria

### Recomendaciones

1. **Monitorear uso:** Usar MongoDB Atlas/Metrics para verificar que los índices se usan
2. **Eliminar índices no usados:** Si un índice no se usa en 30 días, considerar eliminarlo
3. **Revisar periódicamente:** Los patrones de consulta pueden cambiar con el tiempo
4. **Text Indexes:** Solo puede haber un índice de texto por colección

## Mejoras Esperadas

Basado en los patrones de consulta identificados:

- 📚 **Books:** 60-80% más rápido en búsquedas por título/ISBN
- 📄 **Invoices:** 70-90% más rápido en filtros por fecha y estado
- 💰 **Movements:** 50-70% más rápido en consultas por rango de fechas
- 💳 **Debts:** 40-60% más rápido en agrupaciones por entidad
- 🔍 **Búsquedas de texto:** 80-95% más rápido con text indexes

## Mantenimiento

### Reconstruir Índices

Si los índices se corrompen o necesitan optimización:

```javascript
// En MongoDB shell
db.collection.reIndex()
```

### Eliminar un Índice

```javascript
// En MongoDB shell
db.collectionName.dropIndex("index_name")
```

### Ver Estadísticas de Uso

```javascript
// En MongoDB shell
db.collectionName.aggregate([
  { $indexStats: {} }
])
```

## Referencias

- [MongoDB Indexing Strategies](https://docs.mongodb.com/manual/applications/indexes/)
- [Text Search Indexes](https://docs.mongodb.com/manual/core/index-text/)
- [Compound Indexes](https://docs.mongodb.com/manual/core/index-compound/)
