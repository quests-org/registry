# Agent Guidelines for Angular Template

This is a foundational template for building Angular applications. Follow these guidelines to help users build apps effectively without breaking the established architecture.

## Template Architecture Overview

This template uses Angular's modern standalone architecture with:

- Primary language: TypeScript
- Framework: Angular 20 with standalone components
- Build tool: Angular CLI with esbuild
- Styling: CSS with modern features (CSS custom properties, color-mix)
- Testing: Jasmine + Karma
- Change detection: Zoneless change detection (experimental)

## Critical Dependencies - DO NOT MODIFY

These dependencies are carefully configured and should NOT be changed:

- Angular 20 - Latest version with standalone components and signals
- Angular CLI 20 - Build tool and development server
- TypeScript 5.9 - Language with strict configuration
- RxJS 7.8 - Reactive programming library
- Jasmine + Karma - Testing framework
- Zoneless change detection - Experimental Angular feature for better performance

## Important Reminders

- Main Angular entry point: `./src/app/app.ts`
- Component files: Use kebab-case for filenames (e.g. `my-component.ts`)
- Template files: Use `.html` extension for component templates
- Style files: Use `.css` extension for component styles
- Standalone components: All components should be standalone (no NgModules)
- Signals: Use Angular signals for reactive state management
- File naming: Use kebab-case for all filenames

## Angular-Specific Patterns

### Component Structure

```typescript
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-example',
  standalone: true,
  templateUrl: './example.html',
  styleUrl: './example.css'
})
export class ExampleComponent {
  protected readonly data = signal('Hello World');
}
```

### Template Syntax

- Use `{{ }}` for interpolation
- Use `@for` for loops (Angular 17+ control flow)
- Use `@if` for conditionals (Angular 17+ control flow)
- Use `[property]` for property binding
- Use `(event)` for event binding
- Use `#templateRef` for template reference variables

### Styling Guidelines

- Use CSS custom properties for theming
- Use `color-mix()` for dynamic color variations
- Use `:host` selector for component-level styles
- Avoid global styles in component files
- Use modern CSS features (flexbox, grid, etc.)

## File Structure

```
src/
├── app/
│   ├── app.ts              # Main app component
│   ├── app.html            # Main app template
│   ├── app.css             # Main app styles
│   ├── app.config.ts       # App configuration
│   └── app.routes.ts       # Route definitions
├── index.html              # Main HTML file
├── main.ts                 # Bootstrap file
└── styles.css              # Global styles
```

## Adding New Features

### Components

1. Create component files in `src/app/` or subdirectories
2. Use standalone components (no NgModules)
3. Follow the naming convention: `component-name.ts`, `component-name.html`, `component-name.css`
4. Use signals for reactive state management
5. Use Angular's control flow syntax (`@if`, `@for`)

### Services

1. Create services using `@Injectable({ providedIn: 'root' })`
2. Use dependency injection for service consumption
3. Use signals for reactive service state

### Routing

1. Define routes in `app.routes.ts`
2. Use `RouterOutlet` in templates
3. Use `RouterLink` for navigation
4. Use route guards for protection

### Styling

1. Use component-scoped styles
2. Leverage CSS custom properties for theming
3. Use modern CSS features
4. Follow mobile-first responsive design

## Angular Best Practices

- Use standalone components instead of NgModules
- Leverage signals for reactive programming
- Use Angular's built-in control flow (`@if`, `@for`)
- Follow the single responsibility principle
- Use TypeScript strict mode
- Write unit tests for components and services
- Use Angular DevTools for debugging
