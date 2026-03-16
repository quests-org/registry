import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { extractLinks, getDocumentProxy } from "unpdf";

export async function extractPdfLinks({ inputPath }: { inputPath: string }) {
  const buffer = await readFile(inputPath);
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { totalPages, links } = await extractLinks(pdf);
  return { totalPages, links };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { positionals } = parseArgs({ allowPositionals: true });
  const [filePath] = positionals;

  if (!filePath) {
    console.error("Usage: tsx scripts/extract-links.ts <path>");
    process.exit(1);
  }

  const { totalPages, links } = await extractPdfLinks({
    inputPath: resolve(filePath),
  });

  console.log(`Total pages: ${totalPages}`);
  console.log(`Found ${links.length} links:`);
  for (const link of links) console.log(link);
}
