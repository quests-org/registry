import { writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { OfficeParser } from "officeparser";

export async function extractPptxText({ inputPath }: { inputPath: string }) {
  const ast = await OfficeParser.parseOffice(inputPath);
  const text = ast.toText();
  return { text };
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
      "Usage: tsx skills/powerpoint/scripts/extract-text.ts <path> [--output <path>]",
    );
    process.exit(1);
  }

  const result = await extractPptxText({ inputPath: resolve(filePath) });

  if (values.output) {
    const outputPath = resolve(values.output);
    await writeFile(outputPath, result.text, "utf-8");
    const relOutput = relative(process.cwd(), outputPath) || ".";
    console.log(`Text written to ${relOutput}`);
  } else {
    console.log(result.text);
  }
}
