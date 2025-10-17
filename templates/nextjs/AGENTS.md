# Agent Guidelines for Next.js Template

This is a foundational template for building Next.js applications. Follow these guidelines to help users build apps effectively without breaking the established architecture.

## Template Architecture Overview

This template uses Next.js 15 with the App Router and includes:

- Primary language: TypeScript
- Frontend: React 19 + Next.js 15 + Tailwind CSS 4
- App Router architecture with server and client components
- Turbopack for fast development builds
- Google Fonts integration (Geist Sans & Mono)

## Critical Dependencies - DO NOT MODIFY

These dependencies are carefully configured and should NOT be changed:

- Next.js 15.5.5 - Latest stable version with App Router
- React 19.1.1 - Latest version with new features
- Tailwind CSS v4 - Uses the new PostCSS plugin (`@tailwindcss/postcss`)
- TypeScript 5 - Type safety and development experience
- ESLint with Next.js config - Code quality and consistency

## Important Reminders

- Main entry point: `./src/app/page.tsx` (App Router)
- Root layout: `./src/app/layout.tsx` (contains fonts and global styles)
- File naming: Use lowercase, dash-case (kebab-case) for filenames (e.g. `component-name.tsx`)
- App Router structure: Use `src/app/` directory for pages and layouts
- Server vs Client components: Default to server components, use `"use client"` directive when needed
- Image optimization: Use Next.js `Image` component for optimized images
- Font loading: Google Fonts are configured in `layout.tsx` with CSS variables

## Next.js App Router Patterns

### Page Components

- Create pages in `src/app/` directory
- Use `page.tsx` for route pages
- Use `layout.tsx` for shared layouts
- Use `loading.tsx` for loading states
- Use `error.tsx` for error boundaries

### Component Organization

- Create reusable components in `src/components/` (create this directory as needed)
- Use server components by default
- Add `"use client"` directive only when using hooks, event handlers, or browser APIs

### Styling

- Use Tailwind CSS classes
- Global styles in `src/app/globals.css`
- CSS variables defined in `:root` for theming
- Dark mode support via `prefers-color-scheme`

## Adding New Features

### New Pages

1. Create new directories in `src/app/` for routes
2. Add `page.tsx` file for the route component
3. Use TypeScript for all components

### New Components

1. Create in `src/components/` (organize by feature)
2. Use server components by default
3. Add `"use client"` only when necessary
4. Use Tailwind CSS for styling

### API Routes (if needed)

1. Create `route.ts` files in `src/app/api/` directory
2. Export HTTP method handlers (GET, POST, etc.)
3. Use TypeScript for type safety
