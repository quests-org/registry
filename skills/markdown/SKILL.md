---
name: markdown
description: "Convert between HTML and Markdown, and convert Markdown to PDF. Use when converting HTML to markdown, markdown to PDF, turndown, html-to-md, md-to-pdf."
---

# Markdown

Convert HTML to Markdown and Markdown to PDF.

## Scripts

### `md-to-pdf.ts` Convert a Markdown file to PDF

Export: `convertMdToPdf({ inputPath, outputPath? })`

```bash
tsx scripts/md-to-pdf.ts <path> [--output <path>]
```

| Argument          | Required | Default                   | Description          |
| ----------------- | -------- | ------------------------- | -------------------- |
| `<path>`          | Yes      |                           | Input Markdown file  |
| `--output <path>` | No       | same name with `.pdf` ext | Output PDF file path |

### `html-to-md.ts` Convert an HTML file to Markdown

Export: `convertHtmlFile({ inputPath, outputPath?, gfm?, headingStyle?, codeBlockStyle? })`

```bash
tsx scripts/html-to-md.ts <path> [--output <path>] [--gfm] [--no-gfm] [--heading-style <style>] [--code-block-style <style>]
```

| Argument                     | Required | Default  | Description                              |
| ---------------------------- | -------- | -------- | ---------------------------------------- |
| `<path>`                     | Yes      |          | Input HTML file                          |
| `--output <path>`            | No       | stdout   | Output Markdown file path                |
| `--gfm` / `--no-gfm`         | No       | `true`   | Enable GitHub-Flavored Markdown          |
| `--heading-style <style>`    | No       | `atx`    | Heading style: `atx` or `setext`         |
| `--code-block-style <style>` | No       | `fenced` | Code block style: `fenced` or `indented` |

### `html-string-to-md.ts` Convert an HTML string to Markdown

Export: `convertHtmlString({ html, gfm?, headingStyle?, codeBlockStyle? })`

```bash
tsx scripts/html-string-to-md.ts <html-string> [--gfm] [--no-gfm] [--heading-style <style>] [--code-block-style <style>]
```

| Argument                     | Required | Default  | Description                              |
| ---------------------------- | -------- | -------- | ---------------------------------------- |
| `<html-string>`              | Yes      |          | HTML string to convert                   |
| `--gfm` / `--no-gfm`         | No       | `true`   | Enable GitHub-Flavored Markdown          |
| `--heading-style <style>`    | No       | `atx`    | Heading style: `atx` or `setext`         |
| `--code-block-style <style>` | No       | `fenced` | Code block style: `fenced` or `indented` |
