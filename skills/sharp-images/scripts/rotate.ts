import { readFile, writeFile } from "node:fs/promises";
import { parse, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
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
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      angle: { type: "string" },
      background: { type: "string" },
      flip: { type: "boolean" },
      flop: { type: "boolean" },
      output: { type: "string" },
    },
  });

  const [filePath] = positionals;

  if (!filePath) {
    console.error(
      "Usage: tsx skills/sharp-images/scripts/rotate.ts <path> [--angle <degrees>] [--flip] [--flop] [--background <color>] [--output <path>]",
    );
    process.exit(1);
  }

  if (values.angle === undefined && !values.flip && !values.flop) {
    console.error("Provide at least one of --angle, --flip, or --flop");
    process.exit(1);
  }

  const inputPath = resolve(filePath);
  const parsed = parse(inputPath);
  const outputPath = values.output
    ? resolve(values.output)
    : resolve(parsed.dir, `${parsed.name}-rotated${parsed.ext}`);

  const result = await rotateImage({
    angle: values.angle !== undefined ? Number(values.angle) : undefined,
    background: values.background,
    flip: values.flip,
    flop: values.flop,
    inputPath,
    outputPath,
  });
  const displayOutput = values.output ?? `${parsed.name}-rotated${parsed.ext}`;
  console.log(
    `Rotated → ${displayOutput} (${result.width}×${result.height}, ${result.bytes} bytes)`,
  );
}
