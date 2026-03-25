/**
 * Read rows from an Excel or CSV spreadsheet as JSON
 */
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { cac } from "cac";
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
  const cli = cac("read-spreadsheet");
  cli.usage("<path> [--sheet <name>] [--output <path>]");
  cli.option("--sheet <name>", "Read only a specific sheet");
  cli.option("--output <path>", "Write JSON output to file");
  cli.help();
  const parsed = cli.parse();
  const { options } = parsed;
  if (options.help) process.exit(0);
  const [filePath] = parsed.args;

  if (!filePath) {
    cli.outputHelp();
    process.exit(1);
  }

  const result = await readSpreadsheet({
    inputPath: resolve(filePath),
    sheetName: options.sheet,
  });

  const json = JSON.stringify(result, null, 2);

  if (options.output) {
    const outputPath = resolve(options.output);
    await writeFile(outputPath, json, "utf-8");
    console.log(`Written to ${outputPath}`);
  } else {
    console.log(json);
  }
}
