# 📚 Índice de Documentación - Migración SASS + BEM

## 📖 Documentos Principales

### 1. [RESUMEN_MIGRACION_SASS.md](./RESUMEN_MIGRACION_SASS.md)

**Vista ejecutiva del proyecto de migración**

- Estado actual y progreso
- Trabajo completado
- Componentes pendientes
- Métricas del proyecto
- Estructura del proyecto
- Nota importante sobre Tailwind/SASS coexistiendo

👉 **Léeme primero** para entender el panorama general.

---

### 2. [GUIA_MIGRACION_SASS_BEM.md](./GUIA_MIGRACION_SASS_BEM.md)

**Guía completa paso a paso**

- Patrón de migración detallado
- Pasos siguientes organizados por fases
- Tablas de conversión (Tailwind → BEM)
- Mapeo de colores y espaciado
- Naming conventions BEM
- Comandos útiles
- Consideraciones importantes
- Checklist de limpieza final

👉 **Úsame como referencia** durante la migración activa.

---

### 3. [EJEMPLOS_MIGRACION.md](./EJEMPLOS_MIGRACION.md)

**Ejemplos prácticos con código completo**

- Input Component (ejemplo básico)
- Badge Component (con variantes)
- Table Component (componente complejo con sub-elementos)
- Dialog Component (con animaciones y estados)
- Checklist de migración por componente

👉 **Copia y adapta** estos ejemplos para migrar tus componentes.

---

### 4. [PLAN_MIGRACION_SASS.md](./PLAN_MIGRACION_SASS.md)

**Plan detallado de migración**

- Lista completa de componentes a migrar
- Agrupados por categoría
- Estrategia de migración por fases
- Comandos finales de limpieza

👉 **Revísame** para trackear qué falta por migrar.

---

## 🎯 Flujo de Trabajo Recomendado

### Para empezar:

1. Lee **RESUMEN_MIGRACION_SASS.md** completo
2. Familiarízate con **GUIA_MIGRACION_SASS_BEM.md**
3. Revisa **EJEMPLOS_MIGRACION.md** para ver patrones

### Para migrar un componente:

1. Abre **EJEMPLOS_MIGRACION.md** y busca un ejemplo similar
2. Usa **GUIA_MIGRACION_SASS_BEM.md** para consultas específicas
3. Marca el componente en **PLAN_MIGRACION_SASS.md** cuando termines

### Para verificar progreso:

1. Consulta **RESUMEN_MIGRACION_SASS.md** para métricas
2. Actualiza **PLAN_MIGRACION_SASS.md** con checkmarks

---

## 🗂️ Archivos del Sistema de Diseño

### Variables SASS

```
src/styles/_variables.scss
```

- Paleta de colores
- Espaciado
- Tipografía
- Sombras
- Border radius
- Transiciones
- Breakpoints

### Mixins SASS

```
src/styles/_mixins.scss
```

- Responsive design
- Flexbox utilities
- Card styles
- Badge styles
- Button reset
- Icon circles
- Custom scrollbar
- Focus ring
- Transitions

### Estilos Globales

```
src/styles/globals.scss
```

- Reset CSS
- Tipografía global (h1-h6)
- Componentes globales
- Utilidades
- Animaciones

---

## 🛠️ Scripts y Herramientas

### Script de Migración Automatizada

```bash
node scripts/dev/migrate-to-sass.js [comando]
```

**Comandos disponibles:**

- `all` - Crear estructuras para todos los componentes
- `[categoria]` - Crear estructuras para una categoría específica (ej: dashboard, ui, layout)
- `list` - Listar todas las categorías y componentes

**Ubicación:**

```
scripts/dev/migrate-to-sass.js
```

---

## 📁 Estructura de Componentes

### Antes (Tailwind):

```
src/components/
├── ui/
│   ├── button.tsx
│   ├── card.tsx
│   └── input.tsx
└── dashboard/
    ├── StatCard.tsx
    └── IncomeExpenseChart.tsx
```

