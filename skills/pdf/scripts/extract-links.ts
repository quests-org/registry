import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { extractLinks, getDocumentProxy } from "unpdf";
import { cac } from "cac";

export async function extractPdfLinks({ inputPath }: { inputPath: string }) {
  const buffer = await readFile(inputPath);
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { totalPages, links } = await extractLinks(pdf);
  return { totalPages, links };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cli = cac("extract-links");

  cli.command("<filePath>").action(async (filePath: string) => {
    const { totalPages, links } = await extractPdfLinks({
      inputPath: resolve(filePath),
    });
    console.log(`Total pages: ${totalPages}`);
    console.log(`Found ${links.length} links:`);
    for (const link of links) console.log(link);
  });

  cli.help();
  await cli.parse();
}
