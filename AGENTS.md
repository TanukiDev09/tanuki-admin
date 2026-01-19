# AGENTS.md - AI Agent Operating Procedures

This document defines the mandatory rules for agentic AI assistants working on this codebase.

## 🎯 Primary Directives

### 1. Style & Pattern Preservation
- **Preserve Existing Patterns**: Do not introduce new architectural patterns unless explicitly requested. Follow the established Server/Client component boundary.
- **BEM Consistency**: Ensure all new styles strictly follow the BEM (Block Element Modifier) methodology established during the SASS migration.

### 2. Global Variable Integrity
- **No Inventions**: Agents MUST NOT invent variable names or values. 
- **Variable Verification**: ALWAYS read and verify `src/styles/_variables.scss` before adding any colors, spacings, breakpoints, or transitions.
- **Naming Protocol**: Use exact variable names (e.g., `$spacing-md`, `$flow-bg`, `$radius-lg`).

### 3. Structural Continuity
- **Directory Structure**: Preserved and extend the current reorganized structure. 
    - Configuration belongs in `/config`.
    - Documentation belongs in `/docs`.
    - Maintenance/Migration scripts belong in `/scripts`.
- **Component Placement**: Logic-heavy components go in `src/components/[domain]/`. Shared primitives go in `src/components/ui/`.

### 4. Mandatory Verification Flow
Before marking a task as **[x] COMPLETED**, the agent MUST:
1. **Run Linters**: Execute `npm run lint` and address all issues.
2. **Check SCSS**: Execute `npm run lint:css` to verify style compliance.
3. **Type Verification**: Ensure code is free of TypeScript `any` types (unless strictly necessary) and passes implicit/explicit type checks.
4. **Sanity Check**: Verify that `package.json` scripts still work and no breaking changes were introduced to the build process.

## 🛠️ Preferred Tools
- **Grep/Find**: Use these to locate existing implementations of similar features before writing new code.
- **Task Tracker**: Maintain a local `task.md` or equivalent to track atomic progress within a session.

## ⚠️ Hard Rules
- **NO Hardcoded Credentials**: Never commit or suggest hardcoded MongoDB URIs, JWT secrets, or API keys. Always use `process.env`.
- **NO Utility Bloat**: Do not add new NPM dependencies for tasks that can be solved with existing tools (Zod, date-fns, lucide-react).
