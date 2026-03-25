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
  cli
    .command("<filePath>")
    .option("--width <px>", "Target width in pixels")
    .option("--height <px>", "Target height in pixels")
    .option("--fit <mode>", "Resize fit mode")
    .option("--output <path>", "Output image path")
    .option("--background <color>", "Background color for contain fit")
    .option("--kernel <kernel>", "Resize kernel")
    .option("--no-enlarge", "Prevent upscaling smaller inputs")
    .option("--position <position>", "Gravity/crop position")
    .action(async (filePath: string, options) => {
      const inputPath = resolve(filePath);
      const width = options.width ? Number(options.width) : undefined;
      const height = options.height ? Number(options.height) : undefined;

      if (!width && !height) {
        const metadata = await sharp(inputPath).metadata();
        console.log(JSON.stringify(metadata, null, 2));
        process.exit(0);
      }

      const fit = (options.fit ?? "cover") as string;
      if (!VALID_FITS.has(fit as Fit)) {
        console.error(
          `Invalid fit mode "${fit}". Valid: ${[...VALID_FITS].join(", ")}`,
        );
        process.exit(1);
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
      const displayOutput =
        options.output ?? `${parsed.name}-resized${parsed.ext}`;
      console.log(
        `Resized → ${displayOutput} (${result.width}×${result.height}, ${result.fit}, ${result.bytes} bytes)`,
      );
    });
  cli.help();
  cli.parse();
}
