# 🛠️ Tanuki Admin – Guía del Desarrollador

Esta guía proporciona la información necesaria para configurar el entorno de desarrollo, entender la arquitectura y contribuir al proyecto Tanuki Admin.

---

## 🚀 Inicio Rápido

Para poner en marcha el proyecto localmente, sigue estos pasos:

1.  **Requisitos**: Node.js 20+ y una instancia de MongoDB.
2.  **Instalación**: `npm install`
3.  **Configuración**:
    - `cp .env.example .env` y configura tus credenciales de MongoDB y JWT.
4.  **Base de Datos**:
    - `npm run seed:permissions` para inicializar la matriz de permisos.
5.  **Servidor de Desarrollo**: `npm run dev`

---

## 🏗️ Arquitectura y Tecnologías

El proyecto está construido con un stack moderno y escalable:

- **Frontend**: Next.js 16 (App Router), React 19, Radix UI.
- **Backend**: Next.js API Routes, Mongoose (MongoDB).
- **Estilos**: Sistema híbrido SASS (BEM) + Tailwind CSS.
- **Estado**: TanStack Query para sincronización de servidor.

> [!NOTE]
> Para un análisis profundo de la estructura técnica, consulta la [**Arquitectura del Sistema**](./docs/ARCHITECTURE.md).

---

## 📂 Centro de Documentación Técnica

Hemos organizado la documentación técnica en la carpeta [`docs/`](./docs/):

- **[📘 Manual Técnico](./docs/DEVELOPER.md)**: Guía detallada sobre módulos, testing y convenciones.
- **[📐 Sistema de Diseño](./docs/design/design-system.md)**: Guía de componentes y estilos.
- **[🔌 Integración de API](./docs/api/permissions-integration.md)**: Cómo trabajar con permisos y seguridad.
- **[📜 Registro de Cambios](./docs/CHANGELOG.md)**: Historial de versiones y actualizaciones.
- **[🤖 Guía para IAs (CLAUDE.md)](./CLAUDE.md)**: Instrucciones específicas para asistentes de IA.

---

## ✅ Estándares de Codificación

- **Naming**: PascalCase para componentes, camelCase para utilidades.
- **Estilos**: Prioriza SASS con metodología BEM para componentes reutilizables.
- **Calidad**: Asegúrate de que `npm run lint` y `npm run lint:css` no devuelvan errores antes de un commit.

---

**© 2026 Tanuki SAS.**  
Desarrollado para una gestión editorial eficiente y profesional.
