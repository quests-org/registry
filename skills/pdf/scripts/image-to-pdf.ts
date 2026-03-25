/**
 * Convert one or more images into a PDF document, one image per page
 */
import { readFile, writeFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { PDF } from "@libpdf/core";
import { cac } from "cac";

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
  const cli = cac("image-to-pdf");
  cli.usage("photo1.jpg photo2.jpg --output output.pdf");
  cli.option("--output <path>", "Output PDF file path");
  cli.option("--size <size>", "Page size: letter, a4, or legal", {
    default: "letter",
  });
  cli.help();
  const { args, options } = cli.parse();
  if (options.help) process.exit(0);

  if (args.length === 0 || !options.output) {
    cli.outputHelp();
    process.exit(1);
  }

  const validSizes = ["letter", "a4", "legal"] as const;
  if (!validSizes.includes(options.size)) {
    throw new Error(`--size must be one of: ${validSizes.join(", ")}`);
  }
  const result = await imageToPdf({
    imagePaths: args.map((p: string) => resolve(p)),
    outputPath: resolve(options.output),
    size: options.size,
  });
  console.log(
    `Created PDF with ${result.pageCount} page(s) at ${result.outputPath}`,
  );
}
