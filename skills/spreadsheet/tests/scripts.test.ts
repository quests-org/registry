import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { convertCsv } from "../scripts/convert-csv.ts";
import { createSpreadsheet } from "../scripts/create-spreadsheet.ts";
import { generateCsv } from "../scripts/generate-csv.ts";
import { parseCsv } from "../scripts/parse-csv.ts";
import { queryCsv } from "../scripts/query-csv.ts";
import { readSpreadsheet } from "../scripts/read-spreadsheet.ts";

const sampleData = [
  { name: "Alice", age: 30, city: "New York" },
  { name: "Bob", age: 25, city: "London" },
  { name: "Charlie", age: 35, city: "Tokyo" },
];

async function createTempXlsx(
  data: Record<string, unknown>[],
  sheetName = "Sheet1",
) {
  const outputPath = path.join(
    os.tmpdir(),
    `test-${Date.now()}-${Math.random().toString(36).slice(2)}.xlsx`,
  );
  await createSpreadsheet({ data, outputPath, sheetName });
  return outputPath;
}

async function writeTempFile({
  content,
  ext = ".csv",
}: {
  content: string;
  ext?: string;
}) {
  const filePath = path.join(
    os.tmpdir(),
    `test-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`,
  );
  await fs.writeFile(filePath, content, "utf-8");
  return filePath;
}

describe("readSpreadsheet", () => {
  it("reads all sheets from an xlsx file", async () => {
    const xlsxPath = await createTempXlsx(sampleData);
    const result = await readSpreadsheet({ inputPath: xlsxPath });

    expect(result.sheetNames).toMatchInlineSnapshot(`
      [
        "Sheet1",
      ]
    `);
    expect(result.sheets).toHaveLength(1);
    expect(result.sheets[0].name).toBe("Sheet1");
    expect(result.sheets[0].rows).toHaveLength(3);
    expect(result.sheets[0].rows[0]).toMatchObject({
      name: "Alice",
      age: 30,
      city: "New York",
    });
  });

  it("reads a specific sheet by name", async () => {
    const xlsxPath = await createTempXlsx(sampleData, "People");
    const result = await readSpreadsheet({
      inputPath: xlsxPath,
      sheetName: "People",
    });

    expect(result.sheets).toHaveLength(1);
    expect(result.sheets[0].name).toBe("People");
    expect(result.sheets[0].rows).toHaveLength(3);
  });

  it("throws for a non-existent sheet name", async () => {
    const xlsxPath = await createTempXlsx(sampleData);
    await expect(
      readSpreadsheet({ inputPath: xlsxPath, sheetName: "NonExistent" }),
    ).rejects.toThrow("not found");
  });

  it("reads a CSV file", async () => {
    const csvPath = await writeTempFile({
      content: "name,age,city\nAlice,30,New York\nBob,25,London\n",
    });
    const result = await readSpreadsheet({ inputPath: csvPath });

    expect(result.sheets).toHaveLength(1);
    expect(result.sheets[0].rows).toHaveLength(2);
    expect(result.sheets[0].rows[0]).toMatchObject({
      name: "Alice",
      age: 30,
      city: "New York",
    });
  });
});

describe("createSpreadsheet", () => {
  it("creates an xlsx file with the given data", async () => {
    const outputPath = path.join(os.tmpdir(), "test-create-spreadsheet.xlsx");
    const result = await createSpreadsheet({ data: sampleData, outputPath });

    expect(result.rowCount).toBe(3);
    expect(result.sheetName).toBe("Sheet1");
    expect(result.outputPath).toBe(outputPath);

    const buffer = await fs.readFile(outputPath);
    const workbook = XLSX.read(buffer);
    expect(workbook.SheetNames).toContain("Sheet1");

    const rows = XLSX.utils.sheet_to_json(workbook.Sheets["Sheet1"]);
    expect(rows).toHaveLength(3);
  });

  it("uses a custom sheet name", async () => {
    const outputPath = path.join(os.tmpdir(), "test-create-custom-sheet.xlsx");
    const result = await createSpreadsheet({
      data: sampleData,
      outputPath,
      sheetName: "Employees",
    });

    expect(result.sheetName).toBe("Employees");

    const buffer = await fs.readFile(outputPath);
    const workbook = XLSX.read(buffer);
    expect(workbook.SheetNames).toMatchInlineSnapshot(`
      [
        "Employees",
      ]
    `);
  });

  it("handles empty data array", async () => {
    const outputPath = path.join(os.tmpdir(), "test-create-empty.xlsx");
    const result = await createSpreadsheet({ data: [], outputPath });

    expect(result.rowCount).toBe(0);

    const buffer = await fs.readFile(outputPath);
    const workbook = XLSX.read(buffer);
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets["Sheet1"]);
    expect(rows).toHaveLength(0);
  });
});

