/**
 * Convert an image to a different format (jpeg, png, webp, avif, etc.)
 */
import { readFile, writeFile } from "node:fs/promises";
import { parse, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { cac } from "cac";
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
  const cli = cac("convert");
  cli.usage("photo.jpg --format webp --output photo.webp");
  cli.option("--format <fmt>", "Target output image format");
  cli.option("--quality <1-100>", "Encoder quality");
  cli.option("--output <path>", "Output image path");
  cli.help();
  const { args, options } = cli.parse();
  if (options.help) process.exit(0);

  if (!args[0] || !options.format) {
    cli.outputHelp();
    process.exit(1);
  }

  const format = options.format as string;
  if (!OUTPUT_FORMATS.has(format as OutputFormat)) {
    throw new Error(
      `Invalid format "${format}". Valid: ${[...OUTPUT_FORMATS].join(", ")}`,
    );
  }

  const validFormat = format as OutputFormat;
  const inputPath = resolve(args[0]);
  const quality = options.quality ? Number(options.quality) : undefined;
  const parsed = parse(inputPath);
  const ext = FORMAT_EXTENSIONS[validFormat] ?? `.${validFormat}`;
  const outputPath = options.output
    ? resolve(options.output)
    : resolve(parsed.dir, `${parsed.name}${ext}`);

  const result = await convertImage({
    format: validFormat,
    inputPath,
    outputPath,
    quality,
  });
  const displayOutput = options.output ?? `${parsed.name}${ext}`;
  console.log(
    `Converted → ${displayOutput} (${result.format}, ${result.width}×${result.height}, ${result.bytes} bytes)`,
  );
}
