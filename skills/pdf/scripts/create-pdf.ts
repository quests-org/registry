import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function createPdf({
  title,
  content,
  outputPath,
}: {
  title: string;
  content: string;
  outputPath: string;
}) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.addPage([595, 842]);
  const { width, height } = page.getSize();

  page.drawText(title, {
    x: 50,
    y: height - 60,
    size: 24,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.4),
  });

  page.drawLine({
    start: { x: 50, y: height - 75 },
    end: { x: width - 50, y: height - 75 },
    thickness: 1,
    color: rgb(0.6, 0.6, 0.6),
  });

  const lines = content.split("\n");
  let y = height - 110;
  const lineHeight = 18;
  const fontSize = 12;

  for (const line of lines) {
    if (y < 60) {
      const newPage = pdfDoc.addPage([595, 842]);
      y = newPage.getSize().height - 60;
    }
    page.drawText(line, {
      x: 50,
      y,
      size: fontSize,
      font,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= lineHeight;
  }

  pdfDoc.setTitle(title);
  pdfDoc.setCreationDate(new Date());

  const pdfBytes = await pdfDoc.save();
  await writeFile(outputPath, pdfBytes);

  return { pageCount: pdfDoc.getPageCount(), outputPath };
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
