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
  cli
    .command("<image>")
    .option("--output <path>", "Output upscaled image path")
    .option("--model <id>", "Model ID")
    .action(async (filePath: string, options) => {
      const inputPath = resolve(filePath);
      const outputPath = resolve(
        options.output ?? filePath.replace(/(\.[^.]+)$/, "-upscaled$1"),
      );

      const result = await upscaleImage({
        inputPath,
        outputPath,
        model: options.model ?? DEFAULT_MODEL,
      });

      const relOutput = result.outputPath;
      console.log(`Upscaled → ${relOutput} (${result.width}x${result.height})`);
    });
  cli.help();
  cli.parse();
}
