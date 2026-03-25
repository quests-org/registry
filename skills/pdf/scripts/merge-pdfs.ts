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

  cli
    .command("<inputPaths...>")
    .option("--output <path>", "Output merged PDF file path")
    .action(async (inputPaths: string[], options) => {
      if (inputPaths.length < 2) {
        throw new Error("At least two input PDFs are required");
      }
      if (!options.output) {
        throw new Error("--output is required");
      }
      const result = await mergePdfs({
        inputPaths: inputPaths.map((p) => resolve(p)),
        outputPath: resolve(options.output),
      });
      const relOutput = result.outputPath;
      console.log(
        `Merged ${inputPaths.length} PDFs into ${result.pageCount} page(s) at ${relOutput}`,
      );
    });

  cli.help();
  await cli.parse();
}
