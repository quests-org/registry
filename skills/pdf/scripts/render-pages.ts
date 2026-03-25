/**
 * Render PDF pages as PNG images
 * @note Output files are named `page-1.png`, `page-2.png`, etc. For PDFs with 10+ pages the number is zero-padded to match the total page count width (e.g. `page-001.png` for a 100-page PDF). Use --scale 2 for higher resolution output.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { readFile } from "node:fs/promises";
import { basename, extname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  createIsomorphicCanvasFactory,
  getDocumentProxy,
  renderPageAsImage,
} from "unpdf";
import { cac } from "cac";

export async function renderPdfPages({
  inputPath,
  page,
  scale = 1.0,
}: {
  inputPath: string;
  page?: number;
  scale?: number;
}) {
  const buffer = await readFile(inputPath);
  const data = new Uint8Array(buffer);

  const canvasImport = () => import("@napi-rs/canvas");
  const CanvasFactory = await createIsomorphicCanvasFactory(canvasImport);
  const pdf = await getDocumentProxy(data, { CanvasFactory });

  const pages =
    page !== undefined
      ? [page]
      : Array.from({ length: pdf.numPages }, (_, i) => i + 1);

  const results = [];
  for (const p of pages) {
    const result = await renderPageAsImage(pdf, p, { canvasImport, scale });
    results.push({ page: p, buffer: result });
  }
  return { numPages: pdf.numPages, results };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cli = cac("render-pages");
  cli.usage("document.pdf --output ./pages");
  cli.option("--page <number>", "Render only this page number");
  cli.option("--scale <number>", "Render scale multiplier");
  cli.option("--output <dir>", "Output directory for rendered PNG pages");
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
  const scale = options.scale !== undefined ? Number(options.scale) : 1.0;
  const inputResolved = resolve(filePath);
  const outputDir = options.output
    ? resolve(options.output)
    : resolve(`${basename(filePath, extname(filePath))}-pages`);
  await mkdir(outputDir, { recursive: true });
  const { numPages, results } = await renderPdfPages({
    inputPath: inputResolved,
    page,
    scale,
  });
  const pageLabel =
    page !== undefined ? `page ${page}` : `all ${numPages} pages`;
  console.log(`Rendering ${pageLabel}`);
  const pad = String(numPages).length;
  for (const { page: p, buffer } of results) {
    const idx = String(p).padStart(pad, "0");
    const outPath = `${outputDir}/page-${idx}.png`;
    await writeFile(outPath, new Uint8Array(buffer));
    console.log(`Saved ${outputDir}/page-${idx}.png`);
  }
}
