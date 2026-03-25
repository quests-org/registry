---
name: wireframe
description: "Generate HTML wireframes and prototypes with Tailwind CSS. Use when the user wants to create a wireframe, mockup, prototype, HTML artifact, layout sketch, or UI concept — even if they don't say 'wireframe' explicitly. Activate for requests like 'sketch a login page', 'mock up a dashboard', 'create an HTML prototype', or 'wireframe the settings screen'. Not for building full applications (use a template for that)."
---

# Wireframe

Generate a self-contained HTML wireframe powered by the `@tailwindcss/browser` playground — Tailwind v4 compiles client-side with no build step required.

## Usage

```bash
tsx scripts/create-wireframe.ts --output <path> [--theme <css>] [--body <html>]
```

| Argument          | Required | Description                         |
| ----------------- | -------- | ----------------------------------- |
| `--output <path>` | Yes      | Output HTML file path               |
| `--theme <css>`   | No       | CSS injected into `@theme {}` block |
| `--body <html>`   | No       | HTML string to use as `<body>`      |

**One-shot workflow:** Pass your HTML body directly via `--body` to generate the final wireframe in a single command with no read-then-edit round trip. Always run from the **project root** — do not `cd` into the skill directory.

```bash
tsx scripts/create-wireframe.ts --output output/page.html --body "<div class='p-4'>Hello</div>"
```

You do not need to read the generated file before editing — the full template structure is shown above. When you know the content upfront, use `--body` to skip the edit step.
