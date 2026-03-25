/**
 * Generate CSV text from a JSON array of row objects
 */
import fs from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { cac } from "cac";

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
  const cli = cac("generate-csv");
  cli.usage("<json-path> [--output <path>] [--delimiter <char>] [--no-header]");
  cli.option("--output <path>", "Write CSV output to file");
  cli.option("--delimiter <char>", "CSV delimiter character", { default: "," });
  cli.option("--header", "Include header row", { default: true });
  cli.help();
  const parsed = cli.parse();
  const { options } = parsed;
  if (options.help) process.exit(0);
  const [jsonPath] = parsed.args;

  if (!jsonPath) {
    cli.outputHelp();
    process.exit(1);
  }

  const inputPath = resolve(jsonPath);
  const raw = await fs.readFile(inputPath, "utf-8");
  const data = JSON.parse(raw) as Record<string, unknown>[];

  const csv = generateCsv({
    data,
    header: options.header,
    delimiter: options.delimiter,
  });

  if (options.output) {
    const outputPath = resolve(options.output);
    await fs.writeFile(outputPath, csv, "utf-8");
    console.log(`Generated CSV → ${outputPath}`);
  } else {
    console.log(csv);
  }
}
