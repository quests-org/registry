import { mkdir } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import sharp from "sharp";
import { pipeline, validateImagePath } from "./lib/pipeline.ts";

const DEFAULT_MODEL = "onnx-community/depth-anything-v2-small";

export async function estimateDepth({
  inputPath,
  outputPath,
  model = DEFAULT_MODEL,
  colorize = true,
}: {
  inputPath: string;
  outputPath: string;
  model?: string;
  colorize?: boolean;
}) {
  validateImagePath(inputPath);
  const estimator = await pipeline("depth-estimation", model, { dtype: "q8" });
  const raw = await estimator(inputPath);
  const result = Array.isArray(raw) ? raw[0] : raw;

  const depthImage = result.depth;
  const w = depthImage.width;
  const h = depthImage.height;

  await mkdir(dirname(outputPath), { recursive: true });

  if (colorize) {
    const rgbData = Buffer.alloc(w * h * 3);
    for (let i = 0; i < w * h; i++) {
      const val = depthImage.data[i];
      const [r, g, b] = turboColormap(val / 255);
      rgbData[i * 3] = r;
      rgbData[i * 3 + 1] = g;
      rgbData[i * 3 + 2] = b;
    }
    await sharp(rgbData, { raw: { width: w, height: h, channels: 3 } })
      .png()
      .toFile(outputPath);
  } else {
    const grayData = Buffer.from(depthImage.data);
    await sharp(grayData, { raw: { width: w, height: h, channels: 1 } })
      .png()
      .toFile(outputPath);
  }

  return { outputPath, width: w, height: h };
}

function turboColormap(t: number): [number, number, number] {
  t = Math.max(0, Math.min(1, t));
  const r = Math.round(
    255 *
      Math.max(
        0,
        Math.min(
          1,
          0.13572 +
            t *
              (4.6153 +
                t * (-42.659 + t * (132.13 + t * (-152.95 + t * 56.706)))),
        ),
      ),
  );
  const g = Math.round(
    255 *
      Math.max(
        0,
        Math.min(
          1,
          0.0914 +
            t *
              (2.1275 +
                t * (-14.198 + t * (52.952 + t * (-83.202 + t * 42.137)))),
        ),
      ),
  );
  const b = Math.round(
    255 *
      Math.max(
        0,
        Math.min(
          1,
          0.10667 +
            t *
              (12.786 +
                t * (-60.582 + t * (132.73 + t * (-135.6 + t * 50.573)))),
        ),
      ),
  );
  return [r, g, b];
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      output: { type: "string" },
      model: { type: "string" },
      grayscale: { type: "boolean" },
    },
  });

  const [filePath] = positionals;
  if (!filePath) {
    console.error(
      "Usage: tsx skills/transformers-js/scripts/estimate-depth.ts <image> --output <path> [--model <id>] [--grayscale]",
    );
    process.exit(1);
  }

  const inputPath = resolve(filePath);
  const outputPath = resolve(
    values.output ?? filePath.replace(/\.[^.]+$/, "-depth.png"),
  );

  const result = await estimateDepth({
    inputPath,
    outputPath,
    model: values.model ?? DEFAULT_MODEL,
    colorize: !values.grayscale,
  });

  const relOutput = relative(process.cwd(), result.outputPath) || ".";
  console.log(`Depth map → ${relOutput} (${result.width}x${result.height})`);
}
