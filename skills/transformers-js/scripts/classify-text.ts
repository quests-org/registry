import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { pipeline } from "./lib/pipeline.ts";

const DEFAULT_MODEL = "Xenova/distilbert-base-uncased-finetuned-sst-2-english";
const DEFAULT_ZS_MODEL = "Xenova/mobilebert-uncased-mnli";

export async function classifyText({
  text,
  model = DEFAULT_MODEL,
  topK = 5,
}: {
  text: string;
  model?: string;
  topK?: number;
}) {
  if (!text.trim()) {
    throw new Error("Text input is required");
  }
  const classifier = await pipeline("text-classification", model, {
    dtype: "q8",
  });
  const raw = await classifier(text, { top_k: topK });
  const flat = [raw].flat(2);
  const results = flat.map((r) => ({
    label: r.label,
    score: Math.round(r.score * 1000) / 1000,
  }));
  return { results };
}

export async function classifyTextZeroShot({
  text,
  labels,
  model = DEFAULT_ZS_MODEL,
  multiLabel = false,
}: {
  text: string;
  labels: string[];
  model?: string;
  multiLabel?: boolean;
}) {
  if (!text.trim()) {
    throw new Error("Text input is required");
  }
  if (labels.length === 0) {
    throw new Error(
      "At least one label is required for zero-shot classification",
    );
  }
  const classifier = await pipeline("zero-shot-classification", model, {
    dtype: "q8",
  });
  const raw = await classifier(text, labels, { multi_label: multiLabel });
  const output = Array.isArray(raw) ? raw[0] : raw;
  const results = output.labels.map((label: string, i: number) => ({
    label,
    score: Math.round(output.scores[i] * 1000) / 1000,
  }));
  return { results };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      model: { type: "string" },
      labels: { type: "string" },
      "multi-label": { type: "boolean" },
      "top-k": { type: "string" },
      json: { type: "boolean" },
    },
  });

  const text = positionals.join(" ");
  if (!text) {
    console.error(
      "Usage: tsx skills/transformers-js/scripts/classify-text.ts <text> [--labels <a,b,c>] [--model <id>] [--top-k <n>] [--json]",
    );
    process.exit(1);
  }

  if (values.labels) {
    const labels = values.labels.split(",").map((l) => l.trim());
    const { results } = await classifyTextZeroShot({
      text,
      labels,
      model: values.model ?? DEFAULT_ZS_MODEL,
      multiLabel: values["multi-label"] ?? false,
    });
    if (values.json) {
      console.log(JSON.stringify(results, null, 2));
    } else {
      console.log("Zero-shot classification:");
      for (const r of results) {
        console.log(`  ${r.label}: ${(r.score * 100).toFixed(1)}%`);
      }
    }
  } else {
    const topK = values["top-k"] ? parseInt(values["top-k"]) : 5;
    const { results } = await classifyText({
      text,
      model: values.model ?? DEFAULT_MODEL,
      topK,
    });
    if (values.json) {
      console.log(JSON.stringify(results, null, 2));
    } else {
      console.log("Classification:");
      for (const r of results) {
        console.log(`  ${r.label}: ${(r.score * 100).toFixed(1)}%`);
      }
    }
  }
}
