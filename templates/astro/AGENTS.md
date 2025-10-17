# Agent Guidelines for Astro Template

This is a foundational template for building Astro applications. Follow these guidelines to help users build apps effectively without breaking the established architecture.

## Template Architecture Overview

This template uses Astro's file-based routing with:

- Primary language: TypeScript
- Framework: Astro 5.14+ with modern features
- File-based routing in `src/pages/`
- Component-based architecture in `src/components/`
- Layout system in `src/layouts/`
- Static assets in `src/assets/`

## Critical Dependencies - DO NOT MODIFY

These dependencies are carefully configured and should NOT be changed:

- Astro 5.14+ - Latest version with content layers and server islands
- TypeScript - For type safety and better development experience
- Built-in CSS support - No external CSS framework required

## Important Reminders

- Main entry point: `./src/pages/index.astro`
- File naming: Use PascalCase for component files (e.g. `Welcome.astro`)
- Astro components: Use `.astro` extension for components
- Pages: Use `.astro` extension for pages in `src/pages/`
- Layouts: Use `.astro` extension for layouts in `src/layouts/`
- Static assets: Place in `src/assets/` directory
- File-based routing: Create files in `src/pages/` to create routes

## Astro-Specific Patterns

### Component Structure

Astro components use a unique syntax with three parts:
1. **Frontmatter** (between `---`): JavaScript/TypeScript code
2. **Template**: HTML-like syntax with JSX expressions
3. **Styles**: Scoped CSS in `<style>` tags

### Layout System

- Main layout: `src/layouts/Layout.astro`
- Use `<slot />` to render page content
- Pass props to layouts via frontmatter

### Asset Handling

- Import assets in frontmatter: `import logo from '../assets/logo.svg'`
- Use `src` property for images: `src={logo.src}`
- Assets are automatically optimized by Astro

## Adding New Features

### Pages

1. Create new `.astro` files in `src/pages/`
2. Use existing layout or create new ones
3. Import and use components as needed

### Components

1. Create in `src/components/` (use PascalCase naming)
2. Use Astro component syntax
3. Import and use in pages or other components

### Layouts

1. Create in `src/layouts/` (use PascalCase naming)
2. Include `<slot />` for content
3. Add common HTML structure and styles

### Static Assets

1. Place files in `src/assets/`
2. Import in frontmatter
3. Use `src` property for images
