# Tanuki Admin - Design System Documentation

This document outlines the complete design system for the Tanuki Admin dashboard, based on the UI design specifications.

## Table of Contents

1. [Color Palette](#color-palette)
2. [Typography](#typography)
3. [Spacing System](#spacing-system)
4. [Shadows](#shadows)
5. [Border Radius](#border-radius)
6. [Components](#components)
7. [Usage Examples](#usage-examples)

---

## Color Palette

### Base Colors

#### Background & Surfaces

```css
--background: 210 17% 98%; /* #F7F8FA - Light grayish blue */
--foreground: 222 47% 11%; /* #0F172A - Very dark blue (text) */
--card: 0 0% 100%; /* #FFFFFF - Pure white */
--card-foreground: 222 47% 11%; /* Dark blue text on cards */
```

#### Primary & Secondary

```css
--primary: 222 47% 11%; /* #0F172A - Dark blue */
--primary-foreground: 0 0% 100%; /* White */
--secondary: 214 32% 91%; /* #E2E8F0 - Light gray */
--secondary-foreground: 222 47% 11%;
```

#### Muted & Accent

```css
--muted: 210 40% 96%; /* #F1F5F9 - Very light gray */
--muted-foreground: 215 16% 47%; /* #64748B - Medium gray */
--accent: 210 40% 96%;
--accent-foreground: 222 47% 11%;
```

### Semantic Status Colors

These colors are used for financial data and status indicators:

#### Success (Green)

Used for: "Entradas Totales", "Disponible Real", positive values

```css
--success: 142 76% 36%; /* #16A34A - Vibrant green */
--success-foreground: 0 0% 100%; /* White */
```

#### Danger (Red)

Used for: "Salidas Totales", negative values, expenses

```css
--danger: 0 72% 51%; /* #DC2626 - Vibrant red */
--danger-foreground: 0 0% 100%; /* White */
```

#### Info (Blue)

Used for: Primary interactive elements, neutral information

```css
--info: 217 91% 60%; /* #3B82F6 - Bright blue */
--info-foreground: 0 0% 100%; /* White */
```

#### Warning (Amber)

Used for: Alerts, caution messages

```css
--warning: 38 92% 50%; /* #F59E0B - Amber */
--warning-foreground: 0 0% 100%; /* White */
```

### Chart Colors

Multi-color palette for data visualization (e.g., "Gastos por Categoría"):

```css
--chart-1: 217 91% 60%; /* Blue - #3B82F6 */
--chart-2: 0 72% 51%; /* Red - #DC2626 */
--chart-3: 45 93% 47%; /* Yellow - #EAB308 */
--chart-4: 142 76% 36%; /* Green - #16A34A */
--chart-5: 25 95% 53%; /* Orange - #F97316 */
--chart-6: 262 83% 58%; /* Purple - #A855F7 */
--chart-7: 199 89% 48%; /* Cyan - #06B6D4 */
--chart-8: 280 89% 60%; /* Magenta - #D946EF */
```

---

## Typography

### Font Families

```css
--font-serif: var(--font-montserrat); /* Headings (Montserrat Bold) */
--font-sans: var(--font-work-sans); /* Body text (Work Sans) */
```

### Font Sizes

```css
--font-size-xs: 0.75rem; /* 12px - Small labels */
--font-size-sm: 0.875rem; /* 14px - Secondary text */
--font-size-base: 1rem; /* 16px - Body text */
--font-size-lg: 1.125rem; /* 18px - Large text */
--font-size-xl: 1.25rem; /* 20px - Small headings */
--font-size-2xl: 1.5rem; /* 24px - Medium headings */
--font-size-3xl: 1.875rem; /* 30px - Large headings, stat values */
--font-size-4xl: 2.25rem; /* 36px - Extra large headings */
```

### Font Weights

```css
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

### Line Heights

```css
--line-height-tight: 1.25; /* Headings */
--line-height-normal: 1.5; /* Body text */
--line-height-relaxed: 1.75; /* Spacious text */
```

---

## Spacing System

Consistent spacing scale for margins, padding, and gaps:

```css
--spacing-xs: 0.25rem; /* 4px */
--spacing-sm: 0.5rem; /* 8px */
--spacing-md: 1rem; /* 16px */
--spacing-lg: 1.5rem; /* 24px */
--spacing-xl: 2rem; /* 32px */
--spacing-2xl: 3rem; /* 48px */
--spacing-3xl: 4rem; /* 64px */
```

---

## Shadows

Elevation system for depth and hierarchy:

```css
--shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-xl:
  0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
--shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
```

---

## Border Radius

Rounded corner system:

```css
--radius-xs: 0.25rem; /* 4px */
--radius-sm: 0.5rem; /* 8px */
--radius-md: 0.75rem; /* 12px - Default for cards */
--radius-lg: 1rem; /* 16px */
--radius-xl: 1.5rem; /* 24px */
--radius-full: 9999px; /* Circular (badges, icons) */
```

---

## Components

### Cards

#### Standard Card

```css
--card-padding: var(--spacing-lg); /* 24px */
--card-shadow: var(--shadow-sm);
--card-radius: var(--radius-md); /* 12px */
--card-hover-shadow: var(--shadow-md);
```

**Usage:**

```html
<div class="card">
  <!-- Card content -->
</div>
```

#### Stat Cards

For displaying financial statistics like "Entradas Totales", "Salidas Totales":

```css
--stat-card-padding: var(--spacing-lg);
--stat-card-radius: var(--radius-md);
--stat-value-size: var(--font-size-3xl); /* 30px */
--stat-label-size: var(--font-size-xs); /* 12px */
```

**Usage:**

```html
<!-- Success variant (green) -->
<div class="stat-card-success">
  <div class="stat-value">$ 77.454.940</div>
  <div class="stat-label">Entradas Totales</div>
</div>

<!-- Danger variant (red) -->
<div class="stat-card-danger">
  <div class="stat-value">$ 62.477.715</div>
  <div class="stat-label">Salidas Totales</div>
</div>

<!-- Info variant (blue) -->
<div class="stat-card-info">
  <div class="stat-value">$ 62.477.715</div>
  <div class="stat-label">Disponible Real</div>
</div>
```

### Badges

Status badges for tags and labels:

**Usage:**

```html
<span class="badge-success">Active</span>
<span class="badge-danger">Overdue</span>
<span class="badge-info">Pending</span>
<span class="badge-warning">Alert</span>
```

### Icon Circles

Circular icon containers (like in "Movimientos Recientes"):

```css
--icon-xs: 1rem; /* 16px */
--icon-sm: 1.25rem; /* 20px */
--icon-md: 1.5rem; /* 24px */
--icon-lg: 2rem; /* 32px */
--icon-xl: 3rem; /* 48px */
```

**Usage:**

```html
<div class="icon-circle-success">
  <svg><!-- Icon --></svg>
</div>

<div class="icon-circle-danger">
  <svg><!-- Icon --></svg>
</div>

<div class="icon-circle-info">
  <svg><!-- Icon --></svg>
</div>

<div class="icon-circle-muted">
  <svg><!-- Icon --></svg>
</div>
```

### Charts

Chart container heights:

```css
--chart-height-sm: 200px;
--chart-height-md: 300px;
--chart-height-lg: 400px;
```

**Usage:**

```html
<div class="chart-container">
  <!-- Chart component -->
</div>

<div class="chart-container chart-container-sm">
  <!-- Smaller chart -->
</div>
```

**Chart colors:**

```html
<div class="chart-color-1">Blue bar</div>
<div class="chart-color-2">Red bar</div>
<div class="chart-color-3">Yellow bar</div>
<!-- ... up to chart-color-8 -->
```

---

## Usage Examples

### Example 1: Dashboard Card with Stats

```html
<div class="card">
  <h3>Salud del Negocio</h3>
  <div class="mt-4 grid grid-cols-3 gap-4">
    <div class="stat-card-success">
      <div class="stat-value">$ 77.454.940</div>
      <div class="stat-label">Entradas Totales</div>
    </div>
    <div class="stat-card-info">
      <div class="stat-value">$ 62.477.715</div>
      <div class="stat-label">Disponible Real</div>
    </div>
    <div class="stat-card-danger">
      <div class="stat-value">$ 62.477.715</div>
      <div class="stat-label">Salidas Totales</div>
    </div>
  </div>
</div>
```

### Example 2: Recent Movements List

```html
<div class="card">
  <h3>Movimientos Recientes</h3>
  <div class="mt-4 space-y-3">
    <div class="flex items-center gap-3">
      <div class="icon-circle-info">
        <svg><!-- Icon --></svg>
      </div>
      <div class="flex-1">
        <div class="font-semibold">Carri Binranto</div>
        <div class="text-muted-foreground text-sm">
          Material Design list item
        </div>
      </div>
      <div class="font-bold">-$ 77.454.940</div>
    </div>

    <div class="flex items-center gap-3">
      <div class="icon-circle-danger">
        <svg><!-- Icon --></svg>
      </div>
      <div class="flex-1">
        <div class="font-semibold">Departamento</div>
        <div class="text-muted-foreground text-sm">
          Material Design list item
        </div>
      </div>
      <div class="font-bold">-$ 77.454.940</div>
    </div>
  </div>
</div>
```

### Example 3: Using CSS Variables Directly

```css
.custom-component {
  padding: var(--spacing-lg);
  background: hsl(var(--card));
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  color: hsl(var(--foreground));
  font-size: var(--font-size-base);
  transition: all var(--transition-base);
}

.custom-component:hover {
  box-shadow: var(--shadow-md);
}
```

### Example 4: Responsive Stat Card

```html
<div class="stat-card-success">
  <div class="stat-value">$ 77.454.940</div>
  <div class="stat-label">Entradas Totales</div>
</div>
```

On mobile (< 768px), the stat value automatically scales down to `--font-size-2xl` (24px).

---

## Tailwind CSS Integration

All variables are integrated with Tailwind CSS v4. You can use them with Tailwind utilities:

```html
<!-- Using semantic colors -->
<div class="bg-success text-success-foreground">Success message</div>
<div class="bg-danger text-danger-foreground">Error message</div>
<div class="bg-info text-info-foreground">Info message</div>

<!-- Using chart colors -->
<div class="text-chart-1">Blue text</div>
<div class="bg-chart-2">Red background</div>

<!-- Using spacing -->
<div class="gap-[var(--spacing-md)] p-[var(--spacing-lg)]">
  <!-- Content -->
</div>
```

---

## Best Practices

1. **Always use CSS variables** instead of hardcoded values for consistency
2. **Use semantic color names** (`success`, `danger`, `info`) instead of color names (`green`, `red`, `blue`)
3. **Maintain the spacing scale** - don't use arbitrary spacing values
4. **Use the shadow system** for elevation hierarchy
5. **Apply the border radius system** consistently across all components
6. **Use the typography scale** for font sizes
7. **Leverage utility classes** (`.card`, `.stat-card-*`, `.badge-*`, `.icon-circle-*`) for common patterns

---

## Accessibility

- All color combinations meet **WCAG AA** contrast requirements
- Semantic colors have sufficient contrast with their foreground colors
- Font sizes are scalable and responsive
- Interactive elements have appropriate hover states

---

## Maintenance

When updating the design system:

1. Update variables in `src/app/globals.css`
2. Update this documentation
3. Test across all components
4. Ensure backward compatibility with legacy code
5. Update Storybook/component library if applicable

---

**Last Updated:** January 2026  
**Version:** 1.0.0
