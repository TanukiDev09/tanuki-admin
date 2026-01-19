# Tanuki Admin

Sistema de administración integral para gestión de inventario, finanzas y operaciones.

## 🚀 Inicio Rápido

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Compilar para producción
npm run build

# Iniciar servidor de producción
npm start
```

## 📂 Estructura del Proyecto

```
tanuki-admin/
├── 📁 docs/              # Documentación completa del proyecto
├── 📁 config/            # Archivos de configuración
├── 📁 scripts/           # Scripts de utilidad organizados
│   ├── db/              # Scripts de base de datos
│   ├── dev/             # Scripts de desarrollo
│   └── testing/         # Scripts de pruebas
├── 📁 src/              # Código fuente de la aplicación
│   ├── app/            # Páginas y API routes (Next.js)
│   ├── components/     # Componentes React
│   ├── lib/            # Utilidades y helpers
│   ├── models/         # Modelos de MongoDB
│   └── types/          # Definiciones TypeScript
├── 📁 cypress/          # Tests end-to-end
├── 📁 public/           # Assets estáticos
└── 📁 tools/            # Herramientas de análisis
```

## 📚 Documentación

Consulta la [documentación completa](./docs/README.md) para más información sobre:

- [Guía de Integración de Permisos API](./docs/api/permissions-integration.md)
- [Módulo de Catálogo](./docs/modules/catalog.md)
- [Módulo de Usuarios](./docs/modules/users.md)
- [Sistema de Diseño](./docs/design/design-system.md)
- [Referencia Rápida del Sistema de Diseño](./docs/design/quick-reference.md)

## 🛠️ Scripts Disponibles

### Desarrollo
- `npm run dev` - Iniciar servidor de desarrollo
- `npm run lint` - Ejecutar linter
- `npm run format` - Formatear código con Prettier

### Testing
- `npm test` - Ejecutar tests unitarios
- `npm run test:watch` - Ejecutar tests en modo watch
- `npm run test:coverage` - Generar reporte de cobertura
- `npm run test:e2e:open` - Abrir Cypress para tests E2E
- `npm run test:a11y` - Ejecutar tests de accesibilidad

### Base de Datos
- `npm run seed:permissions` - Poblar permisos iniciales
- `npm run discover-routes` - Descubrir rutas de la aplicación

### Producción
- `npm run build` - Compilar para producción
- `npm start` - Iniciar servidor de producción
- `npm run perf` - Análisis de rendimiento con Lighthouse

## 🗂️ Módulos Principales

- **Dashboard**: Panel de control con métricas y estadísticas
- **Inventario**: Gestión de productos y almacenes
- **Finanzas**: Control de ingresos, gastos y categorías
- **Catálogo**: Administración de libros, creadores y colecciones
- **Usuarios**: Gestión de usuarios y permisos
- **Puntos de Venta**: Control de PDVs y stock
- **Acuerdos**: Gestión de contratos y convenios

## 🔧 Tecnologías

- **Framework**: Next.js 16
- **UI**: React 19, Tailwind CSS 4
- **Base de Datos**: MongoDB con Mongoose
- **Autenticación**: JWT
- **Testing**: Jest, Cypress, Testing Library
- **Linting**: ESLint, Prettier
- **Gráficos**: Recharts
- **Formularios**: React Hook Form + Zod

## 🤝 Contribuir

1. Revisa la [guía de contribución](./docs/CONTRIBUTING.md)
2. Asegúrate de seguir el [sistema de diseño](./docs/design/design-system.md)
3. Ejecuta tests antes de hacer commit
4. Mantén el código formateado con Prettier

## 📝 Licencia

Propietario - Todos los derechos reservados

## 🔗 Enlaces Útiles

- [Plan de Reorganización](./PLAN_REORGANIZACION.md)
- [Validador de Esquema](./validator.json)

---

**Versión**: 0.1.0  
**Última actualización**: Enero 2026
