import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { extractText, getDocumentProxy } from "unpdf";

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
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      output: { type: "string" },
      "no-merge": { type: "boolean" },
    },
  });

  const [filePath] = positionals;

  if (!filePath) {
    console.error(
      "Usage: tsx scripts/extract-text.ts <path> [--output <path>] [--no-merge]",
    );
    process.exit(1);
  }

  const result = await extractPdfText({
    inputPath: resolve(filePath),
    mergePages: !values["no-merge"],
  });

  console.log(`Total pages: ${result.totalPages}`);

  const textContent = Array.isArray(result.text)
    ? result.text.join("\n\n---\n\n")
    : result.text;

  if (values.output) {
    await writeFile(resolve(values.output), textContent, "utf-8");
    console.log(`Text written to ${values.output}`);
  } else {
    console.log(textContent);
  }
}
