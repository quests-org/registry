---
name: wireframe
description: "Generate HTML wireframes and prototypes with Tailwind CSS. Use when the user wants to create a wireframe, mockup, prototype, HTML artifact, layout sketch, or UI concept — even if they don't say 'wireframe' explicitly. Activate for requests like 'sketch a login page', 'mock up a dashboard', 'create an HTML prototype', or 'wireframe the settings screen'. Not for building full applications (use a template for that)."
---

# Wireframe

Generate a self-contained HTML wireframe powered by the `@tailwindcss/browser` playground — Tailwind v4 compiles client-side with no build step required.

## Usage

```bash
tsx skills/wireframe/scripts/create-wireframe.ts --output <path> [--title <text>]
```

| Argument          | Required | Default     | Description           |
| ----------------- | -------- | ----------- | --------------------- |
| `--output <path>` | Yes      |             | Output HTML file path |
| `--title <text>`  | No       | `Wireframe` | Page title            |

## After Generating

The output is a Tailwind v4 playground. Edit it directly:

- Replace the starter `<body>` content with the wireframe layout
- The `<style type="text/tailwindcss">` block has a `@theme {}` section for custom tokens or overrides
