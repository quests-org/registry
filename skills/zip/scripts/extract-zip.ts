import { basename, dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { cac } from "cac";
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
  const cli = cac("extract-zip");
  cli.option("--output <dir>", "Output directory for extracted files");
  cli.help();
  const parsed = cli.parse();
  const { options } = parsed;
  const [zipFile] = parsed.args;

  if (!zipFile) {
    console.error(
      "Usage: tsx scripts/extract-zip.ts <zipfile> [--output <dir>]",
    );
    process.exit(1);
  }

  const result = extractZip({
    inputPath: zipFile,
    outputDir: options.output,
  });

  const relOutput = result.outputDir;
  console.log(`Extracted to ${relOutput}:`);
  for (const file of result.files) {
    console.log(`  ${file}`);
  }
}
