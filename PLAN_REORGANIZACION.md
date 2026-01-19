# Plan de Reorganización del Proyecto Tanuki Admin

## 📊 Análisis de la Estructura Actual

### Problemas Identificados

1. **Carpeta `scripts/` desorganizada**: 
   - Mezcla de archivos `.js` y `.ts`
   - Scripts de migración, testing, y utilidades sin categorizar
   - Falta de documentación sobre cuándo usar cada script

2. **Archivos de documentación dispersos**:
   - Múltiples archivos README en raíz
   - Falta de organización en la documentación

3. **Carpeta `tmp_api_client`**:
   - Código temporal que no debería estar en producción
   - Debe moverse a backup o eliminarse

4. **Archivos de configuración en raíz**:
   - Muchos archivos de configuración mezclados
   - Dificulta la navegación

5. **Carpeta `_backup`**:
   - Contenido sin documentar
   - No está claro qué debe preservarse

6. **Componentes bien organizados** ✅:
   - La estructura de `src/components` está bien categorizada
   - Separación clara por funcionalidad

7. **API bien estructurada** ✅:
   - Rutas organizadas por módulo
   - Convenciones de Next.js bien aplicadas

## 🎯 Estructura Propuesta

```
tanuki-admin/
├── 📁 .github/                    # Workflows de CI/CD
│   └── workflows/
│
├── 📁 docs/                       # ✨ NUEVA - Documentación centralizada
│   ├── README.md                  # Documentación principal
│   ├── api/
│   │   └── permissions-integration.md
│   ├── modules/
│   │   ├── catalog.md
│   │   └── users.md
│   └── design/
│       ├── design-system.md
│       └── quick-reference.md
│
├── 📁 config/                     # ✨ NUEVA - Configuraciones
│   ├── jest.config.js
│   ├── jest.setup.js
│   ├── cypress.config.js
│   ├── eslint.config.mjs
│   ├── postcss.config.mjs
│   └── next.config.ts
│
├── 📁 scripts/                    # Scripts organizados por categoría
│   ├── db/                        # ✨ NUEVA - Scripts de base de datos
│   │   ├── migrations/
│   │   │   ├── migrate-categories.ts
│   │   │   ├── migrate-creators.ts
│   │   │   └── fix-schema.ts
│   │   ├── seed/
│   │   │   ├── seed-permissions.ts
│   │   │   ├── populate-categories.ts
│   │   │   └── initialize-inventory.ts
│   │   └── inspect/
│   │       ├── inspect-db.ts
│   │       └── inspect-validator.ts
│   ├── dev/                       # ✨ NUEVA - Scripts de desarrollo
│   │   ├── create-test-user.js
│   │   └── discover-routes.js
│   └── testing/                   # ✨ NUEVA - Scripts de testing
│       ├── test-users-api.js
│       ├── verify-edit-movement.js
│       └── verify-movement-fields.js
│
├── 📁 cypress/                    # Tests E2E
│   ├── e2e/
│   ├── fixtures/
│   ├── screenshots/
│   └── support/
│
├── 📁 src/                        # Código fuente (mantener estructura actual)
│   ├── app/
│   │   ├── api/                   # API routes
│   │   ├── dashboard/             # Dashboard pages
│   │   ├── login/
│   │   └── ...
│   ├── components/                # Componentes React (bien organizado)
│   │   ├── admin/
│   │   ├── agreements/
│   │   ├── auth/
│   │   ├── books/
│   │   ├── creators/
│   │   ├── dashboard/
│   │   ├── finance/
│   │   ├── inventory/
│   │   ├── layout/
│   │   ├── points-of-sale/
│   │   ├── profile/
│   │   ├── ui/
│   │   ├── warehouses/
│   │   └── design-system/
│   ├── contexts/                  # React Contexts
│   ├── hooks/                     # Custom hooks
│   ├── lib/                       # Utilidades y helpers
│   │   └── inventory/
│   ├── models/                    # Modelos de MongoDB
│   ├── providers/                 # React Providers
│   └── types/                     # TypeScript types
│
├── 📁 public/                     # Assets estáticos
│   └── uploads/
│
├── 📁 tools/                      # ✨ NUEVA - Herramientas de análisis
│   ├── lighthouse-report.json
│   ├── lint_output.txt
│   └── lint_results.json
│
├── 📁 archive/                    # ✨ NUEVA - Código archivado
│   └── tmp_api_client/           # Mover aquí o eliminar
│
├── .gitignore
├── .prettierrc
├── package.json
├── package-lock.json
├── tsconfig.json
├── README.md                      # README principal simplificado
└── validator.json

```

## 🔄 Plan de Migración

### Fase 1: Preparación (Sin riesgos)
1. Crear nuevas carpetas: `docs/`, `config/`, `tools/`, `archive/`
2. Crear subcarpetas en `scripts/`: `db/`, `dev/`, `testing/`

### Fase 2: Mover Documentación
1. Mover archivos README a `docs/`
2. Organizar por categorías
3. Crear índice principal

### Fase 3: Mover Configuraciones
1. Mover configs a `config/`
2. Actualizar referencias en `package.json`

### Fase 4: Reorganizar Scripts
1. Clasificar y mover scripts
2. Actualizar `package.json` scripts

### Fase 5: Limpiar Archivos Temporales
1. Mover `tmp_api_client` a `archive/`
2. Evaluar contenido de `_backup/`
3. Mover reportes a `tools/`

### Fase 6: Actualizar Referencias
1. Actualizar imports si es necesario
2. Actualizar documentación
3. Verificar que todo funciona

## ✅ Beneficios de la Reorganización

1. **Navegación clara**: Estructura intuitiva por tipo de archivo
2. **Documentación centralizada**: Fácil de encontrar y mantener
3. **Scripts organizados**: Por función y propósito
4. **Configuración separada**: Menos desorden en raíz
5. **Escalabilidad**: Fácil añadir nuevos elementos
6. **Mantenimiento**: Código más fácil de mantener
7. **Onboarding**: Nuevos desarrolladores se orientan más rápido

## 📋 Checklist de Ejecución

- [ ] Fase 1: Crear estructura de carpetas
- [ ] Fase 2: Reorganizar documentación
- [ ] Fase 3: Mover archivos de configuración
- [ ] Fase 4: Reorganizar scripts
- [ ] Fase 5: Archivar código temporal
- [ ] Fase 6: Actualizar referencias
- [ ] Verificar que `npm run dev` funciona
- [ ] Verificar que `npm run build` funciona
- [ ] Verificar que tests funcionan
- [ ] Actualizar README principal
- [ ] Commit y push de cambios

## ⚠️ Notas Importantes

- La carpeta `src/` se mantiene mayormente igual (ya está bien organizada)
- No tocar `node_modules/`, `.next/`, `.git/`
- Hacer backup antes de ejecutar cambios masivos
- Ejecutar en horario de bajo tráfico si está en producción
- Probar después de cada fase
