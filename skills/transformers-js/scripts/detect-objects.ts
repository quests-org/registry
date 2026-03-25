import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { cac } from "cac";
import sharp from "sharp";
import { pipeline, validateImagePath } from "./lib/pipeline.ts";

const DEFAULT_MODEL = "onnx-community/rtdetr_r50vd";
const DEFAULT_THRESHOLD = 0.5;

export async function detectObjects({
  inputPath,
  model = DEFAULT_MODEL,
  threshold = DEFAULT_THRESHOLD,
}: {
  inputPath: string;
  model?: string;
  threshold?: number;
}) {
  validateImagePath(inputPath);
  const detector = await pipeline("object-detection", model, { dtype: "q8" });
  const raw = await detector(inputPath, { threshold });
  const detections = raw.flat().map((d) => ({
    label: d.label,
    score: Math.round(d.score * 1000) / 1000,
    box: {
      xmin: Math.round(d.box.xmin),
      ymin: Math.round(d.box.ymin),
      xmax: Math.round(d.box.xmax),
      ymax: Math.round(d.box.ymax),
    },
  }));
  return { detections };
}

const COLORS: [number, number, number][] = [
  [255, 85, 85],
  [85, 170, 255],
  [85, 255, 85],
  [255, 200, 50],
  [200, 85, 255],
  [255, 140, 60],
  [50, 210, 210],
  [255, 85, 200],
];

export async function detectAndAnnotate({
  inputPath,
  outputPath,
  model = DEFAULT_MODEL,
  threshold = DEFAULT_THRESHOLD,
}: {
  inputPath: string;
  outputPath: string;
  model?: string;
  threshold?: number;
}) {
  const { detections } = await detectObjects({ inputPath, model, threshold });
  const meta = await sharp(inputPath).metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;

  const strokeWidth = Math.max(2, Math.round(Math.min(width, height) / 200));
  const fontSize = Math.max(12, Math.round(Math.min(width, height) / 40));

  let svgOverlay = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;

  for (let i = 0; i < detections.length; i++) {
    const d = detections[i];
    const [r, g, b] = COLORS[i % COLORS.length];
    const color = `rgb(${r},${g},${b})`;
    const bw = d.box.xmax - d.box.xmin;
    const bh = d.box.ymax - d.box.ymin;

    svgOverlay += `<rect x="${d.box.xmin}" y="${d.box.ymin}" width="${bw}" height="${bh}" fill="none" stroke="${color}" stroke-width="${strokeWidth}"/>`;

    const labelText = `${d.label} ${(d.score * 100).toFixed(0)}%`;
    const labelY = d.box.ymin - 4;
    const bgHeight = fontSize + 6;
    const bgY = labelY - bgHeight + 2;
    const textWidth = labelText.length * fontSize * 0.6;

    if (bgY >= 0) {
      svgOverlay += `<rect x="${d.box.xmin}" y="${bgY}" width="${textWidth}" height="${bgHeight}" fill="${color}" rx="2"/>`;
      svgOverlay += `<text x="${d.box.xmin + 4}" y="${labelY}" font-family="sans-serif" font-size="${fontSize}" fill="white" font-weight="bold">${labelText}</text>`;
    } else {
      svgOverlay += `<rect x="${d.box.xmin}" y="${d.box.ymin}" width="${textWidth}" height="${bgHeight}" fill="${color}" rx="2"/>`;
      svgOverlay += `<text x="${d.box.xmin + 4}" y="${d.box.ymin + fontSize + 2}" font-family="sans-serif" font-size="${fontSize}" fill="white" font-weight="bold">${labelText}</text>`;
    }
  }

  svgOverlay += `</svg>`;

  await mkdir(dirname(outputPath), { recursive: true });
  await sharp(inputPath)
    .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
    .toFile(outputPath);

  return { detections, outputPath, width, height };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cli = cac("detect-objects");
  cli
    .command("<image>")
    .option("--output <path>", "Output annotated image path")
    .option("--model <id>", "Model ID")
    .option("--threshold <0-1>", "Detection threshold")
    .option("--json", "Print JSON output")
    .action(async (filePath: string, options) => {
      const inputPath = resolve(filePath);
      const threshold = options.threshold
        ? parseFloat(options.threshold)
        : DEFAULT_THRESHOLD;
      const model = options.model ?? DEFAULT_MODEL;

      if (options.output) {
        const result = await detectAndAnnotate({
          inputPath,
          outputPath: resolve(options.output),
          model,
          threshold,
        });
        const relOutput = result.outputPath;
        console.log(
          `Detected ${result.detections.length} objects → ${relOutput} (${result.width}x${result.height})`,
        );
        if (options.json) {
          console.log(JSON.stringify(result.detections, null, 2));
        } else {
          for (const d of result.detections) {
            console.log(
              `  ${d.label} (${(d.score * 100).toFixed(0)}%) [${d.box.xmin},${d.box.ymin} → ${d.box.xmax},${d.box.ymax}]`,
            );
          }
        }
      } else {
        const { detections } = await detectObjects({
          inputPath,
          model,
          threshold,
        });
        console.log(`Detected ${detections.length} objects:`);
        if (options.json) {
          console.log(JSON.stringify(detections, null, 2));
        } else {
          for (const d of detections) {
            console.log(
              `  ${d.label} (${(d.score * 100).toFixed(0)}%) [${d.box.xmin},${d.box.ymin} → ${d.box.xmax},${d.box.ymax}]`,
            );
          }
        }
      }
    });
  cli.help();
  cli.parse();
}
