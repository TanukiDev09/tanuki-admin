# ⚡ Referencia Rápida - Tanuki Admin

Comandos y rutas más utilizados para desarrollo diario.

---

## 🚀 Comandos Esenciales

### Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build

# Iniciar producción
npm start
```

### Testing

```bash
# Tests unitarios
npm test
npm run test:watch
npm run test:coverage

# Tests E2E
npm run test:e2e:open

# Tests de accesibilidad
npm run test:a11y
```

### Code Quality

```bash
# Linting
npm run lint

# Formateo
npm run format
```

---

## 📂 Rutas Importantes

### Desarrollo

```
src/app/              → Páginas y API routes
src/components/       → Componentes React
src/lib/             → Utilidades
src/models/          → Modelos MongoDB
src/types/           → Tipos TypeScript
```

### Scripts

```
scripts/db/migrations/    → Migraciones de DB
scripts/db/seed/         → Población de datos
scripts/db/inspect/      → Inspección de DB
scripts/dev/             → Herramientas dev
scripts/testing/         → Scripts de testing
```

### Documentación

```
docs/                    → Toda la documentación
docs/api/               → Docs de API
docs/modules/           → Docs de módulos
docs/design/            → Sistema de diseño
```

### Configuración

```
config/                  → Todos los configs
.env.local              → Variables de entorno
```

---

## 🔧 Scripts de Base de Datos

### Población Inicial

```bash
# Poblar permisos
npm run seed:permissions

# Poblar categorías
npx tsx scripts/db/seed/populate-categories.ts

# Inicializar inventario
npx tsx scripts/db/seed/initialize-inventory.ts
```

### Migraciones

```bash
# Migrar categorías
npx tsx scripts/db/migrations/migrate-categories-real.ts

# Migrar creadores
npx tsx scripts/db/migrations/migrate-creators.ts

# Fix schema
npx tsx scripts/db/migrations/fix-schema-and-migrate.ts
```

### Inspección

```bash
# Inspeccionar DB
npx tsx scripts/db/inspect/inspect-db.ts

# Verificar movimientos
npx tsx scripts/db/inspect/check-movements.ts

# Verificar matriz
node scripts/db/inspect/check_matrix.js
```

---

## 🧾 Procesamiento DIAN XML

```bash
# Importar facturas desde carpeta (Python)
python scripts/process_dian_invoices.py --folder data/facturas --import

# Ayuda para el script
python scripts/process_dian_invoices.py --help
```

---

## 🛠️ Scripts de Desarrollo

```bash
# Crear usuario de prueba
node scripts/dev/create-test-user.js

# Descubrir rutas
npm run discover-routes

# Actualizar validador
node scripts/dev/update_validator_allow_fields.js
```

---

## 🧪 Scripts de Testing

```bash
# Test API de usuarios
node scripts/testing/test-users-api.js

# Verificar edición de movimientos
node scripts/testing/verify_edit_movement.js

# Verificar campos de movimientos
node scripts/testing/verify_movement_fields.js
```

---

## 📖 Documentación Rápida

```bash
# Ver estructura del proyecto
cat README.md

# Ver documentación completa
cat docs/README.md

# Ver scripts disponibles
cat scripts/README.md

# Ver sistema de diseño
cat docs/design/quick-reference.md
```

---

## 🔍 Búsqueda

### Buscar en código

```bash
# PowerShell
Get-ChildItem -Recurse -Include *.tsx,*.ts | Select-String "texto"

# Git grep
git grep "texto"
```

### Listar archivos

```bash
# Árbol de carpeta
tree /F carpeta

# Listar archivos
ls -Name
```

---

## 🌐 URLs Desarrollo

```
Local:          http://localhost:3000
Dashboard:      http://localhost:3000/dashboard
Login:          http://localhost:3000/login
API Base:       http://localhost:3000/api
```

---

## 🔑 Variables de Entorno

```env
MONGODB_URI=mongodb://...
JWT_SECRET=your-secret-key
NODE_ENV=development
```

---

## 📊 Estructura de Carpetas (Quick View)

```
tanuki-admin/
├── docs/          → Documentación
├── config/        → Configuraciones
├── scripts/       → Scripts utilitarios
├── src/           → Código fuente
│   ├── app/      → Next.js App Router
│   ├── components/ → React components
│   ├── lib/      → Utilidades
│   └── models/   → MongoDB models
├── cypress/       → Tests E2E
├── public/        → Assets estáticos
└── tools/         → Reportes y análisis
```

---

## ⚠️ Antes de Producción

```bash
# 1. Tests
npm test
npm run test:e2e:open

# 2. Linting
npm run lint

# 3. Build
npm run build

# 4. Verificar build
npm start
```

---

## 🆘 Troubleshooting Rápido

### Error de conexión a DB

```bash
# Verificar MongoDB está corriendo
# Verificar .env.local tiene MONGODB_URI correcto
```

### Error de build

```bash
# Limpiar caché
rm -rf .next

# Reinstalar
rm -rf node_modules
npm install
```

### Error de permisos

```bash
# Reejecutar seed
npm run seed:permissions
```

---

## 📚 Más Información

- **Completa**: [README.md](../README.md)
- **Documentación**: [docs/README.md](./README.md)
- **Scripts**: [scripts/README.md](../scripts/README.md)
- **Historial**: [docs/CHANGELOG.md](./CHANGELOG.md)

---

**Mantén esta referencia a mano para desarrollo diario** ⚡
