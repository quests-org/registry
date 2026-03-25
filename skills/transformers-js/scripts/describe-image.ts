import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
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
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      model: { type: "string" },
      "max-tokens": { type: "string" },
      json: { type: "boolean" },
    },
  });

  const [filePath] = positionals;
  if (!filePath) {
    console.error(
      "Usage: tsx scripts/describe-image.ts <image> [--model <id>] [--max-tokens <n>] [--json]",
    );
    process.exit(1);
  }

  const inputPath = resolve(filePath);
  const relInput = filePath;
  const maxTokens = values["max-tokens"] ? parseInt(values["max-tokens"]) : 50;

  const { text } = await describeImage({
    inputPath,
    model: values.model ?? DEFAULT_MODEL,
    maxTokens,
  });

  if (values.json) {
    console.log(JSON.stringify({ text }, null, 2));
  } else {
    console.log(`Caption for ${relInput}:\n  ${text}`);
  }
}
