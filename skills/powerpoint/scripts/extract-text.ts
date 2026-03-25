/**
 * Extract all text content from a PowerPoint file
 */
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { cac } from "cac";
import { OfficeParser } from "officeparser";

export async function extractPptxText({ inputPath }: { inputPath: string }) {
  const ast = await OfficeParser.parseOffice(inputPath);
  const text = ast.toText();
  return { text };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cli = cac("extract-text");
  cli.usage("<path> [--output <path>]");
  cli.option("--output <path>", "Write extracted text to a file");
  cli.help();
  const parsed = cli.parse();
  const { options } = parsed;
  if (options.help) process.exit(0);
  const [filePath] = parsed.args;

  if (!filePath) {
    cli.outputHelp();
    process.exit(1);
  }

  const result = await extractPptxText({ inputPath: resolve(filePath) });

  if (options.output) {
    const outputPath = resolve(options.output);
    await writeFile(outputPath, result.text, "utf-8");
    const relOutput = outputPath;
    console.log(`Text written to ${relOutput}`);
  } else {
    console.log(result.text);
  }
}
