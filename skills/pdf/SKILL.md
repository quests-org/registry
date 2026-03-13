---
name: pdf
description: "Work with PDF files. Use whenever the user wants to do anything with a PDF: extracting text content, finding hyperlinks, pulling embedded images, or reading document metadata such as author, title, and creation date. Activate whenever the user mentions a .pdf file or asks to read, parse, or inspect one."
---

# PDF

Use the scripts in `.agents/skills/pdf/scripts/` to work with PDF files. Install dependencies with `pnpm add unpdf sharp @napi-rs/canvas` if needed.

## Scripts

### `extract-text.ts` — Extract all text from a PDF

Use when you need the full text content of a PDF, e.g. to summarize, search, or process its content.

```bash
tsx .agents/skills/pdf/scripts/extract-text.ts <path> [--output <path>] [--no-merge]
```

- Merges all pages into a single string by default
- `--no-merge` returns text per page, separated by `---`
- `--output` writes to a file instead of stdout

### `extract-links.ts` — Extract all URLs from a PDF

Use when you need to find hyperlinks embedded in a PDF.

```bash
tsx .agents/skills/pdf/scripts/extract-links.ts <path>
```

### `get-meta.ts` — Get PDF metadata

Use when you need author, title, creation date, or other document properties.

```bash
tsx .agents/skills/pdf/scripts/get-meta.ts <path> [--parse-dates]
```

- `--parse-dates` parses date strings into structured date objects

### `extract-images.ts` — Extract images from a PDF

Use when you need to save embedded images from a PDF. Extracts all pages by default.

```bash
tsx .agents/skills/pdf/scripts/extract-images.ts <path> [--page <number>] [--output <dir>]
```

- `--page` page number to extract from (default: all pages)
- `--output` directory to save images (default: `<pdf-name>-images/`)
- Saves each image as a PNG file named `image-1.png`, `image-2.png`, etc.
