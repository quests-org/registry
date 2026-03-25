/**
 * Rotate or flip an image
 */
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
  cli.usage("photo.jpg --angle 90 --output rotated.jpg");
  cli.option("--angle <degrees>", "Rotation angle in degrees");
  cli.option("--background <color>", "Background fill color");
  cli.option("--flip", "Flip image vertically");
  cli.option("--flop", "Flip image horizontally");
  cli.option("--output <path>", "Output image path");
  cli.help();
  const { args, options } = cli.parse();
  if (options.help) process.exit(0);

  if (
    !args[0] ||
    (options.angle === undefined && !options.flip && !options.flop)
  ) {
    cli.outputHelp();
    process.exit(1);
  }

  const inputPath = resolve(args[0]);
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
  const displayOutput = options.output ?? `${parsed.name}-rotated${parsed.ext}`;
  console.log(
    `Rotated → ${displayOutput} (${result.width}×${result.height}, ${result.bytes} bytes)`,
  );
}
