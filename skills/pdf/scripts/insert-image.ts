/**
 * Insert an image onto a PDF page at specified coordinates
 */
import { readFile, writeFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { PDF } from "@libpdf/core";
import { cac } from "cac";

export async function insertImage({
  inputPath,
  outputPath,
  imagePath,
  page = 1,
  x,
  y,
  width,
  height,
  opacity = 1,
}: {
  inputPath: string;
  outputPath: string;
  imagePath: string;
  page?: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  opacity?: number;
}) {
  const [pdfBytes, imageBytes] = await Promise.all([
    readFile(inputPath),
    readFile(imagePath),
  ]);

  const pdf = await PDF.load(new Uint8Array(pdfBytes));
  const pageCount = pdf.getPageCount();

  if (page < 1 || page > pageCount) {
    throw new Error(`Page ${page} is out of range (1–${pageCount})`);
  }

  const pdfPage = pdf.getPage(page - 1);
  if (!pdfPage) throw new Error(`Page ${page} not found`);

  const ext = extname(imagePath).toLowerCase();
  const image =
    ext === ".jpg" || ext === ".jpeg"
      ? pdf.embedJpeg(imageBytes)
      : pdf.embedPng(imageBytes);

  pdfPage.drawImage(image, { x, y, width, height, opacity });

  const saved = await pdf.save();
  await writeFile(outputPath, saved);

  return { pageCount, outputPath };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cli = cac("insert-image");
  cli.usage("document.pdf --image logo.png --x 50 --y 50 --output output.pdf");
  cli.option("--image <path>", "Path to image file to insert");
  cli.option("--x <n>", "X position in PDF points");
  cli.option("--y <n>", "Y position in PDF points");
  cli.option("--output <path>", "Output PDF file path");
  cli.option("--page <n>", "1-based page number to edit");
  cli.option("--width <n>", "Draw width in PDF points");
  cli.option("--height <n>", "Draw height in PDF points");
  cli.option("--opacity <n>", "Image opacity between 0 and 1");
  cli.help();
  const { args, options } = cli.parse();
  if (options.help) process.exit(0);

  if (
    !args[0] ||
    !options.output ||
    !options.image ||
    options.x === undefined ||
    options.y === undefined
  ) {
    cli.outputHelp();
    process.exit(1);
  }

  const result = await insertImage({
    inputPath: resolve(args[0]),
    outputPath: resolve(options.output),
    imagePath: resolve(options.image),
    page: options.page !== undefined ? Number(options.page) : 1,
    x: Number(options.x),
    y: Number(options.y),
    width: options.width !== undefined ? Number(options.width) : undefined,
    height: options.height !== undefined ? Number(options.height) : undefined,
    opacity: options.opacity !== undefined ? Number(options.opacity) : 1,
  });
  console.log(`Saved PDF with image inserted at ${result.outputPath}`);
}
