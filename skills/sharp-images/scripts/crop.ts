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
  cli
    .command("<filePath>")
    .option("--width <px>", "Crop width in pixels")
    .option("--height <px>", "Crop height in pixels")
    .option("--left <px>", "Left offset in pixels")
    .option("--top <px>", "Top offset in pixels")
    .option("--strategy <entropy|attention>", "Auto-crop strategy")
    .option("--output <path>", "Output image path")
    .action(async (filePath: string, options) => {
      if (!options.width || !options.height) {
        console.error(
          "Usage: tsx scripts/crop.ts <path> --width <px> --height <px> [--left <px>] [--top <px>] [--strategy <entropy|attention>] [--output <path>]",
        );
        process.exit(1);
      }

      const inputPath = resolve(filePath);
      const width = Number(options.width);
      const height = Number(options.height);
      const left =
        options.left !== undefined ? Number(options.left) : undefined;
      const top = options.top !== undefined ? Number(options.top) : undefined;

      if (
        options.strategy &&
        !VALID_STRATEGIES.has(options.strategy as Strategy)
      ) {
        console.error(
          `Invalid strategy "${options.strategy}". Valid: ${[...VALID_STRATEGIES].join(", ")}`,
        );
        process.exit(1);
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
      const displayOutput =
        options.output ?? `${parsed.name}-cropped${parsed.ext}`;
      console.log(
        `Cropped → ${displayOutput} (${result.width}×${result.height}, ${result.bytes} bytes)`,
      );
    });
  cli.help();
  cli.parse();
}
