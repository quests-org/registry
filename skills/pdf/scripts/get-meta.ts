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

  cli
    .command("<filePath>")
    .option("--parse-dates", "Parse PDF date fields into date-like values")
    .action(async (filePath: string, options) => {
      const { info, metadata } = await getPdfMeta({
        inputPath: resolve(filePath),
        parseDates: options.parseDates,
      });
      console.log("Info:");
      console.log(JSON.stringify(info, null, 2));
      console.log("\nMetadata:");
      console.log(JSON.stringify(metadata, null, 2));
    });

  cli.help();
  await cli.parse();
}
