# Scripts de Utilidad

Colección organizada de scripts para gestión de base de datos, desarrollo y testing.

## 📁 Estructura

```
scripts/
├── db/           # Scripts de base de datos
│   ├── migrations/   # Scripts de migración de datos
│   ├── seed/        # Scripts para poblar datos iniciales
│   └── inspect/     # Scripts para inspeccionar la base de datos
├── dev/          # Scripts de desarrollo
└── testing/      # Scripts de testing y verificación
```

## 🗄️ Scripts de Base de Datos

### Migraciones (`db/migrations/`)

Scripts para migrar y transformar datos existentes.

#### `migrate-categories-real.ts`
Migra categorías financieras a la nueva estructura.

```bash
npx tsx scripts/db/migrations/migrate-categories-real.ts
```

#### `migrate-creators.ts`
Migra datos de creadores (autores, ilustradores, etc.).

```bash
npx tsx scripts/db/migrations/migrate-creators.ts
```

#### `fix-schema-and-migrate.ts`
Corrige problemas de esquema y migra datos.

```bash
npx tsx scripts/db/migrations/fix-schema-and-migrate.ts
```

**⚠️ Advertencia**: Siempre haz backup antes de ejecutar migraciones.

---

### Población de Datos (`db/seed/`)

Scripts para poblar datos iniciales en la base de datos.

#### `seedPermissions.ts`
Crea los permisos iniciales del sistema.

```bash
npm run seed:permissions
# o directamente:
npx tsx scripts/db/seed/seedPermissions.ts
```

**Cuándo usar**: En la configuración inicial del proyecto o después de resetear la DB.

#### `populate-categories.ts`
Crea categorías financieras predeterminadas.

```bash
npx tsx scripts/db/seed/populate-categories.ts
```

#### `initialize-inventory.ts` / `initialize-inventory.js`
Inicializa el inventario con datos de ejemplo.

```bash
# Versión TypeScript (recomendada)
npx tsx scripts/db/seed/initialize-inventory.ts

# Versión JavaScript
node scripts/db/seed/initialize-inventory.js
```

---

### Inspección (`db/inspect/`)

Scripts para inspeccionar y verificar el estado de la base de datos.

#### `inspect-db.ts`
Inspecciona la estructura y contenido de la base de datos.

```bash
npx tsx scripts/db/inspect/inspect-db.ts
```

#### `inspect-validator.ts`
Verifica el esquema de validación.

```bash
npx tsx scripts/db/inspect/inspect-validator.ts
```

#### `check-movements.ts`
Verifica la integridad de movimientos financieros.

```bash
npx tsx scripts/db/inspect/check-movements.ts
```

#### `check_matrix.js`
Verifica la matriz de inventario.

```bash
node scripts/db/inspect/check_matrix.js
```

---

## 💻 Scripts de Desarrollo (`dev/`)

Herramientas útiles durante el desarrollo.

#### `create-test-user.js`
Crea un usuario de prueba para testing.

```bash
node scripts/dev/create-test-user.js
```

**Salida**: Credenciales del usuario creado para usar en desarrollo.

#### `discover-routes.js`
Descubre y lista todas las rutas de la aplicación.

```bash
npm run discover-routes
# o directamente:
node scripts/dev/discover-routes.js
```

**Útil para**: Documentar API, verificar rutas disponibles.

#### `update_validator_allow_fields.js`
Actualiza campos permitidos en el validador de esquema.

```bash
node scripts/dev/update_validator_allow_fields.js
```

---

## 🧪 Scripts de Testing (`testing/`)

Scripts para verificar funcionalidad y realizar pruebas.

#### `test-users-api.js`
Prueba el API de usuarios.

```bash
node scripts/testing/test-users-api.js
```

**Requiere**: Servidor corriendo en puerto configurado.

#### `verify_edit_movement.js`
Verifica que la edición de movimientos funcione correctamente.

```bash
node scripts/testing/verify_edit_movement.js
```

#### `verify_movement_fields.js`
Verifica todos los campos de movimientos.

```bash
node scripts/testing/verify_movement_fields.js
```

---

## 🔧 Buenas Prácticas

### Antes de Ejecutar Scripts

1. **Backup**: Siempre haz backup de la base de datos antes de:
   - Ejecutar migraciones
   - Modificar datos en producción
   - Ejecutar scripts destructivos

2. **Ambiente**: Asegúrate de estar en el ambiente correcto:
   ```bash
   # Verificar variables de entorno
   echo $NODE_ENV
   ```

3. **Dependencias**: Verifica que todas las dependencias estén instaladas:
   ```bash
   npm install
   ```

### Ejecutar Scripts de Forma Segura

```bash
# 1. Verificar el código del script primero
cat scripts/db/migrations/migrate-categories-real.ts

# 2. Hacer backup
mongodump --uri="mongodb://..." --out=/backups/$(date +%Y%m%d)

# 3. Ejecutar en ambiente de desarrollo primero
NODE_ENV=development npx tsx scripts/db/migrations/migrate-categories-real.ts

# 4. Solo entonces, si todo funciona, ejecutar en producción
NODE_ENV=production npx tsx scripts/db/migrations/migrate-categories-real.ts
```

### Crear Nuevos Scripts

Cuando crees un nuevo script:

1. **Ubicación**: Colócalo en la carpeta apropiada:
   - `db/migrations/` - Cambios de estructura o datos
   - `db/seed/` - Población de datos iniciales
   - `db/inspect/` - Solo lectura, inspección
   - `dev/` - Herramientas de desarrollo
   - `testing/` - Verificación y pruebas

2. **Formato**: Usa TypeScript (`.ts`) cuando sea posible

3. **Documentación**: Añade comentarios explicando:
   - Qué hace el script
   - Parámetros que acepta
   - Efectos secundarios
   - Reversibilidad

4. **Error Handling**: Implementa manejo de errores robusto

5. **Logging**: Añade logs informativos del progreso

### Ejemplo de Script Bien Documentado

```typescript
/**
 * Script: migrate-example.ts
 * 
 * Descripción: Migra datos de ejemplo de formato antiguo a nuevo.
 * 
 * Uso:
 *   npx tsx scripts/db/migrations/migrate-example.ts
 * 
 * Efectos:
 *   - Modifica la colección 'examples' en la base de datos
 *   - NO es reversible automáticamente (hacer backup primero)
 * 
 * Requisitos:
 *   - MongoDB corriendo
 *   - Variables de entorno configuradas
 */

import mongoose from 'mongoose';

async function migrate() {
  try {
    console.log('🚀 Iniciando migración...');
    
    // Código de migración aquí
    
    console.log('✅ Migración completada exitosamente');
  } catch (error) {
    console.error('❌ Error en migración:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

migrate();
```

---

## 📋 Checklist de Ejecución

Antes de ejecutar cualquier script en producción:

- [ ] ✅ Leí y entendí qué hace el script
- [ ] ✅ Hice backup de la base de datos
- [ ] ✅ Probé el script en desarrollo
- [ ] ✅ Verifiqué que estoy en el ambiente correcto
- [ ] ✅ Tengo un plan de rollback
- [ ] ✅ Documenté la ejecución y resultados

---

## 🆘 Troubleshooting

### Error: "Cannot connect to database"
```bash
# Verificar que MongoDB esté corriendo
# Verificar variables de entorno en .env.local
```

### Error: "Module not found"
```bash
# Instalar dependencias
npm install
```

### Script se ejecuta pero no hace cambios
```bash
# Verificar que tengas permisos de escritura
# Verificar la cadena de conexión a DB
# Revisar logs para errores silenciosos
```

---

**Última actualización**: Enero 2026
