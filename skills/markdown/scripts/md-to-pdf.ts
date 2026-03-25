/**
 * Convert a Markdown file to PDF
 */

import { readFile, writeFile } from "node:fs/promises";
import { basename, extname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { markdownToPdf } from "@mdpdf/mdpdf";
import { cac } from "cac";

export async function convertMdToPdf({
  inputPath,
  outputPath,
}: {
  inputPath: string;
  outputPath?: string;
}) {
  const markdown = await readFile(inputPath, "utf-8");
  const pdfBytes = await markdownToPdf(markdown);

  const dest =
    outputPath ?? resolve(inputPath.replace(extname(inputPath), ".pdf"));

  await writeFile(dest, pdfBytes);

  return { outputPath: dest };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cli = cac("md-to-pdf");
  cli.usage("document.md --output document.pdf");
  cli.option("--output <path>", "Output PDF file path");
  cli.help();
  const { args, options } = cli.parse();
  if (options.help) process.exit(0);

  if (!args[0]) {
    cli.outputHelp();
    process.exit(1);
  }

  const inputPath = resolve(args[0]);
  const result = await convertMdToPdf({
    inputPath,
    outputPath: options.output ? resolve(options.output) : undefined,
  });
  console.log(`Converted ${basename(inputPath)} → ${result.outputPath}`);
}
