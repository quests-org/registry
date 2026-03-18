import { readFile, writeFile } from "node:fs/promises";
import { basename, extname, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { markdownToPdf } from "@mdpdf/mdpdf";

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
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      output: { type: "string" },
    },
  });

  const [filePath] = positionals;

  if (!filePath) {
    console.error(
      "Usage: tsx skills/markdown/scripts/md-to-pdf.ts <path> [--output <path>]",
    );
    process.exit(1);
  }

  const inputPath = resolve(filePath);
  const result = await convertMdToPdf({
    inputPath,
    outputPath: values.output ? resolve(values.output) : undefined,
  });

  const relOutput = relative(process.cwd(), result.outputPath) || ".";
  console.log(`Converted ${basename(inputPath)} → ${relOutput}`);
}
