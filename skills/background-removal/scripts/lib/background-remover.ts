import { mkdir, writeFile } from "node:fs/promises";
import { dirname, extname, parse, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  removeBackground,
  removeForeground,
  segmentForeground,
} from "@imgly/background-removal-node";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const pkgDistDir = resolve(
  scriptDir,
  "../../node_modules/@imgly/background-removal-node/dist",
);
const PUBLIC_PATH = `${pathToFileURL(pkgDistDir).href}/`;

export type OutputFormat = "image/png" | "image/jpeg" | "image/webp";
export type OutputType = "foreground" | "background" | "mask";
export type ModelSize = "small" | "medium";

const SUPPORTED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

const FORMAT_EXTENSIONS: Record<OutputFormat, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
};

const PROCESSORS: Record<OutputType, typeof removeBackground> = {
  foreground: removeBackground,
  background: removeForeground,
  mask: segmentForeground,
};

export async function removeImageBackground({
  inputPath,
  outputPath,
  format = "image/png",
  outputType = "foreground",
  model = "medium",
  debug = false,
}: {
  inputPath: string;
  outputPath: string;
  format?: OutputFormat;
  outputType?: OutputType;
  model?: ModelSize;
  debug?: boolean;
}) {
  const ext = extname(inputPath).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.has(ext)) {
    throw new Error(
      `Unsupported file type "${ext}". Supported: ${[...SUPPORTED_EXTENSIONS].join(", ")}`,
    );
  }

  const processor = PROCESSORS[outputType];
  const blob = await processor(inputPath, {
    debug,
    model,
    output: { format },
    publicPath: PUBLIC_PATH,
  });

  const arrayBuffer = await blob.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, buffer);

  return { outputPath, format, outputType, model, bytes: buffer.byteLength };
}

export function generateOutputPath({
  inputPath,
  format = "image/png",
}: {
  inputPath: string;
  format?: OutputFormat;
}) {
  const parsed = parse(inputPath);
  return `${parsed.dir}/${parsed.name}-no-bg${FORMAT_EXTENSIONS[format]}`;
}
