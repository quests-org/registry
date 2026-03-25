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
  cli
    .command("<filePath>")
    .option("--output <path>", "Output PDF file path")
    .action(async (filePath: string, options) => {
      const inputPath = resolve(filePath);
      const result = await convertMdToPdf({
        inputPath,
        outputPath: options.output ? resolve(options.output) : undefined,
      });

      const relOutput = result.outputPath;
      console.log(`Converted ${basename(inputPath)} → ${relOutput}`);
    });
  cli.help();
  cli.parse();
}
