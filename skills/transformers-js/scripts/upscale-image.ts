import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { pipeline, validateImagePath } from "./lib/pipeline.ts";

const DEFAULT_MODEL = "Xenova/swin2SR-classical-sr-x2-64";

export async function upscaleImage({
  inputPath,
  outputPath,
  model = DEFAULT_MODEL,
}: {
  inputPath: string;
  outputPath: string;
  model?: string;
}) {
  validateImagePath(inputPath);
  const upscaler = await pipeline("image-to-image", model);
  const result = await upscaler(inputPath);
  const output = Array.isArray(result) ? result[0] : result;

  await mkdir(dirname(outputPath), { recursive: true });
  await output.save(outputPath);

  return {
    outputPath,
    width: output.width,
    height: output.height,
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      output: { type: "string" },
      model: { type: "string" },
    },
  });

  const [filePath] = positionals;
  if (!filePath) {
    console.error(
      "Usage: tsx scripts/upscale-image.ts <image> [--output <path>] [--model <id>]",
    );
    process.exit(1);
  }

  const inputPath = resolve(filePath);
  const outputPath = resolve(
    values.output ?? filePath.replace(/(\.[^.]+)$/, "-upscaled$1"),
  );

  const result = await upscaleImage({
    inputPath,
    outputPath,
    model: values.model ?? DEFAULT_MODEL,
  });

  const relOutput = result.outputPath;
  console.log(`Upscaled → ${relOutput} (${result.width}x${result.height})`);
}
