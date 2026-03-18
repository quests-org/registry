---
name: svg
description: "Optimize SVG files, convert SVG to PNG, and create SVG graphics. Trigger on: SVG, vector graphics, optimize SVG, SVG to PNG, create SVG, icon design, D3 charts, data visualizations, scalable vector graphics."
---

# SVG

Optimize, convert, and create SVG files using svgo and sharp.

## Scripts

### `optimize-svg.ts` Optimize an SVG file

Export: `optimizeSvg({ inputPath, outputPath?, multipass?, pretty? })`

```bash
tsx skills/svg/scripts/optimize-svg.ts <path> [--output <path>] [--no-multipass] [--pretty]
```

| Argument          | Required | Default          | Description                         |
| ----------------- | -------- | ---------------- | ----------------------------------- |
| `<path>`          | Yes      |                  | Input SVG file                      |
| `--output <path>` | No       | Overwrites input | Output file path                    |
| `--no-multipass`  | No       | `true`           | Disable multipass optimization      |
| `--pretty`        | No       | `false`          | Pretty-print output (adds newlines) |

### `svg-to-png.ts` Convert SVG to PNG

Export: `svgToPng({ inputPath, outputPath?, width?, height?, density? })`

```bash
tsx skills/svg/scripts/svg-to-png.ts <path> [--output <path>] [--width <n>] [--height <n>] [--density <dpi>]
```

| Argument          | Required | Default      | Description             |
| ----------------- | -------- | ------------ | ----------------------- |
| `<path>`          | Yes      |              | Input SVG file          |
| `--output <path>` | No       | `<name>.png` | Output PNG path         |
| `--width <n>`     | No       |              | Output width in pixels  |
| `--height <n>`    | No       |              | Output height in pixels |
| `--density <dpi>` | No       | `96`         | Render density (DPI)    |

## SVG Best Practices

When creating or editing SVG files, follow these guidelines:

- **Always use `viewBox`** — ensures the SVG scales correctly at any size. Omit `width`/`height` for responsive SVGs, or set them for fixed-size icons.
- **Prefer `<path>` over basic shapes** when the graphic is complex — paths are more compact and optimize better with svgo.
- **Keep coordinates precise** — use 1-2 decimal places max. Avoid overly precise floats like `12.345678`.
- **Use semantic `id` and group names** — `<g id="icon-arrow">` not `<g id="g1">`. This aids readability and CSS targeting.
- **Test at multiple sizes** — render at 16px, 24px, 48px, and 256px to catch detail loss or aliasing issues.
- **Remove unnecessary metadata** — editor comments, Illustrator metadata, and unused `<defs>` add bloat. Run optimize-svg after export.
- **Use `currentColor`** — set `fill="currentColor"` on icons so they inherit the parent's text color.
- **Prefer `stroke-linecap="round"` and `stroke-linejoin="round"`** for icon strokes — they look better at small sizes.

## Data Visualizations

When creating SVGs programmatically (D3-style charts, graphs, diagrams):

- **Set a viewBox with logical coordinates** — e.g. `viewBox="0 0 800 400"` for a chart, then scale with CSS.
- **Use `<g transform="translate(x,y)">`** to position chart areas (margins, axes, plot area).
- **Axis patterns**: draw axis lines with `<line>`, tick marks with short `<line>` elements, labels with `<text>`. Group each axis in a `<g>`.
- **Bar charts**: use `<rect>` elements with computed x, y, width, height. Add `rx="2"` for slight rounding.
- **Line charts**: use `<polyline>` or `<path>` with `d="M x1,y1 L x2,y2 ..."`. Set `fill="none"` and style the stroke.
- **Pie/donut charts**: compute arc paths using `M`, `A` commands. For donuts, use two arcs with a hole.
- **Color scales**: define a palette array and index into it. Use semantic, accessible colors (avoid pure red/green pairs).
- **Labels and annotations**: use `<text>` with `text-anchor="middle"` for centered labels. Position outside the data area when possible.
- **Responsive embedding**: wrap the `<svg>` in a container with `width: 100%; aspect-ratio: 2/1;` and set the SVG to `width="100%" height="100%"`.
- **Always run optimize-svg** on generated output to clean up unnecessary precision and metadata.
