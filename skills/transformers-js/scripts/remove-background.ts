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
  cli
    .command("<image>")
    .option("--output <path>", "Output image path")
    .option("--model <id>", "Model ID")
    .action(async (filePath: string, options) => {
      const inputPath = resolve(filePath);
      const outputPath = resolve(
        options.output ?? filePath.replace(/(\.[^.]+)$/, "-no-bg.png"),
      );

      const result = await removeBackground({
        inputPath,
        outputPath,
        model: options.model ?? DEFAULT_MODEL,
      });

      const relOutput = result.outputPath;
      console.log(
        `Background removed → ${relOutput} (${result.width}x${result.height})`,
      );
    });
  cli.help();
  cli.parse();
}
