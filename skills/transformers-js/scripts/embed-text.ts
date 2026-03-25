/**
 * Generate text embeddings and compute semantic similarity
 */

import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { cac } from "cac";
import { pipeline } from "./lib/pipeline.ts";

const DEFAULT_MODEL = "Xenova/all-MiniLM-L6-v2";

export async function embedText({
  texts,
  model = DEFAULT_MODEL,
}: {
  texts: string[];
  model?: string;
}) {
  if (texts.length === 0) {
    throw new Error("At least one text input is required");
  }
  const extractor = await pipeline("feature-extraction", model, {
    dtype: "q8",
  });
  const output = await extractor(texts, { pooling: "mean", normalize: true });
  const embeddings: number[][] = output.tolist();
  return { embeddings, dimensions: embeddings[0].length };
}

export async function computeSimilarity({
  textA,
  textB,
  model = DEFAULT_MODEL,
}: {
  textA: string;
  textB: string;
  model?: string;
}) {
  const { embeddings } = await embedText({ texts: [textA, textB], model });
  const a = embeddings[0];
  const b = embeddings[1];
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
  }
  return { similarity: Math.round(dot * 1000) / 1000 };
}

export async function rankBySimilarity({
  query,
  candidates,
  model = DEFAULT_MODEL,
}: {
  query: string;
  candidates: string[];
  model?: string;
}) {
  if (candidates.length === 0) {
    throw new Error("At least one candidate text is required");
  }
  const { embeddings } = await embedText({
    texts: [query, ...candidates],
    model,
  });
  const queryEmb = embeddings[0];
  const ranked = candidates
    .map((text, i) => {
      const candidateEmb = embeddings[i + 1];
      let dot = 0;
      for (let j = 0; j < queryEmb.length; j++) {
        dot += queryEmb[j] * candidateEmb[j];
      }
      return { text, score: Math.round(dot * 1000) / 1000 };
    })
    .sort((a, b) => b.score - a.score);
  return { ranked };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cli = cac("embed-text");
  cli.usage('--text "hello world" --compare "hi there"');
  cli.option("--text <text>", "Text to embed");
  cli.option("--model <id>", "Model ID", { default: DEFAULT_MODEL });
  cli.option("--compare <text>", "Second text for similarity");
  cli.option("--candidates <a|b|c>", "Pipe-separated candidate texts");
  cli.option("--file <path>", "Text file with one entry per line");
  cli.option("--json", "Print JSON output");
  cli.help();
  const { options } = cli.parse();
  if (options.help) process.exit(0);

  const text = options.text ?? "";

  if (options.candidates) {
    if (!text) {
      cli.outputHelp();
      process.exit(1);
    }
    const candidates = options.candidates
      .split("|")
      .map((c: string) => c.trim());
    const { ranked } = await rankBySimilarity({
      query: text,
      candidates,
      model: options.model,
    });
    if (options.json) {
      console.log(JSON.stringify(ranked, null, 2));
    } else {
      console.log(`Ranked by similarity to "${text}":`);
      for (const r of ranked) {
        console.log(`  ${(r.score * 100).toFixed(1)}% — ${r.text}`);
      }
    }
  } else if (options.compare) {
    if (!text) {
      cli.outputHelp();
      process.exit(1);
    }
    const { similarity } = await computeSimilarity({
      textA: text,
      textB: options.compare,
      model: options.model,
    });
    if (options.json) {
      console.log(JSON.stringify({ similarity }, null, 2));
    } else {
      console.log(`Similarity: ${(similarity * 100).toFixed(1)}%`);
    }
  } else if (options.file) {
    const { readFile } = await import("node:fs/promises");
    const filePath = resolve(options.file);
    const content = await readFile(filePath, "utf-8");
    const lines = content
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const { embeddings, dimensions } = await embedText({
      texts: lines,
      model: options.model,
    });
    if (options.json) {
      console.log(JSON.stringify({ dimensions, count: embeddings.length }));
    } else {
      console.log(
        `Embedded ${embeddings.length} lines from ${options.file} (${dimensions}d)`,
      );
    }
  } else {
    if (!text) {
      cli.outputHelp();
      process.exit(1);
    }
    const { embeddings, dimensions } = await embedText({
      texts: [text],
      model: options.model,
    });
    if (options.json) {
      console.log(JSON.stringify({ dimensions, embedding: embeddings[0] }));
    } else {
      console.log(
        `Embedding (${dimensions}d): [${embeddings[0]
          .slice(0, 5)
          .map((v) => v.toFixed(4))
          .join(", ")}, ...]`,
      );
    }
  }
}
