import { writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { PDF, rgb } from "@libpdf/core";

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
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      output: { type: "string" },
    },
  });

  const [content] = positionals;

  if (!values.output) {
    console.error(
      "Usage: tsx skills/pdf/scripts/create-pdf.ts <content> --output <path>",
    );
    process.exit(1);
  }

  const result = await createPdf({
    content: content ?? "",
    outputPath: resolve(values.output),
  });

  const relOutput = relative(process.cwd(), result.outputPath) || ".";
  console.log(`Created PDF with ${result.pageCount} page(s) at ${relOutput}`);
}
