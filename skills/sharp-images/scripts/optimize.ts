import { readFile, stat, writeFile } from "node:fs/promises";
import { parse, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import sharp from "sharp";
import type { FormatEnum } from "sharp";

type OutputFormat = keyof FormatEnum;

export async function optimizeImage({
  inputPath,
  outputPath,
  quality,
  effort,
  progressive,
  lossless,
}: {
  effort?: number;
  inputPath: string;
  lossless?: boolean;
  outputPath: string;
  progressive?: boolean;
  quality?: number;
}) {
  const buffer = await readFile(inputPath);
  const metadata = await sharp(buffer).metadata();
  const format = metadata.format as OutputFormat;

  const options: Record<string, unknown> = {};
  if (quality !== undefined) options.quality = quality;
  if (effort !== undefined) options.effort = effort;
  if (progressive !== undefined) options.progressive = progressive;
  if (lossless !== undefined) options.lossless = lossless;

  const pipeline = sharp(buffer).toFormat(format, options);
  const result = await pipeline.toBuffer({ resolveWithObject: true });
  await writeFile(outputPath, result.data);

  const originalSize = (await stat(inputPath)).size;
  const optimizedSize = result.data.byteLength;

  return {
    bytes: optimizedSize,
    format,
    height: result.info.height,
    originalBytes: originalSize,
    outputPath,
    savedBytes: originalSize - optimizedSize,
    savedPercent: Math.round(
      ((originalSize - optimizedSize) / originalSize) * 100,
    ),
    width: result.info.width,
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      effort: { type: "string" },
      lossless: { type: "boolean" },
      output: { type: "string" },
      progressive: { type: "boolean" },
      quality: { type: "string" },
    },
  });

  const [filePath] = positionals;

  if (!filePath) {
    console.error(
      "Usage: tsx skills/sharp-images/scripts/optimize.ts <path> [--quality <1-100>] [--effort <0-10>] [--progressive] [--lossless] [--output <path>]",
    );
    process.exit(1);
  }

  const inputPath = resolve(filePath);
  const parsed = parse(inputPath);
  const outputPath = values.output
    ? resolve(values.output)
    : resolve(parsed.dir, `${parsed.name}-optimized${parsed.ext}`);

  const result = await optimizeImage({
    effort: values.effort ? Number(values.effort) : undefined,
    inputPath,
    lossless: values.lossless,
    outputPath,
    progressive: values.progressive,
    quality: values.quality ? Number(values.quality) : undefined,
  });
  const relOutput = relative(process.cwd(), result.outputPath) || ".";
  console.log(
    `Optimized → ${relOutput} (${result.format}, ${result.width}×${result.height}, ${result.originalBytes} → ${result.bytes} bytes, ${result.savedPercent}% saved)`,
  );
}
