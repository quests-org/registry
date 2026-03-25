---
name: sharp-images
description: "Pixel-level image manipulation with sharp. Use when the user wants to resize, crop, rotate, flip, convert format (png, jpeg, webp, avif, gif, tiff), compress, optimize file size, watermark, composite, annotate, adjust brightness/saturation/contrast/sharpness, blur, grayscale, or read image metadata."
---

# Images

Resize, crop, rotate, convert, composite, adjust, optimize, and inspect images using [sharp](https://sharp.pixelplumbing.com/).

For the complete Sharp API reference, see [references/REFERENCE.md](references/REFERENCE.md).

## Scripts

### `resize.ts` Resize an image

Export: `resizeImage({ inputPath, outputPath, width?, height?, fit?, withoutEnlargement?, background?, kernel?, position? })`

```bash
tsx skills/sharp-images/scripts/resize.ts <path> [--width <px>] [--height <px>] [--fit <mode>] [--no-enlarge] [--output <path>]
```

| Argument           | Required | Default | Description                                                      |
| ------------------ | -------- | ------- | ---------------------------------------------------------------- |
| `<path>`           | Yes      |         | Input image file                                                 |
| `--width <px>`     | No       |         | Target width in pixels                                           |
| `--height <px>`    | No       |         | Target height in pixels                                          |
| `--fit <mode>`     | No       | `cover` | `cover`, `contain`, `fill`, `inside`, `outside`                  |
| `--no-enlarge`     | No       |         | Don't enlarge if already smaller                                 |
| `--kernel <k>`     | No       |         | `nearest`, `linear`, `cubic`, `mitchell`, `lanczos2`, `lanczos3` |
| `--background <c>` | No       |         | Background color for `contain` fit                               |
| `--output <path>`  | No       | auto    | Output path (defaults to `<name>-resized.<ext>`)                 |

If neither `--width` nor `--height` is given, prints image metadata instead.

### `crop.ts` Crop an image

Export: `cropImage({ inputPath, outputPath, width, height, left?, top?, strategy? })`

```bash
tsx skills/sharp-images/scripts/crop.ts <path> --width <px> --height <px> [--left <px>] [--top <px>] [--strategy <entropy|attention>] [--output <path>]
```

| Argument          | Required | Default   | Description                             |
| ----------------- | -------- | --------- | --------------------------------------- |
| `<path>`          | Yes      |           | Input image file                        |
| `--width <px>`    | Yes      |           | Crop width                              |
| `--height <px>`   | Yes      |           | Crop height                             |
| `--left <px>`     | No       |           | X offset (for manual region extraction) |
| `--top <px>`      | No       |           | Y offset (for manual region extraction) |
| `--strategy <s>`  | No       | `entropy` | Smart crop: `entropy` or `attention`    |
| `--output <path>` | No       | auto      | Output path                             |

When `--left` and `--top` are given, extracts an exact region. Otherwise, uses smart cropping with the given strategy.

### `rotate.ts` Rotate, flip, or mirror an image

Export: `rotateImage({ inputPath, outputPath, angle?, flip?, flop?, background? })`

```bash
tsx skills/sharp-images/scripts/rotate.ts <path> [--angle <degrees>] [--flip] [--flop] [--background <color>] [--output <path>]
```

| Argument               | Required | Default | Description                                       |
| ---------------------- | -------- | ------- | ------------------------------------------------- |
| `<path>`               | Yes      |         | Input image file                                  |
| `--angle <degrees>`    | No       |         | Rotation angle (multiples of 90 avoid background) |
| `--flip`               | No       |         | Vertical flip                                     |
| `--flop`               | No       |         | Horizontal mirror                                 |
| `--background <color>` | No       |         | Background color for non-90° rotations            |
| `--output <path>`      | No       | auto    | Output path                                       |

### `convert.ts` Convert image format

Export: `convertImage({ inputPath, outputPath, format, quality? })`

```bash
tsx skills/sharp-images/scripts/convert.ts <path> --format <fmt> [--quality <1-100>] [--output <path>]
```

| Argument            | Required | Default        | Description                                                        |
| ------------------- | -------- | -------------- | ------------------------------------------------------------------ |
| `<path>`            | Yes      |                | Input image file                                                   |
| `--format <fmt>`    | Yes      |                | `png`, `jpeg`, `webp`, `avif`, `gif`, `tiff`, `heif`, `jp2`, `jxl` |
| `--quality <1-100>` | No       | format default | Compression quality                                                |
| `--output <path>`   | No       | auto           | Output path                                                        |

### `optimize.ts` Optimize image file size

Export: `optimizeImage({ inputPath, outputPath, quality?, effort?, progressive?, lossless? })`

```bash
tsx skills/sharp-images/scripts/optimize.ts <path> [--quality <1-100>] [--effort <0-10>] [--progressive] [--lossless] [--output <path>]
```

| Argument            | Required | Default        | Description                           |
| ------------------- | -------- | -------------- | ------------------------------------- |
| `<path>`            | Yes      |                | Input image file                      |
| `--quality <1-100>` | No       | format default | Compression quality                   |
| `--effort <0-10>`   | No       | format default | CPU effort (higher = smaller, slower) |
| `--progressive`     | No       |                | Progressive/interlace encoding        |
| `--lossless`        | No       |                | Lossless mode (WebP, AVIF)            |
| `--output <path>`   | No       | auto           | Output path                           |

Re-encodes in the same format. Reports original vs optimized size.

### `composite.ts` Overlay or watermark images

Export: `compositeImages({ inputPath, outputPath, overlayPath, gravity?, top?, left?, blend?, tile?, opacity? })`

```bash
tsx skills/sharp-images/scripts/composite.ts <base-image> --overlay <image> [--gravity <pos>] [--top <px>] [--left <px>] [--blend <mode>] [--opacity <0-1>] [--tile] [--output <path>]
```

| Argument            | Required | Default  | Description                                   |
| ------------------- | -------- | -------- | --------------------------------------------- |
| `<base-image>`      | Yes      |          | Base image file                               |
| `--overlay <image>` | Yes      |          | Image to overlay                              |
| `--gravity <pos>`   | No       | `center` | Gravity: `north`, `southeast`, `center`, etc. |
| `--top <px>`        | No       |          | Exact Y position (overrides gravity)          |
| `--left <px>`       | No       |          | Exact X position (overrides gravity)          |
| `--blend <mode>`    | No       | `over`   | Blend mode (see reference)                    |
| `--opacity <0-1>`   | No       | `1`      | Overlay opacity                               |
| `--tile`            | No       |          | Repeat overlay as tiles                       |
| `--output <path>`   | No       | auto     | Output path                                   |

### `annotate.ts` Draw bounding boxes and labels on an image

Export: `annotateImage({ inputPath, outputPath, annotations, strokeWidth?, fontSize? })`

```bash
tsx skills/sharp-images/scripts/annotate.ts <image> --json <annotations> [--stroke-width <px>] [--font-size <px>] [--output <path>]
```

| Argument              | Required | Default | Description                                           |
| --------------------- | -------- | ------- | ----------------------------------------------------- |
| `<image>`             | Yes      |         | Input image file                                      |
| `--json <data>`       | Yes      |         | Annotations as inline JSON array or path to JSON file |
| `--stroke-width <px>` | No       | `2`     | Border thickness                                      |
| `--font-size <px>`    | No       | `14`    | Label text size                                       |
| `--output <path>`     | No       | auto    | Output path                                           |

Each annotation object: `{ left, top, width, height, label?, color? }`. Colors cycle automatically when omitted.

Renders SVG shapes directly onto the image — no extra dependencies needed. Useful for marking up regions, drawing detection results, or highlighting areas for the user.

### `adjust.ts` Adjust image appearance

Export: `adjustImage({ inputPath, outputPath, brightness?, saturation?, hue?, lightness?, sharpen?, blur?, gamma?, grayscale?, negate?, normalize?, tint?, threshold?, median? })`

```bash
tsx skills/sharp-images/scripts/adjust.ts <path> [options] [--output <path>]
```

| Argument              | Required | Default | Description                           |
| --------------------- | -------- | ------- | ------------------------------------- |
| `--brightness <n>`    | No       |         | Brightness multiplier (1 = no change) |
| `--saturation <n>`    | No       |         | Saturation multiplier (1 = no change) |
| `--hue <degrees>`     | No       |         | Hue rotation in degrees               |
| `--lightness <n>`     | No       |         | Lightness adjustment (additive)       |
| `--sharpen <sigma>`   | No       |         | Sharpen with given sigma              |
| `--blur <sigma>`      | No       |         | Gaussian blur (0.3–1000)              |
| `--gamma <n>`         | No       |         | Gamma correction (e.g. 2.2)           |
| `--grayscale`         | No       |         | Convert to grayscale                  |
| `--negate`            | No       |         | Invert colors                         |
| `--normalize`         | No       |         | Stretch contrast to full range        |
| `--tint <color>`      | No       |         | Apply color tint (e.g. `"#ff6600"`)   |
| `--threshold <0-255>` | No       |         | Binarize at threshold                 |
| `--median <size>`     | No       |         | Median filter for noise reduction     |

Multiple adjustments can be combined in a single call.

### `get-metadata.ts` Get image metadata

Export: `getImageMetadata({ inputPath })`

```bash
tsx skills/sharp-images/scripts/get-metadata.ts <path>
```

| Argument | Required | Description      |
| -------- | -------- | ---------------- |
| `<path>` | Yes      | Input image file |

Prints width, height, format, channels, size, color space, density, and alpha info as JSON.
