# Guía Completa de Migración de Tailwind CSS a SASS + BEM

## 📋 Resumen del Proyecto

Este documento detalla la migración completa del proyecto Tanuki Admin Dashboard de Tailwind CSS a SASS con notación BEM (Block Element Modifier) y estructura de componentes organizada en carpetas individuales.

## ✅ Trabajo Completado

### 1. Sistema de Diseño SASS

- ✅ **Variables Globales** (`src/styles/_variables.scss`)
  - Paleta de colores completa
  - Sistema de espaciado
  - Tipografía
  - Sombras
  - Border radius
  - Transiciones
  - Breakpoints

- ✅ **Mixins SASS** (`src/styles/_mixins.scss`)
  - Mixins de responsive design
  - Mixins de flexbox
  - Mixins de cards
  - Mixins de badges
  - Mixins de scrollbar
  - Mixins de focus
  - Mixins de transiciones

- ✅ **Estilos Globales** (`src/styles/globals.scss`)
  - Reset CSS
  - Estilos base
  - Tipografía global
  - Componentes globales (cards, badges, etc.)
  - Utilidades de zona (legacy)
  - Animaciones
  - Custom scrollbar

### 2. Estructura de Componentes Migrados

#### ✅ Componentes Completados

**Dashboard:**

- `StatCard` → `dashboard/StatCard/`
  - `StatCard.tsx`
  - `StatCard.scss`
  - `index.ts`

**UI Components:**

- `Button` → `ui/Button/`
  - `Button.tsx`
  - `Button.scss`
  - `index.ts`
- `Card` → `ui/Card/`
  - `Card.tsx`
  - `Card.scss`
  - `index.ts`

#### 📁 Estructuras Creadas (Pendientes de Migración)

El script `migrate-to-sass.js` creó las estructuras de carpetas con archivos plantilla para **59 componentes** en las siguientes categorías:

- **Dashboard** (9 componentes)
- **Admin** (13 componentes)
- **Agreements** (3 componentes)
- **Auth** (2 componentes)
- **Books** (2 componentes)
- **Creators** (3 componentes)
- **Finance** (4 componentes)
- **Inventory** (8 componentes)
- **Layout** (3 componentes)
- **Points of Sale** (5 componentes)
- **Profile** (1 componente)
- **Warehouses** (6 componentes)

### 3. Herramientas y Scripts

- ✅ **Script de Migración Automatizada** (`scripts/dev/migrate-to-sass.js`)
  - Crea estructuras de carpetas
  - Genera archivos plantilla
  - Soporta migración por categoría o completa

## 🎯 Pasos Siguientes

### Fase 1: Migrar Componentes UI Restantes

Los componentes UI son críticos porque son usados por todos los demás componentes. Migrar en orden:

1. **Input** → `ui/Input/`
2. **Label** → `ui/Label/`
3. **Badge** → `ui/Badge/`
4. **Table** → `ui/Table/`
5. **Dialog** → `ui/Dialog/`
6. **Select** → `ui/Select/`
7. **Checkbox** → `ui/Checkbox/`
8. **Tabs** → `ui/Tabs/`
9. **Toast** → `ui/Toast/`
10. **Dropdown Menu** → `ui/DropdownMenu/`
11. **Popover** → `ui/Popover/`
12. **Separator** → `ui/Separator/`
13. **Textarea** → `ui/Textarea/`
14. **Command** → `ui/Command/`
15. **Form** → `ui/Form/`
16. **Sparkline** → `ui/Sparkline/`

### Fase 2: Migrar Componentes de Layout

1. **Sidebar** → `layout/Sidebar/`
2. **AppHeader** → `layout/AppHeader/`
3. **NavLinks** → `layout/NavLinks/`

### Fase 3: Migrar Componentes de Dashboard

1. **IncomeExpenseChart**
2. **CategoryBarChart**
3. **CategoryPieChart**
4. **HealthScoreCard**
5. **BurnRateCard**
6. **RunwayCard**
7. **RunwayProjectionChart**
8. **RecentMovements**
9. **ScrollableIncomeExpenseChart**

### Fase 4: Migrar Componentes de Dominio

Migrar los componentes específicos de cada módulo:

- Inventory
- Finance
- Agreements
- Creators
- Books
- Warehouses
- Points of Sale
- Admin
- Auth
- Profile

## 📝 Patrón de Migración por Componente

