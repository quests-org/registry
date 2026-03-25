/**
 * Upscale an image 2x using super-resolution
 */

import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { cac } from "cac";
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
  const cli = cac("upscale-image");
  cli.usage("photo.jpg --output photo-upscaled.jpg");
  cli.option("--output <path>", "Output upscaled image path");
  cli.option("--model <id>", "Model ID", { default: DEFAULT_MODEL });
  cli.help();
  const { args, options } = cli.parse();
  if (options.help) process.exit(0);

  if (!args[0]) {
    cli.outputHelp();
    process.exit(1);
  }

  const inputPath = resolve(args[0]);
  const outputPath = resolve(
    options.output ?? args[0].replace(/(\.[^.]+)$/, "-upscaled$1"),
  );

  const result = await upscaleImage({
    inputPath,
    outputPath,
    model: options.model,
  });
  console.log(
    `Upscaled → ${result.outputPath} (${result.width}x${result.height})`,
  );
}
