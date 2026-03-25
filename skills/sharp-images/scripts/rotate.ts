import { readFile, writeFile } from "node:fs/promises";
import { parse, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { cac } from "cac";
import sharp from "sharp";

export async function rotateImage({
  inputPath,
  outputPath,
  angle,
  flip,
  flop,
  background,
}: {
  angle?: number;
  background?: string;
  flip?: boolean;
  flop?: boolean;
  inputPath: string;
  outputPath: string;
}) {
  const buffer = await readFile(inputPath);
  let pipeline = sharp(buffer);

  if (angle !== undefined) {
    pipeline = pipeline.rotate(angle, background ? { background } : undefined);
  }

  if (flip) {
    pipeline = pipeline.flip();
  }

  if (flop) {
    pipeline = pipeline.flop();
  }

  const result = await pipeline.toBuffer({ resolveWithObject: true });
  await writeFile(outputPath, result.data);

  return {
    bytes: result.data.byteLength,
    height: result.info.height,
    outputPath,
    width: result.info.width,
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cli = cac("rotate");
  cli
    .command("<filePath>")
    .option("--angle <degrees>", "Rotation angle in degrees")
    .option("--background <color>", "Background fill color")
    .option("--flip", "Flip image vertically")
    .option("--flop", "Flip image horizontally")
    .option("--output <path>", "Output image path")
    .action(async (filePath: string, options) => {
      if (options.angle === undefined && !options.flip && !options.flop) {
        console.error("Provide at least one of --angle, --flip, or --flop");
        process.exit(1);
      }

      const inputPath = resolve(filePath);
      const parsed = parse(inputPath);
      const outputPath = options.output
        ? resolve(options.output)
        : resolve(parsed.dir, `${parsed.name}-rotated${parsed.ext}`);

      const result = await rotateImage({
        angle: options.angle !== undefined ? Number(options.angle) : undefined,
        background: options.background,
        flip: options.flip,
        flop: options.flop,
        inputPath,
        outputPath,
      });
      const displayOutput =
        options.output ?? `${parsed.name}-rotated${parsed.ext}`;
      console.log(
        `Rotated → ${displayOutput} (${result.width}×${result.height}, ${result.bytes} bytes)`,
      );
    });
  cli.help();
  cli.parse();
}
