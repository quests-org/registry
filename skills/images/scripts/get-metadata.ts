import { stat } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import sharp from "sharp";

export async function getImageMetadata({ inputPath }: { inputPath: string }) {
  const metadata = await sharp(inputPath).metadata();
  const fileStats = await stat(inputPath);

  return {
    channels: metadata.channels,
    density: metadata.density,
    format: metadata.format,
    hasAlpha: metadata.hasAlpha,
    height: metadata.height,
    size: fileStats.size,
    space: metadata.space,
    width: metadata.width,
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { positionals } = parseArgs({
    allowPositionals: true,
    options: {},
  });

  const [filePath] = positionals;

  if (!filePath) {
    console.error("Usage: tsx skills/images/scripts/get-metadata.ts <path>");
    process.exit(1);
  }

  const inputPath = resolve(filePath);
  const metadata = await getImageMetadata({ inputPath });
  const relInput = relative(process.cwd(), inputPath) || ".";
  console.log(`Metadata for ${relInput}:`);
  console.log(JSON.stringify(metadata, null, 2));
}
