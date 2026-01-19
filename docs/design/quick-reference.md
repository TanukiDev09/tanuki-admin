# Design System Quick Reference

## 🎨 Colors

### Semantic Status

```css
hsl(var(--success))    /* Green: #16A34A */
hsl(var(--danger))     /* Red: #DC2626 */
hsl(var(--info))       /* Blue: #3B82F6 */
hsl(var(--warning))    /* Amber: #F59E0B */
```

### Chart Palette

```css
hsl(var(--chart-1))    /* Blue */
hsl(var(--chart-2))    /* Red */
hsl(var(--chart-3))    /* Yellow */
hsl(var(--chart-4))    /* Green */
hsl(var(--chart-5))    /* Orange */
hsl(var(--chart-6))    /* Purple */
hsl(var(--chart-7))    /* Cyan */
hsl(var(--chart-8))    /* Magenta */
```

## 📏 Spacing

```css
var(--spacing-xs)      /* 4px */
var(--spacing-sm)      /* 8px */
var(--spacing-md)      /* 16px */
var(--spacing-lg)      /* 24px */
var(--spacing-xl)      /* 32px */
var(--spacing-2xl)     /* 48px */
var(--spacing-3xl)     /* 64px */
```

## 🔤 Typography

```css
var(--font-size-xs)    /* 12px */
var(--font-size-sm)    /* 14px */
var(--font-size-base)  /* 16px */
var(--font-size-lg)    /* 18px */
var(--font-size-xl)    /* 20px */
var(--font-size-2xl)   /* 24px */
var(--font-size-3xl)   /* 30px */
var(--font-size-4xl)   /* 36px */
```

## 🌑 Shadows

```css
var(--shadow-xs)       /* Minimal */
var(--shadow-sm)       /* Small (cards) */
var(--shadow-md)       /* Medium (hover) */
var(--shadow-lg)       /* Large */
var(--shadow-xl)       /* Extra large */
var(--shadow-2xl)      /* Maximum */
```

## 📐 Border Radius

```css
var(--radius-xs)       /* 4px */
var(--radius-sm)       /* 8px */
var(--radius-md)       /* 12px (default) */
var(--radius-lg)       /* 16px */
var(--radius-xl)       /* 24px */
var(--radius-full)     /* Circular */
```

## 🧩 Utility Classes

### Cards

```html
<div class="card">Standard card</div>
<div class="stat-card-success">Green stat card</div>
<div class="stat-card-danger">Red stat card</div>
<div class="stat-card-info">Blue stat card</div>
```

### Badges

```html
<span class="badge-success">Success</span>
<span class="badge-danger">Danger</span>
<span class="badge-info">Info</span>
<span class="badge-warning">Warning</span>
```

### Icon Circles

```html
<div class="icon-circle-success">✓</div>
<div class="icon-circle-danger">✗</div>
<div class="icon-circle-info">i</div>
<div class="icon-circle-muted">?</div>
```

### Charts

```html
<div class="chart-container">Default height (300px)</div>
<div class="chart-container chart-container-sm">Small (200px)</div>
<div class="chart-container chart-container-lg">Large (400px)</div>
```

## ⚡ Quick Examples

### Stat Card

```html
<div class="stat-card-success">
  <div class="stat-value">$ 77.454.940</div>
  <div class="stat-label">Entradas Totales</div>
</div>
```

### Movement Item

```html
<div class="flex items-center gap-3">
  <div class="icon-circle-info">$</div>
  <div class="flex-1">
    <div class="font-semibold">Transaction Name</div>
    <div class="text-sm text-muted-foreground">Description</div>
  </div>
  <div class="font-bold">-$ 1.234.567</div>
</div>
```

### Custom Component

```css
.my-component {
  padding: var(--spacing-lg);
  background: hsl(var(--card));
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-base);
}
```

## Integración con Tailwind

```html
<!-- Colors -->
<div class="bg-success text-success-foreground">Success</div>
<div class="bg-danger text-danger-foreground">Danger</div>

<!-- Spacing -->
<div class="p-[var(--spacing-lg)]">Content</div>

<!-- Chart colors -->
<div class="text-chart-1">Blue text</div>
```
