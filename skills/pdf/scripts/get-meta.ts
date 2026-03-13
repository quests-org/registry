import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { getMeta, getDocumentProxy } from "unpdf";

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
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      "parse-dates": { type: "boolean" },
    },
  });

  const [filePath] = positionals;

  if (!filePath) {
    console.error("Usage: tsx scripts/get-meta.ts <path> [--parse-dates]");
    process.exit(1);
  }

  const { info, metadata } = await getPdfMeta({
    inputPath: resolve(filePath),
    parseDates: values["parse-dates"],
  });

  console.log("Info:");
  console.log(JSON.stringify(info, null, 2));
  console.log("\nMetadata:");
  console.log(JSON.stringify(metadata, null, 2));
}
