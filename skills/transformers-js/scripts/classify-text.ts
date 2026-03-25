/**
 * Classify or categorize text using sentiment analysis or zero-shot labels
 * @note Without --labels runs sentiment analysis (POSITIVE/NEGATIVE). With --labels runs zero-shot classification — use to triage, tag, or route text (e.g. --labels "urgent,routine,spam")
 */

import { pathToFileURL } from "node:url";
import { cac } from "cac";
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
  const cli = cac("classify-text");
  cli.usage('--text "This movie was great"');
  cli.option("--text <text>", "Text to classify");
  cli.option("--labels <a,b,c>", "Comma-separated zero-shot labels");
  cli.option("--model <id>", "Model ID");
  cli.option("--multi-label", "Enable multi-label zero-shot mode");
  cli.option("--top-k <n>", "Number of top labels to return", { default: 5 });
  cli.option("--json", "Print JSON output");
  cli.help();
  const { options } = cli.parse();
  if (options.help) process.exit(0);

  if (!options.text) {
    cli.outputHelp();
    process.exit(1);
  }

  const text = options.text;
  if (options.labels) {
    const labels = options.labels.split(",").map((l: string) => l.trim());
    const { results } = await classifyTextZeroShot({
      text,
      labels,
      model: options.model ?? DEFAULT_ZS_MODEL,
      multiLabel: options.multiLabel ?? false,
    });
    if (options.json) {
      console.log(JSON.stringify(results, null, 2));
    } else {
      console.log("Zero-shot classification:");
      for (const r of results) {
        console.log(`  ${r.label}: ${(r.score * 100).toFixed(1)}%`);
      }
    }
  } else {
    const topK = parseInt(options.topK);
    const { results } = await classifyText({
      text,
      model: options.model ?? DEFAULT_MODEL,
      topK,
    });
    if (options.json) {
      console.log(JSON.stringify(results, null, 2));
    } else {
      console.log("Classification:");
      for (const r of results) {
        console.log(`  ${r.label}: ${(r.score * 100).toFixed(1)}%`);
      }
    }
  }
}
