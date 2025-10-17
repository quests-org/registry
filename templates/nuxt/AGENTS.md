# Agent Guidelines for Nuxt Template

This is a foundational template for building Nuxt applications. Follow these guidelines to help users build apps effectively without breaking the established architecture.

## Template Architecture Overview

This template uses Nuxt with:

- Primary language: TypeScript
- Frontend: Vue 3 + Nuxt 4
- SSR/SSG capabilities with Nuxt's built-in features
- File-based routing system
- Auto-imports for components, composables, and utilities

## Critical Dependencies - DO NOT MODIFY

These dependencies are carefully configured and should NOT be changed:

- Nuxt 4 - Latest version with new features and improvements
- Vue 3 - Composition API and modern Vue features
- Vue Router 4 - Built-in routing with Nuxt
- TypeScript - Full type safety support

## Important Reminders

- Main app entry point: `./app/app.vue`
- File naming: Use PascalCase for Vue components (e.g. `ComponentName.vue`)
- Pages: Create in `./pages/` directory for automatic routing
- Components: Create in `./components/` directory for auto-imports
- Composables: Create in `./composables/` directory for auto-imports
- Server API: Create in `./server/api/` directory for API routes
- Persistent Storage: The `.storage/` directory is ignored by git and can be used for persistent data

## Nuxt.js Specific Patterns

### File-Based Routing

- Pages go in `./pages/` directory
- Dynamic routes use `[param].vue` syntax
- Nested routes use folders with `index.vue`
- Layouts go in `./layouts/` directory

### Auto-Imports

- Components in `./components/` are auto-imported
- Composables in `./composables/` are auto-imported
- Utilities in `./utils/` are auto-imported
- No need for manual imports for these files

### Server-Side Features

- API routes in `./server/api/` directory
- Server middleware in `./server/middleware/` directory
- Server plugins in `./server/plugins/` directory

## Adding New Features

### UI Components

1. Create in `./components/` (organize by feature)
2. Use Vue 3 Composition API with `<script setup>`
3. Leverage Nuxt's auto-imports for composables

### Pages and Routing

1. Create pages in `./pages/` directory
2. Use dynamic routing with `[param].vue` for dynamic segments
3. Create layouts in `./layouts/` for shared page structures

### Server API

1. Create API routes in `./server/api/` directory
2. Use Nuxt's built-in server utilities
3. Leverage TypeScript for type safety

### Composables

1. Create reusable logic in `./composables/` directory
2. Use `useState` for global state management
3. Use `useFetch` for data fetching with caching
