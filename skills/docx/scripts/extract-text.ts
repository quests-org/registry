import { writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import mammoth from "mammoth";

export async function extractDocxText({ inputPath }: { inputPath: string }) {
  const result = await mammoth.extractRawText({ path: inputPath });
  return { text: result.value, messages: result.messages };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      output: { type: "string" },
    },
  });

  const [filePath] = positionals;

  if (!filePath) {
    console.error(
      "Usage: tsx skills/docx/scripts/extract-text.ts <path> [--output <path>]",
    );
    process.exit(1);
  }

  const result = await extractDocxText({ inputPath: resolve(filePath) });

  if (values.output) {
    const outputPath = resolve(values.output);
    await writeFile(outputPath, result.text, "utf-8");
    const relOutput = relative(process.cwd(), outputPath) || ".";
    console.log(`Text written to ${relOutput}`);
  } else {
    console.log(result.text);
  }
}
