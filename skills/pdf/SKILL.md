---
name: pdf
description: "Work with PDF files. Use whenever the user wants to do anything with a PDF: extracting text content, finding hyperlinks, pulling embedded images, reading document metadata such as author, title, and creation date, rendering pages as images, creating new PDFs, merging or splitting PDFs, filling form fields, rotating pages, adding page numbers, adding headers/footers, watermarking, or updating metadata. Activate whenever the user mentions a .pdf file or asks to read, parse, inspect, render, create, modify, merge, split, or fill one."
---

# PDF

Use the scripts in `scripts/` to work with PDF files.

## Scripts

Each script can also be used programmatically via its exported function.

### `extract-text.ts` Extract all text from a PDF

Export: `extractPdfText({ inputPath, mergePages? })`

Use when you need the full text content of a PDF, e.g. to summarize, search, or process its content.

```bash
tsx scripts/extract-text.ts <path> [--output <path>] [--no-merge]
```

- Merges all pages into a single string by default
- `--no-merge` returns text per page, separated by `---`
- `--output` writes to a file instead of stdout

### `extract-links.ts` Extract all URLs from a PDF

Export: `extractPdfLinks({ inputPath })`

Use when you need to find hyperlinks embedded in a PDF.

```bash
tsx scripts/extract-links.ts <path>
```

### `get-meta.ts` Get PDF metadata

Export: `getPdfMeta({ inputPath, parseDates? })`

Use when you need author, title, creation date, or other document properties.

```bash
tsx scripts/get-meta.ts <path> [--parse-dates]
```

- `--parse-dates` parses date strings into structured date objects

### `extract-images.ts` Extract images from a PDF

Export: `extractPdfImages({ inputPath, page? })`

Use when you need to save embedded images from a PDF. Extracts all pages by default.

```bash
tsx scripts/extract-images.ts <path> [--page <number>] [--output <dir>]
```

- `--page` page number to extract from (default: all pages)
- `--output` directory to save images (default: `<pdf-name>-images/`)
- Saves each image as a PNG file named `image-1.png`, `image-2.png`, etc.

### `render-pages.ts` Render PDF pages as images

Export: `renderPdfPages({ inputPath, page?, scale? })`

Use when you need a visual representation of PDF pages as PNG files.

```bash
tsx scripts/render-pages.ts <path> [--page <number>] [--scale <number>] [--output <dir>]
```

- `--page` page number to render (default: all pages)
- `--scale` render scale factor (default: `1.0`; use `2` for higher resolution)
- `--output` directory to save images (default: `<pdf-name>-pages/`)
- Saves each page as a PNG file named `page-1.png`, `page-2.png`, etc.; padding width matches total page count (e.g. `page-001.png` for a 100-page PDF)

## Creating and Modifying PDFs

### `insert-image.ts` Insert an image into an existing PDF

Export: `insertImage({ inputPath, outputPath, imagePath, x, y, page?, width?, height?, opacity? })`

Use when you need to overlay an image onto a specific page of an existing PDF at given coordinates.

```bash
tsx scripts/insert-image.ts <input> --image <path> --x <n> --y <n> --output <path> [--page <n>] [--width <n>] [--height <n>] [--opacity <0-1>]
```

- `--image` path to the image file to insert (JPEG or PNG)
- `--x` / `--y` position in PDF points from the bottom-left of the page (required)
- `--page` 1-indexed page number to insert on (default: `1`)
- `--width` / `--height` target dimensions in points; if only one is given, aspect ratio is preserved
- `--opacity` image opacity, 0-1 (default: `1`)

### `image-to-pdf.ts` Convert images to a PDF

Export: `imageToPdf({ imagePaths, outputPath, size? })`

Use when you need to convert one or more images (JPEG or PNG) into a PDF.

```bash
tsx scripts/image-to-pdf.ts <image1> [image2 ...] --output <path> [--size letter|a4|legal]
```

- Accepts one or more JPEG or PNG image paths; each becomes one page
- `--size` page size: `letter` (default), `a4`, or `legal`
- Images are centered and scaled to fit the page while preserving aspect ratio

### `create-pdf.ts` Create a new PDF from scratch

Export: `createPdf({ content, outputPath })`

Use when you need to generate a new PDF from text content.

