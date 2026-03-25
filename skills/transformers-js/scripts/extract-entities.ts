/**
 * Extract named entities (people, organizations, locations) from text
 */

import { pathToFileURL } from "node:url";
import { cac } from "cac";
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
  const cli = cac("extract-entities");
  cli.usage('--text "Corp was founded by Mike Bud in Chicago"');
  cli.option("--text <text>", "Text to extract entities from");
  cli.option("--model <id>", "Model ID", { default: DEFAULT_MODEL });
  cli.option("--group", "Group entities by type");
  cli.option("--json", "Print JSON output");
  cli.help();
  const { options } = cli.parse();
  if (options.help) process.exit(0);

  if (!options.text) {
    cli.outputHelp();
    process.exit(1);
  }

  const text = options.text;
  if (options.group) {
    const { grouped } = await extractEntitiesByType({
      text,
      model: options.model,
    });
    if (options.json) {
      console.log(JSON.stringify(grouped, null, 2));
    } else {
      console.log("Entities by type:");
      for (const [type, items] of Object.entries(grouped)) {
        console.log(`  ${type}: ${items.join(", ")}`);
      }
    }
  } else {
    const { entities } = await extractEntities({ text, model: options.model });
    if (options.json) {
      console.log(JSON.stringify(entities, null, 2));
    } else {
      console.log(`Found ${entities.length} entities:`);
      for (const e of entities) {
        console.log(`  ${e.type}: ${e.text} (${(e.score * 100).toFixed(0)}%)`);
      }
    }
  }
}
