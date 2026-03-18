import { readFile, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { PDF, rgb } from "@libpdf/core";

export async function watermarkPdf({
  inputPath,
  outputPath,
  text,
  opacity = 0.3,
  fontSize = 60,
}: {
  inputPath: string;
  outputPath: string;
  text: string;
  opacity?: number;
  fontSize?: number;
}) {
  const bytes = await readFile(inputPath);
  const pdf = await PDF.load(new Uint8Array(bytes));
  const pages = pdf.getPages();

  for (const page of pages) {
    const { width, height } = page;
    const textWidth = text.length * fontSize * 0.5;
    page.drawText(text, {
      x: width / 2 - textWidth / 2,
      y: height / 2,
      size: fontSize,
      font: "Helvetica-Bold",
      color: rgb(0.6, 0.6, 0.6),
      opacity,
      rotate: { angle: -45 },
    });
  }

  const pdfBytes = await pdf.save();
  await writeFile(outputPath, pdfBytes);

  return { pageCount: pages.length, outputPath };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      output: { type: "string" },
      text: { type: "string" },
      opacity: { type: "string" },
      "font-size": { type: "string" },
    },
  });

  const [inputPath] = positionals;

  if (!inputPath || !values.output || !values.text) {
    console.error(
      "Usage: tsx scripts/watermark-pdf.ts <input> --text <text> --output <path> [--opacity <0-1>] [--font-size <n>]",
    );
    process.exit(1);
  }

  const result = await watermarkPdf({
    inputPath: resolve(inputPath),
    outputPath: resolve(values.output),
    text: values.text,
    opacity: values.opacity ? parseFloat(values.opacity) : undefined,
    fontSize: values["font-size"] ? parseFloat(values["font-size"]) : undefined,
  });

  const relOutput = relative(process.cwd(), result.outputPath) || ".";
  console.log(
    `Watermarked ${result.pageCount} page(s) with "${values.text}", saved to ${relOutput}`,
  );
}
