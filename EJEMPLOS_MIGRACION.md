# 🔧 Ejemplos Prácticos de Migración de Componentes

Este documento contiene ejemplos concretos de cómo migrar componentes específicos de Tailwind a SASS + BEM.

## Ejemplo 1: Input Component

### Componente Original (Tailwind)
```typescript
// src/components/ui/input.tsx
import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
```

### Componente Migrado (SASS + BEM)

**src/components/ui/Input/Input.tsx:**
```typescript
import * as React from "react";
import './Input.scss';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={`input ${className || ''}`}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
```

**src/components/ui/Input/Input.scss:**
```scss
@use '../../../styles/variables' as *;
@use '../../../styles/mixins' as *;

.input {
  display: flex;
  height: 40px;
  width: 100%;
  border-radius: $radius-md;
  border: 1px solid $input;
  background: $background;
  padding: $spacing-sm 12px;
  font-size: $font-size-sm;
  font-family: $font-sans;
  color: $foreground;
  @include transition(border-color, box-shadow);

  &::placeholder {
    color: $muted-foreground;
  }

  &:focus-visible {
    outline: none;
    @include focus-ring;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  // File input specific styles
  &[type="file"] {
    &::file-selector-button {
      border: 0;
      background: transparent;
      font-size: $font-size-sm;
      font-weight: $font-weight-medium;
    }
  }
}
```

**src/components/ui/Input/index.ts:**
```typescript
export { Input, type InputProps } from './Input';
```

---

## Ejemplo 2: Badge Component

### Componente Original (Tailwind)
```typescript
// src/components/ui/badge.tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
```

### Componente Migrado (SASS + BEM)

**src/components/ui/Badge/Badge.tsx:**
```typescript
import * as React from "react";
import './Badge.scss';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'info' | 'warning';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div 
      className={`badge badge--${variant} ${className || ''}`}
      {...props}
    />
  );
}

export { Badge };
```

**src/components/ui/Badge/Badge.scss:**
```scss
@use '../../../styles/variables' as *;
@use '../../../styles/mixins' as *;

.badge {
  display: inline-flex;
  align-items: center;
  border-radius: $radius-full;
  border: 1px solid transparent;
  padding: 2px 10px;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  font-family: $font-sans;
  @include transition(background-color, color);

  &:focus {
    outline: none;
    @include focus-ring;
  }

  // --- VARIANTES ---

  &--default {
    border-color: transparent;
    background: $primary;
    color: $primary-foreground;

    &:hover {
      background: rgba($primary, 0.8);
    }
  }

  &--secondary {
    border-color: transparent;
    background: $secondary;
    color: $secondary-foreground;

    &:hover {
      background: rgba($secondary, 0.8);
    }
  }

  &--destructive {
    border-color: transparent;
    background: $destructive;
    color: $destructive-foreground;

    &:hover {
      background: rgba($destructive, 0.8);
    }
  }

  &--success {
    border-color: transparent;
    background: $success;
    color: $success-foreground;

    &:hover {
      background: rgba($success, 0.8);
    }
  }

  &--info {
    border-color: transparent;
    background: $info;
    color: $info-foreground;

    &:hover {
      background: rgba($info, 0.8);
    }
  }

  &--warning {
    border-color: transparent;
    background: $warning;
    color: $warning-foreground;

    &:hover {
      background: rgba($warning, 0.8);
    }
  }

  &--outline {
    color: $foreground;
    border-color: $border;
    background: transparent;

    &:hover {
      background: $accent;
    }
  }
}
```

**src/components/ui/Badge/index.ts:**
```typescript
export { Badge, type BadgeProps } from './Badge';
```

---

## Ejemplo 3: Componente Complejo - Table

### Componente Original (Tailwind)
```typescript
// src/components/ui/table.tsx
import * as React from "react"
import { cn } from "@/lib/utils"

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  )
)
Table.displayName = "Table"

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
  )
)
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
  )
)
TableBody.displayName = "TableBody"

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr ref={ref} className={cn("border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted", className)} {...props} />
  )
)
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn("h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0", className)}
      {...props}
    />
  )
)
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td ref={ref} className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)} {...props} />
  )
)
TableCell.displayName = "TableCell"

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell }
```

### Componente Migrado (SASS + BEM)

**src/components/ui/Table/Table.tsx:**
```typescript
import * as React from "react";
import './Table.scss';

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="table-wrapper">
      <table ref={ref} className={`table ${className || ''}`} {...props} />
    </div>
  )
);
Table.displayName = "Table";

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={`table__header ${className || ''}`} {...props} />
  )
);
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={`table__body ${className || ''}`} {...props} />
  )
);
TableBody.displayName = "TableBody";

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr ref={ref} className={`table__row ${className || ''}`} {...props} />
  )
);
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th ref={ref} className={`table__head ${className || ''}`} {...props} />
  )
);
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td ref={ref} className={`table__cell ${className || ''}`} {...props} />
  )
);
TableCell.displayName = "TableCell";

const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tfoot ref={ref} className={`table__footer ${className || ''}`} {...props} />
  )
);
TableFooter.displayName = "TableFooter";

const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
  ({ className, ...props }, ref) => (
    <caption ref={ref} className={`table__caption ${className || ''}`} {...props} />
  )
);
TableCaption.displayName = "TableCaption";

export { 
  Table, 
  TableHeader, 
  TableBody, 
  TableFooter,
  TableRow, 
  TableHead, 
  TableCell,
  TableCaption
};
```

