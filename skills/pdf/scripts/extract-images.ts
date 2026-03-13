import { mkdir, writeFile } from "node:fs/promises";
import { readFile } from "node:fs/promises";
import { basename, extname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import sharp from "sharp";
import { extractImages, getDocumentProxy } from "unpdf";

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
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      page: { type: "string" },
      output: { type: "string" },
    },
  });

  const [filePath] = positionals;

  if (!filePath) {
    console.error(
      "Usage: tsx scripts/extract-images.ts <path> [--page <number>] [--output <dir>]",
    );
    process.exit(1);
  }

  let page: number | undefined;
  if (values.page !== undefined) {
    page = Number(values.page);
    if (!Number.isInteger(page) || page < 1) {
      console.error("--page must be a positive integer");
      process.exit(1);
    }
  }

  const inputResolved = resolve(filePath);
  const outputDir = values.output
    ? resolve(values.output)
    : resolve(`${basename(filePath, extname(filePath))}-images`);

  await mkdir(outputDir, { recursive: true });

  const images = await extractPdfImages({ inputPath: inputResolved, page });
  const pageLabel = page !== undefined ? `page ${page}` : "all pages";

  if (images.length === 0) {
    console.log(`No images found on ${pageLabel}.`);
    process.exit(0);
  }

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
    console.log(`Saved image-${idx}.png (${img.width}x${img.height})`);
  }
}