### Ejemplo: Migrar `IncomeExpenseChart`

#### 1. Ver el componente original

```bash
# Ubicación actual
src/components/dashboard/IncomeExpenseChart.tsx
```

#### 2. Analizar clases de Tailwind

Identificar todas las clases de Tailwind y crear equivalentes BEM:

**Tailwind:**

```tsx
className = 'w-full border-none shadow-none bg-transparent';
```

**BEM:**

```tsx
className = 'income-expense-chart income-expense-chart--transparent';
```

#### 3. Crear el nuevo componente

**Archivo:** `src/components/dashboard/IncomeExpenseChart/IncomeExpenseChart.tsx`

```typescript
import './IncomeExpenseChart.scss';

export function IncomeExpenseChart({ data }: IncomeExpenseChartProps) {
  return (
    <div className="income-expense-chart">
      <div className="income-expense-chart__header">
        <h3 className="income-expense-chart__title">
          Flujo de Caja del Mes
        </h3>
        <div className="income-expense-chart__controls">
          {/* Controls */}
        </div>
      </div>
      <div className="income-expense-chart__content">
        {/* Chart content */}
      </div>
    </div>
  );
}
```

#### 4. Crear estilos SASS

**Archivo:** `src/components/dashboard/IncomeExpenseChart/IncomeExpenseChart.scss`

```scss
@use '../../../styles/variables' as *;
@use '../../../styles/mixins' as *;

.income-expense-chart {
  width: 100%;

  &--transparent {
    background: transparent;
    border: none;
    box-shadow: none;
  }

  &__header {
    @include flex-between;
    padding-bottom: $spacing-sm;
  }

  &__title {
    font-family: $font-sans;
    font-size: $font-size-xl;
    font-weight: $font-weight-semibold;
    color: $foreground;
  }

  &__controls {
    @include flex-center;
    gap: $spacing-sm;
  }

  &__content {
    padding-left: 0;
    padding-right: 0;
  }
}
```

#### 5. Crear archivo barrel

**Archivo:** `src/components/dashboard/IncomeExpenseChart/index.ts`

```typescript
export { IncomeExpenseChart } from './IncomeExpenseChart';
```

#### 6. Actualizar imports

Buscar todos los archivos que importan el componente y actualizar:

**Antes:**

```typescript
import { IncomeExpenseChart } from '@/components/dashboard/IncomeExpenseChart';
```

**Después:**

```typescript
import { IncomeExpenseChart } from '@/components/dashboard/IncomeExpenseChart';
// El import es el mismo gracias al index.ts, solo el contenido interno cambió
```

## 🔄 Conversión de Clases Tailwind a BEM

### Guía de Conversión Común

| Tailwind                             | BEM                  | SCSS                                                          |
| ------------------------------------ | -------------------- | ------------------------------------------------------------- |
| `flex items-center justify-between`  | `component__header`  | `@include flex-between;`                                      |
| `text-sm font-medium`                | `component__text`    | `font-size: $font-size-sm; font-weight: $font-weight-medium;` |
| `bg-primary text-primary-foreground` | `component--primary` | `background: $primary; color: $primary-foreground;`           |
| `rounded-md`                         | `component`          | `border-radius: $radius-md;`                                  |
| `p-6`                                | `component__content` | `padding: $spacing-lg;`                                       |
| `hover:bg-accent`                    | `component:hover`    | `&:hover { background: $accent; }`                            |
| `disabled:opacity-50`                | `component:disabled` | `&:disabled { opacity: 0.5; }`                                |

### Mapeo de Colores Tailwind a Variables SASS

| Tailwind CSS Variable    | Variable SASS |
| ------------------------ | ------------- |
| `hsl(var(--background))` | `$background` |
| `hsl(var(--foreground))` | `$foreground` |
| `hsl(var(--primary))`    | `$primary`    |
| `hsl(var(--secondary))`  | `$secondary`  |
| `hsl(var(--muted))`      | `$muted`      |
| `hsl(var(--success))`    | `$success`    |
| `hsl(var(--danger))`     | `$danger`     |
| `hsl(var(--info))`       | `$info`       |
| `hsl(var(--warning))`    | `$warning`    |

### Mapeo de Espaciado

