---
name: markdown
description: "Convert between HTML and Markdown, and convert Markdown to PDF. Use when converting HTML to markdown, markdown to PDF, turndown, html-to-md, md-to-pdf."
---

# Markdown

Convert HTML to Markdown and Markdown to PDF.

## Scripts

### `html-to-md.ts` Convert an HTML file or string to Markdown

Exports:

- `convertHtmlFile({ inputPath, outputPath, gfm, headingStyle, codeBlockStyle, }: { codeBlockStyle?: CodeBlockStyle; gfm?: boolean; headingStyle?: HeadingStyle; inputPath: string; outputPath?: string; }): Promise<{ markdown: string; outputPath: string; } | { markdown: string; outputPath?: undefined; }>`
- `convertHtmlString({ html, gfm, headingStyle, codeBlockStyle, }: { codeBlockStyle?: CodeBlockStyle; gfm?: boolean; headingStyle?: HeadingStyle; html: string; }): string`

```text
html-to-md

Usage:
  $ html-to-md --html-file page.html --output page.md

Options:
  --html-file <path>          Input HTML file path
  --html <htmlString>         Inline HTML string input
  --output <path>             Output Markdown file path
  --gfm                       Enable GitHub-Flavored Markdown (default: true)
  --heading-style <style>     Heading style: atx or setext (default: atx)
  --code-block-style <style>  Code block style: fenced or indented (default: fenced)
  -h, --help                  Display this message
```

### `md-to-pdf.ts` Convert a Markdown file to PDF

Exports:

- `convertMdToPdf({ inputPath, outputPath, }: { inputPath: string; outputPath?: string; }): Promise<{ outputPath: string; }>`

```text
md-to-pdf

Usage:
  $ md-to-pdf document.md --output document.pdf

Options:
  --output <path>  Output PDF file path
  -h, --help       Display this message
```
