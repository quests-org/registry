/**
 * Generate a natural-language caption for an image
 */

import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { cac } from "cac";
import { pipeline, validateImagePath } from "./lib/pipeline.ts";

const DEFAULT_MODEL = "Xenova/vit-gpt2-image-captioning";

export async function describeImage({
  inputPath,
  model = DEFAULT_MODEL,
  maxTokens = 50,
}: {
  inputPath: string;
  model?: string;
  maxTokens?: number;
}) {
  validateImagePath(inputPath);
  const captioner = await pipeline("image-to-text", model, { dtype: "q8" });
  const raw = await captioner(inputPath, { max_new_tokens: maxTokens });
  const results = raw.flat();
  const text =
    results.length > 0 ? (results[0].generated_text ?? "").trim() : "";
  return { text };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cli = cac("describe-image");
  cli.usage("photo.jpg");
  cli.option("--model <id>", "Model ID", { default: DEFAULT_MODEL });
  cli.option("--max-tokens <n>", "Maximum generated tokens", { default: 50 });
  cli.option("--json", "Print JSON output");
  cli.help();
  const { args, options } = cli.parse();
  if (options.help) process.exit(0);

  if (!args[0]) {
    cli.outputHelp();
    process.exit(1);
  }

  const inputPath = resolve(args[0]);
  const maxTokens = parseInt(options.maxTokens);

  const { text } = await describeImage({
    inputPath,
    model: options.model,
    maxTokens,
  });

  if (options.json) {
    console.log(JSON.stringify({ text }, null, 2));
  } else {
    console.log(`Caption for ${args[0]}:\n  ${text}`);
  }
}