| Tailwind          | Variable SASS |
| ----------------- | ------------- |
| `p-1, m-1` (4px)  | `$spacing-xs` |
| `p-2, m-2` (8px)  | `$spacing-sm` |
| `p-4, m-4` (16px) | `$spacing-md` |
| `p-6, m-6` (24px) | `$spacing-lg` |
| `p-8, m-8` (32px) | `$spacing-xl` |

## 🛠️ Comandos Útiles

### Migrar todos los componentes (crear estructuras)

```bash
node scripts/dev/migrate-to-sass.js all
```

### Migrar una categoría específica

```bash
node scripts/dev/migrate-to-sass.js dashboard
node scripts/dev/migrate-to-sass.js ui
node scripts/dev/migrate-to-sass.js layout
```

### Listar componentes pendientes

```bash
node scripts/dev/migrate-to-sass.js list
```

### Verificar compilación

```bash
npm run dev
```

## ⚠️ Consideraciones Importantes

### 1. Imports de Componentes

Durante la migración, algunos componentes pueden tener imports que fallan. Actualizar según sea necesario:

**Antes:**

```typescript
import { Card } from '@/components/ui/card';
```

**Después:**

```typescript
import { Card } from '@/components/ui/Card';
```

### 2. Props className

Siempre mantener soporte para `className` adicional para flexibilidad:

```typescript
export function Component({ className }: ComponentProps) {
  return (
    <div className={`component ${className || ''}`}>
      {/* ... */}
    </div>
  );
}
```

### 3. CSS Modules vs Global Styles

Los archivo `.scss` de componentes se importan directamente, NO son CSS Modules. Las clases son globales, por eso es importante usar BEM para evitar conflictos.

### 4. Variables CSS vs SASS

El proyecto usa variables CSS (Custom Properties) en el HTML para temas dinámicos. Las variables SASS compilan a valores estáticos. Mantener ambos cuando sea necesario:

```scss
// Variable SASS para desarrollo
$primary: hsl(222, 47%, 11%);

// En el CSS compilado, puede referenciar variables CSS para temas dinámicos
background: var(--primary, #{$primary});
```

## 🎨 Naming Conventions BEM

### Block

El componente principal, usa kebab-case del nombre del componente:

- `IncomeExpenseChart` → `.income-expense-chart`
- `StatCard` → `.stat-card`
- `UserManagementTable` → `.user-management-table`

### Element

Partes del componente, usa `__`:

- `.income-expense-chart__header`
- `.stat-card__title`
- `.user-management-table__row`

### Modifier

Variantes del componente o elemento, usa `--`:

- `.stat-card--success`
- `.button--large`
- `.income-expense-chart--loading`

## 🚀 Optimizaciones

### Tree Shaking

Al usar imports nombrados con archivos barrel (`index.ts`), Next.js puede hacer tree-shaking más eficientemente.

### Code Splitting

Los estilos SCSS se compilan a CSS y se incluyen automáticamente por Next.js solo donde se usan.

### Performance

SASS compila a CSS optimizado. No hay overhead en runtime como con Tailwind's JIT.

## 📦 Limpieza Final

Una vez completada la migración de TODOS los componentes:

### 1. Remover Tailwind y dependencias

```bash
npm uninstall tailwindcss @tailwindcss/postcss postcss tailwind-merge prettier-plugin-tailwindcss class-variance-authority
```

### 2. Remover archivos de configuración

```bash
rm postcss.config.mjs
```

### 3. Limpiar imports obsoletos

Buscar y remover todas las referencias a:

- `import { cn } from '@/lib/utils'` (función de Tailwind merge)
- `import { cva } from 'class-variance-authority'`

### 4. Eliminar archivos antiguos

Una vez verificado que todos los imports nuevos funcionan, eliminar los archivos `.tsx` antiguos fuera de sus carpetas.

### 5. Actualizar `.prettierrc`

Remover la configuración de prettier-plugin-tailwindcss

### 6. Verificar build de producción

```bash
npm run build
npm start
```

## 📊 Estado de Migración

### Componentes Migrados: 3/~80 (~4%)

- [x] StatCard
- [x] Button
- [x] Card

### Próximos Pasos Inmediatos

1. Migrar componentes UI restantes (Input, Label, Badge, Table, etc.)
2. Migrar_componen componentes the Layout (Sidebar, AppHeader, NavLinks)
3. Continuar con Dashboard y componentes de dominio

---

**Última actualización:** 2026-01-17
**Autor:** Migración automatizada con asistencia de IA
