import { readFile, writeFile } from "node:fs/promises";
import { basename, extname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { PDF } from "@libpdf/core";

export async function splitPdf({
  inputPath,
  outputPath,
  pages,
}: {
  inputPath: string;
  outputPath: string;
  pages: number | { start: number; end: number };
}) {
  const bytes = await readFile(inputPath);
  const srcDoc = await PDF.load(new Uint8Array(bytes));
  const totalPages = srcDoc.getPageCount();

  let indices: number[];

  if (typeof pages === "number") {
    const idx = pages - 1;
    if (idx < 0 || idx >= totalPages) {
      throw new Error(
        `Page ${pages} is out of range (document has ${totalPages} page(s))`,
      );
    }
    indices = [idx];
  } else {
    const { start, end } = pages;
    if (start < 1 || end > totalPages || start > end) {
      throw new Error(
        `Range ${start}–${end} is invalid (document has ${totalPages} page(s))`,
      );
    }
    indices = Array.from({ length: end - start + 1 }, (_, i) => start - 1 + i);
  }

  const outDoc = await srcDoc.extractPages(indices);
  const pdfBytes = await outDoc.save();
  await writeFile(outputPath, pdfBytes);

  return { pageCount: outDoc.getPageCount(), outputPath };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      output: { type: "string" },
      page: { type: "string" },
      start: { type: "string" },
      end: { type: "string" },
    },
  });

  const [inputPath] = positionals;

  if (!inputPath) {
    console.error(
      "Usage: tsx scripts/split-pdf.ts <input> --output <path> [--page <n>] [--start <n> --end <n>]",
    );
    process.exit(1);
  }

  const ext = extname(inputPath);
  const base = basename(inputPath, ext);
  const defaultOutput = `${base}-split${ext}`;
  const resolvedOutput = resolve(values.output ?? defaultOutput);

  let pages: number | { start: number; end: number };

  if (values.page !== undefined) {
    pages = parseInt(values.page, 10);
  } else if (values.start !== undefined && values.end !== undefined) {
    pages = {
      start: parseInt(values.start, 10),
      end: parseInt(values.end, 10),
    };
  } else {
    console.error("Provide --page <n> or --start <n> --end <n>");
    process.exit(1);
  }

  const result = await splitPdf({
    inputPath: resolve(inputPath),
    outputPath: resolvedOutput,
    pages,
  });

  console.log(`Extracted ${result.pageCount} page(s) to ${result.outputPath}`);
}
