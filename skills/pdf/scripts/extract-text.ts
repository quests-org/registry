/**
 * Extract all text content from a PDF
 * @note By default all pages are merged into a single string. Pass --no-merge to get text per page as separate blocks.
 */
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { extractText, getDocumentProxy } from "unpdf";
import { cac } from "cac";

export async function extractPdfText({
  inputPath,
  mergePages = true,
}: {
  inputPath: string;
  mergePages?: boolean;
}) {
  const buffer = await readFile(inputPath);
  const pdf = await getDocumentProxy(new Uint8Array(buffer));

  if (mergePages) {
    const { totalPages, text } = await extractText(pdf, { mergePages: true });
    return { totalPages, text };
  }

  const { totalPages, text } = await extractText(pdf, { mergePages: false });
  return { totalPages, text };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cli = cac("extract-text");
  cli.usage("document.pdf");
  cli.option("--output <path>", "Write extracted text to a file");
  cli.option("--no-merge", "Return text as separate per-page blocks");
  cli.help();
  const { args, options } = cli.parse();
  if (options.help) process.exit(0);

  if (!args[0]) {
    cli.outputHelp();
    process.exit(1);
  }

  const result = await extractPdfText({
    inputPath: resolve(args[0]),
    mergePages: options.merge,
  });
  console.log(`Total pages: ${result.totalPages}`);
  const textContent = Array.isArray(result.text)
    ? result.text.join("\n\n---\n\n")
    : result.text;
  if (options.output) {
    await writeFile(resolve(options.output), textContent, "utf-8");
    console.log(`Text written to ${options.output}`);
  } else {
    console.log(textContent);
  }
}
