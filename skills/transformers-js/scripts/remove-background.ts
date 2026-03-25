/**
 * Remove the background from an image, producing a transparent PNG
 */

import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { cac } from "cac";
import { pipeline, validateImagePath } from "./lib/pipeline.ts";

const DEFAULT_MODEL = "briaai/RMBG-1.4";

export async function removeBackground({
  inputPath,
  outputPath,
  model = DEFAULT_MODEL,
}: {
  inputPath: string;
  outputPath: string;
  model?: string;
}) {
  validateImagePath(inputPath);
  const segmenter = await pipeline("background-removal", model);
  const result = await segmenter(inputPath);
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
  const cli = cac("remove-background");
  cli.usage("photo.jpg --output photo-no-bg.png");
  cli.option("--output <path>", "Output image path");
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
    options.output ?? args[0].replace(/(\.[^.]+)$/, "-no-bg.png"),
  );

  const result = await removeBackground({
    inputPath,
    outputPath,
    model: options.model,
  });
  console.log(
    `Background removed → ${result.outputPath} (${result.width}x${result.height})`,
  );
}
