import { mkdir, writeFile } from "node:fs/promises";
import { readFile } from "node:fs/promises";
import { basename, extname, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import {
  createIsomorphicCanvasFactory,
  getDocumentProxy,
  renderPageAsImage,
} from "unpdf";

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
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      page: { type: "string" },
      scale: { type: "string" },
      output: { type: "string" },
    },
  });

  const [filePath] = positionals;

  if (!filePath) {
    console.error(
      "Usage: tsx scripts/render-pages.ts <path> [--page <number>] [--scale <number>] [--output <dir>]",
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

  const scale = values.scale !== undefined ? Number(values.scale) : 1.0;
  const inputResolved = resolve(filePath);
  const outputDir = values.output
    ? resolve(values.output)
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
  const relDir = relative(process.cwd(), outputDir) || ".";
  for (const { page: p, buffer } of results) {
    const idx = String(p).padStart(pad, "0");
    const outPath = `${outputDir}/page-${idx}.png`;
    await writeFile(outPath, new Uint8Array(buffer));
    console.log(`Saved ${relDir}/page-${idx}.png`);
  }
}
