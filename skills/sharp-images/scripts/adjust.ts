import { readFile, writeFile } from "node:fs/promises";
import { parse, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { cac } from "cac";
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
  const cli = cac("adjust");
  cli
    .command("<filePath>")
    .option("--brightness <n>", "Brightness multiplier")
    .option("--saturation <n>", "Saturation multiplier")
    .option("--hue <deg>", "Hue rotation in degrees")
    .option("--sharpen <sigma>", "Sharpen sigma value")
    .option("--blur <sigma>", "Blur sigma value")
    .option("--gamma <n>", "Gamma correction value")
    .option("--grayscale", "Convert output to grayscale")
    .option("--negate", "Invert image colors")
    .option("--normalize", "Normalize contrast")
    .option("--tint <color>", "Apply tint color")
    .option("--threshold <0-255>", "Threshold value")
    .option("--median <size>", "Median filter window size")
    .option("--lightness <n>", "Lightness multiplier")
    .option("--output <path>", "Output image path")
    .action(async (filePath: string, options) => {
      const inputPath = resolve(filePath);
      const parsed = parse(inputPath);
      const outputPath = options.output
        ? resolve(options.output)
        : resolve(parsed.dir, `${parsed.name}-adjusted${parsed.ext}`);

      const result = await adjustImage({
        blur: options.blur ? Number(options.blur) : undefined,
        brightness: options.brightness ? Number(options.brightness) : undefined,
        gamma: options.gamma ? Number(options.gamma) : undefined,
        grayscale: options.grayscale,
        hue: options.hue ? Number(options.hue) : undefined,
        inputPath,
        lightness: options.lightness ? Number(options.lightness) : undefined,
        median: options.median ? Number(options.median) : undefined,
        negate: options.negate,
        normalize: options.normalize,
        outputPath,
        saturation: options.saturation ? Number(options.saturation) : undefined,
        sharpen: options.sharpen ? Number(options.sharpen) : undefined,
        threshold: options.threshold ? Number(options.threshold) : undefined,
        tint: options.tint,
      });
      const displayOutput =
        options.output ?? `${parsed.name}-adjusted${parsed.ext}`;
      console.log(
        `Adjusted → ${displayOutput} (${result.width}×${result.height}, ${result.bytes} bytes)`,
      );
    });
  cli.help();
  cli.parse();
}
