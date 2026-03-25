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
  cli
    .command("<image>")
    .option("--model <id>", "Model ID")
    .option("--max-tokens <n>", "Maximum generated tokens")
    .option("--json", "Print JSON output")
    .action(async (filePath: string, options) => {
      const inputPath = resolve(filePath);
      const relInput = filePath;
      const maxTokens = options.maxTokens ? parseInt(options.maxTokens) : 50;

      const { text } = await describeImage({
        inputPath,
        model: options.model ?? DEFAULT_MODEL,
        maxTokens,
      });

      if (options.json) {
        console.log(JSON.stringify({ text }, null, 2));
      } else {
        console.log(`Caption for ${relInput}:\n  ${text}`);
      }
    });
  cli.help();
  cli.parse();
}