**src/components/ui/Table/Table.scss:**
```scss
@use '../../../styles/variables' as *;
@use '../../../styles/mixins' as *;

.table-wrapper {
  position: relative;
  width: 100%;
  overflow: auto;
}

.table {
  width: 100%;
  caption-side: bottom;
  font-size: $font-size-sm;
  border-collapse: collapse;

  // --- ELEMENTOS ---

  &__header {
    tr {
      border-bottom: 1px solid $border;
    }
  }

  &__body {
    tr:last-child {
      border-bottom: 0;
    }
  }

  &__footer {
    border-top: 1px solid $border;
    font-weight: $font-weight-medium;
  }

  &__row {
    border-bottom: 1px solid $border;
    @include transition(background-color, color);

    &:hover {
      background: rgba($muted, 0.5);
    }

    &[data-state="selected"] {
      background: $muted;
    }
  }

  &__head {
    height: 48px;
    padding: $spacing-md;
    text-align: left;
    vertical-align: middle;
    font-weight: $font-weight-medium;
    color: $muted-foreground;

    &:has([role="checkbox"]) {
      padding-right: 0;
    }
  }

  &__cell {
    padding: $spacing-md;
    vertical-align: middle;

    &:has([role="checkbox"]) {
      padding-right: 0;
    }
  }

  &__caption {
    margin-top: $spacing-md;
    font-size: $font-size-sm;
    color: $muted-foreground;
  }
}
```

**src/components/ui/Table/index.ts:**
```typescript
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from './Table';
```

---

## Ejemplo 4: Componente con Estado - Dialog

### Componente Original (Tailwind)
```typescript
// src/components/ui/dialog.tsx
import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

export { Dialog, DialogPortal, DialogOverlay, DialogTrigger, DialogClose, DialogContent }
```

### Componente Migrado (SASS + BEM)

**src/components/ui/Dialog/Dialog.tsx:**
```typescript
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import './Dialog.scss';

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={`dialog__overlay ${className || ''}`}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={`dialog__content ${className || ''}`}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="dialog__close">
        <X className="dialog__close-icon" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`dialog__header ${className || ''}`} {...props} />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`dialog__footer ${className || ''}`} {...props} />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={`dialog__title ${className || ''}`}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={`dialog__description ${className || ''}`}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
```

**src/components/ui/Dialog/Dialog.scss:**
```scss
@use '../../../styles/variables' as *;
@use '../../../styles/mixins' as *;

.dialog {
  &__overlay {
    position: fixed;
    inset: 0;
    z-index: 50;
    background: rgba(0, 0, 0, 0.8);
    
    &[data-state="open"] {
      animation: fadeIn $transition-base ease-out;
    }
    
    &[data-state="closed"] {
      animation: fadeOut $transition-base ease-in;
    }
  }

  &__content {
    position: fixed;
    left: 50%;
    top: 50%;
    z-index: 50;
    display: grid;
    width: 100%;
    max-width: 512px;
    transform: translate(-50%, -50%);
    gap: $spacing-md;
    border: 1px solid $border;
    background: $background;
    padding: $spacing-lg;
    box-shadow: $shadow-lg;
    
    @include respond-to('sm') {
      border-radius: $radius-lg;
    }
    
    &[data-state="open"] {
      animation: dialogEnter $transition-base ease-out;
    }
    
    &[data-state="closed"] {
      animation: dialogExit $transition-base ease-in;
    }
  }

  &__close {
    position: absolute;
    right: $spacing-md;
    top: $spacing-md;
    @include button-reset;
    border-radius: $radius-sm;
    opacity: 0.7;
    @include transition(opacity, background-color);

    &:hover {
      opacity: 1;
    }

    &:focus {
      outline: none;
      @include focus-ring;
    }

    &:disabled {
      pointer-events: none;
    }

    &[data-state="open"] {
      background: $accent;
      color: $muted-foreground;
    }
  }

  &__close-icon {
    height: 16px;
    width: 16px;
  }

  &__header {
    @include flex-column;
    gap: 6px;
    text-align: center;

    @include respond-to('sm') {
      text-align: left;
    }
  }

  &__footer {
    @include flex-column;

    @include respond-to('sm') {
      @include flex-between;
      flex-direction: row;
    }
  }

  &__title {
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    line-height: $line-height-tight;
    letter-spacing: -0.025em;
  }

  &__description {
    font-size: $font-size-sm;
    color: $muted-foreground;
  }
}

// Animaciones
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

@keyframes dialogEnter {
  from {
    opacity: 0;
    transform: translate(-50%, -48%) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes dialogExit {
  from {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  to {
    opacity: 0;
    transform: translate(-50%, -48%) scale(0.95);
  }
}

// Screen reader only
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

**src/components/ui/Dialog/index.ts:**
```typescript
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from './Dialog';
```

---

## Checklist de Migración

Para cada componente, seguir estos pasos:

- [ ] 1. Leer el componente original y entender su funcionalidad
- [ ] 2. Identificar todas las clases de Tailwind usadas
- [ ] 3. Crear la estructura de carpeta con el script o manualmente
- [ ] 4. Crear el archivo .tsx con clases BEM
- [ ] 5. Crear el archivo .scss con los estilos equivalentes
- [ ] 6. Crear el archivo index.ts para exports
- [ ] 7. Probar el componente en aislamiento
- [ ] 8. Buscar y actualizar imports en otros archivos si es necesario
- [ ] 9. Verificar que no hay regresiones visuales
- [ ] 10. Marcar como completado en `PLAN_MIGRACION_SASS.md`

---

**Nota:** Estos ejemplos cubren los patrones más comunes. Adapta según necesites para componentes más específicos.