describe("convertCsv", () => {
  it("converts CSV to XLSX", async () => {
    const csvPath = await writeTempFile({
      content: "name,age\nAlice,30\nBob,25\n",
    });
    const outputPath = path.join(os.tmpdir(), "test-csv-to-xlsx.xlsx");

    const result = await convertCsv({ inputPath: csvPath, outputPath });

    expect(result.direction).toBe("csv-to-xlsx");

    const buffer = await fs.readFile(outputPath);
    const workbook = XLSX.read(buffer);
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
      workbook.Sheets["Sheet1"],
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ name: "Alice", age: 30 });
  });

  it("converts XLSX to CSV", async () => {
    const xlsxPath = await createTempXlsx(sampleData);
    const outputPath = path.join(os.tmpdir(), "test-xlsx-to-csv.csv");

    const result = await convertCsv({ inputPath: xlsxPath, outputPath });

    expect(result.direction).toBe("xlsx-to-csv");

    const csv = await fs.readFile(outputPath, "utf-8");
    expect(csv).toContain("name");
    expect(csv).toContain("Alice");
    expect(csv).toContain("Bob");
  });

  it("uses custom sheet name for CSV to XLSX", async () => {
    const csvPath = await writeTempFile({ content: "x,y\n1,2\n" });
    const outputPath = path.join(os.tmpdir(), "test-csv-custom-sheet.xlsx");

    await convertCsv({ inputPath: csvPath, outputPath, sheetName: "Data" });

    const buffer = await fs.readFile(outputPath);
    const workbook = XLSX.read(buffer);
    expect(workbook.SheetNames).toContain("Data");
  });

  it("converts XLSX to CSV for a specific sheet", async () => {
    const outputPath1 = path.join(os.tmpdir(), "test-multisheet.xlsx");
    const ws1 = XLSX.utils.json_to_sheet([{ a: 1 }]);
    const ws2 = XLSX.utils.json_to_sheet([{ b: 2 }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws1, "First");
    XLSX.utils.book_append_sheet(wb, ws2, "Second");
    const buffer = XLSX.write(wb, {
      type: "buffer",
      bookType: "xlsx",
    }) as Buffer;
    await fs.writeFile(outputPath1, buffer);

    const csvOutput = path.join(os.tmpdir(), "test-multisheet-second.csv");
    await convertCsv({
      inputPath: outputPath1,
      outputPath: csvOutput,
      sheetName: "Second",
    });

    const csv = await fs.readFile(csvOutput, "utf-8");
    expect(csv).toContain("b");
    expect(csv).toContain("2");
    expect(csv).not.toContain("a");
  });

  it("throws for unsupported conversion", async () => {
    const csvPath = await writeTempFile({ content: "a,b\n1,2\n" });
    const outputPath = path.join(os.tmpdir(), "test-bad.json");

    await expect(
      convertCsv({ inputPath: csvPath, outputPath }),
    ).rejects.toThrow("Unsupported conversion");
  });
});

const SAMPLE_CSV = `name,age,city
Alice,30,New York
Bob,25,London
Charlie,35,Paris
Diana,25,London`;

const SAMPLE_TSV = `name\tage\tcity
Alice\t30\tNew York
Bob\t25\tLondon`;

describe("parseCsv", () => {
  it("parses CSV with headers", async () => {
    const filePath = await writeTempFile({ content: SAMPLE_CSV });

    const result = await parseCsv({ inputPath: filePath });

    expect(result.data).toMatchInlineSnapshot(`
      [
        {
          "age": "30",
          "city": "New York",
          "name": "Alice",
        },
        {
          "age": "25",
          "city": "London",
          "name": "Bob",
        },
        {
          "age": "35",
          "city": "Paris",
          "name": "Charlie",
        },
        {
          "age": "25",
          "city": "London",
          "name": "Diana",
        },
      ]
    `);
  });

  it("parses CSV without headers", async () => {
    const filePath = await writeTempFile({ content: SAMPLE_CSV });

    const result = await parseCsv({ inputPath: filePath, header: false });

    expect(result.data).toMatchInlineSnapshot(`
      [
        [
          "name",
          "age",
          "city",
        ],
        [
          "Alice",
          "30",
          "New York",
        ],
        [
          "Bob",
          "25",
          "London",
        ],
        [
          "Charlie",
          "35",
          "Paris",
        ],
        [
          "Diana",
          "25",
          "London",
        ],
      ]
    `);
  });

  it("parses TSV with custom delimiter", async () => {
    const filePath = await writeTempFile({ content: SAMPLE_TSV, ext: ".tsv" });

    const result = await parseCsv({
      inputPath: filePath,
      delimiter: "\t",
    });

    expect(result.data).toMatchInlineSnapshot(`
      [
        {
          "age": "30",
          "city": "New York",
          "name": "Alice",
        },
        {
          "age": "25",
          "city": "London",
          "name": "Bob",
        },
      ]
    `);
  });

  it("auto-detects tab delimiter", async () => {
    const filePath = await writeTempFile({ content: SAMPLE_TSV, ext: ".tsv" });

    const result = await parseCsv({ inputPath: filePath });

    expect(result.meta.delimiter).toBe("\t");
    expect(result.data).toHaveLength(2);
  });
});

