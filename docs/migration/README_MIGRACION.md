# 🔄 Migración de Tailwind CSS a SASS + BEM

## 🎯 Objetivo

Este proyecto está en proceso de migración de **Tailwind CSS** a **SASS** con:

- ✅ Variables globales para el sistema de diseño
- ✅ Notación BEM para naming de clases CSS
- ✅ Estructura de carpetas organizada: cada componente en su propia carpeta con su hoja de estilos

## 📚 Documentación

Toda la documentación de migración está disponible en los siguientes archivos:

### 🎯 Inicio Rápido

👉 **[INDICE_DOCS_MIGRACION.md](./INDICE_DOCS_MIGRACION.md)** - Índice centralizado de toda la documentación

### 📄 Documentos Principales

- **[RESUMEN_MIGRACION_SASS.md](./RESUMEN_MIGRACION_SASS.md)** - Vista ejecutiva y progreso
- **[GUIA_MIGRACION_SASS_BEM.md](./GUIA_MIGRACION_SASS_BEM.md)** - Guía completa paso a paso
- **[EJEMPLOS_MIGRACION.md](./EJEMPLOS_MIGRACION.md)** - Ejemplos prácticos con código
- **[PLAN_MIGRACION_SASS.md](./PLAN_MIGRACION_SASS.md)** - Plan detallado y tracking

## 📊 Estado Actual

```
Progreso: ~4% (3/80 componentes)

✅ Sistema de Diseño: 100%
✅ Herramientas: 100%
✅ Documentación: 100%
🔄 Componentes: 4%
```

### Componentes Migrados ✅

- StatCard
- Button
- Card

### En Progreso 🔄

- Componentes UI restantes
- Componentes de Layout
- Componentes de Dashboard

## 🛠️ Scripts Disponibles

### Migración Automatizada

```bash
# Crear estructuras para todos los componentes
node scripts/dev/migrate-to-sass.js all

# Crear estructuras por categoría
node scripts/dev/migrate-to-sass.js ui
node scripts/dev/migrate-to-sass.js dashboard
node scripts/dev/migrate-to-sass.js layout

# Listar componentes pendientes
node scripts/dev/migrate-to-sass.js list
```

## 🎨 Sistema de Diseño SASS

### Variables Globales

```scss
// src/styles/_variables.scss
$primary: hsl(222, 47%, 11%);
$spacing-lg: 1.5rem;
$font-size-xl: 1.25rem;
// ... y muchas más
```

### Mixins Reutilizables

```scss
// src/styles/_mixins.scss
@include flex-between; // display: flex + align/justify
@include card-base; // Estilos base de tarjetas
@include respond-to('md'); // Media queries
```

### Uso en Componentes

```scss
@use '../../../styles/variables' as *;
@use '../../../styles/mixins' as *;

.my-component {
  padding: $spacing-lg;
  color: $foreground;
  @include flex-between;
}
```

## 📁 Estructura de Componentes

### Antes (Tailwind)

```
components/
└── ui/
    └── button.tsx
```

### Después (SASS + BEM)

```
components/
└── ui/
    └── Button/
        ├── Button.tsx
        ├── Button.scss
        └── index.ts
```

## 🔤 Notación BEM

```scss
.component {
  // Block
  &__element {
    // Element
    &--modifier {
    } // Modifier
  }
}
```

**Ejemplo:**

```scss
.stat-card {
  &__title {
  }
  &__value {
  }
  &--success {
  } // Variante success
  &--danger {
  } // Variante danger
}
```

## ⚡ Quick Start para Migrar un Componente

1. **Crear estructura** (opcional, ya creadas con script):

```bash
node scripts/dev/migrate-to-sass.js [categoria]
```

2. **Migrar JSX/TSX:**

```typescript
// Antes
<div className="flex items-center justify-between">

// Después
<div className="component__header">
```

3. **Crear estilos SASS:**

```scss
.component {
  &__header {
    @include flex-between;
  }
}
```

4. **Exportar:**

```typescript
// index.ts
export { Component } from './Component';
```

5. **Marcar como completado** en PLAN_MIGRACION_SASS.md

## ⚠️ Notas Importantes

- **Tailwind y SASS coexisten** durante la migración
- **NO remover Tailwind** hasta completar todos los componentes
- **Imports no cambian** gracias a los archivos index.ts
- **Funcionalidad idéntica** - solo cambian los estilos

## 🚀 Próximos Pasos

1. Migrar componentes UI básicos (Input, Label, Badge, Table, etc.)
2. Migrar componentes de Layout (Sidebar, Header, NavLinks)
3. Migrar componentes de Dashboard
4. Migrar componentes de dominio por módulo
5. Limpieza final y remoción de Tailwind

## 📖 Más Información

Para información detallada, consulta:
👉 **[INDICE_DOCS_MIGRACION.md](./INDICE_DOCS_MIGRACION.md)**

---

**Última actualización:** 2026-01-17
