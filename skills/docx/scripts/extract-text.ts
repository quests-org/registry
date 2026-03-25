import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { cac } from "cac";
import mammoth from "mammoth";

export async function extractDocxText({ inputPath }: { inputPath: string }) {
  const result = await mammoth.extractRawText({ path: inputPath });
  return { text: result.value, messages: result.messages };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cli = cac("extract-text");
  cli.option("--output <path>", "Write extracted text to a file");
  cli.help();
  const parsed = cli.parse();
  const { options } = parsed;
  const [filePath] = parsed.args;

  if (!filePath) {
    console.error(
      "Usage: tsx scripts/extract-text.ts <path> [--output <path>]",
    );
    process.exit(1);
  }

  const result = await extractDocxText({ inputPath: resolve(filePath) });

  if (options.output) {
    const outputPath = resolve(options.output);
    await writeFile(outputPath, result.text, "utf-8");
    const relOutput = outputPath;
    console.log(`Text written to ${relOutput}`);
  } else {
    console.log(result.text);
  }
}