```bash
tsx scripts/create-pdf.ts <content> --output <path>
```

- `--output` path to write the output PDF (required)
- Multi-line content is supported; new pages are added automatically when content overflows

### `watermark-pdf.ts` Add a diagonal watermark to every page

Export: `watermarkPdf({ inputPath, outputPath, text, opacity?, fontSize? })`

Use when you need to add large diagonal text across every page of a document.

```bash
tsx scripts/watermark-pdf.ts <input> --text <text> --output <path> [--opacity <0-1>] [--font-size <n>]
```

- `--text` watermark label (required)
- `--opacity` transparency, 0–1 (default: `0.3`)
- `--font-size` size of the watermark text in points (default: `60`)

### `merge-pdfs.ts` Merge multiple PDFs into one

Export: `mergePdfs({ inputPaths, outputPath })`

Use when you need to combine several PDF files into a single document.

```bash
tsx scripts/merge-pdfs.ts <input1> <input2> [...inputs] --output <path>
```

- Accepts two or more input PDF paths
- `--output` path to write the merged PDF (required)
- Pages are appended in the order the inputs are provided

### `split-pdf.ts` Extract pages from a PDF

Export: `splitPdf({ inputPath, outputPath, pages })`

Use when you need a single page or a range of pages from a larger document.

```bash
tsx scripts/split-pdf.ts <input> --output <path> [--page <n>] [--start <n> --end <n>]
```

- `--page` extract a single page by number (1-indexed)
- `--start` / `--end` extract a range of pages (inclusive, 1-indexed)
- `--output` path to write the output PDF (default: `<name>-split.pdf`)

### `fill-form.ts` Fill fields in a PDF form

Export: `fillForm({ inputPath, outputPath, fields, flatten? })`

Use when you need to populate a fillable PDF form.

```bash
tsx scripts/fill-form.ts <input> --output <path> --fields-file <json> [--flatten] [--list]
```

- `--fields-file` path to a JSON file containing a `{ "FieldName": "value" }` object; use `true`/`false` for checkboxes
- `--field` alternative: a `key=value` pair to set inline; repeat for each field (only suitable for a small number of simple field names)
- `--flatten` bake the filled values into the page so the form is no longer editable
- `--list` print all field names and types in the PDF without modifying it
- Field names are matched with trimmed whitespace, so trailing spaces in PDF field names are handled automatically

### `rotate-pages.ts` Rotate pages in a PDF

Export: `rotatePages({ inputPath, outputPath, rotation, pages? })`

Use when you need to rotate pages in a PDF.

```bash
tsx scripts/rotate-pages.ts <input> --output <path> [--rotation <90|180|270>] [--pages <1,2,3>]
```

- `--rotation` degrees to rotate clockwise (default: `90`)
- `--pages` comma-separated list of page numbers to rotate (default: all pages)

### `add-page-numbers.ts` Add page numbers and/or header/footer text to every page

Export: `addPageNumbers({ inputPath, outputPath, startAt?, position?, fontSize?, format?, header?, footer? })`

Use when you need to add page numbers, a header, or a footer to every page.

```bash
tsx scripts/add-page-numbers.ts <input> --output <path> [--start-at <n>] [--position <pos>] [--font-size <n>] [--format '<text>'] [--header <text>] [--footer <text>]
```

- `--start-at` first page number (default: `1`)
- `--position` where to place page numbers: `bottom-center` (default), `bottom-left`, `bottom-right`, `top-center`, `top-left`, `top-right`
- `--font-size` font size in points (default: `10`)
- `--format` label template using `{page}` and `{total}` (default: `{page} / {total}`)
- `--header` centered text drawn at the top of every page
- `--footer` centered text drawn at the bottom of every page

### `set-meta.ts` Set PDF metadata

Export: `setMeta({ inputPath, outputPath, title?, author?, subject?, keywords?, producer?, creator? })`

Use when you need to update the title, author, subject, keywords, producer, or creator fields of a PDF.

```bash
tsx scripts/set-meta.ts <input> --output <path> [--title <t>] [--author <a>] [--subject <s>] [--keywords <k1,k2>] [--producer <p>] [--creator <c>]
```

- Any combination of metadata fields can be set; unspecified fields are left unchanged
- `--keywords` accepts a comma-separated list
- Modification date is automatically updated
