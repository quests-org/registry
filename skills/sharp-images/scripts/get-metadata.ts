import { stat } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { cac } from "cac";
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
  const cli = cac("get-metadata");
  cli.command("<filePath>").action(async (filePath: string) => {
    const inputPath = resolve(filePath);
    const metadata = await getImageMetadata({ inputPath });
    console.log(`Metadata for ${filePath}:`);
    console.log(JSON.stringify(metadata, null, 2));
  });
  cli.help();
  cli.parse();
}
