import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { PDF, rgb } from "@libpdf/core";
import { cac } from "cac";

export async function addPageNumbers({
  inputPath,
  outputPath,
  startAt = 1,
  position = "bottom-center",
  fontSize = 10,
  format = "{page} / {total}",
  header,
  footer,
}: {
  inputPath: string;
  outputPath: string;
  startAt?: number;
  position?:
    | "bottom-center"
    | "bottom-left"
    | "bottom-right"
    | "top-center"
    | "top-left"
    | "top-right";
  fontSize?: number;
  format?: string;
  header?: string;
  footer?: string;
}) {
  const bytes = await readFile(inputPath);
  const pdf = await PDF.load(new Uint8Array(bytes));
  const pages = pdf.getPages();
  const totalPages = pages.length;
  const margin = 30;
  const charWidth = fontSize * 0.5;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const { width, height } = page;

    const pageNumber = startAt + i;
    const label = format
      .replace("{page}", String(pageNumber))
      .replace("{total}", String(totalPages));

    const labelWidth = label.length * charWidth;
    const isBottom = position.startsWith("bottom");
    const labelY = isBottom ? margin - fontSize / 2 : height - margin;

    let labelX: number;
    if (position.endsWith("center")) {
      labelX = width / 2 - labelWidth / 2;
    } else if (position.endsWith("right")) {
      labelX = width - margin - labelWidth;
    } else {
      labelX = margin;
    }

    page.drawText(label, {
      x: labelX,
      y: labelY,
      size: fontSize,
      font: "Helvetica",
      color: rgb(0.3, 0.3, 0.3),
    });

    if (header) {
      const headerWidth = header.length * charWidth;
      page.drawText(header, {
        x: width / 2 - headerWidth / 2,
        y: height - margin,
        size: fontSize,
        font: "Helvetica",
        color: rgb(0.2, 0.2, 0.2),
      });
    }

    if (footer) {
      const footerWidth = footer.length * charWidth;
      page.drawText(footer, {
        x: width / 2 - footerWidth / 2,
        y: margin / 2,
        size: fontSize,
        font: "Helvetica",
        color: rgb(0.2, 0.2, 0.2),
      });
    }
  }

  const pdfBytes = await pdf.save();
  await writeFile(outputPath, pdfBytes);

  return { pageCount: totalPages, outputPath };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cli = cac("add-page-numbers");

  cli
    .command("<inputPath>")
    .option("--output <path>", "Output PDF file path")
    .option("--start-at <n>", "Starting page number value")
    .option("--position <pos>", "Label position on each page")
    .option("--font-size <n>", "Font size for header/footer and page labels")
    .option("--format <text>", "Page label format, e.g. {page} / {total}")
    .option("--header <text>", "Optional header text")
    .option("--footer <text>", "Optional footer text")
    .action(async (inputPath: string, options) => {
      if (!options.output) {
        throw new Error("--output is required");
      }
      const validPositions = [
        "bottom-center",
        "bottom-left",
        "bottom-right",
        "top-center",
        "top-left",
        "top-right",
      ] as const;
      const position = options.position ?? "bottom-center";
      if (!validPositions.includes(position)) {
        throw new Error(
          `--position must be one of: ${validPositions.join(", ")}`,
        );
      }
      const result = await addPageNumbers({
        inputPath: resolve(inputPath),
        outputPath: resolve(options.output),
        startAt: options["startAt"] ? parseInt(options["startAt"], 10) : 1,
        position,
        fontSize: options["fontSize"] ? parseFloat(options["fontSize"]) : 10,
        format: options.format,
        header: options.header,
        footer: options.footer,
      });
      const relOutput = result.outputPath;
      console.log(
        `Added page numbers to ${result.pageCount} page(s), saved to ${relOutput}`,
      );
    });

  cli.help();
  await cli.parse();
}
