---
name: docx
description: "Work with Word documents (.docx). Use whenever the user wants to extract text from a .docx file, create a new Word document with headings/paragraphs/tables, fill placeholders in a .docx template, or detect template placeholders. Activate whenever the user mentions a .docx file, Word document, or asks to read, create, generate, fill, or template one."
---

# DOCX

Use the scripts in `scripts/` to work with Word documents.

## Scripts

Each script can also be used programmatically via its exported function.

### `extract-text.ts` Extract plain text from a .docx file

Export: `extractDocxText({ inputPath })`

Use when you need the full text content of a Word document, e.g. to summarize, search, or process its content.

```bash
tsx scripts/extract-text.ts <path> [--output <path>]
```

| Argument          | Required | Default | Description                    |
| ----------------- | -------- | ------- | ------------------------------ |
| `<path>`          | Yes      |         | Input .docx file               |
| `--output <path>` | No       | stdout  | Write extracted text to a file |

### `create-document.ts` Create a new Word document

Export: `createDocument({ outputPath, sections })`

Use when you need to generate a new .docx file with headings, paragraphs, and tables.

```bash
tsx scripts/create-document.ts --output <path> --sections <json>
tsx scripts/create-document.ts --output <path> --title <title>
```

| Argument            | Required | Default | Description                                          |
| ------------------- | -------- | ------- | ---------------------------------------------------- |
| `--output <path>`   | Yes      |         | Output .docx file path                               |
| `--sections <json>` | No       |         | JSON array of sections (see below)                   |
| `--title <title>`   | No       |         | Shorthand: creates a single section with an H1 title |

Each section has a `children` array of blocks:

```json
[
  {
    "children": [
      { "type": "heading", "level": 1, "text": "Title" },
      {
        "type": "paragraph",
        "text": "Body text",
        "bold": false,
        "italic": false
      },
      {
        "type": "table",
        "rows": [
          ["Header 1", "Header 2"],
          ["Cell 1", "Cell 2"]
        ]
      }
    ]
  }
]
```

Block types: `heading` (level 1-6), `paragraph`, `table` (rows as string arrays). Paragraphs and headings support `bold` and `italic`.

### `patch-document.ts` Replace placeholders in a .docx template

Export: `patchDocxDocument({ inputPath, outputPath, patches })`

Use when you have a .docx template with `{{placeholder}}` markers and want to fill them with values.

```bash
tsx scripts/patch-document.ts <input> --output <path> --patches-file <json>
```

| Argument                | Required | Default | Description                                    |
| ----------------------- | -------- | ------- | ---------------------------------------------- |
| `<input>`               | Yes      |         | Input .docx template file                      |
| `--output <path>`       | Yes      |         | Output .docx file path                         |
| `--patches-file <json>` | Yes      |         | JSON file mapping placeholder names to strings |

The patches JSON file maps placeholder names (without delimiters) to replacement strings:

```json
{ "name": "John Doe", "date": "2026-03-20", "amount": "$5,000" }
```

### `detect-placeholders.ts` List placeholders in a .docx template

Export: `detectPlaceholders({ inputPath })`

Use when you need to discover what placeholders a template expects before patching it.

```bash
tsx scripts/detect-placeholders.ts <path>
```

| Argument | Required | Description               |
| -------- | -------- | ------------------------- |
| `<path>` | Yes      | Input .docx template file |
