/**
 * Crop an image to exact dimensions, with optional auto-crop strategy
 * @note Without --left/--top uses smart auto-crop (entropy or attention strategy). With --left/--top does a precise pixel-coordinate extract
 */
import { readFile, writeFile } from "node:fs/promises";
import { parse, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { cac } from "cac";
import sharp from "sharp";

type Strategy = "attention" | "entropy";

const VALID_STRATEGIES = new Set<Strategy>(["attention", "entropy"]);

export async function cropImage({
  inputPath,
  outputPath,
  left,
  top,
  width,
  height,
  strategy,
}: {
  height: number;
  inputPath: string;
  left?: number;
  outputPath: string;
  strategy?: Strategy;
  top?: number;
  width: number;
}) {
  const buffer = await readFile(inputPath);
  let pipeline = sharp(buffer);

  if (left !== undefined && top !== undefined) {
    pipeline = pipeline.extract({ height, left, top, width });
  } else {
    pipeline = pipeline.resize({
      fit: "cover",
      height,
      position: strategy ?? sharp.strategy.entropy,
      width,
    });
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
  const cli = cac("crop");
  cli.usage("photo.jpg --width 800 --height 600 --output cropped.jpg");
  cli.option("--width <px>", "Crop width in pixels");
  cli.option("--height <px>", "Crop height in pixels");
  cli.option("--left <px>", "Left offset in pixels");
  cli.option("--top <px>", "Top offset in pixels");
  cli.option("--strategy <entropy|attention>", "Auto-crop strategy");
  cli.option("--output <path>", "Output image path");
  cli.help();
  const { args, options } = cli.parse();
  if (options.help) process.exit(0);

  if (!args[0] || !options.width || !options.height) {
    cli.outputHelp();
    process.exit(1);
  }

  const inputPath = resolve(args[0]);
  const width = Number(options.width);
  const height = Number(options.height);
  const left = options.left !== undefined ? Number(options.left) : undefined;
  const top = options.top !== undefined ? Number(options.top) : undefined;

  if (options.strategy && !VALID_STRATEGIES.has(options.strategy as Strategy)) {
    throw new Error(
      `Invalid strategy "${options.strategy}". Valid: ${[...VALID_STRATEGIES].join(", ")}`,
    );
  }

  const parsed = parse(inputPath);
  const outputPath = options.output
    ? resolve(options.output)
    : resolve(parsed.dir, `${parsed.name}-cropped${parsed.ext}`);

  const result = await cropImage({
    height,
    inputPath,
    left,
    outputPath,
    strategy: options.strategy as Strategy | undefined,
    top,
    width,
  });
  const displayOutput = options.output ?? `${parsed.name}-cropped${parsed.ext}`;
  console.log(
    `Cropped → ${displayOutput} (${result.width}×${result.height}, ${result.bytes} bytes)`,
  );
}
