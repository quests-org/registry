import { readFile, writeFile } from "node:fs/promises";
import { parse, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
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
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      height: { type: "string" },
      left: { type: "string" },
      output: { type: "string" },
      strategy: { type: "string" },
      top: { type: "string" },
      width: { type: "string" },
    },
  });

  const [filePath] = positionals;

  if (!filePath || !values.width || !values.height) {
    console.error(
      "Usage: tsx skills/sharp-images/scripts/crop.ts <path> --width <px> --height <px> [--left <px>] [--top <px>] [--strategy <entropy|attention>] [--output <path>]",
    );
    process.exit(1);
  }

  const inputPath = resolve(filePath);
  const width = Number(values.width);
  const height = Number(values.height);
  const left = values.left !== undefined ? Number(values.left) : undefined;
  const top = values.top !== undefined ? Number(values.top) : undefined;

  if (values.strategy && !VALID_STRATEGIES.has(values.strategy as Strategy)) {
    console.error(
      `Invalid strategy "${values.strategy}". Valid: ${[...VALID_STRATEGIES].join(", ")}`,
    );
    process.exit(1);
  }

  const parsed = parse(inputPath);
  const outputPath = values.output
    ? resolve(values.output)
    : resolve(parsed.dir, `${parsed.name}-cropped${parsed.ext}`);

  const result = await cropImage({
    height,
    inputPath,
    left,
    outputPath,
    strategy: values.strategy as Strategy | undefined,
    top,
    width,
  });
  const displayOutput = values.output ?? `${parsed.name}-cropped${parsed.ext}`;
  console.log(
    `Cropped → ${displayOutput} (${result.width}×${result.height}, ${result.bytes} bytes)`,
  );
}
