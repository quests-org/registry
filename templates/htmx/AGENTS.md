# Agent Guidelines for HTMX Template

This is a foundational template for building HTMX applications. Follow these guidelines to help users build apps effectively without breaking the established architecture.

## Template Architecture Overview

This template uses a traditional server-side architecture with:

- Primary language: JavaScript (Node.js)
- Frontend: HTMX for dynamic interactions + vanilla HTML/CSS
- Backend: Express.js server
- Static file serving for client-side assets
- Server-side rendering with HTMX for dynamic content

## Critical Dependencies - DO NOT MODIFY

These dependencies are carefully configured and should NOT be changed:

- Express.js ^4.17.1 - Web server framework
- HTMX 2.0.7 - Client-side library for dynamic interactions
- Node.js - Runtime environment

## Important Reminders

- Main server entry point: `./src/index.js`
- Static files served from: `./public/` directory
- Main HTML file: `./public/index.html`
- File naming: Use lowercase, dash-case (kebab-case) for filenames
- HTMX attributes: Use `hx-*` attributes for dynamic behavior
- Server responses: Return HTML fragments, not JSON

## Demo Files - Reference Implementations

These files provide working examples for common HTMX functionality. Use them as templates or reference when implementing similar features:

> [!IMPORTANT] ALWAYS read these demo files first - Do not guess implementation based on file names.

### Client Patterns

- `public/index.html` - Complete HTMX client with counter example
- `public/styles.css` - CSS styling and animations
- `public/htmx.min.js` - HTMX library (version 2.0.7)

### Server Patterns

- `src/index.js` - Express server with HTMX endpoints
- Counter endpoints (`/increment`, `/decrement`) - Return HTML fragments
- Documentation endpoint (`/docs`) - Server-side rendered content

## Adding New Features

### HTMX Interactions

1. Add `hx-*` attributes to HTML elements in `public/index.html`
2. Create corresponding server endpoints in `src/index.js`
3. Return HTML fragments from server endpoints (not JSON)
4. Use appropriate HTMX attributes:
   - `hx-get` - GET requests
   - `hx-post` - POST requests
   - `hx-target` - Target element for updates
   - `hx-swap` - How to swap content (innerHTML, outerHTML, etc.)
   - `hx-trigger` - When to trigger (click, load, etc.)

### Server Endpoints

1. Add new routes to `src/index.js`
2. Return HTML fragments that match the target element structure
3. Use `res.send()` with HTML strings
4. Consider using template engines for complex HTML generation

### Styling

1. Add CSS to `public/styles.css`
2. Use vanilla CSS or consider adding a CSS framework
3. Maintain responsive design principles
4. Keep animations smooth and performant

## HTMX Best Practices

- Return HTML fragments that match the target element structure
- Use semantic HTML elements
- Implement proper error handling with `hx-trigger="error"`
- Consider using `hx-boost` for progressive enhancement
- Use `hx-indicator` for loading states
- Implement proper form validation on both client and server
