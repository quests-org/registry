import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { PDFDocument } from "pdf-lib";

export async function mergePdfs({
  inputPaths,
  outputPath,
}: {
  inputPaths: string[];
  outputPath: string;
}) {
  const mergedDoc = await PDFDocument.create();

  for (const inputPath of inputPaths) {
    const bytes = await readFile(inputPath);
    const doc = await PDFDocument.load(bytes);
    const indices = doc.getPageIndices();
    const copiedPages = await mergedDoc.copyPages(doc, indices);
    for (const page of copiedPages) {
      mergedDoc.addPage(page);
    }
  }

  const pdfBytes = await mergedDoc.save();
  await writeFile(outputPath, pdfBytes);

  return { pageCount: mergedDoc.getPageCount(), outputPath };
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
