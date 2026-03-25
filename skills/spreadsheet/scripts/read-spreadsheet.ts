import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import * as XLSX from "xlsx";

interface SheetData {
  name: string;
  rows: Record<string, unknown>[];
}

export async function readSpreadsheet({
  inputPath,
  sheetName,
}: {
  inputPath: string;
  sheetName?: string;
}) {
  const buffer = await readFile(inputPath);
  const workbook = XLSX.read(buffer);

  const sheetNames = sheetName ? [sheetName] : workbook.SheetNames;

  const sheets: SheetData[] = sheetNames.map((name) => {
    const worksheet = workbook.Sheets[name];
    if (!worksheet) {
      throw new Error(
        `Sheet "${name}" not found. Available sheets: ${workbook.SheetNames.join(", ")}`,
      );
    }
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);
    return { name, rows };
  });

  return { sheetNames: workbook.SheetNames, sheets };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      output: { type: "string" },
      sheet: { type: "string" },
    },
  });

  const [filePath] = positionals;

  if (!filePath) {
    console.error(
      "Usage: tsx scripts/read-spreadsheet.ts <path> [--sheet <name>] [--output <path>]",
    );
    process.exit(1);
  }

  const result = await readSpreadsheet({
    inputPath: resolve(filePath),
    sheetName: values.sheet,
  });

  const json = JSON.stringify(result, null, 2);

  if (values.output) {
    const outputPath = resolve(values.output);
    await writeFile(outputPath, json, "utf-8");
    console.log(`Written to ${outputPath}`);
  } else {
    console.log(json);
  }
}
