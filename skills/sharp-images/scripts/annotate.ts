import { readFile, writeFile } from "node:fs/promises";
import { parse, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
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
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      "font-size": { type: "string" },
      json: { type: "string" },
      "json-file": { type: "string" },
      output: { type: "string" },
      "stroke-width": { type: "string" },
    },
  });

  const [filePath] = positionals;

  if (!filePath || (!values.json && !values["json-file"])) {
    console.error(
      "Usage: tsx skills/sharp-images/scripts/annotate.ts <image> --json <inline-json> [--json-file <path>] [--stroke-width <px>] [--font-size <px>] [--output <path>]",
    );
    console.error(
      '\nInline JSON: --json \'[{ "left": 10, "top": 10, "width": 100, "height": 50, "label": "Cat", "color": "#FF0000" }]\'',
    );
    console.error("File:        --json-file annotations.json");
    process.exit(1);
  }

  const inputPath = resolve(filePath);
  const parsed = parse(inputPath);
  const outputPath = values.output
    ? resolve(values.output)
    : resolve(parsed.dir, `${parsed.name}-annotated${parsed.ext}`);

  let annotations: Annotation[];

  try {
    const raw = values["json-file"]
      ? await readFile(resolve(values["json-file"]), "utf-8")
      : values.json;
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
    fontSize: values["font-size"] ? Number(values["font-size"]) : undefined,
    inputPath,
    outputPath,
    strokeWidth: values["stroke-width"]
      ? Number(values["stroke-width"])
      : undefined,
  });

  const displayOutput =
    values.output ?? `${parsed.name}-annotated${parsed.ext}`;
  console.log(
    `Annotated → ${displayOutput} (${result.width}×${result.height}, ${result.annotationCount} annotations, ${result.bytes} bytes)`,
  );
}
