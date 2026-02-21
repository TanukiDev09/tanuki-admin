# Documentación Tanuki Admin

Bienvenido a la documentación completa del proyecto Tanuki Admin. Esta guía te ayudará a entender, desarrollar y mantener el sistema.

---

## 📑 Índice General

### ⚡ Inicio Rápido

- [**Guía Rápida de Comandos**](./guia-rapida.md)
  Comandos, rutas y utilidades para el día a día.

### 🔌 API y Backend

- [**Guía de Integración de Permisos API**](./api/permissions-integration.md)
  Cómo implementar y verificar permisos en las rutas API.

### 🧾 Gestión Documental y DIAN

- [**Guía de Importación DIAN XML**](./dian-xml-import-guide.md)
  Procesamiento de facturas electrónicas y uso del wizard web.
- [**Estructura Técnica XML UBL 2.1**](./dian-xml-structure.md)
  Análisis de campos y mapeo de datos DIAN.

### 📦 Módulos de la Aplicación

- [**Módulo de Catálogo**](./modules/catalog.md)
  Gestión de libros, creadores, colecciones y editorial
- [**Módulo de Usuarios**](./modules/users.md)
  Administración de usuarios, roles y permisos

### 🎨 Diseño y UI

- [**Sistema de Diseño**](./design/design-system.md)
  Guía completa del sistema de diseño, componentes y patrones
- [**Referencia Rápida del Sistema de Diseño**](./design/quick-reference.md)
  Guía rápida para consulta de tokens, colores y estilos

### 🔄 Historial y Evolución

- [**Proceso de Reorganización**](./reorganization/RESUMEN_REORGANIZACION.md)
  Detalles sobre la nueva estructura del proyecto y el plan ejecutado.
- [**Migración SASS**](./migration/README_MIGRACION.md)
  Guías y estándares para la migración de estilos a BEM/SCSS.

---

## 🎯 Documentación por Rol

### Desarrollador Frontend

1. [**Sistema de Diseño**](./design/design-system.md) - Bases visuales y componentes.
2. [**Módulos**](./modules/) - Lógica de negocio y vistas.
3. [**Guía Rápida**](./guia-rapida.md) - Comandos de desarrollo.

### Desarrollador Backend

1. [**Permisos API**](./api/permissions-integration.md) - Seguridad y control de acceso.
2. [**Scripts de DB**](../scripts/README.md) - Gestión de datos y migraciones.
3. [**Modelos**](../src/models/) - Estructura de la base de datos.

### Diseñador

1. [**Sistema de Diseño**](./design/design-system.md) - Guía completa de estilos.
2. [**Referencia Rápida**](./design/quick-reference.md) - Tokens y colores.

---

## 🚀 Guías de Inicio

### Para Desarrolladores Nuevos

1. **Configuración Inicial**

   ```bash
   # Clonar el repositorio
   git clone [repository-url]

   # Instalar dependencias
   npm install

   # Configurar variables de entorno
   cp .env.example .env.local

   # Iniciar base de datos
   npm run seed:permissions

   # Iniciar servidor de desarrollo
   npm run dev
   ```

2. **Entender la Estructura**
   - Lee el [README principal](../README.md)
   - Revisa el [Resumen de Reorganización](./reorganization/RESUMEN_REORGANIZACION.md)
   - Familiarízate con el [Sistema de Diseño](./design/design-system.md)

3. **Primeros Pasos en Desarrollo**
   - Explora los componentes en `src/components/`
   - Revisa las rutas API en `src/app/api/`
   - Estudia los modelos de datos en `src/models/`

---

## 📚 Documentación por Área

### Autenticación y Permisos

- Sistema de autenticación JWT
- Control de acceso basado en roles
- [Integración de permisos en API](./api/permissions-integration.md)

### Base de Datos

- MongoDB con Mongoose
- Modelos en `src/models/`
- [Scripts de migración](../scripts/db/migrations/)
- [Scripts de seed](../scripts/db/seed/)

### Frontend

- Next.js 16 con App Router
- React 19
- Vanilla CSS con BEM (Migración en curso)
- [Sistema de Diseño](./design/design-system.md)

### Testing

- Tests unitarios con Jest
- Tests E2E con Cypress
- Tests de accesibilidad
- [Guía de Scripts](../scripts/README.md)

---

## 🔧 Herramientas y Utilidades

### Scripts Útiles

#### Comandos de Base de Datos

```bash
# Poblar permisos
npm run seed:permissions

# Migrar categorías
npx tsx scripts/db/migrations/migrate-categories-real.ts

# Inspeccionar DB
npx tsx scripts/db/inspect/inspect-db.ts
```

#### Comandos de Desarrollo

```bash
# Crear usuario de prueba
node scripts/dev/create-test-user.js

# Descubrir rutas
npm run discover-routes
```

#### Comandos de Testing

```bash
# Tests unitarios
npm test

# Tests E2E
npm run test:e2e:open

# Tests de accesibilidad
npm run test:a11y
```

---

## 🎯 Convenciones de Código

### Estructura de Archivos

- Componentes: PascalCase (ej: `UserProfile.tsx`)
- Utilidades: camelCase (ej: `formatDate.ts`)
- Constantes: UPPER_SNAKE_CASE
- Tipos: PascalCase (ej: `UserType.ts`)

### Estilos (SCSS/BEM)

- Seguir la [Guía de Migración SASS](./migration/GUIA_MIGRACION_SASS_BEM.md)
- Usar variables del sistema: `styles/variables.scss`

---

## 🐛 Debugging y Troubleshooting

1. **Error de conexión a DB**: Verifica variables de entorno y que MongoDB esté corriendo.
2. **Error de permisos**: Ejecuta `npm run seed:permissions` para resetear permisos base.
3. **Estilos no se aplican**: Verifica que no haya conflictos con clases legacy.

---

## 🤝 Contribuir

1. Sigue el sistema de diseño.
2. Ejecuta `npm run lint` y `npm run format` antes de commit.
3. Actualiza la documentación si añades nuevos módulos.

---

**Última actualización**: Febrero 2026  
**Versión de documentación**: 1.2
