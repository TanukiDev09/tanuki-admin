# 🔄 Guía para Evitar Loops de Importación en SASS

## ⚠️ Problema: Loops de Importación Circulares

En SASS, con `@use` y `@forward`, es posible crear **dependencias circulares** que causan errores de compilación:

```
Error: Module loop: this module is already being loaded.
```

## 🚫 Ejemplo de Loop (INCORRECTO)

```scss
// _variables.scss
@use 'mixins' as *;

$primary: hsl(222, 47%, 11%);

// _mixins.scss
@use 'variables' as *;

@mixin button {
  background: $primary; // ❌ Loop: mixins → variables → mixins
}
```

## ✅ Solución: Jerarquía Clara de Importación

### Regla de Oro

**NUNCA crear dependencias circulares. Mantener una jerarquía unidireccional.**

### Jerarquía Correcta en este Proyecto

```
1. _variables.scss      (No importa nada)
        ↓
2. _mixins.scss         (Solo importa _variables.scss)
        ↓
3. globals.scss         (Importa _variables.scss y _mixins.scss)
        ↓
4. Componentes          (Importan _variables.scss y _mixins.scss)
```

## 📋 Reglas Específicas del Proyecto

### 1. `_variables.scss`

```scss
// ✅ CORRECTO: No importa nada
// Solo define variables

$primary: hsl(222, 47%, 11%);
$spacing-lg: 1.5rem;
```

### 2. `_mixins.scss`

```scss
// ✅ CORRECTO: Solo importa variables
@use './variables' as *;

// ❌ NUNCA importar:
// - globals
// - archivos de componentes
// - otros archivos que puedan importar mixins

@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}
```

### 3. `globals.scss`

```scss
// ✅ CORRECTO: Importa variables y mixins
@use './variables' as *;
@use './mixins' as *;

// ❌ NUNCA importar:
// - archivos de componentes individuales
// - solo estilos verdaderamente globales aquí
```

### 4. Componentes

```scss
// ✅ CORRECTO: Cada componente importa lo que necesita
// Archivo: components/ui/Button/Button.scss

@use '../../../styles/variables' as *;
@use '../../../styles/mixins' as *;

.button {
  padding: $spacing-md;
  @include flex-center;
}

// ❌ NUNCA importar:
// - globals.scss (ya se importa en layout.tsx)
// - otros componentes
```

## 🎯 Patrones Correctos

### Patrón 1: Componente Simple

```scss
// components/ui/Input/Input.scss
@use '../../../styles/variables' as *;
@use '../../../styles/mixins' as *;

.input {
  padding: $spacing-md;
  border: 1px solid $border;

  @include respond-to('md') {
    padding: $spacing-lg;
  }
}
```

### Patrón 2: Componente que Necesita Variables de Otro

```scss
// ❌ INCORRECTO - No importar otros componentes
@use '../Button/Button.scss';

// ✅ CORRECTO - Duplicar estilos necesarios o usar variables comunes
.my-component {
  // Si necesitas estilos similares a Button, usa las mismas variables
  padding: $spacing-md;
  background: $primary;

  // O crea una clase CSS común en globals si realmente es compartido
}
```

### Patrón 3: Estilos Compartidos

Si varios componentes necesitan los mismos estilos:

**Opción A: Usar variables y mixins**

```scss
// En _mixins.scss
@mixin card-style {
  background: $card;
  border-radius: $radius-md;
  box-shadow: $shadow-sm;
}

// En componentes
.component-a {
  @include card-style;
}

.component-b {
  @include card-style;
}
```

**Opción B: Clase global en globals.scss**

```scss
// En globals.scss
.card-base {
  background: $card;
  border-radius: $radius-md;
  box-shadow: $shadow-sm;
}

// En componentes JSX
<div className="card-base component-specific">
```

## 🔍 Detectar Loops de Importación

### Síntomas

1. Error de compilación: "Module loop"
2. Variables undefined
3. El proyecto no compila

### Debugging

```bash
# Si ves un error de loop, pregúntate:
1. ¿Qué archivo estoy editando?
2. ¿Qué archivos importa con @use?
3. ¿Alguno de esos archivos importa de vuelta mi archivo?
4. ¿Hay una cadena de imports que vuelve al inicio?
```

### Solución

1. Identificar la cadena circular
2. Romper la cadena eliminando una de las importaciones
3. Restructurar el código para seguir la jerarquía correcta

## 📦 Estructura de Archivos Segura

```
src/styles/
├── _variables.scss      # Nivel 0: No importa nada
├── _mixins.scss         # Nivel 1: Solo importa variables
└── globals.scss         # Nivel 2: Importa variables y mixins

src/components/
└── [module]/
    └── [Component]/
        ├── Component.tsx
        ├── Component.scss  # Nivel 3: Importa variables y mixins
        └── index.ts
```

## ✅ Checklist para Cada Archivo SCSS

Antes de crear o editar un archivo SCSS:

- [ ] ¿Este archivo realmente necesita importar otros archivos?
- [ ] ¿Estoy importando solo `_variables.scss` y `_mixins.scss`?
- [ ] ¿Estoy seguro de que ninguno de mis imports importa de vuelta este archivo?
- [ ] ¿Podría usar variables/mixins existentes en lugar de importar componentes?
- [ ] ¿Los estilos compartidos deberían ir en `_mixins.scss` o `globals.scss`?

## 🚀 Mejores Prácticas

### DO ✅

- Importar `_variables.scss` y `_mixins.scss` en componentes
- Mantener la jerarquía unidireccional
- Usar variables para valores compartidos
- Usar mixins para patrones compartidos
- Documentar dependencias complejas

### DON'T ❌

- Importar `globals.scss` en componentes (se importa globalmente en layout)
- Importar archivos de componentes en `_variables.scss` o `_mixins.scss`
- Crear dependencias circulares
- Uso de `@import` (deprecado, usar `@use`)
- Importar componentes entre sí

## 📚 Recursos

- [SASS @use Documentation](https://sass-lang.com/documentation/at-rules/use)
- [SASS @forward Documentation](https://sass-lang.com/documentation/at-rules/forward)
- [Migration from @import to @use](https://sass-lang.com/documentation/at-rules/import)

---

**Recuerda:** La jerarquía clara es la clave para evitar loops. Cuando tengas dudas, vuelve a este documento.
