import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { PDF, rgb } from "@libpdf/core";
import { cac } from "cac";

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
  const cli = cac("watermark-pdf");

  cli
    .command("<inputPath>")
    .option("--text <text>", "Watermark text")
    .option("--output <path>", "Output PDF file path")
    .option("--opacity <n>", "Watermark opacity between 0 and 1")
    .option("--font-size <n>", "Watermark font size in points")
    .action(async (inputPath: string, options) => {
      if (!options.output || !options.text) {
        throw new Error("--text and --output are required");
      }
      const result = await watermarkPdf({
        inputPath: resolve(inputPath),
        outputPath: resolve(options.output),
        text: options.text,
        opacity: options.opacity ? parseFloat(options.opacity) : undefined,
        fontSize: options.fontSize ? parseFloat(options.fontSize) : undefined,
      });
      const relOutput = result.outputPath;
      console.log(
        `Watermarked ${result.pageCount} page(s) with "${options.text}", saved to ${relOutput}`,
      );
    });

  cli.help();
  await cli.parse();
}
