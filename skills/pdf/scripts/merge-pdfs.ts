import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { PDF } from "@libpdf/core";

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
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      output: { type: "string" },
    },
  });

  if (positionals.length < 2 || !values.output) {
    console.error(
      "Usage: tsx scripts/merge-pdfs.ts <input1> <input2> [...inputs] --output <path>",
    );
    process.exit(1);
  }

  const result = await mergePdfs({
    inputPaths: positionals.map((p) => resolve(p)),
    outputPath: resolve(values.output),
  });

  console.log(
    `Merged ${positionals.length} PDFs into ${result.pageCount} page(s) at ${result.outputPath}`,
  );
}
