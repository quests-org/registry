# Agent Guidelines for Solid.js Template

This is a foundational template for building Solid.js applications. Follow these guidelines to help users build apps effectively without breaking the established architecture.

## Template Architecture Overview

This template uses SolidStart (Solid.js full-stack framework) with:

- Primary language: TypeScript
- Frontend: Solid.js with fine-grained reactivity
- Framework: SolidStart (built on Vinxi)
- Routing: File-based routing with `@solidjs/router`
- Meta: `@solidjs/meta` for SEO and head management
- Build tool: Vinxi (not Vite directly)

## Critical Dependencies - DO NOT MODIFY

These dependencies are carefully configured and should NOT be changed:

- `solid-js` - Core reactive UI library
- `@solidjs/start` - Full-stack Solid.js framework
- `@solidjs/router` - File-based routing system
- `@solidjs/meta` - Head management and SEO
- `vinxi` - Build tool and development server
- TypeScript - Type safety throughout

## Important Reminders

- Main entry point: `./src/app.tsx` (not in a client subdirectory)
- File-based routing: Create files in `src/routes/` directory
- Components: Place in `src/components/` directory
- File naming: Use PascalCase for components (e.g. `Counter.tsx`)
- Server-side rendering: Supported out of the box
- Client hydration: Automatic with `entry-client.tsx`

## File Structure

- `src/app.tsx` - Main app component with router setup
- `src/routes/` - File-based routing (e.g., `index.tsx`, `about.tsx`)
- `src/components/` - Reusable UI components
- `src/entry-client.tsx` - Client-side entry point
- `src/entry-server.tsx` - Server-side entry point
- `src/app.css` - Global styles

## Adding New Features

### UI Components

1. Create in `src/components/` directory
2. Use PascalCase naming (e.g., `MyComponent.tsx`)
3. Export as default function
4. Use Solid.js signals for reactive state

### Routes

1. Create files in `src/routes/` directory
2. File name becomes the route path
3. Export default function component
4. Use `Title` from `@solidjs/meta` for page titles

### Styling

1. Use CSS files alongside components
2. Import CSS in component files
3. Global styles go in `src/app.css`
