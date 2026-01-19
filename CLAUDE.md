# CLAUDE.md - Tanuki Admin Project Guidelines

This document provides essential instructions for Claude and other AI assistants working on the Tanuki Admin project.

## 🚀 Quick Start
- **Dev Server**: `npm run dev`
- **Linting**: `npm run lint` (JS/TS), `npm run lint:css` (SCSS)
- **Formatting**: `npm run format`

## 🛠️ Technology Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: MongoDB (Mongoose)
- **Styles**: SASS (BEM notation) + Tailwind CSS
- **State**: TanStack Query + React Context

## 🎨 Design System & Styling
- **Global Variables**: ALWAYS reference `src/styles/_variables.scss` for colors, spacing, typography, and shadows.
- **NEVER** use hardcoded HSL/RGB/HEX values in components or SCSS files.
- **BEM Convention**: Follow `block__element--modifier` for all new SCSS.
- **Mixing Styles**: Use Tailwind for rapid layouts but prioritize SASS for complex/reusable components.

## 📁 Architecture & Organization
- **App Router**: Routes are in `src/app/`. API handlers are in `src/app/api/`.
- **Components**: Group by domain in `src/components/` (e.g., `dashboard/`, `catalog/`, `ui/`).
- **Models**: Unified Mongoose schemas in `src/models/`.
- **Scripts**: Utility scripts are located in `scripts/` (reorganized by category: `db/`, `dev/`, `testing/`).
- **Config**: Root config files are pointers to `config/` directory.

## ✅ Task Completion Definition
A task is NOT considered finished until:
1. All linting errors are resolved (`npm run lint` & `npm run lint:css`).
2. Type checking passes (ensure no TypeScript errors).
3. The project builds correctly if requested.
4. Documentation is updated (if applicable).
