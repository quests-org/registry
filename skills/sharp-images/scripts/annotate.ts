/**
 * Draw labeled bounding box annotations on an image
 * @note One of --json (inline JSON array) or --json-file (path to JSON file) is required. Each annotation object: `{ left, top, width, height, label?, color? }`. Colors cycle automatically when omitted.
 */
import { readFile, writeFile } from "node:fs/promises";
import { parse, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { cac } from "cac";
import sharp from "sharp";

interface Annotation {
  color?: string;
  height: number;
  label?: string;
  left: number;
  top: number;
  width: number;
}

function escapeXml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildSvgOverlay({
  annotations,
  imageHeight,
  imageWidth,
  fontSize = 14,
  strokeWidth = 2,
}: {
  annotations: Annotation[];
  fontSize?: number;
  imageHeight: number;
  imageWidth: number;
  strokeWidth?: number;
}) {
  const defaultColors = [
    "#FF3B30",
    "#007AFF",
    "#34C759",
    "#FF9500",
    "#AF52DE",
    "#00C7BE",
    "#FF2D55",
    "#5856D6",
  ];

  const rects = annotations
    .map((ann, i) => {
      const color = ann.color ?? defaultColors[i % defaultColors.length];
      const rect = `<rect x="${ann.left}" y="${ann.top}" width="${ann.width}" height="${ann.height}" fill="none" stroke="${color}" stroke-width="${strokeWidth}"/>`;

      if (!ann.label) return rect;

      const escaped = escapeXml(ann.label);
      const labelY =
        ann.top > fontSize + 6 ? ann.top - 4 : ann.top + fontSize + 4;
      const label = [
        `<text x="${ann.left + 4}" y="${labelY}" font-family="sans-serif" font-size="${fontSize}" font-weight="bold" fill="${color}" stroke="#000" stroke-width="3" paint-order="stroke">${escaped}</text>`,
      ].join("");

      return `${rect}\n    ${label}`;
    })
    .join("\n    ");

  return `<svg width="${imageWidth}" height="${imageHeight}" xmlns="http://www.w3.org/2000/svg">\n    ${rects}\n</svg>`;
}

export async function annotateImage({
  inputPath,
  outputPath,
  annotations,
  fontSize,
  strokeWidth,
}: {
  annotations: Annotation[];
  fontSize?: number;
  inputPath: string;
  outputPath: string;
  strokeWidth?: number;
}) {
  const buffer = await readFile(inputPath);
  const metadata = await sharp(buffer).metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("Could not read image dimensions");
  }

  const svg = buildSvgOverlay({
    annotations,
    fontSize,
    imageHeight: metadata.height,
    imageWidth: metadata.width,
    strokeWidth,
  });

  const result = await sharp(buffer)
    .composite([{ input: Buffer.from(svg), left: 0, top: 0 }])
    .toBuffer({ resolveWithObject: true });

  await writeFile(outputPath, result.data);

  return {
    annotationCount: annotations.length,
    bytes: result.data.byteLength,
    height: result.info.height,
    outputPath,
    width: result.info.width,
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cli = cac("annotate");
  cli.usage(
    'photo.jpg --json \'[{"left":10,"top":10,"width":100,"height":50,"label":"Cat"}]\' --output annotated.jpg',
  );
  cli.option("--json <inlineJson>", "Inline JSON annotations array");
  cli.option("--json-file <path>", "Path to annotations JSON file");
  cli.option("--stroke-width <px>", "Annotation stroke width in pixels");
  cli.option("--font-size <px>", "Annotation label font size in pixels");
  cli.option("--output <path>", "Output image path");
  cli.help();
  const { args, options } = cli.parse();
  if (options.help) process.exit(0);

  if (!args[0] || (!options.json && !options.jsonFile)) {
    cli.outputHelp();
    process.exit(1);
  }

  const inputPath = resolve(args[0]);
  const parsed = parse(inputPath);
  const outputPath = options.output
    ? resolve(options.output)
    : resolve(parsed.dir, `${parsed.name}-annotated${parsed.ext}`);
  let annotations: Annotation[];

  try {
    const raw = options.jsonFile
      ? await readFile(resolve(options.jsonFile), "utf-8")
      : options.json;
    if (raw === undefined) {
      throw new Error("Missing annotations JSON");
    }
    annotations = JSON.parse(raw);
  } catch {
    console.error("Failed to parse annotations JSON");
    process.exit(1);
  }

  const result = await annotateImage({
    annotations,
    fontSize: options.fontSize ? Number(options.fontSize) : undefined,
    inputPath,
    outputPath,
    strokeWidth: options.strokeWidth ? Number(options.strokeWidth) : undefined,
  });
  const displayOutput =
    options.output ?? `${parsed.name}-annotated${parsed.ext}`;
  console.log(
    `Annotated → ${displayOutput} (${result.width}×${result.height}, ${result.annotationCount} annotations, ${result.bytes} bytes)`,
  );
}
