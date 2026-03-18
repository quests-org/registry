import { relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

import {
  generateOutputPath,
  removeImageBackground,
} from "./lib/background-remover";

export { removeImageBackground } from "./lib/background-remover";

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      output: { type: "string" },
      format: { type: "string" },
      type: { type: "string" },
      model: { type: "string" },
      debug: { type: "boolean" },
    },
  });

  const [filePath] = positionals;

  if (!filePath) {
    console.error(
      "Usage: tsx skills/background-removal/scripts/remove-background.ts <path> [--output <path>] [--format <fmt>] [--type <type>] [--model <size>] [--debug]",
    );
    process.exit(1);
  }

  const inputPath = resolve(filePath);
  const format = (values.format ?? "image/png") as
    | "image/png"
    | "image/jpeg"
    | "image/webp";
  const outputType = (values.type ?? "foreground") as
    | "foreground"
    | "background"
    | "mask";
  const model = (values.model ?? "medium") as "small" | "medium";

  const outputPath = values.output
    ? resolve(values.output)
    : generateOutputPath({ inputPath, format });

  const result = await removeImageBackground({
    inputPath,
    outputPath,
    format,
    outputType,
    model,
    debug: values.debug ?? false,
  });

  const relOutput = relative(process.cwd(), result.outputPath) || ".";
  console.log(
    `Removed background → ${relOutput} (${result.outputType}, ${result.model}, ${result.bytes} bytes)`,
  );
}
