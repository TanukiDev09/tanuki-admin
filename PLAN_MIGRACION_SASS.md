# Plan de Migración de Tailwind a SASS + BEM

## Estado Actual
- ✅ Sistema de variables SASS creado (`src/styles/_variables.scss`)
- ✅ Mixins SASS creados (`src/styles/_mixins.scss`)
- ✅ Estilos globales SASS creados (`src/styles/globals.scss`)
- ✅ Ejemplo de componente migrado: `StatCard`

## Componentes a Migrar

### Dashboard Components (11 archivos)
- [x] StatCard
- [ ] BurnRateCard
- [ ] CategoryBarChart
- [ ] CategoryPieChart
- [ ] HealthScoreCard
- [ ] IncomeExpenseChart
- [ ] RecentMovements
- [ ] RunwayCard
- [ ] RunwayProjectionChart
- [ ] ScrollableIncomeExpenseChart

### Admin Components (13 archivos)
- [ ] BookManagementTable
- [ ] CollectionSelect
- [ ] CostCenterSelect
- [ ] CreateBookModal
- [ ] CreateUserModal
- [ ] DynamicArrayField
- [ ] EditBookModal
- [ ] EditUserModal
- [ ] ImageUploader
- [ ] MonthYearSelect
- [ ] PermissionMatrix
- [ ] UserManagementTable
- [ ] UserPermissionsSelect

### Agreements Components (3 archivos)
- [ ] AgreementForm
- [ ] AgreementList
- [ ] GlobalAgreementList

### Auth Components (2 archivos)
- [ ] AuthGuard
- [ ] LoginForm

### Books Components (2 archivos)
- [ ] BookFinancials
- [ ] BookInventorySummary

### Creators Components (3 archivos)
- [ ] CreatorForm
- [ ] CreatorList
- [ ] CreatorSelect

### Finance Components (4 archivos)
- [ ] CategoriesTable
- [ ] CategorySelect
- [ ] CreateCategoryModal
- [ ] EditCategoryModal

### Inventory Components (8 archivos)
- [ ] AddBookToInventoryModal
- [ ] InventoryAdjustModal
- [ ] InventoryList
- [ ] InventoryMatrixTable
- [ ] InventoryMovementModal
- [ ] InventoryMovementsList
- [ ] InventoryStats
- [ ] InventoryStockBadge

### Layout Components (3 archivos)
- [ ] AppHeader
- [ ] NavLinks
- [ ] Sidebar

### Points of Sale Components (5 archivos)
- [ ] CreatePointOfSaleButton
- [ ] EditPointOfSaleModal
- [ ] PointOfSaleCard
- [ ] PointOfSaleDetail
- [ ] PointOfSaleForm

### Profile Components (1 archivo)
- [ ] ProfileCard

### UI Components (20+ archivos)
- [ ] badge
- [ ] button
- [ ] card
- [ ] checkbox
- [ ] command
- [ ] dialog
- [ ] dropdown-menu
- [ ] input
- [ ] label
- [ ] popover
- [ ] select
- [ ] separator
- [ ] spinner
- [ ] Sparkline
- [ ] table
- [ ] tabs
- [ ] toast
- [ ] toaster

### Warehouses Components (6 archivos)
- [ ] CreateWarehouseButton
- [ ] EditWarehouseModal
- [ ] WarehouseCard
- [ ] WarehouseDetail
- [ ] WarehouseList
- [ ] WarehouseSelect

## Pasos de Migración por Componente

Para cada componente:

1. **Crear estructura de carpeta**
   ```
   components/[categoria]/[NombreComponente]/
   ├── [NombreComponente].tsx
   ├── [NombreComponente].scss
   └── index.ts
   ```

2. **Migrar JSX/TSX**
   - Reemplazar clases de Tailwind con clases BEM
   - Actualizar imports
   - Mantener lógica del componente intacta

3. **Crear estilos SASS**
   - Usar notación BEM
   - Importar variables y mixins
   - Aplicar sistema de diseño

4. **Crear archivo barrel (index.ts)**
   - Exportar componente

5. **Actualizar imports en archivos que usan el componente**

## Estrategia de Migración

### Fase 1: Componentes Base UI
Migrar primero los componentes de UI básicos ya que son usados por otros componentes.

### Fase 2: Componentes de Layout
Migrar componentes de layout (Header, Sidebar, etc.)

### Fase 3: Componentes de Dominio
Migrar componentes específicos de cada módulo (dashboard, inventory, etc.)

### Fase 4: Limpieza
- Eliminar archivos viejos de componentes
- Remover Tailwind del proyecto
- Actualizar todos los imports
- Verificar que todo compile

## Comandos Finales

```bash
# Remover Tailwind
npm uninstall tailwindcss @tailwindcss/postcss postcss tailwind-merge prettier-plugin-tailwindcss

# Remover archivos de configuración de Tailwind
rm postcss.config.mjs

# Verificar build
npm run build
```

## Notas

- Mantener compatibilidad con clases legacy (`zone-flow`, `zone-ebb`, etc.)
- Asegurar que los colores HSL se conviertan correctamente
- Preservar toda la funcionalidad existente
- Actualizar imports en páginas y otros componentes
