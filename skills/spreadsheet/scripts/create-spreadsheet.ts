import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { cac } from "cac";
import * as XLSX from "xlsx";

export async function createSpreadsheet({
  data,
  outputPath,
  sheetName = "Sheet1",
}: {
  data: Record<string, unknown>[];
  outputPath: string;
  sheetName?: string;
}) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const buffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  }) as Buffer;
  await writeFile(outputPath, buffer);

  return { outputPath, sheetName, rowCount: data.length };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cli = cac("create-spreadsheet");
  cli.option("--output <path>", "Output spreadsheet path");
  cli.option("--sheet <name>", "Sheet name");
  cli.option("--data <json>", "Inline JSON array data");
  cli.option("--data-file <path>", "Path to JSON array data file");
  cli.help();
  const parsed = cli.parse();
  const { options } = parsed;

  if (!options.output) {
    console.error(
      "Usage: tsx scripts/create-spreadsheet.ts --output <path> [--sheet <name>] [--data <json>] [--data-file <path>]",
    );
    process.exit(1);
  }

  let data: Record<string, unknown>[];

  if (options["dataFile"]) {
    const raw = await readFile(resolve(options["dataFile"]), "utf-8");
    data = JSON.parse(raw);
  } else if (options.data) {
    data = JSON.parse(options.data);
  } else {
    console.error("Provide --data or --data-file");
    process.exit(1);
  }

  const result = await createSpreadsheet({
    data,
    outputPath: resolve(options.output),
    sheetName: options.sheet,
  });

  console.log(
    `Created ${result.outputPath} with ${result.rowCount} rows in sheet "${result.sheetName}"`,
  );
}
