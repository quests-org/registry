# HTMX

A template using [htmx](https://htmx.org/) - a library that gives you access to AJAX, CSS Transitions, WebSockets and Server Sent Events directly in HTML using attributes.

## What is htmx?

htmx allows you to build modern user interfaces with the simplicity and power of hypertext. It's small (~16k min.gz'd), dependency-free, and extendable.

## Key Features

- Access AJAX, CSS Transitions, WebSockets and Server Sent Events directly in HTML
- Use simple attributes like `hx-post`, `hx-swap` to create dynamic interactions
- No complex JavaScript frameworks required
- Reduces codebase sizes by 67% compared to React

## Quick Start

```html
<script src="https://cdn.jsdelivr.net/npm/htmx.org@2.0.7/dist/htmx.min.js"></script>
<button hx-post="/clicked" hx-swap="outerHTML">
  Click Me
</button>
```

This template provides a foundation for building HTMX applications with modern tooling and best practices.
