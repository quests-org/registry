/**
 * Resize an image to specified dimensions with configurable fit mode
 * @note If neither --width nor --height is provided, the script prints image metadata instead of resizing.
 */
import { readFile, writeFile } from "node:fs/promises";
import { parse, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { cac } from "cac";
import sharp from "sharp";
import type { FitEnum } from "sharp";

type Fit = keyof FitEnum;

const VALID_FITS = new Set<Fit>([
  "contain",
  "cover",
  "fill",
  "inside",
  "outside",
]);

export async function resizeImage({
  inputPath,
  outputPath,
  width,
  height,
  fit = "cover",
  withoutEnlargement,
  background,
  kernel,
  position,
}: {
  background?: string;
  fit?: Fit;
  height?: number;
  inputPath: string;
  kernel?:
    | "cubic"
    | "lanczos2"
    | "lanczos3"
    | "linear"
    | "mitchell"
    | "nearest";
  outputPath: string;
  position?: string;
  width?: number;
  withoutEnlargement?: boolean;
}) {
  const buffer = await readFile(inputPath);
  const resized = await sharp(buffer)
    .resize({
      background,
      fit,
      height,
      kernel,
      position,
      width,
      withoutEnlargement,
    })
    .toBuffer({ resolveWithObject: true });

  await writeFile(outputPath, resized.data);

  return {
    bytes: resized.data.byteLength,
    fit,
    height: resized.info.height,
    outputPath,
    width: resized.info.width,
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cli = cac("resize");
  cli.usage("photo.jpg --width 800 --height 600 --output resized.jpg");
  cli.option("--width <px>", "Target width in pixels");
  cli.option("--height <px>", "Target height in pixels");
  cli.option("--fit <mode>", "Resize fit mode", { default: "cover" });
  cli.option("--output <path>", "Output image path");
  cli.option("--background <color>", "Background color for contain fit");
  cli.option("--kernel <kernel>", "Resize kernel");
  cli.option("--no-enlarge", "Prevent upscaling smaller inputs");
  cli.option("--position <position>", "Gravity/crop position");
  cli.help();
  const { args, options } = cli.parse();
  if (options.help) process.exit(0);

  if (!args[0]) {
    cli.outputHelp();
    process.exit(1);
  }

  const inputPath = resolve(args[0]);
  const width = options.width ? Number(options.width) : undefined;
  const height = options.height ? Number(options.height) : undefined;

  if (!width && !height) {
    const metadata = await sharp(inputPath).metadata();
    console.log(JSON.stringify(metadata, null, 2));
    process.exit(0);
  }

  const fit = options.fit as string;
  if (!VALID_FITS.has(fit as Fit)) {
    throw new Error(
      `Invalid fit mode "${fit}". Valid: ${[...VALID_FITS].join(", ")}`,
    );
  }

  const parsed = parse(inputPath);
  const outputPath = options.output
    ? resolve(options.output)
    : resolve(parsed.dir, `${parsed.name}-resized${parsed.ext}`);

  const result = await resizeImage({
    background: options.background,
    fit: fit as Fit,
    height,
    inputPath,
    kernel: options.kernel as "lanczos3" | undefined,
    outputPath,
    position: options.position,
    width,
    withoutEnlargement: options.noEnlarge,
  });
  const displayOutput = options.output ?? `${parsed.name}-resized${parsed.ext}`;
  console.log(
    `Resized → ${displayOutput} (${result.width}×${result.height}, ${result.fit}, ${result.bytes} bytes)`,
  );
}
