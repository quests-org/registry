---
name: pdf
description: "Work with PDF files. Use whenever the user wants to do anything with a PDF: extracting text content, finding hyperlinks, pulling embedded images, reading document metadata such as author, title, and creation date, rendering pages as images, creating new PDFs, merging or splitting PDFs, filling form fields, rotating pages, adding page numbers, adding headers/footers, watermarking, or updating metadata. Activate whenever the user mentions a .pdf file or asks to read, parse, inspect, render, create, modify, merge, split, or fill one."
---

# PDF

Use the scripts in `scripts/` to work with PDF files.

## Scripts

Each script can also be used programmatically via its exported function.

### `add-page-numbers.ts` Add page numbers (and optional header/footer text) to a PDF

Exports:

- `addPageNumbers({ inputPath, outputPath, startAt, position, fontSize, format, header, footer, }: { inputPath: string; outputPath: string; startAt?: number; position?: "bottom-center" | "bottom-left" | "bottom-right" | "top-center" | "top-left" | "top-right"; fontSize?: number; format?: string; header?: string; footer?: string; }): Promise<{ pageCount: number; outputPath: string; }>`

```text
add-page-numbers

Usage:
  $ add-page-numbers input.pdf --output output.pdf

Options:
  --output <path>   Output PDF file path
  --start-at <n>    Starting page number value (default: 1)
  --position <pos>  Label position on each page (default: bottom-center)
  --font-size <n>   Font size for header/footer and page labels (default: 10)
  --format <text>   Page label format, e.g. {page} / {total}
  --header <text>   Optional header text
  --footer <text>   Optional footer text
  -h, --help        Display this message
```

### `create-pdf.ts` Create a simple text-based PDF document

Exports:

- `createPdf({ content, outputPath, }: { content: string; outputPath: string; }): Promise<{ pageCount: number; outputPath: string; }>`

```text
create-pdf

Usage:
  $ create-pdf --content "Hello world" --output output.pdf

Options:
  --content <text>  Text content for the PDF
  --output <path>   Output PDF file path
  -h, --help        Display this message
```

### `extract-images.ts` Extract embedded images from a PDF and save them as PNG files

Exports:

- `extractPdfImages({ inputPath, page, }: { inputPath: string; page?: number; }): Promise<ExtractedImageObject[]>`

```text
extract-images

Usage:
  $ extract-images document.pdf --output ./images

Options:
  --page <number>  Only extract images from this page
  --output <dir>   Output directory for extracted images
  -h, --help       Display this message
```

### `extract-links.ts` Extract all hyperlinks from a PDF

Exports:

- `extractPdfLinks({ inputPath }: { inputPath: string; }): Promise<{ totalPages: number; links: string[]; }>`

```text
extract-links

Usage:
  $ extract-links <filePath>

Options:
  -h, --help  Display this message
```

### `extract-text.ts` Extract all text content from a PDF

Exports:

- `extractPdfText({ inputPath, mergePages, }: { inputPath: string; mergePages?: boolean; }): Promise<{ totalPages: number; text: string; } | { totalPages: number; text: string[]; }>`

```text
extract-text

Usage:
  $ extract-text document.pdf

Options:
  --output <path>  Write extracted text to a file
  --no-merge       Return text as separate per-page blocks (default: true)
  -h, --help       Display this message
```

> [!NOTE]
> By default all pages are merged into a single string. Pass --no-merge to get text per page as separate blocks.

### `fill-form.ts` Fill PDF form fields by name and optionally flatten the form

Exports:

- `fillForm({ inputPath, outputPath, fields, flatten, }: { inputPath: string; outputPath: string; fields: Record<string, FillFormValue>; flatten?: boolean; }): Promise<{ filled: string[]; skipped: string[]; outputPath: string; warnings: string[]; }>`
- `parseFillFormFieldsJson(raw: string): Record<string, FillFormValue>`

```text
fill-form

Usage:
  $ fill-form form.pdf --json '{"name":"John","agree":true}' --output filled.pdf

Options:
  --json <inlineJson>  Inline JSON object of field values
  --json-file <path>   Path to JSON file of field values
  --flatten            Flatten filled fields into static PDF content
  --list               List available form fields
  --output <path>      Output PDF file path
  -h, --help           Display this message
```

> [!NOTE]
> One of --json (inline JSON object) or --json-file (path to JSON file) is required. Each key is a field name; values are strings, booleans (for checkboxes), or string arrays (for multi-select list boxes).
> Use --list to discover available field names before filling. Field names are matched with trimmed whitespace.
> Use --flatten to bake filled values into the page so the form is no longer editable.

### `get-meta.ts` Read metadata and document info from a PDF

Exports:

- `getPdfMeta({ inputPath, parseDates, }: { inputPath: string; parseDates?: boolean; }): Promise<{ info: Record<string, any>; metadata: Metadata; }>`

```text
get-meta

Usage:
  $ get-meta document.pdf

Options:
  --parse-dates  Parse PDF date fields into date-like values
  -h, --help     Display this message
```

### `image-to-pdf.ts` Convert one or more images into a PDF document, one image per page

Exports:

- `imageToPdf({ imagePaths, outputPath, size, }: { imagePaths: string[]; outputPath: string; size?: "letter" | "a4" | "legal"; }): Promise<{ pageCount: number; outputPath: string; }>`

