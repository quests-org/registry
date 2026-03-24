import { readFile, writeFile } from "node:fs/promises";
import { extname, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { PDF } from "@libpdf/core";

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
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      output: { type: "string" },
      image: { type: "string" },
      page: { type: "string" },
      x: { type: "string" },
      y: { type: "string" },
      width: { type: "string" },
      height: { type: "string" },
      opacity: { type: "string" },
    },
  });

  if (
    positionals.length === 0 ||
    !values.output ||
    !values.image ||
    values.x === undefined ||
    values.y === undefined
  ) {
    console.error(
      "Usage: tsx skills/pdf/scripts/insert-image.ts <input> --image <path> --x <n> --y <n> --output <path> [--page <n>] [--width <n>] [--height <n>] [--opacity <0-1>]",
    );
    process.exit(1);
  }

  const result = await insertImage({
    inputPath: resolve(positionals[0]),
    outputPath: resolve(values.output),
    imagePath: resolve(values.image),
    page: values.page !== undefined ? Number(values.page) : 1,
    x: Number(values.x),
    y: Number(values.y),
    width: values.width !== undefined ? Number(values.width) : undefined,
    height: values.height !== undefined ? Number(values.height) : undefined,
    opacity: values.opacity !== undefined ? Number(values.opacity) : 1,
  });

  const relOutput = relative(process.cwd(), result.outputPath) || ".";
  console.log(`Saved PDF with image inserted at ${relOutput}`);
}
