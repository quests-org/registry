import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { PatchType, TextRun, patchDocument } from "docx";

export async function patchDocxDocument({
  inputPath,
  outputPath,
  patches,
}: {
  inputPath: string;
  outputPath: string;
  patches: Record<string, string>;
}) {
  const data = await readFile(inputPath);

  const docxPatches: Record<
    string,
    { children: TextRun[]; type: (typeof PatchType)["PARAGRAPH"] }
  > = {};
  for (const [key, value] of Object.entries(patches)) {
    docxPatches[key] = {
      children: [new TextRun(value)],
      type: PatchType.PARAGRAPH,
    };
  }

  const buffer = await patchDocument({
    data,
    outputType: "nodebuffer",
    patches: docxPatches,
  });

  await writeFile(outputPath, buffer);
  return { outputPath };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      output: { type: "string" },
      "patches-file": { type: "string" },
    },
  });

  const [filePath] = positionals;

  if (!filePath || !values.output || !values["patches-file"]) {
    console.error(
      "Usage: tsx scripts/patch-document.ts <input> --output <path> --patches-file <json>",
    );
    process.exit(1);
  }

  const patchesJson = await readFile(resolve(values["patches-file"]), "utf-8");
  const patches = JSON.parse(patchesJson) as Record<string, string>;

  const outputPath = resolve(values.output);
  const result = await patchDocxDocument({
    inputPath: resolve(filePath),
    outputPath,
    patches,
  });

  const relOutput = result.outputPath;
  console.log(`Patched document saved to ${relOutput}`);
}
