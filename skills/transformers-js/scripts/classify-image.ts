import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
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
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      model: { type: "string" },
      "top-k": { type: "string" },
      labels: { type: "string" },
      json: { type: "boolean" },
    },
  });

  const [filePath] = positionals;
  if (!filePath) {
    console.error(
      "Usage: tsx scripts/classify-image.ts <image> [--labels <a,b,c>] [--model <id>] [--top-k <n>] [--json]",
    );
    process.exit(1);
  }

  const inputPath = resolve(filePath);
  const relInput = filePath;

  if (values.labels) {
    const labels = values.labels.split(",").map((l) => l.trim());
    const { results } = await classifyImageZeroShot({
      inputPath,
      labels,
      model: values.model ?? DEFAULT_ZS_MODEL,
    });
    console.log(`Zero-shot classification for ${relInput}:`);
    if (values.json) {
      console.log(JSON.stringify(results, null, 2));
    } else {
      for (const r of results) {
        console.log(`  ${r.label}: ${(r.score * 100).toFixed(1)}%`);
      }
    }
  } else {
    const topK = values["top-k"] ? parseInt(values["top-k"]) : 5;
    const { results } = await classifyImage({
      inputPath,
      model: values.model ?? DEFAULT_MODEL,
      topK,
    });
    console.log(`Classification for ${relInput}:`);
    if (values.json) {
      console.log(JSON.stringify(results, null, 2));
    } else {
      for (const r of results) {
        console.log(`  ${r.label}: ${(r.score * 100).toFixed(1)}%`);
      }
    }
  }
}
