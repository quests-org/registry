import { readFile, stat, writeFile } from "node:fs/promises";
import { parse, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { cac } from "cac";
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
  const cli = cac("optimize");
  cli
    .command("<filePath>")
    .option("--quality <1-100>", "Encoder quality")
    .option("--effort <0-10>", "Encoder effort/speed tradeoff")
    .option("--progressive", "Enable progressive encoding if supported")
    .option("--lossless", "Enable lossless mode if supported")
    .option("--output <path>", "Output image path")
    .action(async (filePath: string, options) => {
      const inputPath = resolve(filePath);
      const parsed = parse(inputPath);
      const outputPath = options.output
        ? resolve(options.output)
        : resolve(parsed.dir, `${parsed.name}-optimized${parsed.ext}`);

      const result = await optimizeImage({
        effort: options.effort ? Number(options.effort) : undefined,
        inputPath,
        lossless: options.lossless,
        outputPath,
        progressive: options.progressive,
        quality: options.quality ? Number(options.quality) : undefined,
      });
      const displayOutput =
        options.output ?? `${parsed.name}-optimized${parsed.ext}`;
      console.log(
        `Optimized → ${displayOutput} (${result.format}, ${result.width}×${result.height}, ${result.originalBytes} → ${result.bytes} bytes, ${result.savedPercent}% saved)`,
      );
    });
  cli.help();
  cli.parse();
}
