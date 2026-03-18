import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { pipeline } from "./lib/pipeline.ts";

const DEFAULT_MODEL = "Xenova/bert-base-NER";

export async function extractEntities({
  text,
  model = DEFAULT_MODEL,
}: {
  text: string;
  model?: string;
}) {
  if (!text.trim()) {
    throw new Error("Text input is required");
  }
  const ner = await pipeline("token-classification", model, {
    dtype: "q8",
  });
  const raw = await ner(text);
  const flat = [raw].flat(2);
  const entities = flat.map((e) => ({
    type: e.entity,
    text: e.word.trim(),
    score: Math.round(e.score * 1000) / 1000,
    start: e.start ?? e.index,
    end: e.end ?? e.index,
  }));
  return { entities };
}

export async function extractEntitiesByType({
  text,
  model = DEFAULT_MODEL,
}: {
  text: string;
  model?: string;
}) {
  const { entities } = await extractEntities({ text, model });
  const grouped: Record<string, string[]> = {};
  for (const e of entities) {
    if (!grouped[e.type]) grouped[e.type] = [];
    const normalized = e.text;
    if (!grouped[e.type].includes(normalized)) {
      grouped[e.type].push(normalized);
    }
  }
  return { grouped, entities };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      model: { type: "string" },
      group: { type: "boolean" },
      json: { type: "boolean" },
    },
  });

  const text = positionals.join(" ");
  if (!text) {
    console.error(
      "Usage: tsx skills/transformers-js/scripts/extract-entities.ts <text> [--group] [--model <id>] [--json]",
    );
    process.exit(1);
  }

  if (values.group) {
    const { grouped } = await extractEntitiesByType({
      text,
      model: values.model ?? DEFAULT_MODEL,
    });
    if (values.json) {
      console.log(JSON.stringify(grouped, null, 2));
    } else {
      console.log("Entities by type:");
      for (const [type, items] of Object.entries(grouped)) {
        console.log(`  ${type}: ${items.join(", ")}`);
      }
    }
  } else {
    const { entities } = await extractEntities({
      text,
      model: values.model ?? DEFAULT_MODEL,
    });
    if (values.json) {
      console.log(JSON.stringify(entities, null, 2));
    } else {
      console.log(`Found ${entities.length} entities:`);
      for (const e of entities) {
        console.log(`  ${e.type}: ${e.text} (${(e.score * 100).toFixed(0)}%)`);
      }
    }
  }
}
