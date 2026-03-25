/**
 * Create a ZIP archive from files or directories
 */
import { lstatSync } from "node:fs";
import { basename, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { cac } from "cac";
import AdmZip from "adm-zip";

export function createZip({
  outputPath,
  inputPaths,
}: {
  outputPath: string;
  inputPaths: readonly string[];
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
  const cli = cac("create-zip");
  cli.usage("--output <path> <input...>");
  cli.option("--output <path>", "Output ZIP file path");
  cli.help();
  const parsed = cli.parse();
  const { options } = parsed;
  if (options.help) process.exit(0);
  const positionals = parsed.args;

  if (!options.output || positionals.length === 0) {
    cli.outputHelp();
    process.exit(1);
  }

  const result = createZip({
    outputPath: options.output,
    inputPaths: positionals,
  });

  const relOutput = result.outputPath;
  console.log(`Created ${relOutput} (${result.entryCount} entries)`);
}
