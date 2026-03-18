---
name: background-removal
description: "Remove backgrounds from images. Use when removing image backgrounds, extracting foreground subjects, generating image masks, or producing transparent-background PNGs from photos. Activate whenever the user wants to isolate a subject, make a background transparent, or extract a silhouette mask from an image."
---

# Background Removal

Remove backgrounds from images using `@imgly/background-removal-node` — runs fully locally with no API keys.

## Scripts

### `remove-background.ts` Remove background from an image

Export: `removeImageBackground({ inputPath, outputPath, format?, outputType?, model?, debug? })`

```bash
tsx skills/background-removal/scripts/remove-background.ts <path> [--output <path>] [--format <fmt>] [--type <type>] [--model <size>] [--debug]
```

| Argument          | Required | Default              | Description                                            |
| ----------------- | -------- | -------------------- | ------------------------------------------------------ |
| `<path>`          | Yes      |                      | Input image file                                       |
| `--output <path>` | No       | `<name>-no-bg.<ext>` | Output image path                                      |
| `--format <fmt>`  | No       | `image/png`          | Output format: `image/png`, `image/jpeg`, `image/webp` |
| `--type <type>`   | No       | `foreground`         | Output type: `foreground`, `background`, `mask`        |
| `--model <size>`  | No       | `medium`             | Model size: `small` (~40 MB), `medium` (~80 MB)        |
| `--debug`         | No       | `false`              | Enable verbose debug logging                           |

### Output Types

- **`foreground`** — Subject with transparent background (default)
- **`background`** — Background only, subject removed
- **`mask`** — Grayscale alpha mask of the subject

### Supported Input Formats

`.jpg`, `.jpeg`, `.png`, `.webp`

### Known Limitations

- Fine hair/fur may not be perfectly separated at fine edges
- Busy or similar-colored backgrounds reduce accuracy
- Very large images may require increased Node.js memory (`--max-old-space-size=4096`)
- GIF not supported
