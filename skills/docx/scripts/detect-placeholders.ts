/**
 * List all placeholder token names in a Word document template
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { cac } from "cac";
import { patchDetector } from "docx";

export async function detectPlaceholders({ inputPath }: { inputPath: string }) {
  const data = await readFile(inputPath);
  const placeholders = await patchDetector({ data });
  return { placeholders: [...placeholders] };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cli = cac("detect-placeholders");
  cli.usage("<path>");
  cli.help();
  const parsed = cli.parse();
  if (parsed.options.help) process.exit(0);
  const [filePath] = parsed.args;

  if (!filePath) {
    cli.outputHelp();
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
