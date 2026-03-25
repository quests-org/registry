import fs from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { cac } from "cac";

import Papa from "papaparse";

export async function queryCsv({
  inputPath,
  column,
  value,
  columns,
  sort,
  limit,
}: {
  inputPath: string;
  column?: string;
  value?: string;
  columns?: string[];
  sort?: string;
  limit?: number;
}) {
  const content = await fs.readFile(inputPath, "utf-8");
  const result = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
  });

  let rows = result.data;

  if (column && value !== undefined) {
    rows = rows.filter((row) => row[column] === value);
  }

  if (sort) {
    rows.sort((a, b) => {
      const aVal = a[sort] ?? "";
      const bVal = b[sort] ?? "";
      const aNum = Number(aVal);
      const bNum = Number(bVal);
      if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
        return aNum - bNum;
      }
      return aVal.localeCompare(bVal);
    });
  }

  if (limit !== undefined && limit > 0) {
    rows = rows.slice(0, limit);
  }

  if (columns && columns.length > 0) {
    rows = rows.map((row) => {
      const filtered: Record<string, string> = {};
      for (const col of columns) {
        if (col in row) {
          filtered[col] = row[col];
        }
      }
      return filtered;
    });
  }

  return rows;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cli = cac("query-csv");
  cli.option("--column <name>", "Column name to filter on");
  cli.option("--columns <a,b,c>", "Comma-separated columns to project");
  cli.option("--limit <n>", "Maximum number of rows to return");
  cli.option("--sort <col>", "Column to sort by");
  cli.option("--value <val>", "Filter value for --column");
  cli.help();
  const parsed = cli.parse();
  const { options } = parsed;
  const [filePath] = parsed.args;

  if (!filePath) {
    console.error(
      "Usage: tsx scripts/query-csv.ts <path> [--column <name>] [--value <val>] [--columns <a,b,c>] [--sort <col>] [--limit <n>]",
    );
    process.exit(1);
  }

  const inputPath = resolve(filePath);
  const limitNum = options.limit ? parseInt(options.limit, 10) : undefined;
  const columnsList = options.columns
    ? options.columns.split(",").map((c: string) => c.trim())
    : undefined;

  const rows = await queryCsv({
    inputPath,
    column: options.column,
    columns: columnsList,
    limit: limitNum,
    sort: options.sort,
    value: options.value,
  });

  console.log(JSON.stringify(rows, null, 2));
}