describe("generateCsv", () => {
  it("generates CSV from array of objects", () => {
    const data = [
      { name: "Alice", age: "30", city: "New York" },
      { name: "Bob", age: "25", city: "London" },
    ];

    const csv = generateCsv({ data });

    expect(csv).toMatchInlineSnapshot(`
      "name,age,city
      Alice,30,New York
      Bob,25,London"
    `);
  });

  it("generates CSV without header", () => {
    const data = [
      { name: "Alice", age: "30" },
      { name: "Bob", age: "25" },
    ];

    const csv = generateCsv({ data, header: false });

    expect(csv).toMatchInlineSnapshot(`
      "Alice,30
      Bob,25"
    `);
  });

  it("generates TSV with custom delimiter", () => {
    const data = [
      { name: "Alice", age: "30" },
      { name: "Bob", age: "25" },
    ];

    const csv = generateCsv({ data, delimiter: "\t" });

    expect(csv).toMatchInlineSnapshot(`
      "name	age
      Alice	30
      Bob	25"
    `);
  });

  it("roundtrips through parse and generate", async () => {
    const filePath = await writeTempFile({ content: SAMPLE_CSV });

    const parsed = await parseCsv({ inputPath: filePath });
    const csv = generateCsv({
      data: parsed.data as Record<string, unknown>[],
    });
    const reparsed = await parseCsv({
      inputPath: await writeTempFile({ content: csv }),
    });

    expect(reparsed.data).toEqual(parsed.data);
  });
});

describe("queryCsv", () => {
  it("filters rows by column value", async () => {
    const filePath = await writeTempFile({ content: SAMPLE_CSV });

    const rows = await queryCsv({
      inputPath: filePath,
      column: "city",
      value: "London",
    });

    expect(rows).toMatchInlineSnapshot(`
      [
        {
          "age": "25",
          "city": "London",
          "name": "Bob",
        },
        {
          "age": "25",
          "city": "London",
          "name": "Diana",
        },
      ]
    `);
  });

  it("selects specific columns", async () => {
    const filePath = await writeTempFile({ content: SAMPLE_CSV });

    const rows = await queryCsv({
      inputPath: filePath,
      columns: ["name", "city"],
    });

    expect(rows).toMatchInlineSnapshot(`
      [
        {
          "city": "New York",
          "name": "Alice",
        },
        {
          "city": "London",
          "name": "Bob",
        },
        {
          "city": "Paris",
          "name": "Charlie",
        },
        {
          "city": "London",
          "name": "Diana",
        },
      ]
    `);
  });

  it("sorts by a numeric column", async () => {
    const filePath = await writeTempFile({ content: SAMPLE_CSV });

    const rows = await queryCsv({
      inputPath: filePath,
      sort: "age",
      columns: ["name", "age"],
    });

    expect(rows).toMatchInlineSnapshot(`
      [
        {
          "age": "25",
          "name": "Bob",
        },
        {
          "age": "25",
          "name": "Diana",
        },
        {
          "age": "30",
          "name": "Alice",
        },
        {
          "age": "35",
          "name": "Charlie",
        },
      ]
    `);
  });

  it("sorts by a string column", async () => {
    const filePath = await writeTempFile({ content: SAMPLE_CSV });

    const rows = await queryCsv({
      inputPath: filePath,
      sort: "name",
      columns: ["name"],
    });

    expect(rows).toMatchInlineSnapshot(`
      [
        {
          "name": "Alice",
        },
        {
          "name": "Bob",
        },
        {
          "name": "Charlie",
        },
        {
          "name": "Diana",
        },
      ]
    `);
  });

  it("limits output rows", async () => {
    const filePath = await writeTempFile({ content: SAMPLE_CSV });

    const rows = await queryCsv({
      inputPath: filePath,
      limit: 2,
    });

    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveProperty("name", "Alice");
    expect(rows[1]).toHaveProperty("name", "Bob");
  });

  it("combines filter, sort, limit, and column selection", async () => {
    const filePath = await writeTempFile({ content: SAMPLE_CSV });

    const rows = await queryCsv({
      inputPath: filePath,
      column: "city",
      value: "London",
      sort: "name",
      limit: 1,
      columns: ["name"],
    });

    expect(rows).toMatchInlineSnapshot(`
      [
        {
          "name": "Bob",
        },
      ]
    `);
  });

  it("returns all rows when no filters applied", async () => {
    const filePath = await writeTempFile({ content: SAMPLE_CSV });

    const rows = await queryCsv({ inputPath: filePath });

    expect(rows).toHaveLength(4);
  });
});
