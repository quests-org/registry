/**
 * Read metadata and document info from a PDF
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { getMeta, getDocumentProxy } from "unpdf";
import { cac } from "cac";

export async function getPdfMeta({
  inputPath,
  parseDates = false,
}: {
  inputPath: string;
  parseDates?: boolean;
}) {
  const buffer = await readFile(inputPath);
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { info, metadata } = await getMeta(pdf, { parseDates });
  return { info, metadata };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cli = cac("get-meta");
  cli.usage("document.pdf");
  cli.option("--parse-dates", "Parse PDF date fields into date-like values");
  cli.help();
  const { args, options } = cli.parse();
  if (options.help) process.exit(0);

  if (!args[0]) {
    cli.outputHelp();
    process.exit(1);
  }

  const { info, metadata } = await getPdfMeta({
    inputPath: resolve(args[0]),
    parseDates: options.parseDates,
  });
  console.log("Info:");
  console.log(JSON.stringify(info, null, 2));
  console.log("\nMetadata:");
  console.log(JSON.stringify(metadata, null, 2));
}
