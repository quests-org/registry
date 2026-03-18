import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { PDF } from "@libpdf/core";

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
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      output: { type: "string" },
      rotation: { type: "string", default: "90" },
      pages: { type: "string" },
    },
  });

  const [inputPath] = positionals;

  if (!inputPath || !values.output) {
    console.error(
      "Usage: tsx scripts/rotate-pages.ts <input> --output <path> [--rotation <90|180|270>] [--pages <1,2,3>]",
    );
    process.exit(1);
  }

  const rotation = parseInt(values.rotation ?? "90", 10);
  if (rotation !== 90 && rotation !== 180 && rotation !== 270) {
    console.error("--rotation must be 90, 180, or 270");
    process.exit(1);
  }

  const pages = values.pages
    ? values.pages.split(",").map((p) => parseInt(p.trim(), 10))
    : undefined;

  const result = await rotatePages({
    inputPath: resolve(inputPath),
    outputPath: resolve(values.output),
    rotation,
    pages,
  });

  console.log(
    `Rotated ${result.rotatedCount} page(s) by ${rotation}°, saved to ${result.outputPath}`,
  );
}
