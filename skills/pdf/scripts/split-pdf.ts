import { readFile, writeFile } from "node:fs/promises";
import { basename, extname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { PDF } from "@libpdf/core";
import { cac } from "cac";

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
  const cli = cac("split-pdf");

  cli
    .command("<inputPath>")
    .option("--output <path>", "Output PDF file path")
    .option("--page <n>", "Single 1-based page number to extract")
    .option("--start <n>", "Start page (inclusive) for range extraction")
    .option("--end <n>", "End page (inclusive) for range extraction")
    .action(async (inputPath: string, options) => {
      const ext = extname(inputPath);
      const base = basename(inputPath, ext);
      const defaultOutput = `${base}-split${ext}`;
      const resolvedOutput = resolve(options.output ?? defaultOutput);
      let pages: number | { start: number; end: number };
      if (options.page !== undefined) {
        pages = parseInt(options.page, 10);
      } else if (options.start !== undefined && options.end !== undefined) {
        pages = {
          start: parseInt(options.start, 10),
          end: parseInt(options.end, 10),
        };
      } else {
        throw new Error("Provide --page <n> or --start <n> --end <n>");
      }
      const result = await splitPdf({
        inputPath: resolve(inputPath),
        outputPath: resolvedOutput,
        pages,
      });
      const relOutput = result.outputPath;
      console.log(`Extracted ${result.pageCount} page(s) to ${relOutput}`);
    });

  cli.help();
  await cli.parse();
}
