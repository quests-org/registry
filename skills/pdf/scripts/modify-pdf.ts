import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";

export async function modifyPdf({
  inputPath,
  outputPath,
  watermark,
  appendText,
}: {
  inputPath: string;
  outputPath: string;
  watermark?: string;
  appendText?: string;
}) {
  const existingBytes = await readFile(inputPath);
  const pdfDoc = await PDFDocument.load(existingBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();

  if (watermark) {
    for (const page of pages) {
      const { width, height } = page.getSize();
      page.drawText(watermark, {
        x: width / 2 - (watermark.length * 20) / 2,
        y: height / 2,
        size: 60,
        font,
        color: rgb(0.8, 0.8, 0.8),
        opacity: 0.3,
        rotate: degrees(-45),
      });
    }
  }

  if (appendText) {
    const newPage = pdfDoc.addPage([595, 842]);
    const { height } = newPage.getSize();
    const lines = appendText.split("\n");
    let y = height - 60;
    for (const line of lines) {
      newPage.drawText(line, {
        x: 50,
        y,
        size: 12,
        font,
        color: rgb(0.1, 0.1, 0.1),
      });
      y -= 18;
    }
  }

  const pdfBytes = await pdfDoc.save();
  await writeFile(outputPath, pdfBytes);

  return { pageCount: pdfDoc.getPageCount(), outputPath };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      output: { type: "string" },
      watermark: { type: "string" },
      "append-text": { type: "string" },
    },
  });

  const [inputPath] = positionals;

  if (!inputPath || !values.output) {
    console.error(
      "Usage: tsx scripts/modify-pdf.ts <input> --output <path> [--watermark <text>] [--append-text <text>]",
    );
    process.exit(1);
  }

  const result = await modifyPdf({
    inputPath: resolve(inputPath),
    outputPath: resolve(values.output),
    watermark: values.watermark,
    appendText: values["append-text"],
  });

  console.log(
    `Modified PDF with ${result.pageCount} page(s) saved to ${result.outputPath}`,
  );
}
