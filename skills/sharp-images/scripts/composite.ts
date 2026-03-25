import { readFile, writeFile } from "node:fs/promises";
import { parse, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import sharp from "sharp";
import type { Blend } from "sharp";

type Gravity =
  | "center"
  | "east"
  | "north"
  | "northeast"
  | "northwest"
  | "south"
  | "southeast"
  | "southwest"
  | "west";

const VALID_GRAVITIES = new Set<Gravity>([
  "center",
  "east",
  "north",
  "northeast",
  "northwest",
  "south",
  "southeast",
  "southwest",
  "west",
]);

export async function compositeImages({
  inputPath,
  outputPath,
  overlayPath,
  gravity,
  top,
  left,
  blend,
  tile,
  opacity,
}: {
  blend?: Blend;
  gravity?: Gravity;
  inputPath: string;
  left?: number;
  opacity?: number;
  outputPath: string;
  overlayPath: string;
  tile?: boolean;
  top?: number;
}) {
  const [baseBuffer, overlayBuffer] = await Promise.all([
    readFile(inputPath),
    readFile(overlayPath),
  ]);

  let overlayInput = sharp(overlayBuffer);
  if (opacity !== undefined && opacity < 1) {
    const alpha = Math.round(opacity * 255);
    overlayInput = overlayInput.ensureAlpha().composite([
      {
        blend: "dest-in" as Blend,
        input: {
          create: {
            background: { alpha, b: 0, g: 0, r: 0 },
            channels: 4,
            height: 1,
            width: 1,
          },
        },
        tile: true,
      },
    ]);
  }

  const processedOverlay = await overlayInput.toBuffer();

  const pipeline = sharp(baseBuffer).composite([
    {
      blend,
      gravity:
        gravity ??
        (top !== undefined || left !== undefined ? undefined : "center"),
      input: processedOverlay,
      left,
      tile,
      top,
    },
  ]);

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
      blend: { type: "string" },
      gravity: { type: "string" },
      left: { type: "string" },
      opacity: { type: "string" },
      output: { type: "string" },
      overlay: { type: "string" },
      tile: { type: "boolean" },
      top: { type: "string" },
    },
  });

  const [filePath] = positionals;

  if (!filePath || !values.overlay) {
    console.error(
      "Usage: tsx scripts/composite.ts <base-image> --overlay <image> [--gravity <pos>] [--top <px>] [--left <px>] [--blend <mode>] [--opacity <0-1>] [--tile] [--output <path>]",
    );
    process.exit(1);
  }

  const inputPath = resolve(filePath);

  if (values.gravity && !VALID_GRAVITIES.has(values.gravity as Gravity)) {
    console.error(
      `Invalid gravity "${values.gravity}". Valid: ${[...VALID_GRAVITIES].join(", ")}`,
    );
    process.exit(1);
  }

  const parsed = parse(inputPath);
  const outputPath = values.output
    ? resolve(values.output)
    : resolve(parsed.dir, `${parsed.name}-composite${parsed.ext}`);

  const result = await compositeImages({
    blend: values.blend as Blend | undefined,
    gravity: values.gravity as Gravity | undefined,
    inputPath,
    left: values.left !== undefined ? Number(values.left) : undefined,
    opacity: values.opacity !== undefined ? Number(values.opacity) : undefined,
    outputPath,
    overlayPath: resolve(values.overlay),
    tile: values.tile,
    top: values.top !== undefined ? Number(values.top) : undefined,
  });
  const displayOutput =
    values.output ?? `${parsed.name}-composite${parsed.ext}`;
  console.log(
    `Composited → ${displayOutput} (${result.width}×${result.height}, ${result.bytes} bytes)`,
  );
}
