import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
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
  const { values } = parseArgs({
    options: {
      data: { type: "string" },
      "data-file": { type: "string" },
      output: { type: "string" },
      sheet: { type: "string" },
    },
  });

  if (!values.output) {
    console.error(
      "Usage: tsx scripts/create-spreadsheet.ts --output <path> [--sheet <name>] [--data <json>] [--data-file <path>]",
    );
    process.exit(1);
  }

  let data: Record<string, unknown>[];

  if (values["data-file"]) {
    const raw = await readFile(resolve(values["data-file"]), "utf-8");
    data = JSON.parse(raw);
  } else if (values.data) {
    data = JSON.parse(values.data);
  } else {
    console.error("Provide --data or --data-file");
    process.exit(1);
  }

  const result = await createSpreadsheet({
    data,
    outputPath: resolve(values.output),
    sheetName: values.sheet,
  });

  console.log(
    `Created ${result.outputPath} with ${result.rowCount} rows in sheet "${result.sheetName}"`,
  );
}
