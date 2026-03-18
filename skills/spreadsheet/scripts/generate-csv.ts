import fs from "node:fs/promises";
import { relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

import Papa from "papaparse";

export function generateCsv({
  data,
  header = true,
  delimiter = ",",
}: {
  data: Record<string, unknown>[];
  header?: boolean;
  delimiter?: string;
}) {
  return Papa.unparse(data, {
    delimiter,
    header,
    newline: "\n",
  });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      delimiter: { type: "string", default: "," },
      header: { type: "boolean", default: true },
      output: { type: "string" },
    },
  });

  const [jsonPath] = positionals;

  if (!jsonPath) {
    console.error(
      "Usage: tsx skills/spreadsheet/scripts/generate-csv.ts <json-path> [--output <path>] [--delimiter <char>] [--no-header]",
    );
    process.exit(1);
  }

  const inputPath = resolve(jsonPath);
  const raw = await fs.readFile(inputPath, "utf-8");
  const data = JSON.parse(raw) as Record<string, unknown>[];

  const csv = generateCsv({
    data,
    header: values.header,
    delimiter: values.delimiter,
  });

  if (values.output) {
    const outputPath = resolve(values.output);
    await fs.writeFile(outputPath, csv, "utf-8");
    console.log(`Generated CSV → ${relative(process.cwd(), outputPath)}`);
  } else {
    console.log(csv);
  }
}
