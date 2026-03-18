import { readFile, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { PDF, rgb } from "@libpdf/core";

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
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      output: { type: "string" },
      "start-at": { type: "string" },
      position: { type: "string" },
      "font-size": { type: "string" },
      format: { type: "string" },
      header: { type: "string" },
      footer: { type: "string" },
    },
  });

  const [inputPath] = positionals;

  if (!inputPath || !values.output) {
    console.error(
      "Usage: tsx scripts/add-page-numbers.ts <input> --output <path> [--start-at <n>] [--position <pos>] [--font-size <n>] [--format '<text>'] [--header <text>] [--footer <text>]",
    );
    process.exit(1);
  }

  const validPositions = [
    "bottom-center",
    "bottom-left",
    "bottom-right",
    "top-center",
    "top-left",
    "top-right",
  ];
  const position = values.position ?? "bottom-center";

  if (!validPositions.includes(position)) {
    console.error(`--position must be one of: ${validPositions.join(", ")}`);
    process.exit(1);
  }

  const result = await addPageNumbers({
    inputPath: resolve(inputPath),
    outputPath: resolve(values.output),
    startAt: values["start-at"] ? parseInt(values["start-at"], 10) : 1,
    position: position as Parameters<typeof addPageNumbers>[0]["position"],
    fontSize: values["font-size"] ? parseFloat(values["font-size"]) : 10,
    format: values.format,
    header: values.header,
    footer: values.footer,
  });

  const relOutput = relative(process.cwd(), result.outputPath) || ".";
  console.log(
    `Added page numbers to ${result.pageCount} page(s), saved to ${relOutput}`,
  );
}
