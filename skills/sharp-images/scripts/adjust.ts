import { readFile, writeFile } from "node:fs/promises";
import { parse, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import sharp from "sharp";

export async function adjustImage({
  inputPath,
  outputPath,
  brightness,
  saturation,
  hue,
  lightness,
  sharpen,
  blur,
  gamma,
  grayscale,
  negate,
  normalize,
  tint,
  threshold,
  median,
}: {
  blur?: number;
  brightness?: number;
  gamma?: number;
  grayscale?: boolean;
  hue?: number;
  inputPath: string;
  lightness?: number;
  median?: number;
  negate?: boolean;
  normalize?: boolean;
  outputPath: string;
  saturation?: number;
  sharpen?: number;
  threshold?: number;
  tint?: string;
}) {
  const buffer = await readFile(inputPath);
  let pipeline = sharp(buffer);

  const hasModulate =
    brightness !== undefined ||
    saturation !== undefined ||
    hue !== undefined ||
    lightness !== undefined;

  if (hasModulate) {
    const modulateOptions: {
      brightness?: number;
      hue?: number;
      lightness?: number;
      saturation?: number;
    } = {};
    if (brightness !== undefined) modulateOptions.brightness = brightness;
    if (saturation !== undefined) modulateOptions.saturation = saturation;
    if (hue !== undefined) modulateOptions.hue = hue;
    if (lightness !== undefined) modulateOptions.lightness = lightness;
    pipeline = pipeline.modulate(modulateOptions);
  }

  if (sharpen !== undefined) {
    pipeline = pipeline.sharpen({ sigma: sharpen });
  }

  if (blur !== undefined) {
    pipeline = pipeline.blur(blur);
  }

  if (gamma !== undefined) {
    pipeline = pipeline.gamma(gamma);
  }

  if (grayscale) {
    pipeline = pipeline.grayscale();
  }

  if (negate) {
    pipeline = pipeline.negate();
  }

  if (normalize) {
    pipeline = pipeline.normalize();
  }

  if (tint) {
    pipeline = pipeline.tint(tint);
  }

  if (threshold !== undefined) {
    pipeline = pipeline.threshold(threshold);
  }

  if (median !== undefined) {
    pipeline = pipeline.median(median);
  }

  const result = await pipeline.toBuffer({ resolveWithObject: true });
  await writeFile(outputPath, result.data);

  return {
    bytes: result.data.byteLength,
    height: result.info.height,
    outputPath,
    width: result.info.width,
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      blur: { type: "string" },
      brightness: { type: "string" },
      gamma: { type: "string" },
      grayscale: { type: "boolean" },
      hue: { type: "string" },
      lightness: { type: "string" },
      median: { type: "string" },
      negate: { type: "boolean" },
      normalize: { type: "boolean" },
      output: { type: "string" },
      saturation: { type: "string" },
      sharpen: { type: "string" },
      threshold: { type: "string" },
      tint: { type: "string" },
    },
  });

  const [filePath] = positionals;

  if (!filePath) {
    console.error(
      "Usage: tsx skills/sharp-images/scripts/adjust.ts <path> [--brightness <n>] [--saturation <n>] [--hue <deg>] [--sharpen <sigma>] [--blur <sigma>] [--gamma <n>] [--grayscale] [--negate] [--normalize] [--tint <color>] [--threshold <0-255>] [--median <size>] [--output <path>]",
    );
    process.exit(1);
  }

  const inputPath = resolve(filePath);
  const parsed = parse(inputPath);
  const outputPath = values.output
    ? resolve(values.output)
    : resolve(parsed.dir, `${parsed.name}-adjusted${parsed.ext}`);

  const result = await adjustImage({
    blur: values.blur ? Number(values.blur) : undefined,
    brightness: values.brightness ? Number(values.brightness) : undefined,
    gamma: values.gamma ? Number(values.gamma) : undefined,
    grayscale: values.grayscale,
    hue: values.hue ? Number(values.hue) : undefined,
    inputPath,
    lightness: values.lightness ? Number(values.lightness) : undefined,
    median: values.median ? Number(values.median) : undefined,
    negate: values.negate,
    normalize: values.normalize,
    outputPath,
    saturation: values.saturation ? Number(values.saturation) : undefined,
    sharpen: values.sharpen ? Number(values.sharpen) : undefined,
    threshold: values.threshold ? Number(values.threshold) : undefined,
    tint: values.tint,
  });
  const relOutput = relative(process.cwd(), result.outputPath) || ".";
  console.log(
    `Adjusted → ${relOutput} (${result.width}×${result.height}, ${result.bytes} bytes)`,
  );
}
