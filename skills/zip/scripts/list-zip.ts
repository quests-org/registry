/**
 * List entries in a ZIP archive with sizes
 */
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { cac } from "cac";
import AdmZip from "adm-zip";

export interface ZipEntryInfo {
  name: string;
  size: number;
  compressedSize: number;
  isDirectory: boolean;
}

export function listZip({ inputPath }: { inputPath: string }): ZipEntryInfo[] {
  const zip = new AdmZip(resolve(inputPath));
  const entries = zip.getEntries();

  return entries.map((entry) => ({
    compressedSize: entry.header.compressedSize,
    isDirectory: entry.isDirectory,
    name: entry.entryName,
    size: entry.header.size,
  }));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cli = cac("list-zip");
  cli.usage("<zipfile>");
  cli.help();
  const parsed = cli.parse();
  if (parsed.options.help) process.exit(0);
  const [zipFile] = parsed.args;

  if (!zipFile) {
    cli.outputHelp();
    process.exit(1);
  }

  const entries = listZip({ inputPath: zipFile });

  console.log(
    `${"Name".padEnd(40)} ${"Size".padStart(10)} ${"Compressed".padStart(10)}`,
  );
  console.log("-".repeat(62));

  for (const entry of entries) {
    console.log(
      `${entry.name.padEnd(40)} ${String(entry.size).padStart(10)} ${String(entry.compressedSize).padStart(10)}`,
    );
  }

  console.log(`\n${entries.length} entries`);
}
