/**
 * Overlay one image on top of another with configurable position and blend mode
 */
import { readFile, writeFile } from "node:fs/promises";
import { parse, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { cac } from "cac";
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
  const cli = cac("composite");
  cli.usage("base.jpg --overlay logo.png --output result.jpg");
  cli.option("--overlay <image>", "Overlay image path");
  cli.option("--gravity <pos>", "Overlay gravity position");
  cli.option("--top <px>", "Overlay top offset in pixels");
  cli.option("--left <px>", "Overlay left offset in pixels");
  cli.option("--blend <mode>", "Sharp blend mode");
  cli.option("--opacity <0-1>", "Overlay opacity");
  cli.option("--tile", "Tile the overlay image");
  cli.option("--output <path>", "Output image path");
  cli.help();
  const { args, options } = cli.parse();
  if (options.help) process.exit(0);

  if (!args[0] || !options.overlay) {
    cli.outputHelp();
    process.exit(1);
  }

  const inputPath = resolve(args[0]);
  if (options.gravity && !VALID_GRAVITIES.has(options.gravity as Gravity)) {
    throw new Error(
      `Invalid gravity "${options.gravity}". Valid: ${[...VALID_GRAVITIES].join(", ")}`,
    );
  }

  const parsed = parse(inputPath);
  const outputPath = options.output
    ? resolve(options.output)
    : resolve(parsed.dir, `${parsed.name}-composite${parsed.ext}`);
  const result = await compositeImages({
    blend: options.blend as Blend | undefined,
    gravity: options.gravity as Gravity | undefined,
    inputPath,
    left: options.left !== undefined ? Number(options.left) : undefined,
    opacity:
      options.opacity !== undefined ? Number(options.opacity) : undefined,
    outputPath,
    overlayPath: resolve(options.overlay),
    tile: options.tile,
    top: options.top !== undefined ? Number(options.top) : undefined,
  });
  const displayOutput =
    options.output ?? `${parsed.name}-composite${parsed.ext}`;
  console.log(
    `Composited → ${displayOutput} (${result.width}×${result.height}, ${result.bytes} bytes)`,
  );
}
