import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { PDF, rgb } from "@libpdf/core";

export async function createPdf({
  title,
  content,
  outputPath,
}: {
  title: string;
  content: string;
  outputPath: string;
}) {
  const pdf = PDF.create();
  let page = pdf.addPage({ width: 595, height: 842 });

  page.drawText(title, {
    x: 50,
    y: 842 - 60,
    size: 24,
    font: "Helvetica-Bold",
    color: rgb(0.1, 0.1, 0.4),
  });

  page.drawLine({
    start: { x: 50, y: 842 - 75 },
    end: { x: 595 - 50, y: 842 - 75 },
    thickness: 1,
    color: rgb(0.6, 0.6, 0.6),
  });

  const lines = content.split("\n");
  let y = 842 - 110;
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

  pdf.setTitle(title);
  pdf.setCreationDate(new Date());

  const pdfBytes = await pdf.save();
  await writeFile(outputPath, pdfBytes);

  return { pageCount: pdf.getPageCount(), outputPath };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      title: { type: "string", default: "Untitled" },
      output: { type: "string" },
    },
  });

  const [contentOrFile] = positionals;

  if (!values.output) {
    console.error(
      "Usage: tsx scripts/create-pdf.ts <content> --title <title> --output <path>",
    );
    process.exit(1);
  }

  const result = await createPdf({
    title: values.title ?? "Untitled",
    content: contentOrFile ?? "",
    outputPath: resolve(values.output),
  });

  console.log(
    `Created PDF with ${result.pageCount} page(s) at ${result.outputPath}`,
  );
}
