/**
 * Script de Migración Automática de Tailwind a SASS + BEM
 *
 * Este script ayuda a:
 * 1. Crear la estructura de carpetas para cada componente
 * 2. Generar archivos básicos (index.ts, scss template)
 * 3. Listar componentes que faltan migrar
 */

const fs = require('fs');
const path = require('path');

// Rutas base
const COMPONENTS_DIR = path.join(__dirname, '..', 'src', 'components');

// Template para index.ts
const createIndexTemplate = (
  componentName
) => `export { ${componentName} } from './${componentName}';
`;

// Template base para SCSS
const createScssTemplate = (
  componentName,
  blockName
) => `@use '../../../styles/variables' as *;
@use '../../../styles/mixins' as *;

// ============================================
// ${componentName.toUpperCase()} COMPONENT
// Notación BEM
// ============================================

.${blockName} {
  // Estilos base del componente
  
  // --- ELEMENTOS ---
  
  &__element {
    // Estilos de elementos
  }
  
  // --- MODIFICADORES ---
  
  &--modifier {
    // Estilos de modificadores
  }
}
`;

// Función para convertir PascalCase a kebab-case
function pascalToKebab(str) {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

// Función para crear estructura de carpeta de componente
function createComponentStructure(category, componentName) {
  const componentDir = path.join(COMPONENTS_DIR, category, componentName);

  // Verificar si ya existe
  if (fs.existsSync(componentDir)) {
    console.log(`⚠️  ${componentName} ya existe en ${category}`);
    return false;
  }

  // Crear directorio
  fs.mkdirSync(componentDir, { recursive: true });

  // Crear index.ts
  const indexPath = path.join(componentDir, 'index.ts');
  fs.writeFileSync(indexPath, createIndexTemplate(componentName));

  // Crear archivo SCSS
  const scssPath = path.join(componentDir, `${componentName}.scss`);
  const blockName = pascalToKebab(componentName);
  fs.writeFileSync(scssPath, createScssTemplate(componentName, blockName));

  console.log(`✅ Creada estructura para ${componentName} en ${category}`);
  return true;
}

// Lista de componentes a migrar (organizado por categoría)
const componentsToMigrate = {
  dashboard: [
    'BurnRateCard',
    'CategoryBarChart',
    'CategoryPieChart',
    'HealthScoreCard',
    'IncomeExpenseChart',
    'RecentMovements',
    'RunwayCard',
    'RunwayProjectionChart',
    'ScrollableIncomeExpenseChart',
  ],
  admin: [
    'BookManagementTable',
    'CollectionSelect',
    'CostCenterSelect',
    'CreateBookModal',
    'CreateUserModal',
    'DynamicArrayField',
    'EditBookModal',
    'EditUserModal',
    'ImageUploader',
    'MonthYearSelect',
    'PermissionMatrix',
    'UserManagementTable',
    'UserPermissionsSelect',
  ],
  agreements: ['AgreementForm', 'AgreementList', 'GlobalAgreementList'],
  auth: ['AuthGuard', 'LoginForm'],
  books: ['BookFinancials', 'BookInventorySummary'],
  creators: ['CreatorForm', 'CreatorList', 'CreatorSelect'],
  finance: [
    'CategoriesTable',
    'CategorySelect',
    'CreateCategoryModal',
    'EditCategoryModal',
  ],
  inventory: [
    'AddBookToInventoryModal',
    'InventoryAdjustModal',
    'InventoryList',
    'InventoryMatrixTable',
    'InventoryMovementModal',
    'InventoryMovementsList',
    'InventoryStats',
    'InventoryStockBadge',
  ],
  layout: ['AppHeader', 'NavLinks', 'Sidebar'],
  'points-of-sale': [
    'CreatePointOfSaleButton',
    'EditPointOfSaleModal',
    'PointOfSaleCard',
    'PointOfSaleDetail',
    'PointOfSaleForm',
  ],
  profile: ['ProfileCard'],
  warehouses: [
    'CreateWarehouseButton',
    'EditWarehouseModal',
    'WarehouseCard',
    'WarehouseDetail',
    'WarehouseList',
    'WarehouseSelect',
  ],
};

// Función principal
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('📋 Uso del script:');
    console.log(
      '  node migrate-to-sass.js all          - Crear estructuras para todos los componentes'
    );
    console.log(
      '  node migrate-to-sass.js [categoria]  - Crear estructuras para una categoría específica'
    );
    console.log(
      '  node migrate-to-sass.js list         - Listar todas las categorías y componentes'
    );
    return;
  }

  const command = args[0];

  if (command === 'list') {
    console.log('\n📋 Componentes a migrar:\n');
    Object.entries(componentsToMigrate).forEach(([category, components]) => {
      console.log(
        `\n${category.toUpperCase()} (${components.length} componentes):`
      );
      components.forEach((comp) => console.log(`  - ${comp}`));
    });
    return;
  }

  if (command === 'all') {
    console.log('\n🚀 Creando estructuras para todos los componentes...\n');
    let created = 0;
    Object.entries(componentsToMigrate).forEach(([category, components]) => {
      console.log(`\n📁 ${category}:`);
      components.forEach((componentName) => {
        if (createComponentStructure(category, componentName)) {
          created++;
        }
      });
    });
    console.log(`\n✨ Total: ${created} estructuras creadas`);
    return;
  }

  // Migrar una categoría específica
  if (componentsToMigrate[command]) {
    console.log(`\n🚀 Creando estructuras para ${command}...\n`);
    let created = 0;
    componentsToMigrate[command].forEach((componentName) => {
      if (createComponentStructure(command, componentName)) {
        created++;
      }
    });
    console.log(`\n✨ ${created} estructuras creadas en ${command}`);
  } else {
    console.log(`❌ Categoría "${command}" no encontrada`);
    console.log(
      'Categorías disponibles:',
      Object.keys(componentsToMigrate).join(', ')
    );
  }
}

main();
