import { readFile, writeFile } from "node:fs/promises";
import { parse, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import sharp from "sharp";

export async function svgToPng({
  inputPath,
  outputPath,
  width,
  height,
  density = 96,
}: {
  inputPath: string;
  outputPath?: string;
  width?: number;
  height?: number;
  density?: number;
}) {
  const svgBuffer = await readFile(inputPath);
  const resolvedOutput =
    outputPath ?? `${parse(inputPath).dir}/${parse(inputPath).name}.png`;

  let pipeline = sharp(svgBuffer, { density });

  if (width || height) {
    pipeline = pipeline.resize({ width, height });
  }

  const pngBuffer = await pipeline.png().toBuffer();
  await writeFile(resolvedOutput, pngBuffer);

  return {
    outputPath: resolvedOutput,
    bytes: pngBuffer.byteLength,
    density,
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      density: { type: "string", default: "96" },
      height: { type: "string" },
      output: { type: "string" },
      width: { type: "string" },
    },
  });

  const [filePath] = positionals;

  if (!filePath) {
    console.error(
      "Usage: tsx skills/svg/scripts/svg-to-png.ts <path> [--output <path>] [--width <n>] [--height <n>] [--density <dpi>]",
    );
    process.exit(1);
  }

  const inputPath = resolve(filePath);
  const outputPath = values.output ? resolve(values.output) : undefined;
  const width = values.width ? parseInt(values.width, 10) : undefined;
  const height = values.height ? parseInt(values.height, 10) : undefined;
  const density = parseInt(values.density ?? "96", 10);

  const result = await svgToPng({
    inputPath,
    outputPath,
    width,
    height,
    density,
  });

  const relOutput = relative(process.cwd(), result.outputPath) || ".";
  console.log(
    `Converted → ${relOutput} (${result.bytes} bytes, ${result.density} DPI)`,
  );
}
