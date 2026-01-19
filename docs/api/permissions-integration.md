# Guía de Integración Masiva de Permisos en APIs

## ✅ APIs Ya Protegidas

### Books (COMPLETO)
- ✅ `/api/books` - GET (READ), POST (CREATE)
- ✅ `/api/books/[id]` - GET (READ), PUT (UPDATE), DELETE (DELETE)

## 🔄 APIs Pendientes de Proteger

### Creators
- `/api/creators` - GET, POST
- `/api/creators/[id]` - GET, PUT, DELETE
- **Módulo**: `ModuleName.CREATORS`

### Warehouses
- `/api/warehouses` - GET, POST
- `/api/warehouses/[id]` - GET, PUT, DELETE
- **Módulo**: `ModuleName.WAREHOUSES`

### Inventory
- `/api/inventory/*` - Múltiples rutas
- **Módulo**: `ModuleName.INVENTORY`

### Points of Sale
- `/api/points-of-sale` - GET, POST
- `/api/points-of-sale/[id]` - GET, PUT, DELETE
- **Módulo**: `ModuleName.POINTS_OF_SALE`

### Finance/Movements
- `/api/finance/movements` - GET, POST
- `/api/finance/movements/[id]` - GET, PUT, DELETE
- `/api/finance/categories` - GET, POST
- **Módulo**: `ModuleName.FINANCE`

### Categories
- `/api/finance/categories/` - GET, POST
- **Módulo**: `ModuleName.CATEGORIES`

### Cost Centers
- `/api/costcenters` - GET, POST
- **Módulo**: `ModuleName.COST_CENTERS`

### Agreements
- `/api/agreements` - GET, POST
- `/api/agreements/[id]` - GET, PUT, DELETE
- **Módulo**: `ModuleName.AGREEMENTS`

### Collections
- `/api/collections` - GET, POST
- **Módulo**: `ModuleName.COLLECTIONS`

### Users (Admin Only)
- `/api/users` - GET, POST
- `/api/users/[id]` - GET, PUT, DELETE
- **Módulo**: `ModuleName.USERS`
- **Nota**: Solo administradores

## 📝 Patrón de Implementación

Para cada archivo `route.ts`:

```typescript
// 1. Añadir imports al inicio
import { requirePermission } from '@/lib/apiPermissions';
import { ModuleName, PermissionAction } from '@/types/permission';

// 2. En cada método HTTP, ANTES del try:
export async function GET(request) {
  const permissionError = await requirePermission(
    request,
    ModuleName.XXX,  // ← Cambiar según módulo
    PermissionAction.READ  // ← GET = READ
  );
  if (permissionError) return permissionError;
  
  try {
    // ... código existente
  }
}

export async function POST(request) {
  const permissionError = await requirePermission(
    request,
    ModuleName.XXX,
    PermissionAction.CREATE  // ← POST = CREATE
  );
  if (permissionError) return permissionError;
  
  try {
    // ... código existente
  }
}

export async function PUT(request, { params }) {
  const permissionError = await requirePermission(
    request,
    ModuleName.XXX,
    PermissionAction.UPDATE  // ← PUT = UPDATE
  );
  if (permissionError) return permissionError;
  
  try {
    // ... código existente
  }
}

export async function DELETE(request, { params }) {
  const permissionError = await requirePermission(
    request,
    ModuleName.XXX,
    PermissionAction.DELETE  // ← DELETE = DELETE
  );
  if (permissionError) return permissionError;
  
  try {
    // ... código existente
  }
}
```

## Map de Métodos HTTP → PermissionAction

| Método HTTP | PermissionAction |
|-------------|------------------|
| GET         | READ             |
| POST        | CREATE           |
| PUT/PATCH   | UPDATE           |
| DELETE      | DELETE           |

## ⚠️ Casos Especiales

### APIs de Admin Only
Para `/api/users`, `/api/permissions`, etc., el middleware ya verifica automáticamente si el usuario es admin y da acceso total (bypass).

### APIs Públicas
Si un endpoint NO debe requerir autenticación (ej: login), NO añadir requirePermission.

### APIs de Solo Lectura
Algunos endpoints pueden estar diseñados como públicos (ej: catálogo público de libros). Evaluar caso por caso.

## 🚀 Checklist de Verificación

Para cada ruta modificada, verificar:
- ✅ Imports añadidos correctamente
- ✅ `ModuleName` correcto para el módulo
- ✅ `PermissionAction` correcto para el método HTTP
- ✅ Check de permiso ANTES del try/catch
- ✅ Return early si no tiene permiso
- ✅ Código existente sin modificar

## 🧪 Testing
Después de aplicar permisos:
1. Ejecutar `npm run dev`
2. Testear con usuario admin (debe funcionar todo)
3. Testear con usuario sin permisos (debe recibir 403)
4. Testear con usuario no autenticado (debe recibir 401)
