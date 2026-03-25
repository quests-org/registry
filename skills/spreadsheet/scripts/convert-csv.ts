/**
 * Convert between CSV and Excel (XLSX/XLS) formats
 */
import { readFile, writeFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { cac } from "cac";
import * as XLSX from "xlsx";

export async function convertCsv({
  inputPath,
  outputPath,
  sheetName,
}: {
  inputPath: string;
  outputPath: string;
  sheetName?: string;
}) {
  const inputExt = extname(inputPath).toLowerCase();
  const outputExt = extname(outputPath).toLowerCase();
  const buffer = await readFile(inputPath);
  const workbook = XLSX.read(buffer);

  if (inputExt === ".csv" && (outputExt === ".xlsx" || outputExt === ".xls")) {
    const outWorkbook = XLSX.utils.book_new();
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet) {
      throw new Error("No sheet found in CSV input");
    }
    XLSX.utils.book_append_sheet(outWorkbook, sheet, sheetName ?? "Sheet1");
    const outBuffer = XLSX.write(outWorkbook, {
      type: "buffer",
      bookType: outputExt === ".xls" ? "biff8" : "xlsx",
    }) as Buffer;
    await writeFile(outputPath, outBuffer);
    return { inputPath, outputPath, direction: "csv-to-xlsx" as const };
  }

  if ((inputExt === ".xlsx" || inputExt === ".xls") && outputExt === ".csv") {
    const targetSheet = sheetName ?? workbook.SheetNames[0];
    const worksheet = workbook.Sheets[targetSheet];
    if (!worksheet) {
      throw new Error(
        `Sheet "${targetSheet}" not found. Available: ${workbook.SheetNames.join(", ")}`,
      );
    }
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    await writeFile(outputPath, csv, "utf-8");
    return { inputPath, outputPath, direction: "xlsx-to-csv" as const };
  }

  throw new Error(
    `Unsupported conversion: ${inputExt} -> ${outputExt}. Supported: CSV <-> XLSX/XLS`,
  );
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cli = cac("convert-csv");
  cli.usage("<input> --output <path> [--sheet <name>]");
  cli.option("--output <path>", "Output file path");
  cli.option("--sheet <name>", "Sheet name for spreadsheet conversion");
  cli.help();
  const parsed = cli.parse();
  const { options } = parsed;
  if (options.help) process.exit(0);
  const [inputFile] = parsed.args;

  if (!inputFile || !options.output) {
    cli.outputHelp();
    process.exit(1);
  }

  const result = await convertCsv({
    inputPath: resolve(inputFile),
    outputPath: resolve(options.output),
    sheetName: options.sheet,
  });

  console.log(
    `Converted ${result.inputPath} -> ${result.outputPath} (${result.direction})`,
  );
}
