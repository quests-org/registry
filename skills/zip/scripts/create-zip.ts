import { lstatSync } from "node:fs";
import { basename, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import AdmZip from "adm-zip";

export function createZip({
  outputPath,
  inputPaths,
}: {
  outputPath: string;
  inputPaths: string[];
}) {
  const zip = new AdmZip();

  for (const inputPath of inputPaths) {
    const resolved = resolve(inputPath);
    const stat = lstatSync(resolved);

    if (stat.isDirectory()) {
      zip.addLocalFolder(resolved, basename(resolved));
    } else {
      zip.addLocalFile(resolved);
    }
  }

  zip.writeZip(resolve(outputPath));

  const entries = zip.getEntries();
  return {
    outputPath: resolve(outputPath),
    entryCount: entries.length,
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      output: { type: "string" },
    },
  });

  if (!values.output || positionals.length === 0) {
    console.error(
      "Usage: tsx skills/zip/scripts/create-zip.ts --output <path> <input...>",
    );
    process.exit(1);
  }

  const result = createZip({
    outputPath: values.output,
    inputPaths: positionals,
  });

  const relOutput = result.outputPath;
  console.log(`Created ${relOutput} (${result.entryCount} entries)`);
}
