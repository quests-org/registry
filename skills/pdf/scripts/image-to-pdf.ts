import { readFile, writeFile } from "node:fs/promises";
import { extname, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { PDF } from "@libpdf/core";

export async function imageToPdf({
  imagePaths,
  outputPath,
  size = "letter",
}: {
  imagePaths: string[];
  outputPath: string;
  size?: "letter" | "a4" | "legal";
}) {
  const sizes = {
    letter: { width: 612, height: 792 },
    a4: { width: 595, height: 842 },
    legal: { width: 612, height: 1008 },
  };

  const { width, height } = sizes[size];
  const pdf = PDF.create();

  for (const imagePath of imagePaths) {
    const bytes = await readFile(imagePath);
    const ext = extname(imagePath).toLowerCase();

    const page = pdf.addPage({ width, height });

    const image =
      ext === ".jpg" || ext === ".jpeg"
        ? pdf.embedJpeg(bytes)
        : pdf.embedPng(bytes);

    const imgWidth = image.width;
    const imgHeight = image.height;

    const scaleX = width / imgWidth;
    const scaleY = height / imgHeight;
    const scale = Math.min(scaleX, scaleY);

    const drawWidth = imgWidth * scale;
    const drawHeight = imgHeight * scale;
    const x = (width - drawWidth) / 2;
    const y = (height - drawHeight) / 2;

    page.drawImage(image, { x, y, width: drawWidth, height: drawHeight });
  }

  const pdfBytes = await pdf.save();
  await writeFile(outputPath, pdfBytes);

  return { pageCount: pdf.getPageCount(), outputPath };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      output: { type: "string" },
      size: { type: "string" },
    },
  });

  if (positionals.length === 0 || !values.output) {
    console.error(
      "Usage: tsx skills/pdf/scripts/image-to-pdf.ts <image1> [image2 ...] --output <path> [--size letter|a4|legal]",
    );
    process.exit(1);
  }

  const size = (values.size ?? "letter") as "letter" | "a4" | "legal";
  const validSizes = ["letter", "a4", "legal"];
  if (!validSizes.includes(size)) {
    console.error(`--size must be one of: ${validSizes.join(", ")}`);
    process.exit(1);
  }

  const result = await imageToPdf({
    imagePaths: positionals.map((p) => resolve(p)),
    outputPath: resolve(values.output),
    size,
  });

  const relOutput = relative(process.cwd(), result.outputPath) || ".";
  console.log(`Created PDF with ${result.pageCount} page(s) at ${relOutput}`);
}
