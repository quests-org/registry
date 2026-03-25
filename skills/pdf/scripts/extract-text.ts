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

  cli
    .command("<filePath>")
    .option("--output <path>", "Write extracted text to a file")
    .option("--no-merge", "Return text as separate per-page blocks")
    .action(async (filePath: string, options) => {
      const result = await extractPdfText({
        inputPath: resolve(filePath),
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
    });

  cli.help();
  await cli.parse();
}
