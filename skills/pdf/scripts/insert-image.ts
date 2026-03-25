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

  cli
    .command("<inputPath>")
    .option("--image <path>", "Path to image file to insert")
    .option("--x <n>", "X position in PDF points")
    .option("--y <n>", "Y position in PDF points")
    .option("--output <path>", "Output PDF file path")
    .option("--page <n>", "1-based page number to edit")
    .option("--width <n>", "Draw width in PDF points")
    .option("--height <n>", "Draw height in PDF points")
    .option("--opacity <n>", "Image opacity between 0 and 1")
    .action(async (inputPath: string, options) => {
      if (
        !options.output ||
        !options.image ||
        options.x === undefined ||
        options.y === undefined
      ) {
        throw new Error("--image, --x, --y, and --output are required");
      }
      const result = await insertImage({
        inputPath: resolve(inputPath),
        outputPath: resolve(options.output),
        imagePath: resolve(options.image),
        page: options.page !== undefined ? Number(options.page) : 1,
        x: Number(options.x),
        y: Number(options.y),
        width: options.width !== undefined ? Number(options.width) : undefined,
        height:
          options.height !== undefined ? Number(options.height) : undefined,
        opacity: options.opacity !== undefined ? Number(options.opacity) : 1,
      });
      const relOutput = result.outputPath;
      console.log(`Saved PDF with image inserted at ${relOutput}`);
    });

  cli.help();
  await cli.parse();
}
