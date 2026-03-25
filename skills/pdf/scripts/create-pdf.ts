import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { PDF, rgb } from "@libpdf/core";
import { cac } from "cac";

export async function createPdf({
  content,
  outputPath,
}: {
  content: string;
  outputPath: string;
}) {
  const pdf = PDF.create();
  let page = pdf.addPage({ width: 595, height: 842 });

  const lines = content.split("\n");
  let y = 842 - 60;
  const lineHeight = 18;
  const fontSize = 12;

  for (const line of lines) {
    if (y < 60) {
      page = pdf.addPage({ width: 595, height: 842 });
      y = 842 - 60;
    }
    page.drawText(line, {
      x: 50,
      y,
      size: fontSize,
      font: "Helvetica",
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= lineHeight;
  }

  pdf.setCreationDate(new Date());

  const pdfBytes = await pdf.save();
  await writeFile(outputPath, pdfBytes);

  return { pageCount: pdf.getPageCount(), outputPath };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cli = cac("create-pdf");

  cli
    .command("[content]")
    .option("--output <path>", "Output PDF file path")
    .action(async (content: string | undefined, options) => {
      if (!options.output) {
        throw new Error("--output is required");
      }
      const result = await createPdf({
        content: content ?? "",
        outputPath: resolve(options.output),
      });
      const relOutput = result.outputPath;
      console.log(
        `Created PDF with ${result.pageCount} page(s) at ${relOutput}`,
      );
    });

  cli.help();
  await cli.parse();
}
