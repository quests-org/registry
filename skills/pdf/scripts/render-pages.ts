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

  cli
    .command("<filePath>")
    .option("--page <number>", "Render only this page number")
    .option("--scale <number>", "Render scale multiplier")
    .option("--output <dir>", "Output directory for rendered PNG pages")
    .action(async (filePath: string, options) => {
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
      const relDir = outputDir;
      for (const { page: p, buffer } of results) {
        const idx = String(p).padStart(pad, "0");
        const outPath = `${outputDir}/page-${idx}.png`;
        await writeFile(outPath, new Uint8Array(buffer));
        console.log(`Saved ${relDir}/page-${idx}.png`);
      }
    });

  cli.help();
  await cli.parse();
}