```text
image-to-pdf

Usage:
  $ image-to-pdf photo1.jpg photo2.jpg --output output.pdf

Options:
  --output <path>  Output PDF file path
  --size <size>    Page size: letter, a4, or legal (default: letter)
  -h, --help       Display this message
```

### `insert-image.ts` Insert an image onto a PDF page at specified coordinates

Exports:

- `insertImage({ inputPath, outputPath, imagePath, page, x, y, width, height, opacity, }: { inputPath: string; outputPath: string; imagePath: string; page?: number; x: number; y: number; width?: number; height?: number; opacity?: number; }): Promise<{ pageCount: number; outputPath: string; }>`

```text
insert-image

Usage:
  $ insert-image document.pdf --image logo.png --x 50 --y 50 --output output.pdf

Options:
  --image <path>   Path to image file to insert
  --x <n>          X position in PDF points
  --y <n>          Y position in PDF points
  --output <path>  Output PDF file path
  --page <n>       1-based page number to edit
  --width <n>      Draw width in PDF points
  --height <n>     Draw height in PDF points
  --opacity <n>    Image opacity between 0 and 1
  -h, --help       Display this message
```

### `merge-pdfs.ts` Merge multiple PDF files into a single document

Exports:

- `mergePdfs({ inputPaths, outputPath, }: { inputPaths: string[]; outputPath: string; }): Promise<{ pageCount: number; outputPath: string; }>`

```text
merge-pdfs

Usage:
  $ merge-pdfs a.pdf b.pdf c.pdf --output merged.pdf

Options:
  --output <path>  Output merged PDF file path
  -h, --help       Display this message
```

### `render-pages.ts` Render PDF pages as PNG images

Exports:

- `renderPdfPages({ inputPath, page, scale, }: { inputPath: string; page?: number; scale?: number; }): Promise<{ numPages: number; results: { page: number; buffer: ArrayBuffer; }[]; }>`

```text
render-pages

Usage:
  $ render-pages document.pdf --output ./pages

Options:
  --page <number>   Render only this page number
  --scale <number>  Render scale multiplier
  --output <dir>    Output directory for rendered PNG pages
  -h, --help        Display this message
```

> [!NOTE]
> Output files are named `page-1.png`, `page-2.png`, etc. For PDFs with 10+ pages the number is zero-padded to match the total page count width (e.g. `page-001.png` for a 100-page PDF). Use --scale 2 for higher resolution output.

### `rotate-pages.ts` Rotate pages in a PDF by 90, 180, or 270 degrees

Exports:

- `rotatePages({ inputPath, outputPath, rotation, pages, }: { inputPath: string; outputPath: string; rotation: 90 | 180 | 270; pages?: number[]; }): Promise<{ rotatedCount: number; pageCount: number; outputPath: string; }>`

```text
rotate-pages

Usage:
  $ rotate-pages document.pdf --output rotated.pdf --rotation 90

Options:
  --output <path>     Output PDF file path
  --rotation <value>  Rotation angle: 90, 180, or 270 (default: 90)
  --pages <value>     Comma-separated 1-based page numbers
  -h, --help          Display this message
```

### `set-meta.ts` Set metadata fields (title, author, subject, keywords) on a PDF

Exports:

- `setMeta({ inputPath, outputPath, title, author, subject, keywords, producer, creator, }: { inputPath: string; outputPath: string; title?: string; author?: string; subject?: string; keywords?: string[]; producer?: string; creator?: string; }): Promise<{ outputPath: string; }>`

```text
set-meta

Usage:
  $ set-meta document.pdf --title "My Doc" --output output.pdf

Options:
  --output <path>     Output PDF file path
  --title <value>     Document title
  --author <value>    Document author
  --subject <value>   Document subject
  --keywords <value>  Comma-separated document keywords
  --producer <value>  PDF producer metadata value
  --creator <value>   PDF creator metadata value
  -h, --help          Display this message
```

### `split-pdf.ts` Extract a single page or page range from a PDF into a new file

Exports:

- `splitPdf({ inputPath, outputPath, pages, }: { inputPath: string; outputPath: string; pages: number | { start: number; end: number; }; }): Promise<{ pageCount: number; outputPath: string; }>`

```text
split-pdf

Usage:
  $ split-pdf document.pdf --page 3 --output page3.pdf

Options:
  --output <path>  Output PDF file path
  --page <n>       Single 1-based page number to extract
  --start <n>      Start page (inclusive) for range extraction
  --end <n>        End page (inclusive) for range extraction
  -h, --help       Display this message
```

### `watermark-pdf.ts` Stamp diagonal watermark text on every page of a PDF

Exports:

- `watermarkPdf({ inputPath, outputPath, text, opacity, fontSize, }: { inputPath: string; outputPath: string; text: string; opacity?: number; fontSize?: number; }): Promise<{ pageCount: number; outputPath: string; }>`

```text
watermark-pdf

Usage:
  $ watermark-pdf document.pdf --text "DRAFT" --output watermarked.pdf

Options:
  --text <text>    Watermark text
  --output <path>  Output PDF file path
  --opacity <n>    Watermark opacity between 0 and 1
  --font-size <n>  Watermark font size in points
  -h, --help       Display this message
```
