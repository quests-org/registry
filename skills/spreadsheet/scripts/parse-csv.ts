import fs from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

import Papa from "papaparse";

export async function parseCsv({
  inputPath,
  header = true,
  delimiter,
}: {
  inputPath: string;
  header?: boolean;
  delimiter?: string;
}) {
  const content = await fs.readFile(inputPath, "utf-8");
  const result = Papa.parse(content, {
    delimiter: delimiter || "",
    header,
    skipEmptyLines: true,
  });

  return {
    data: result.data as Record<string, string>[] | string[][],
    meta: result.meta,
    errors: result.errors,
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      delimiter: { type: "string" },
      header: { type: "boolean", default: true },
      output: { type: "string" },
    },
  });

  const [filePath] = positionals;

  if (!filePath) {
    console.error(
      "Usage: tsx scripts/parse-csv.ts <path> [--output <path>] [--no-header] [--delimiter <char>]",
    );
    process.exit(1);
  }

  const inputPath = resolve(filePath);
  const result = await parseCsv({
    inputPath,
    header: values.header,
    delimiter: values.delimiter,
  });

  const json = JSON.stringify(result.data, null, 2);

  if (values.output) {
    const outputPath = resolve(values.output);
    await fs.writeFile(outputPath, json, "utf-8");
    console.log(`Parsed CSV → ${outputPath}`);
  } else {
    console.log(json);
  }
}
