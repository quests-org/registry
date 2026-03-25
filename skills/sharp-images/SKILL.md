---
name: sharp-images
description: "Pixel-level image manipulation with sharp. Use when the user wants to resize, crop, rotate, flip, convert format (png, jpeg, webp, avif, gif, tiff), compress, optimize file size, watermark, composite, annotate, adjust brightness/saturation/contrast/sharpness, blur, grayscale, or read image metadata."
---

# Images

Resize, crop, rotate, convert, composite, adjust, optimize, and inspect images using [sharp](https://sharp.pixelplumbing.com/).

For the complete Sharp API reference, see [references/REFERENCE.md](references/REFERENCE.md).

## Scripts

### `adjust.ts` Adjust image color, brightness, blur, sharpen, and other visual properties

Exports:

- `adjustImage({ inputPath, outputPath, brightness, saturation, hue, lightness, sharpen, blur, gamma, grayscale, negate, normalize, tint, threshold, median, }: { blur?: number; brightness?: number; gamma?: number; grayscale?: boolean; hue?: number; inputPath: string; lightness?: number; median?: number; negate?: boolean; normalize?: boolean; outputPath: string; saturation?: number; sharpen?: number; threshold?: number; tint?: string; }): Promise<{ bytes: number; height: number; outputPath: string; width: number; }>`

```text
adjust

Usage:
  $ adjust photo.jpg --brightness 1.2 --output adjusted.jpg

Options:
  --brightness <n>     Brightness multiplier
  --saturation <n>     Saturation multiplier
  --hue <deg>          Hue rotation in degrees
  --sharpen <sigma>    Sharpen sigma value
  --blur <sigma>       Blur sigma value
  --gamma <n>          Gamma correction value
  --grayscale          Convert output to grayscale
  --negate             Invert image colors
  --normalize          Normalize contrast
  --tint <color>       Apply tint color
  --threshold <0-255>  Threshold value
  --median <size>      Median filter window size
  --lightness <n>      Lightness multiplier
  --output <path>      Output image path
  -h, --help           Display this message
```

### `annotate.ts` Draw labeled bounding box annotations on an image

Exports:

- `annotateImage({ inputPath, outputPath, annotations, fontSize, strokeWidth, }: { annotations: Annotation[]; fontSize?: number; inputPath: string; outputPath: string; strokeWidth?: number; }): Promise<{ annotationCount: number; bytes: number; height: number; outputPath: string; width: number; }>`

```text
annotate

Usage:
  $ annotate photo.jpg --json '[{"left":10,"top":10,"width":100,"height":50,"label":"Cat"}]' --output annotated.jpg

Options:
  --json <inlineJson>  Inline JSON annotations array
  --json-file <path>   Path to annotations JSON file
  --stroke-width <px>  Annotation stroke width in pixels
  --font-size <px>     Annotation label font size in pixels
  --output <path>      Output image path
  -h, --help           Display this message
```

> [!NOTE]
> One of --json (inline JSON array) or --json-file (path to JSON file) is required. Each annotation object: `{ left, top, width, height, label?, color? }`. Colors cycle automatically when omitted.

### `composite.ts` Overlay one image on top of another with configurable position and blend mode

Exports:

- `compositeImages({ inputPath, outputPath, overlayPath, gravity, top, left, blend, tile, opacity, }: { blend?: Blend; gravity?: Gravity; inputPath: string; left?: number; opacity?: number; outputPath: string; overlayPath: string; tile?: boolean; top?: number; }): Promise<{ bytes: number; height: number; outputPath: string; width: number; }>`

```text
composite

Usage:
  $ composite base.jpg --overlay logo.png --output result.jpg

Options:
  --overlay <image>  Overlay image path
  --gravity <pos>    Overlay gravity position
  --top <px>         Overlay top offset in pixels
  --left <px>        Overlay left offset in pixels
  --blend <mode>     Sharp blend mode
  --opacity <0-1>    Overlay opacity
  --tile             Tile the overlay image
  --output <path>    Output image path
  -h, --help         Display this message
```

### `convert.ts` Convert an image to a different format (jpeg, png, webp, avif, etc.)

Exports:

- `convertImage({ inputPath, outputPath, format, quality, }: { format: OutputFormat; inputPath: string; outputPath: string; quality?: number; }): Promise<{ bytes: number; format: keyof sharp.FormatEnum; height: number; outputPath: string; width: number; }>`

```text
convert

Usage:
  $ convert photo.jpg --format webp --output photo.webp

Options:
  --format <fmt>     Target output image format
  --quality <1-100>  Encoder quality
  --output <path>    Output image path
  -h, --help         Display this message
```

### `crop.ts` Crop an image to exact dimensions, with optional auto-crop strategy

Exports:

- `cropImage({ inputPath, outputPath, left, top, width, height, strategy, }: { height: number; inputPath: string; left?: number; outputPath: string; strategy?: Strategy; top?: number; width: number; }): Promise<{ bytes: number; height: number; outputPath: string; width: number; }>`

```text
crop

Usage:
  $ crop photo.jpg --width 800 --height 600 --output cropped.jpg

Options:
  --width <px>                    Crop width in pixels
  --height <px>                   Crop height in pixels
  --left <px>                     Left offset in pixels
  --top <px>                      Top offset in pixels
  --strategy <entropy|attention>  Auto-crop strategy
  --output <path>                 Output image path
  -h, --help                      Display this message
```

> [!NOTE]
> Without --left/--top uses smart auto-crop (entropy or attention strategy). With --left/--top does a precise pixel-coordinate extract

### `get-metadata.ts` Read format, dimensions, color space, and file size of an image

Exports:

- `getImageMetadata({ inputPath }: { inputPath: string; }): Promise<{ channels: sharp.Channels; density: number | undefined; format: keyof sharp.FormatEnum; hasAlpha: boolean; height: number; size: number; space: keyof sharp.ColourspaceEnum; width: number; }>`

```text
get-metadata

Usage:
  $ get-metadata <filePath>

Options:
  -h, --help  Display this message
```

### `optimize.ts` Re-encode an image to reduce file size while preserving format

Exports:

- `optimizeImage({ inputPath, outputPath, quality, effort, progressive, lossless, }: { effort?: number; inputPath: string; lossless?: boolean; outputPath: string; progressive?: boolean; quality?: number; }): Promise<{ bytes: number; format: keyof sharp.FormatEnum; height: number; originalBytes: number; outputPath: string; savedBytes: number; savedPercent: number; width: number; }>`

```text
optimize

Usage:
  $ optimize photo.jpg --quality 80 --output optimized.jpg

Options:
  --quality <1-100>  Encoder quality
  --effort <0-10>    Encoder effort/speed tradeoff
  --progressive      Enable progressive encoding if supported
  --lossless         Enable lossless mode if supported
  --output <path>    Output image path
  -h, --help         Display this message
```

### `resize.ts` Resize an image to specified dimensions with configurable fit mode

Exports:

- `resizeImage({ inputPath, outputPath, width, height, fit, withoutEnlargement, background, kernel, position, }: { background?: string; fit?: Fit; height?: number; inputPath: string; kernel?: "cubic" | "lanczos2" | "lanczos3" | "linear" | "mitchell" | "nearest"; outputPath: string; position?: string; width?: number; withoutEnlargement?: boolean; }): Promise<{ bytes: number; fit: keyof sharp.FitEnum; height: number; outputPath: string; width: number; }>`

```text
resize

Usage:
  $ resize photo.jpg --width 800 --height 600 --output resized.jpg

Options:
  --width <px>           Target width in pixels
  --height <px>          Target height in pixels
  --fit <mode>           Resize fit mode (default: cover)
  --output <path>        Output image path
  --background <color>   Background color for contain fit
  --kernel <kernel>      Resize kernel
  --no-enlarge           Prevent upscaling smaller inputs (default: true)
  --position <position>  Gravity/crop position
  -h, --help             Display this message
```

> [!NOTE]
> If neither --width nor --height is provided, the script prints image metadata instead of resizing.

### `rotate.ts` Rotate or flip an image

Exports:

- `rotateImage({ inputPath, outputPath, angle, flip, flop, background, }: { angle?: number; background?: string; flip?: boolean; flop?: boolean; inputPath: string; outputPath: string; }): Promise<{ bytes: number; height: number; outputPath: string; width: number; }>`

```text
rotate

Usage:
  $ rotate photo.jpg --angle 90 --output rotated.jpg

Options:
  --angle <degrees>     Rotation angle in degrees
  --background <color>  Background fill color
  --flip                Flip image vertically
  --flop                Flip image horizontally
  --output <path>       Output image path
  -h, --help            Display this message
```
