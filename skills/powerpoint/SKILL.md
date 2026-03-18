---
name: powerpoint
description: "Work with PowerPoint files. Use whenever the user wants to create presentations, generate PPTX files with slides, extract text content from PowerPoint files, read slide content, or parse .pptx documents. Activate whenever the user mentions a .pptx file, PowerPoint, presentation slides, or asks to create, read, or extract text from one."
---

# PowerPoint

Use the scripts in `skills/powerpoint/scripts/` to create and read PowerPoint presentations.

## Scripts

Each script can also be used programmatically via its exported function.

### `create-presentation.ts` Create a new PowerPoint presentation

Export: `createPresentation({ title, slides, outputPath })`

```bash
tsx skills/powerpoint/scripts/create-presentation.ts --title <title> --output <path> --slides <json>
```

| Argument          | Required | Default | Description                                                                             |
| ----------------- | -------- | ------- | --------------------------------------------------------------------------------------- |
| `--title <title>` | Yes      |         | Presentation title (shown on the first slide)                                           |
| `--output <path>` | Yes      |         | Output .pptx file path                                                                  |
| `--slides <json>` | No       | `[]`    | JSON array of slides: `[{"title":"…","body":"…"}]` or `[{"title":"…","bullets":["…"]}]` |

### `extract-text.ts` Extract text from a PowerPoint file

Export: `extractPptxText({ inputPath })`

```bash
tsx skills/powerpoint/scripts/extract-text.ts <path> [--output <path>]
```

| Argument          | Required | Default | Description                    |
| ----------------- | -------- | ------- | ------------------------------ |
| `<path>`          | Yes      |         | Input .pptx file               |
| `--output <path>` | No       |         | Write extracted text to a file |
