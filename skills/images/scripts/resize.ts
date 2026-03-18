import { readFile, writeFile } from "node:fs/promises";
import { parse, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
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
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      background: { type: "string" },
      fit: { type: "string" },
      height: { type: "string" },
      kernel: { type: "string" },
      "no-enlarge": { type: "boolean" },
      output: { type: "string" },
      position: { type: "string" },
      width: { type: "string" },
    },
  });

  const [filePath] = positionals;

  if (!filePath) {
    console.error(
      "Usage: tsx skills/images/scripts/resize.ts <path> [--width <px>] [--height <px>] [--fit <mode>] [--output <path>]",
    );
    process.exit(1);
  }

  const inputPath = resolve(filePath);
  const width = values.width ? Number(values.width) : undefined;
  const height = values.height ? Number(values.height) : undefined;

  if (!width && !height) {
    const metadata = await sharp(inputPath).metadata();
    console.log(JSON.stringify(metadata, null, 2));
    process.exit(0);
  }

  const fit = (values.fit ?? "cover") as string;
  if (!VALID_FITS.has(fit as Fit)) {
    console.error(
      `Invalid fit mode "${fit}". Valid: ${[...VALID_FITS].join(", ")}`,
    );
    process.exit(1);
  }

  const parsed = parse(inputPath);
  const outputPath = values.output
    ? resolve(values.output)
    : resolve(parsed.dir, `${parsed.name}-resized${parsed.ext}`);

  const result = await resizeImage({
    background: values.background,
    fit: fit as Fit,
    height,
    inputPath,
    kernel: values.kernel as "lanczos3" | undefined,
    outputPath,
    position: values.position,
    width,
    withoutEnlargement: values["no-enlarge"],
  });
  const relOutput = relative(process.cwd(), result.outputPath) || ".";
  console.log(
    `Resized → ${relOutput} (${result.width}×${result.height}, ${result.fit}, ${result.bytes} bytes)`,
  );
}
