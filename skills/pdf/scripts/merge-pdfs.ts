/**
 * Merge multiple PDF files into a single document
 */
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { PDF } from "@libpdf/core";
import { cac } from "cac";

export async function mergePdfs({
  inputPaths,
  outputPath,
}: {
  inputPaths: string[];
  outputPath: string;
}) {
  const sources = await Promise.all(
    inputPaths.map(async (p) => new Uint8Array(await readFile(p))),
  );
  const merged = await PDF.merge(sources);
  const pdfBytes = await merged.save();
  await writeFile(outputPath, pdfBytes);

  return { pageCount: merged.getPageCount(), outputPath };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cli = cac("merge-pdfs");
  cli.usage("a.pdf b.pdf c.pdf --output merged.pdf");
  cli.option("--output <path>", "Output merged PDF file path");
  cli.help();
  const { args, options } = cli.parse();
  if (options.help) process.exit(0);

  if (args.length < 2 || !options.output) {
    cli.outputHelp();
    process.exit(1);
  }

  const result = await mergePdfs({
    inputPaths: args.map((p: string) => resolve(p)),
    outputPath: resolve(options.output),
  });
  console.log(
    `Merged ${args.length} PDFs into ${result.pageCount} page(s) at ${result.outputPath}`,
  );
}
