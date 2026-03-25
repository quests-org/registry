import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { cac } from "cac";
import { pipeline, validateImagePath } from "./lib/pipeline.ts";

const DEFAULT_MODEL = "Xenova/vit-base-patch16-224";
const DEFAULT_ZS_MODEL = "Xenova/clip-vit-base-patch32";

export async function classifyImage({
  inputPath,
  model = DEFAULT_MODEL,
  topK = 5,
}: {
  inputPath: string;
  model?: string;
  topK?: number;
}) {
  validateImagePath(inputPath);
  const classifier = await pipeline("image-classification", model, {
    dtype: "q8",
  });
  const raw = await classifier(inputPath, { top_k: topK });
  const results = raw.flat().map((r) => ({
    label: r.label,
    score: Math.round(r.score * 1000) / 1000,
  }));
  return { results };
}

export async function classifyImageZeroShot({
  inputPath,
  labels,
  model = DEFAULT_ZS_MODEL,
}: {
  inputPath: string;
  labels: string[];
  model?: string;
}) {
  validateImagePath(inputPath);
  if (labels.length === 0) {
    throw new Error(
      "At least one label is required for zero-shot classification",
    );
  }
  const classifier = await pipeline("zero-shot-image-classification", model, {
    dtype: "q8",
  });
  const raw = await classifier(inputPath, labels);
  const results = raw.flat().map((r) => ({
    label: r.label,
    score: Math.round(r.score * 1000) / 1000,
  }));
  return { results };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cli = cac("classify-image");
  cli
    .command("<image>")
    .option("--labels <a,b,c>", "Comma-separated zero-shot labels")
    .option("--model <id>", "Model ID")
    .option("--top-k <n>", "Number of top labels to return")
    .option("--json", "Print JSON output")
    .action(async (filePath: string, options) => {
      const inputPath = resolve(filePath);
      const relInput = filePath;

      if (options.labels) {
        const labels = options.labels.split(",").map((l: string) => l.trim());
        const { results } = await classifyImageZeroShot({
          inputPath,
          labels,
          model: options.model ?? DEFAULT_ZS_MODEL,
        });
        console.log(`Zero-shot classification for ${relInput}:`);
        if (options.json) {
          console.log(JSON.stringify(results, null, 2));
        } else {
          for (const r of results) {
            console.log(`  ${r.label}: ${(r.score * 100).toFixed(1)}%`);
          }
        }
      } else {
        const topK = options.topK ? parseInt(options.topK) : 5;
        const { results } = await classifyImage({
          inputPath,
          model: options.model ?? DEFAULT_MODEL,
          topK,
        });
        console.log(`Classification for ${relInput}:`);
        if (options.json) {
          console.log(JSON.stringify(results, null, 2));
        } else {
          for (const r of results) {
            console.log(`  ${r.label}: ${(r.score * 100).toFixed(1)}%`);
          }
        }
      }
    });
  cli.help();
  cli.parse();
}
