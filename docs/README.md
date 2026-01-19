# Documentación Tanuki Admin

Bienvenido a la documentación completa del proyecto Tanuki Admin. Esta guía te ayudará a entender, desarrollar y mantener el sistema.

## 📑 Índice General

### 🔌 API y Backend
- [**Guía de Integración de Permisos API**](./api/permissions-integration.md)  
  Cómo implementar y verificar permisos en las rutas API

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
   - Revisa el [Plan de Reorganización](../PLAN_REORGANIZACION.md)
   - Familiarízate con el [Sistema de Diseño](./design/design-system.md)

3. **Primeros Pasos en Desarrollo**
   - Explora los componentes en `src/components/`
   - Revisa las rutas API en `src/app/api/`
   - Estudia los modelos de datos en `src/models/`

### Para Diseñadores

1. Revisa el [Sistema de Diseño](./design/design-system.md)
2. Consulta la [Referencia Rápida](./design/quick-reference.md)
3. Los componentes UI están en `src/components/ui/`

### Para Administradores de Sistema

1. Scripts de base de datos: `scripts/db/`
2. Scripts de desarrollo: `scripts/dev/`
3. Configuraciones: `config/`

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
- Tailwind CSS 4
- [Sistema de Diseño](./design/design-system.md)

### Testing
- Tests unitarios con Jest
- Tests E2E con Cypress
- Tests de accesibilidad
- Scripts de testing en `scripts/testing/`

## 🔧 Herramientas y Utilidades

### Scripts Útiles

#### Base de Datos
```bash
# Poblar permisos
npm run seed:permissions

# Migrar categorías
npx tsx scripts/db/migrations/migrate-categories-real.ts

# Inspeccionar DB
npx tsx scripts/db/inspect/inspect-db.ts
```

#### Desarrollo
```bash
# Crear usuario de prueba
node scripts/dev/create-test-user.js

# Descubrir rutas
npm run discover-routes
```

#### Testing
```bash
# Tests unitarios
npm test

# Tests E2E
npm run test:e2e:open

# Tests de accesibilidad
npm run test:a11y
```

## 🎯 Convenciones de Código

### Estructura de Archivos
- Componentes: PascalCase (ej: `UserProfile.tsx`)
- Utilidades: camelCase (ej: `formatDate.ts`)
- Constantes: UPPER_SNAKE_CASE
- Tipos: PascalCase con sufijo Type (ej: `UserType`)

### Imports
```typescript
// 1. Dependencias externas
import React from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Componentes internos
import { Button } from '@/components/ui/button';

// 3. Utilidades y helpers
import { cn } from '@/lib/utils';

// 4. Tipos
import type { User } from '@/types/user';
```

### Componentes
- Usar TypeScript estricto
- Props tipadas con interfaces
- Exportar componentes nombrados
- Documentar componentes complejos

## 🐛 Debugging y Troubleshooting

### Problemas Comunes

1. **Error de conexión a DB**
   - Verifica variables de entorno
   - Asegúrate que MongoDB esté corriendo
   - Revisa cadena de conexión en `.env.local`

2. **Error de permisos**
   - Verifica que los permisos estén poblados: `npm run seed:permissions`
   - Revisa la [guía de permisos](./api/permissions-integration.md)

3. **Estilos no se aplican**
   - Verifica que Tailwind esté compilando
   - Revisa el [sistema de diseño](./design/design-system.md)
   - Limpia caché: `rm -rf .next`

## 📈 Roadmap y Mejoras Futuras

Consulta el archivo [ROADMAP.md](./ROADMAP.md) para ver las características planificadas.

## 🤝 Contribuir

1. Lee las guías de módulos relevantes
2. Sigue el sistema de diseño
3. Escribe tests para nuevas funcionalidades
4. Actualiza la documentación
5. Ejecuta linter antes de commit

## 📞 Soporte

- **Issues**: [GitHub Issues]
- **Documentación técnica**: Ver carpeta `docs/`
- **Preguntas**: Contactar al equipo de desarrollo

---

**Última actualización**: Enero 2026  
**Versión de documentación**: 1.0