### Después (SASS + BEM):

```
src/components/
├── ui/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.scss
│   │   └── index.ts
│   ├── Card/
│   │   ├── Card.tsx
│   │   ├── Card.scss
│   │   └── index.ts
│   └── Input/
│       ├── Input.tsx
│       ├── Input.scss
│       └── index.ts
└── dashboard/
    ├── StatCard/
    │   ├── StatCard.tsx
    │   ├── StatCard.scss
    │   └── index.ts
    └── IncomeExpenseChart/
        ├── IncomeExpenseChart.tsx
        ├── IncomeExpenseChart.scss
        └── index.ts
```

---

## 🎨 Naming Convention BEM

### Block (Componente)

```
PascalCase → kebab-case

IncomeExpenseChart → .income-expense-chart
StatCard → .stat-card
UserManagementTable → .user-management-table
```

### Element (Parte del componente)

```
Usar doble guión bajo: __

.income-expense-chart__header
.stat-card__title
.user-management-table__row
```

### Modifier (Variante)

```
Usar doble guión: --

.stat-card--success
.button--large
.income-expense-chart--loading
```

---

## 🚀 Quick Start

### 1. Familiarízate con el sistema de diseño

```scss
// Importar en tu componente SCSS
@use '../../../styles/variables' as *;
@use '../../../styles/mixins' as *;
```

### 2. Usa variables en lugar de valores hardcoded

```scss
// ❌ Mal
padding: 24px;
color: #0f172a;

// ✅ Bien
padding: $spacing-lg;
color: $foreground;
```

### 3. Usa mixins para patrones comunes

```scss
// ❌ Evitar repetir código
display: flex;
align-items: center;
justify-content: space-between;

// ✅ Usar mixin
@include flex-between;
```

### 4. Sigue BEM estrictamente

```scss
// ✅ Estructura correcta
.component {
  // Estilos base

  &__element {
    // Estilos del elemento
  }

  &--modifier {
    // Estilos del modificador
  }
}
```

---

## ⚠️ Puntos Importantes

### Durante la Migración:

1. **NO remover Tailwind** hasta que TODOS los componentes estén migrados
2. **Mantener imports compatibles** usando archivos index.ts
3. **Probar cada componente** después de migrarlo
4. **Actualizar** PLAN_MIGRACION_SASS.md con checkmarks

### Al Finalizar:

1. Remover dependencias de Tailwind
2. Eliminar archivos de configuración de Tailwind
3. Limpiar imports obsoletos (cn, cva)
4. Verificar build de producción
5. Eliminar archivos antiguos

---

## 📊 Estado Actual

**Progreso:** ~4% (3/80 componentes)

### ✅ Completado:

- Sistema de diseño SASS (100%)
- Herramientas y scripts (100%)
- Documentación (100%)
- StatCard, Button, Card (migrados)

### 🔄 En Progreso:

- Componentes UI restantes
- Componentes de Layout
- Componentes de Dashboard
- Componentes de dominio

---

## 🆘 ¿Necesitas Ayuda?

### Para dudas sobre:

- **Colores y variables:** Ver `src/styles/_variables.scss`
- **Mixins disponibles:** Ver `src/styles/_mixins.scss`
- **Ejemplos de código:** Ver `EJEMPLOS_MIGRACION.md`
- **Convenciones BEM:** Ver `GUIA_MIGRACION_SASS_BEM.md` sección "Naming Conventions BEM"
- **Qué migrar siguiente:** Ver `PLAN_MIGRACION_SASS.md`

---

## 📝 Mantén la Documentación Actualizada

Cuando completes un componente:

1. Marca con [x] en `PLAN_MIGRACION_SASS.md`
2. Actualiza las métricas en `RESUMEN_MIGRACION_SASS.md`
3. Documenta patrones nuevos si son útiles

---

**Última actualización:** 2026-01-17
**Creado por:** Migración automatizada
