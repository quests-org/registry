---
name: pdf
description: "Work with PDF files. Use whenever the user wants to do anything with a PDF: extracting text content, finding hyperlinks, pulling embedded images, reading document metadata such as author, title, and creation date, rendering pages as images, creating new PDFs, modifying existing PDFs, or merging multiple PDFs together. Activate whenever the user mentions a .pdf file or asks to read, parse, inspect, render, create, modify, or merge one."
---

# PDF

Use the scripts in `.agents/skills/pdf/scripts/` to work with PDF files.

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

### `render-pages.ts` — Render PDF pages as images

Use when you need a visual representation of PDF pages as PNG files.

```bash
tsx .agents/skills/pdf/scripts/render-pages.ts <path> [--page <number>] [--scale <number>] [--output <dir>]
```

- `--page` page number to render (default: all pages)
- `--scale` render scale factor (default: `1.0`; use `2` for higher resolution)
- `--output` directory to save images (default: `<pdf-name>-pages/`)
- Saves each page as a PNG file named `page-01.png`, `page-02.png`, etc.

## Creating and Modifying PDFs

### `create-pdf.ts` — Create a new PDF from scratch

Use when you need to generate a new PDF with a title and text content.

```bash
tsx .agents/skills/pdf/scripts/create-pdf.ts <content> --title <title> --output <path>
```

- `--title` document title (shown as heading and set as PDF metadata)
- `--output` path to write the output PDF (required)
- Multi-line content is supported; new pages are added automatically when content overflows

### `modify-pdf.ts` — Modify an existing PDF

Use when you need to add a watermark to all pages or append a new page with text.

```bash
tsx .agents/skills/pdf/scripts/modify-pdf.ts <input> --output <path> [--watermark <text>] [--append-text <text>]
```

- `--output` path to write the modified PDF (required)
- `--watermark` adds diagonal semi-transparent watermark text to every page
- `--append-text` appends a new page with the given text content

### `merge-pdfs.ts` — Merge multiple PDFs into one

Use when you need to combine several PDF files into a single document.

```bash
tsx .agents/skills/pdf/scripts/merge-pdfs.ts <input1> <input2> [...inputs] --output <path>
```

- Accepts two or more input PDF paths
- `--output` path to write the merged PDF (required)
- Pages are appended in the order the inputs are provided
