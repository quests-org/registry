import { basename, dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import AdmZip from "adm-zip";

export function extractZip({
  inputPath,
  outputDir,
}: {
  inputPath: string;
  outputDir?: string;
}) {
  const resolvedInput = resolve(inputPath);
  const targetDir =
    outputDir !== undefined
      ? resolve(outputDir)
      : resolve(dirname(resolvedInput), basename(resolvedInput, ".zip"));

  const zip = new AdmZip(resolvedInput);
  zip.extractAllTo(targetDir, true);

  const entries = zip.getEntries();
  const extractedFiles = entries
    .filter((entry) => !entry.isDirectory)
    .map((entry) => entry.entryName);

  return {
    outputDir: targetDir,
    files: extractedFiles,
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      output: { type: "string" },
    },
  });

  const [zipFile] = positionals;

  if (!zipFile) {
    console.error(
      "Usage: tsx skills/zip/scripts/extract-zip.ts <zipfile> [--output <dir>]",
    );
    process.exit(1);
  }

  const result = extractZip({
    inputPath: zipFile,
    outputDir: values.output,
  });

  const relOutput = result.outputDir;
  console.log(`Extracted to ${relOutput}:`);
  for (const file of result.files) {
    console.log(`  ${file}`);
  }
}
