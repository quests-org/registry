---
name: powerpoint
description: "Work with PowerPoint files. Use whenever the user wants to create presentations, generate PPTX files with slides, extract text content from PowerPoint files, read slide content, or parse .pptx documents. Activate whenever the user mentions a .pptx file, PowerPoint, presentation slides, or asks to create, read, or extract text from one."
---

# PowerPoint

Use the scripts in `scripts/` to create and read PowerPoint presentations.

## Scripts

Each script can also be used programmatically via its exported function.

### `create-presentation.ts` Create a PowerPoint presentation from a slides JSON array

Exports:

- `createPresentation({ slides, outputPath, }: { slides: SlideInput[]; outputPath: string; }): Promise<{ slideCount: number; outputPath: string; }>`

```text
create-presentation

Usage:
  $ create-presentation --output <path> [--slides <json>]

Options:
  --output <path>  Output PPTX file path
  --slides <json>  Slides JSON array
  -h, --help       Display this message
```

> [!NOTE]
> Each slide object requires a `title` and either a `body` string or a `bullets` string array, e.g. `[{"title":"Intro","body":"Hello"},{"title":"Points","bullets":["One","Two"]}]`.

### `extract-text.ts` Extract all text content from a PowerPoint file

Exports:

- `extractPptxText({ inputPath }: { inputPath: string; }): Promise<{ text: string; }>`

```text
extract-text

Usage:
  $ extract-text <path> [--output <path>]

Options:
  --output <path>  Write extracted text to a file
  -h, --help       Display this message
```
