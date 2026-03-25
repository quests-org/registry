---
name: spreadsheet
description: "Work with tabular data files: spreadsheets, Excel, CSV, TSV, and comma-separated values. Use whenever the user wants to read, write, create, parse, generate, query, filter, convert, or manipulate .xlsx, .xls, .csv, .tsv files, workbooks, worksheets, or any tabular data."
---

# Spreadsheet

Use the scripts in `scripts/` to work with spreadsheet and tabular data files.

## Scripts

Each script can also be used programmatically via its exported function.

### `convert-csv.ts` Convert between CSV and Excel (XLSX/XLS) formats

Exports:

- `convertCsv({ inputPath, outputPath, sheetName, }: { inputPath: string; outputPath: string; sheetName?: string; }): Promise<{ inputPath: string; outputPath: string; direction: "csv-to-xlsx"; } | { inputPath: string; outputPath: string; direction: "xlsx-to-csv"; }>`

```text
convert-csv

Usage:
  $ convert-csv <input> --output <path> [--sheet <name>]

Options:
  --output <path>  Output file path
  --sheet <name>   Sheet name for spreadsheet conversion
  -h, --help       Display this message
```

### `create-spreadsheet.ts` Create an Excel spreadsheet from a JSON array of row objects

Exports:

- `createSpreadsheet({ data, outputPath, sheetName, }: { data: Record<string, unknown>[]; outputPath: string; sheetName?: string; }): Promise<{ outputPath: string; sheetName: string; rowCount: number; }>`

```text
create-spreadsheet

Usage:
  $ create-spreadsheet --output <path> [--sheet <name>] [--data <json>] [--data-file <path>]

Options:
  --output <path>     Output spreadsheet path
  --sheet <name>      Sheet name
  --data <json>       Inline JSON array data
  --data-file <path>  Path to JSON array data file
  -h, --help          Display this message
```

### `generate-csv.ts` Generate CSV text from a JSON array of row objects

Exports:

- `generateCsv({ data, header, delimiter, }: { data: Record<string, unknown>[]; header?: boolean; delimiter?: string; }): string`

```text
generate-csv

Usage:
  $ generate-csv <json-path> [--output <path>] [--delimiter <char>] [--no-header]

Options:
  --output <path>     Write CSV output to file
  --delimiter <char>  CSV delimiter character (default: ,)
  --header            Include header row (default: true)
  -h, --help          Display this message
```

### `parse-csv.ts` Parse a CSV file into a JSON array of row objects

Exports:

- `parseCsv({ inputPath, header, delimiter, }: { inputPath: string; header?: boolean; delimiter?: string; }): Promise<{ data: Record<string, string>[] | string[][]; meta: Papa.ParseMeta; errors: Papa.ParseError[]; }>`

```text
parse-csv

Usage:
  $ parse-csv <path> [--output <path>] [--no-header] [--delimiter <char>]

Options:
  --output <path>     Write parsed JSON output to file
  --delimiter <char>  CSV delimiter character
  --header            Treat first row as header (default: true)
  -h, --help          Display this message
```

### `query-csv.ts` Filter, sort, and project rows from a CSV file

Exports:

- `queryCsv({ inputPath, column, value, columns, sort, limit, }: { inputPath: string; column?: string; value?: string; columns?: string[]; sort?: string; limit?: number; }): Promise<Record<string, string>[]>`

```text
query-csv

Usage:
  $ query-csv <path> [--column <name>] [--value <val>] [--columns <a,b,c>] [--sort <col>] [--limit <n>]

Options:
  --column <name>    Column name to filter on
  --columns <a,b,c>  Comma-separated columns to project
  --limit <n>        Maximum number of rows to return
  --sort <col>       Column to sort by
  --value <val>      Filter value for --column
  -h, --help         Display this message
```

### `read-spreadsheet.ts` Read rows from an Excel or CSV spreadsheet as JSON

Exports:

- `readSpreadsheet({ inputPath, sheetName, }: { inputPath: string; sheetName?: string; }): Promise<{ sheetNames: string[]; sheets: SheetData[]; }>`

```text
read-spreadsheet

Usage:
  $ read-spreadsheet <path> [--sheet <name>] [--output <path>]

Options:
  --sheet <name>   Read only a specific sheet
  --output <path>  Write JSON output to file
  -h, --help       Display this message
```
