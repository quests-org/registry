/**
 * Extract embedded images from a PDF and save them as PNG files
 */
import { mkdir, writeFile } from "node:fs/promises";
import { readFile } from "node:fs/promises";
import { basename, extname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import sharp from "sharp";
import { extractImages, getDocumentProxy } from "unpdf";
import { cac } from "cac";

export async function extractPdfImages({
  inputPath,
  page,
}: {
  inputPath: string;
  page?: number;
}) {
  const buffer = await readFile(inputPath);
  const pdf = await getDocumentProxy(new Uint8Array(buffer));

  if (page !== undefined) {
    return await extractImages(pdf, page);
  }

  const allImages = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    allImages.push(...(await extractImages(pdf, p)));
  }
  return allImages;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cli = cac("extract-images");
  cli.usage("document.pdf --output ./images");
  cli.option("--page <number>", "Only extract images from this page");
  cli.option("--output <dir>", "Output directory for extracted images");
  cli.help();
  const { args, options } = cli.parse();
  if (options.help) process.exit(0);

  if (!args[0]) {
    cli.outputHelp();
    process.exit(1);
  }

  const filePath = args[0];
  let page: number | undefined;
  if (options.page !== undefined) {
    page = Number(options.page);
    if (!Number.isInteger(page) || page < 1) {
      throw new Error("--page must be a positive integer");
    }
  }
  const inputResolved = resolve(filePath);
  const outputDir = options.output
    ? resolve(options.output)
    : resolve(`${basename(filePath, extname(filePath))}-images`);
  await mkdir(outputDir, { recursive: true });
  const images = await extractPdfImages({ inputPath: inputResolved, page });
  const pageLabel = page !== undefined ? `page ${page}` : "all pages";
  if (images.length === 0) {
    console.log(`No images found on ${pageLabel}.`);
  } else {
    console.log(`Found ${images.length} image(s) on ${pageLabel}`);
    const pad = String(images.length).length;
    let i = 0;
    for (const img of images) {
      i++;
      const idx = String(i).padStart(pad, "0");
      const outPath = `${outputDir}/image-${idx}.png`;
      await sharp(img.data, {
        raw: { width: img.width, height: img.height, channels: img.channels },
      })
        .png()
        .toFile(outPath);
      console.log(
        `Saved ${outputDir}/image-${idx}.png (${img.width}x${img.height})`,
      );
    }
  }
}
