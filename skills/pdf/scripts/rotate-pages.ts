/**
 * Rotate pages in a PDF by 90, 180, or 270 degrees
 */
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { PDF } from "@libpdf/core";
import { cac } from "cac";

export async function rotatePages({
  inputPath,
  outputPath,
  rotation,
  pages,
}: {
  inputPath: string;
  outputPath: string;
  rotation: 90 | 180 | 270;
  pages?: number[];
}) {
  const bytes = await readFile(inputPath);
  const pdf = await PDF.load(new Uint8Array(bytes));
  const allPages = pdf.getPages();
  const totalPages = allPages.length;

  const targetIndices =
    pages !== undefined
      ? pages.map((p) => {
          const idx = p - 1;
          if (idx < 0 || idx >= totalPages) {
            throw new Error(
              `Page ${p} is out of range (document has ${totalPages} page(s))`,
            );
          }
          return idx;
        })
      : allPages.map((_, i) => i);

  for (const idx of targetIndices) {
    const page = allPages[idx];
    const current = page.rotation;
    page.setRotation(((current + rotation) % 360) as 0 | 90 | 180 | 270);
  }

  const pdfBytes = await pdf.save();
  await writeFile(outputPath, pdfBytes);

  return {
    rotatedCount: targetIndices.length,
    pageCount: totalPages,
    outputPath,
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cli = cac("rotate-pages");
  cli.usage("document.pdf --output rotated.pdf --rotation 90");
  cli.option("--output <path>", "Output PDF file path");
  cli.option("--rotation <value>", "Rotation angle: 90, 180, or 270", {
    default: "90",
  });
  cli.option("--pages <value>", "Comma-separated 1-based page numbers");
  cli.help();
  const { args, options } = cli.parse();
  if (options.help) process.exit(0);

  if (!args[0] || !options.output) {
    cli.outputHelp();
    process.exit(1);
  }

  const rotation = parseInt(options.rotation, 10);
  if (rotation !== 90 && rotation !== 180 && rotation !== 270) {
    throw new Error("--rotation must be 90, 180, or 270");
  }
  const pages = options.pages
    ? options.pages.split(",").map((p: string) => parseInt(p.trim(), 10))
    : undefined;
  const result = await rotatePages({
    inputPath: resolve(args[0]),
    outputPath: resolve(options.output),
    rotation,
    pages,
  });
  console.log(
    `Rotated ${result.rotatedCount} page(s) by ${rotation}°, saved to ${result.outputPath}`,
  );
}
