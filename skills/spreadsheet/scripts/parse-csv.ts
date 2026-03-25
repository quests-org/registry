import fs from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { cac } from "cac";

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
  const cli = cac("parse-csv");
  cli.option("--output <path>", "Write parsed JSON output to file");
  cli.option("--delimiter <char>", "CSV delimiter character");
  cli.option("--header", "Treat first row as header", { default: true });
  cli.help();
  const parsed = cli.parse();
  const { options } = parsed;
  const [filePath] = parsed.args;

  if (!filePath) {
    console.error(
      "Usage: tsx scripts/parse-csv.ts <path> [--output <path>] [--no-header] [--delimiter <char>]",
    );
    process.exit(1);
  }

  const inputPath = resolve(filePath);
  const result = await parseCsv({
    inputPath,
    header: options.header,
    delimiter: options.delimiter,
  });

  const json = JSON.stringify(result.data, null, 2);

  if (options.output) {
    const outputPath = resolve(options.output);
    await fs.writeFile(outputPath, json, "utf-8");
    console.log(`Parsed CSV → ${outputPath}`);
  } else {
    console.log(json);
  }
}
