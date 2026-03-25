---
name: wireframe
description: "Generate HTML wireframes and prototypes with Tailwind CSS. Use when the user wants to create a wireframe, mockup, prototype, HTML artifact, layout sketch, or UI concept — even if they don't say 'wireframe' explicitly. Activate for requests like 'sketch a login page', 'mock up a dashboard', 'create an HTML prototype', or 'wireframe the settings screen'. Not for building full applications (use a template for that)."
---

# Wireframe

Generate a self-contained HTML wireframe powered by the `@tailwindcss/browser` playground — Tailwind v4 compiles client-side with no build step required.

## Scripts

### `create-wireframe.ts` Generate an HTML wireframe page with Tailwind CSS styling

Exports:

- `createWireframe({ body, outputPath, theme, }: { body?: string; outputPath: string; theme?: string; }): Promise<{ outputPath: string; }>`

```text
create-wireframe

Usage:
  $ create-wireframe --output wireframe.html --body "<div>Hello</div>"

Options:
  --output <path>  Output HTML file path
  --body <html>    Inline HTML body content
  --theme <name>   Theme name
  -h, --help       Display this message
--output <path> is required
```

> [!NOTE]
> Pass --body with your full HTML content to generate the wireframe in one command with no read-then-edit round trip. Always run from the project root — do not cd into the skill directory.
