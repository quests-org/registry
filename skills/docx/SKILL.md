---
name: docx
description: "Work with Word documents (.docx). Use whenever the user wants to extract text from a .docx file, create a new Word document with headings/paragraphs/tables, fill placeholders in a .docx template, or detect template placeholders. Activate whenever the user mentions a .docx file, Word document, or asks to read, create, generate, fill, or template one."
---

# DOCX

Use the scripts in `scripts/` to work with Word documents.

## Scripts

Each script can also be used programmatically via its exported function.

### `create-document.ts` Create a Word document from a structured sections and blocks JSON input

Exports:

- `createDocument({ outputPath, sections, }: { outputPath: string; sections: SectionInput[]; }): Promise<{ outputPath: string; }>`

```text
create-document

Usage:
  $ create-document --output <path> --sections <json>

Options:
  --output <path>    Output DOCX file path
  --sections <json>  Sections JSON input
  -h, --help         Display this message
```

> [!NOTE]
> Sections contain a `children` array of block objects. Block types: `heading` (level 1–6), `paragraph`, `table` (rows as string arrays). Headings and paragraphs support optional `bold` and `italic` fields.

### `detect-placeholders.ts` List all placeholder token names in a Word document template

Exports:

- `detectPlaceholders({ inputPath }: { inputPath: string; }): Promise<{ placeholders: string[]; }>`

```text
detect-placeholders

Usage:
  $ detect-placeholders <path>

Options:
  -h, --help  Display this message
```

### `extract-text.ts` Extract all text content from a Word document

Exports:

- `extractDocxText({ inputPath }: { inputPath: string; }): Promise<{ text: string; messages: (Warning | Error)[]; }>`

```text
extract-text

Usage:
  $ extract-text <path> [--output <path>]

Options:
  --output <path>  Write extracted text to a file
  -h, --help       Display this message
```

### `patch-document.ts` Replace placeholder tokens in a Word document template with values

Exports:

- `patchDocxDocument({ inputPath, outputPath, patches, }: { inputPath: string; outputPath: string; patches: Record<string, string>; }): Promise<{ outputPath: string; }>`

```text
patch-document

Usage:
  $ patch-document <input> --output <path> --patches-file <json>

Options:
  --output <path>        Output DOCX file path
  --patches-file <path>  JSON file of patch key/value pairs
  -h, --help             Display this message
```

> [!NOTE]
> The patches JSON maps placeholder names without their `{{` `}}` delimiters to replacement strings, e.g. `{ "name": "John", "date": "2026-01-01" }`. Run detect-placeholders first to discover what keys a template expects.
