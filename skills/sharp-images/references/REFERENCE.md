# Sharp API Reference

Quick reference for the [sharp](https://sharp.pixelplumbing.com/) image processing library. Use this when building custom image pipelines beyond what the scripts provide.

## Constructor

```ts
import sharp from "sharp";

sharp(inputPath); // from file
sharp(buffer); // from Buffer
sharp({
  create: { width: 100, height: 100, channels: 4, background: "#ff0000" },
}); // blank image
sharp({ text: { text: "Hello", font: "sans", dpi: 300 } }); // text image
```

### Constructor Options

| Option             | Type                                            | Default     | Description                                    |
| ------------------ | ----------------------------------------------- | ----------- | ---------------------------------------------- |
| `failOn`           | `"none" \| "truncated" \| "error" \| "warning"` | `"warning"` | When to abort processing of invalid pixel data |
| `limitInputPixels` | `number \| boolean`                             | `268402689` | Max pixels (set `false` to disable)            |
| `autoOrient`       | `boolean`                                       | `false`     | Apply EXIF orientation on load                 |
| `animated`         | `boolean`                                       | `false`     | Read all frames/pages                          |
| `pages`            | `number`                                        | `1`         | Number of pages to extract (`-1` for all)      |
| `density`          | `number`                                        | `72`        | DPI for vector images (SVG, PDF)               |

## Input Formats

JPEG, PNG, WebP, GIF (animated), AVIF, TIFF, SVG, PDF, RAW pixel data

## Output Formats & Options

### Format Methods

```ts
sharp(input).jpeg(options).toBuffer();
sharp(input).png(options).toBuffer();
sharp(input).webp(options).toBuffer();
sharp(input).avif(options).toBuffer();
sharp(input).gif(options).toBuffer();
sharp(input).tiff(options).toBuffer();
sharp(input).heif(options).toBuffer();
sharp(input).toFormat("jpeg", options).toBuffer();
```

### JPEG Options

| Option              | Type      | Default   | Description                  |
| ------------------- | --------- | --------- | ---------------------------- |
| `quality`           | `1-100`   | `80`      | Compression quality          |
| `progressive`       | `boolean` | `false`   | Progressive scan             |
| `mozjpeg`           | `boolean` | `false`   | Use mozjpeg defaults         |
| `chromaSubsampling` | `string`  | `"4:2:0"` | `"4:4:4"` for higher quality |

### PNG Options

| Option             | Type      | Default | Description                            |
| ------------------ | --------- | ------- | -------------------------------------- |
| `compressionLevel` | `0-9`     | `6`     | zlib compression level                 |
| `palette`          | `boolean` | `false` | Quantise to palette-based              |
| `quality`          | `1-100`   | `100`   | Palette quality (when `palette: true`) |
| `effort`           | `1-10`    | `7`     | CPU effort for palette                 |
| `colours`          | `2-256`   | `256`   | Max palette colors                     |
| `progressive`      | `boolean` | `false` | Interlace scan                         |

### WebP Options

| Option           | Type      | Default     | Description                                             |
| ---------------- | --------- | ----------- | ------------------------------------------------------- |
| `quality`        | `1-100`   | `80`        | Compression quality                                     |
| `lossless`       | `boolean` | `false`     | Lossless compression                                    |
| `nearLossless`   | `boolean` | `false`     | Near-lossless mode                                      |
| `smartSubsample` | `boolean` | `false`     | High quality chroma subsampling                         |
| `effort`         | `0-6`     | `4`         | CPU effort                                              |
| `preset`         | `string`  | `"default"` | `"photo"`, `"picture"`, `"drawing"`, `"icon"`, `"text"` |

### AVIF Options

| Option     | Type            | Default | Description          |
| ---------- | --------------- | ------- | -------------------- |
| `quality`  | `1-100`         | `50`    | Compression quality  |
| `lossless` | `boolean`       | `false` | Lossless compression |
| `effort`   | `0-9`           | `4`     | CPU effort           |
| `bitdepth` | `8 \| 10 \| 12` | `8`     | Bit depth            |

### GIF Options

| Option    | Type       | Default | Description                         |
| --------- | ---------- | ------- | ----------------------------------- |
| `colours` | `2-256`    | `256`   | Max palette colors                  |
| `effort`  | `1-10`     | `7`     | CPU effort                          |
| `dither`  | `0.0-1.0`  | `1.0`   | Floyd-Steinberg dither level        |
| `loop`    | `number`   | `0`     | Animation loop count (0 = infinite) |
| `delay`   | `number[]` |         | Frame delays in ms                  |

### TIFF Options

| Option        | Type               | Default        | Description                                                                |
| ------------- | ------------------ | -------------- | -------------------------------------------------------------------------- |
| `quality`     | `1-100`            | `80`           | Compression quality                                                        |
| `compression` | `string`           | `"jpeg"`       | `"none"`, `"jpeg"`, `"deflate"`, `"packbits"`, `"lzw"`, `"webp"`, `"zstd"` |
| `predictor`   | `string`           | `"horizontal"` | `"none"`, `"horizontal"`, `"float"`                                        |
| `pyramid`     | `boolean`          | `false`        | Multi-resolution pyramid                                                   |
| `tile`        | `boolean`          | `false`        | Tiled TIFF                                                                 |
| `bitdepth`    | `1 \| 2 \| 4 \| 8` | `8`            | Bit depth                                                                  |

## Resize

```ts
sharp(input).resize(width, height, options);
sharp(input).resize({ width, height, ...options });
```

| Option               | Type             | Default                      | Description                                                                  |
| -------------------- | ---------------- | ---------------------------- | ---------------------------------------------------------------------------- |
| `width`              | `number`         |                              | Target width                                                                 |
| `height`             | `number`         |                              | Target height                                                                |
| `fit`                | `string`         | `"cover"`                    | `"cover"`, `"contain"`, `"fill"`, `"inside"`, `"outside"`                    |
| `position`           | `string\|number` | `"centre"`                   | Position for `cover`/`contain`. Gravity or strategy                          |
| `background`         | `string\|object` | `{ r:0, g:0, b:0, alpha:1 }` | Background for `contain`                                                     |
| `kernel`             | `string`         | `"lanczos3"`                 | `"nearest"`, `"linear"`, `"cubic"`, `"mitchell"`, `"lanczos2"`, `"lanczos3"` |
| `withoutEnlargement` | `boolean`        | `false`                      | Don't enlarge if already smaller                                             |
| `withoutReduction`   | `boolean`        | `false`                      | Don't reduce if already larger                                               |

### Fit Modes

| Mode      | Behavior                                                                             |
| --------- | ------------------------------------------------------------------------------------ |
| `cover`   | Crop to cover both dimensions                                                        |
| `contain` | Fit within both dimensions (letterbox/pillarbox)                                     |
| `fill`    | Stretch to fill both dimensions (ignores aspect ratio)                               |
| `inside`  | Fit within both dimensions without cropping (preserves aspect ratio, may be smaller) |
| `outside` | Fit to cover both dimensions (preserves aspect ratio, may be larger)                 |

### Smart Crop Strategies

```ts
sharp(input).resize(200, 200, {
  fit: "cover",
  position: sharp.strategy.entropy,
});
sharp(input).resize(200, 200, {
  fit: "cover",
  position: sharp.strategy.attention,
});
```

## Crop / Extract

```ts
sharp(input).extract({ left: 0, top: 0, width: 200, height: 200 });
```

### Trim

```ts
sharp(input).trim();
sharp(input).trim({ background: "#ffffff", threshold: 10 });
```

## Rotate / Flip / Flop

```ts
sharp(input).rotate(); // auto-orient from EXIF
sharp(input).rotate(90); // explicit angle (any number, multiples of 90 avoid background)
sharp(input).rotate(45, { background: "#ff0000" });
sharp(input).flip(); // vertical flip
sharp(input).flop(); // horizontal mirror
sharp(input).autoOrient(); // apply EXIF orientation and strip tag
```

## Composite (Overlay / Watermark)

```ts
sharp(input).composite([
  { input: "overlay.png", gravity: "southeast" },
  { input: "watermark.png", top: 10, left: 10, blend: "over" },
  { input: buffer, tile: true },
]);
```

### Blend Modes

`clear`, `source`, `over`, `in`, `out`, `atop`, `dest`, `dest-over`, `dest-in`, `dest-out`, `dest-atop`, `xor`, `add`, `saturate`, `multiply`, `screen`, `overlay`, `darken`, `lighten`, `colour-dodge`, `colour-burn`, `hard-light`, `soft-light`, `difference`, `exclusion`

### Gravity Values

`north`, `northeast`, `east`, `southeast`, `south`, `southwest`, `west`, `northwest`, `center`/`centre`

## Adjustments

### Modulate (Brightness / Saturation / Hue)

```ts
sharp(input).modulate({ brightness: 1.5 }); // 1 = no change
sharp(input).modulate({ saturation: 0.5 }); // 1 = no change, 0 = grayscale
sharp(input).modulate({ hue: 90 }); // degrees
sharp(input).modulate({ lightness: 20 }); // additive
```

### Sharpen

```ts
sharp(input).sharpen();
sharp(input).sharpen({ sigma: 2 });
sharp(input).sharpen({ sigma: 2, m1: 0, m2: 3, x1: 3, y2: 15, y3: 15 });
```

### Blur

```ts
sharp(input).blur(); // mild 3×3 box blur
sharp(input).blur(5); // sigma: 0.3–1000
```

### Other Adjustments

```ts
sharp(input).gamma(2.2)                     // gamma correction
sharp(input).grayscale()                    // convert to grayscale
sharp(input).negate()                       // invert colors
sharp(input).normalize()                    // stretch contrast to full range
sharp(input).threshold(128)                 // binarize
sharp(input).tint("#ff6600")                // apply color tint
sharp(input).median(3)                      // median filter (noise reduction)
sharp(input).flatten({ background: "#fff" }) // remove alpha, apply background
sharp(input).unflatten()                    // add alpha from luminance
sharp(input).clahe({ width: 3, height: 3 }) // adaptive histogram equalization
sharp(input).linear(1.5, -0.15)            // linear adjustment (a * pixel + b)
sharp(input).recomb([[...], [...], [...]])  // color matrix
```

## Extend (Add Borders / Padding)

```ts
sharp(input).extend(20); // 20px all sides
sharp(input).extend({ top: 10, bottom: 10, left: 20, right: 20 });
sharp(input).extend({ top: 50, background: "#ff0000" });
sharp(input).extend({ top: 50, extendWith: "mirror" }); // "background", "copy", "repeat", "mirror"
```

## Alpha / Channels

```ts
sharp(input).removeAlpha();
sharp(input).ensureAlpha(0.5);
sharp(input).extractChannel("red"); // "red", "green", "blue", "alpha" or 0-3
sharp(input).joinChannel(otherBuffer);
sharp(input).flatten({ background: "#ffffff" });
```

## Metadata

```ts
const metadata = await sharp(input).metadata();
// { format, width, height, channels, space, depth, density, chromaSubsampling,
//   isProgressive, hasAlpha, orientation, pages, pageHeight, loop, delay, ... }

const stats = await sharp(input).stats();
// { channels: [{ min, max, sum, squaresSum, mean, stdev, minX, minY, maxX, maxY }],
//   isOpaque, entropy, sharpness, dominant: { r, g, b } }
```

### Metadata Preservation

```ts
sharp(input).keepMetadata(); // keep all EXIF, ICC, XMP
sharp(input).keepExif();
sharp(input).withExif({ IFD0: { Copyright: "..." } });
sharp(input).keepIccProfile();
sharp(input).withIccProfile("srgb"); // "srgb", "p3", "cmyk", or path
```

## Output

```ts
await sharp(input).toFile("output.jpg"); // write to file (format from extension)
const { data, info } = await sharp(input).toBuffer({ resolveWithObject: true });
// info: { format, size, width, height, channels, premultiplied }
```

## Utilities

```ts
sharp.format; // { jpeg: { id, input, output }, png: ..., ... }
sharp.fit; // { contain, cover, fill, inside, outside }
sharp.gravity; // { north, northeast, east, ..., center }
sharp.strategy; // { entropy, attention }
sharp.kernel; // { nearest, cubic, linear, mitchell, lanczos2, lanczos3 }
sharp.bool; // { and, or, eor }
```

## TypeScript Types

Key types available from `import type { ... } from "sharp"`:

- `Sharp` — pipeline instance
- `SharpOptions` — constructor options
- `Metadata` — output of `.metadata()`
- `Stats` — output of `.stats()`
- `OutputInfo` — output of `.toFile()` / `.toBuffer()`
- `ResizeOptions`, `Region`, `ExtendOptions`, `TrimOptions`
- `JpegOptions`, `PngOptions`, `WebpOptions`, `AvifOptions`, `GifOptions`, `TiffOptions`, `HeifOptions`
- `OverlayOptions` — composite options
- `Blend` — blend mode union
- `FormatEnum`, `FitEnum`, `KernelEnum`
- Use `keyof FormatEnum` for format strings, `keyof FitEnum` for fit modes
