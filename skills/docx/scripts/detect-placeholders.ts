import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { patchDetector } from "docx";

export async function detectPlaceholders({ inputPath }: { inputPath: string }) {
  const data = await readFile(inputPath);
  const placeholders = await patchDetector({ data });
  return { placeholders: [...placeholders] };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { positionals } = parseArgs({
    allowPositionals: true,
  });

  const [filePath] = positionals;

  if (!filePath) {
    console.error("Usage: tsx scripts/detect-placeholders.ts <path>");
    process.exit(1);
  }

  const result = await detectPlaceholders({ inputPath: resolve(filePath) });

  if (result.placeholders.length === 0) {
    console.log("No placeholders found.");
  } else {
    for (const name of result.placeholders) {
      console.log(name);
    }
  }
}
