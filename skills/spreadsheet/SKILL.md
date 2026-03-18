---
name: spreadsheet
description: "Work with tabular data files: spreadsheets, Excel, CSV, TSV, and comma-separated values. Use whenever the user wants to read, write, create, parse, generate, query, filter, convert, or manipulate .xlsx, .xls, .csv, .tsv files, workbooks, worksheets, or any tabular data."
---

# Spreadsheet

Use the scripts in `skills/spreadsheet/scripts/` to work with spreadsheet and tabular data files.

## Scripts

Each script can also be used programmatically via its exported function.

### `read-spreadsheet.ts` Read an Excel or CSV file

Export: `readSpreadsheet({ inputPath })`

Use when you need to extract data from a spreadsheet file as JSON.

```bash
tsx skills/spreadsheet/scripts/read-spreadsheet.ts <path> [--sheet <name>] [--output <path>]
```

- Reads `.xlsx`, `.xls`, and `.csv` files
- Returns all sheets by default; use `--sheet` to select a specific sheet
- Each sheet's data is returned as an array of objects keyed by header row
- `--output` writes JSON to a file instead of stdout

### `create-spreadsheet.ts` Create a new .xlsx file from JSON data

Export: `createSpreadsheet({ data, outputPath, sheetName? })`

Use when you need to generate a spreadsheet from structured data.

```bash
tsx skills/spreadsheet/scripts/create-spreadsheet.ts --output <path> [--sheet <name>] [--data <json>] [--data-file <path>]
```

- `--data` inline JSON string (array of objects)
- `--data-file` path to a JSON file containing an array of objects
- `--sheet` sheet name (default: `Sheet1`)
- `--output` path to write the `.xlsx` file (required)

### `convert-csv.ts` Convert between CSV and XLSX formats

Export: `convertCsv({ inputPath, outputPath, sheetName? })`

Use when you need to convert a CSV file to XLSX or an XLSX file to CSV.

```bash
tsx skills/spreadsheet/scripts/convert-csv.ts <input> --output <path> [--sheet <name>]
```

- Infers conversion direction from file extensions
- CSV to XLSX: wraps CSV data in a workbook with optional sheet name
- XLSX to CSV: exports the first sheet (or named `--sheet`) as CSV

### `parse-csv.ts` Parse a CSV file into JSON

Export: `parseCsv({ inputPath, header?, delimiter? })`

```bash
tsx skills/spreadsheet/scripts/parse-csv.ts <path> [--output <path>] [--no-header] [--delimiter <char>]
```

| Argument          | Required | Default     | Description                       |
| ----------------- | -------- | ----------- | --------------------------------- |
| `<path>`          | Yes      |             | Input CSV file                    |
| `--output <path>` | No       | stdout      | Write JSON output to file         |
| `--no-header`     | No       | `false`     | Do not treat first row as headers |
| `--delimiter <c>` | No       | auto-detect | Delimiter character               |

### `generate-csv.ts` Generate a CSV file from JSON

Export: `generateCsv({ data, header?, delimiter? })`

```bash
tsx skills/spreadsheet/scripts/generate-csv.ts <json-path> [--output <path>] [--delimiter <char>] [--no-header]
```

| Argument          | Required | Default | Description                        |
| ----------------- | -------- | ------- | ---------------------------------- |
| `<json-path>`     | Yes      |         | Input JSON file (array of objects) |
| `--output <path>` | No       | stdout  | Write CSV output to file           |
| `--delimiter <c>` | No       | `,`     | Delimiter character                |
| `--no-header`     | No       | `false` | Omit the header row                |

### `query-csv.ts` Query and filter a CSV file

Export: `queryCsv({ inputPath, column?, value?, columns?, sort?, limit? })`

```bash
tsx skills/spreadsheet/scripts/query-csv.ts <path> [--column <name>] [--value <val>] [--columns <a,b,c>] [--sort <col>] [--limit <n>]
```

| Argument           | Required | Default | Description                               |
| ------------------ | -------- | ------- | ----------------------------------------- |
| `<path>`           | Yes      |         | Input CSV file                            |
| `--column <name>`  | No       |         | Column to filter on (requires --value)    |
| `--value <val>`    | No       |         | Value to match in the filter column       |
| `--columns <list>` | No       | all     | Comma-separated list of columns to output |
| `--sort <col>`     | No       |         | Column to sort by (ascending)             |
| `--limit <n>`      | No       | all     | Maximum number of rows to output          |
