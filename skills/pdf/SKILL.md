---
name: pdf
description: "Work with PDF files. Use when reading, extracting, or converting PDF content — including converting PDFs to Markdown, extracting text, or processing PDF documents programmatically."
---

# PDF

Capabilities for working with PDF files.

## PDF to Markdown

Convert PDF files to Markdown format.

## Important: Use the Provided Script

This skill includes a **ready-to-use, tested conversion script** at `.agents/skills/pdf/scripts/pdf-to-markdown/cli.ts`.

**Do not build your own PDF parsing implementation.** Use this script instead. It handles edge cases, error handling, and proper PDF parsing that you should not recreate from scratch.

## Quick Start - Use This First

1. **Install dependencies:**

   ```bash
   pnpm add pdf-parse
   ```

2. **Run the provided script on your PDF:**

   ```bash
   # Basic conversion
   tsx .agents/skills/pdf/scripts/pdf-to-markdown/cli.ts --file ./document.pdf

   # Custom output path
   tsx .agents/skills/pdf/scripts/pdf-to-markdown/cli.ts \
     --file ./doc.pdf \
     --output ./output/doc.md
   ```

3. **For batch conversion,** edit `.agents/skills/pdf/scripts/pdf-to-markdown/cli.ts` directly to add multi-file support. Do not create a new script.

## Understanding the Implementation

The provided script includes:

- **CLI entry point:** `.agents/skills/pdf/scripts/pdf-to-markdown/cli.ts` - argument parsing and orchestration
- **Core logic:** `.agents/skills/pdf/scripts/pdf-to-markdown/convert.ts` - PDF parsing using `pdf-parse`'s `PDFParse` class

If you need custom behavior (e.g., different output formatting), examine and adapt the `textToMarkdown()` function in `convert.ts` rather than reimplementing the entire PDF parsing pipeline.

## CLI Options

| Option            | Required | Description                                      |
| ----------------- | -------- | ------------------------------------------------ |
| `--file <path>`   | Yes      | Input PDF file                                   |
| `--output <path>` | No       | Output Markdown path (default: input name + .md) |
| `--help`          | No       | Show usage information                           |

## Output Format (JSON)

The script outputs a JSON result on completion:

```json
{
  "success": true,
  "input": "/path/to/input.pdf",
  "output": "/path/to/output.md",
  "wordCount": 1523,
  "pages": 5,
  "warnings": ["Tables may not be accurately converted"]
}
```

**Always check the `success` field** to determine if conversion worked.

## Batch Converting Multiple PDFs

Edit `.agents/skills/pdf/scripts/pdf-to-markdown/cli.ts` directly to add support for a `--dir` flag or multiple `--file` arguments. **Do not create a new script.** The existing script is the right place to add this logic.

## Supported Elements

- Text extraction from digital PDFs
- Headings (detected by font size heuristics)
- Paragraphs
- Basic lists
- Links (when embedded in PDF)

## Known Limitations

- **Tables**: Very limited support; may not render correctly
- **Multi-column layouts**: Text may interleave between columns
- **Scanned PDFs**: NOT supported (requires OCR - see alternatives below)
- **Images**: NOT extracted (PDF images are not included in output)
- **Complex formatting**: May be simplified or lost
- **Password-protected PDFs**: NOT supported

## Customization

If you need to modify how text is converted to Markdown:

1. **Examine** `.agents/skills/pdf/scripts/pdf-to-markdown/convert.ts`
2. **Adapt** the `textToMarkdown()` function to suit your needs
3. **Copy** the modified version into your own script if needed

**Do not try to rewrite the PDFParse initialization or buffer handling** - use what's provided as-is.
