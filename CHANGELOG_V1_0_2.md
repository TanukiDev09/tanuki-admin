# Changelog - Versión 1.0.2 (Tanuki Admin)

Esta versión se enfoca en el fortalecimiento de la calidad del código, la mantenibilidad a largo plazo, la estandarización de las reglas de desarrollo y mejoras en la visualización financiera.

## [1.0.2] - 2026-01-22

### ✨ Nuevas Características

- **Visualización Financiera Flexible**:
  - **Toggle Ingresos/Gastos**: Nueva funcionalidad para alternar entre la visualización de repartición de ingresos y gastos en las gráficas de categorías y centros de costo.
  - **Identificación de Categorías**: Resolución inteligente de IDs de categorías, mostrando nombres legibles o referencias cortas en lugar de hashes largos.
- **Precisión de Datos**:
  - **Filtro UTC Estricto**: Corrección en los límites de fechas para evitar la "contaminación" de reportes con movimientos de años adyacentes debido a diferencias horarias.

### 🛠️ Calidad Técnica & Estándares de Código

- **Límite de Líneas por Componente**:
  - Se ha implementado una regla estricta en ESLint (`max-lines`) que limita los archivos `.tsx` a un máximo de **700 líneas**.
  - Esta regla ignora comentarios y líneas en blanco para enfocarse exclusivamente en la complejidad del código.
  - Objetivo: Fomentar la componetización y evitar "archivos monstruo" que dificulten la mantenibilidad.
- **Mantenimiento Preventivo (Linters Clean)**:
  - **ESLint**: Ejecución y corrección total de advertencias y errores. El proyecto ahora cumple al 100% con las reglas de linting definidas.
  - **Stylelint**: Verificación completa de archivos SCSS, asegurando el orden correcto de propiedades y el cumplimiento del sistema de diseño.
  - **TypeScript (TSC)**: Verificación de tipos en todo el proyecto (`npx tsc --noEmit`) con resultado exitoso (Zero errors).
- **Refactorización Mayor**:
  - Desacople del dashboard financiero en componentes dedicados (`GlobalView`, `MonthlyView`, `AnnualView`) para mejorar la mantenibilidad.
  - **Optimización de Complejidad**: Reducción de la complejidad cognitiva en componentes clave y rutas de API mediante la integración con SonarJS.
- **Estandarización de Formato**:
  - Aplicación de `Prettier` en todo el workspace para garantizar una base de código visualmente consistente y profesional.

### 🐛 Correcciones

- Arreglado bug donde los nombres de categorías no se mostraban en reportes antiguos (Enero 2019).
- Corregida la comparación de tipos en la tabla de movimientos financieros.
- Ajustados estilos SCSS para cumplir con el orden de propiedades estándar.

---

*Nota: Esta versión asegura una base sólida y estandarizada para el crecimiento futuro de Tanuki Admin.*
