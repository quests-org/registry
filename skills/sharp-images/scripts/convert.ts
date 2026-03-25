import { readFile, writeFile } from "node:fs/promises";
import { parse, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import sharp from "sharp";
import type { FormatEnum } from "sharp";

type OutputFormat = keyof FormatEnum;

const OUTPUT_FORMATS = new Set<OutputFormat>([
  "avif",
  "gif",
  "heif",
  "jpeg",
  "jp2",
  "jxl",
  "png",
  "tiff",
  "webp",
]);

const FORMAT_EXTENSIONS: Partial<Record<OutputFormat, string>> = {
  avif: ".avif",
  gif: ".gif",
  heif: ".heif",
  jpeg: ".jpg",
  jp2: ".jp2",
  jxl: ".jxl",
  png: ".png",
  tiff: ".tiff",
  webp: ".webp",
};

export async function convertImage({
  inputPath,
  outputPath,
  format,
  quality,
}: {
  format: OutputFormat;
  inputPath: string;
  outputPath: string;
  quality?: number;
}) {
  const buffer = await readFile(inputPath);
  const pipeline = sharp(buffer).toFormat(
    format,
    quality !== undefined ? { quality } : {},
  );

  const result = await pipeline.toBuffer({ resolveWithObject: true });
  await writeFile(outputPath, result.data);

  return {
    bytes: result.data.byteLength,
    format,
    height: result.info.height,
    outputPath,
    width: result.info.width,
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      format: { type: "string" },
      output: { type: "string" },
      quality: { type: "string" },
    },
  });

  const [filePath] = positionals;

  if (!filePath || !values.format) {
    console.error(
      "Usage: tsx skills/sharp-images/scripts/convert.ts <path> --format <fmt> [--quality <1-100>] [--output <path>]",
    );
    process.exit(1);
  }

  const format = values.format as string;
  if (!OUTPUT_FORMATS.has(format as OutputFormat)) {
    console.error(
      `Invalid format "${format}". Valid: ${[...OUTPUT_FORMATS].join(", ")}`,
    );
    process.exit(1);
  }

  const validFormat = format as OutputFormat;
  const inputPath = resolve(filePath);
  const quality = values.quality ? Number(values.quality) : undefined;

  const parsed = parse(inputPath);
  const ext = FORMAT_EXTENSIONS[validFormat] ?? `.${validFormat}`;
  const outputPath = values.output
    ? resolve(values.output)
    : resolve(parsed.dir, `${parsed.name}${ext}`);

  const result = await convertImage({
    format: validFormat,
    inputPath,
    outputPath,
    quality,
  });
  const displayOutput = values.output ?? `${parsed.name}${ext}`;
  console.log(
    `Converted → ${displayOutput} (${result.format}, ${result.width}×${result.height}, ${result.bytes} bytes)`,
  );
}
