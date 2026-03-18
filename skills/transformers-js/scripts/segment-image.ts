import { mkdir } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import sharp from "sharp";
import { pipeline, validateImagePath } from "./lib/pipeline.ts";

const DEFAULT_MODEL = "Xenova/detr-resnet-50-panoptic";

interface Segment {
  label: string;
  score: number | null;
  maskWidth: number;
  maskHeight: number;
  pixelCount: number;
}

const SEGMENT_COLORS: [number, number, number][] = [
  [255, 85, 85],
  [85, 170, 255],
  [85, 255, 85],
  [255, 200, 50],
  [200, 85, 255],
  [255, 140, 60],
  [50, 210, 210],
  [255, 85, 200],
  [170, 255, 85],
  [255, 170, 170],
  [85, 85, 255],
  [210, 180, 140],
  [0, 200, 150],
  [255, 100, 150],
  [100, 255, 200],
  [200, 200, 50],
];

export async function segmentImage({
  inputPath,
  model = DEFAULT_MODEL,
}: {
  inputPath: string;
  model?: string;
}) {
  validateImagePath(inputPath);
  const segmenter = await pipeline("image-segmentation", model, {
    dtype: "q8",
  });
  const raw = await segmenter(inputPath);

  const segments: Segment[] = [];
  const masks: Array<{ label: string; mask: (typeof raw)[number]["mask"] }> =
    [];

  for (const seg of raw) {
    let pixelCount = 0;
    for (let i = 0; i < seg.mask.width * seg.mask.height; i++) {
      if (seg.mask.data[i] > 128) pixelCount++;
    }
    if (pixelCount === 0) continue;

    segments.push({
      label: seg.label ?? "unknown",
      score: seg.score !== null ? Math.round(seg.score * 1000) / 1000 : null,
      maskWidth: seg.mask.width,
      maskHeight: seg.mask.height,
      pixelCount,
    });
    masks.push({ label: seg.label ?? "unknown", mask: seg.mask });
  }

  return { segments, masks };
}

export async function segmentAndVisualize({
  inputPath,
  outputPath,
  model = DEFAULT_MODEL,
}: {
  inputPath: string;
  outputPath: string;
  model?: string;
}) {
  const { segments, masks } = await segmentImage({ inputPath, model });
  const meta = await sharp(inputPath).metadata();
  const W = meta.width ?? 0;
  const H = meta.height ?? 0;

  const composites: sharp.OverlayOptions[] = [];

  for (let i = 0; i < masks.length; i++) {
    const { mask } = masks[i];
    const [r, g, b] = SEGMENT_COLORS[i % SEGMENT_COLORS.length];

    const rgbaData = Buffer.alloc(mask.width * mask.height * 4, 0);
    for (let p = 0; p < mask.width * mask.height; p++) {
      if (mask.data[p] > 128) {
        rgbaData[p * 4] = r;
        rgbaData[p * 4 + 1] = g;
        rgbaData[p * 4 + 2] = b;
        rgbaData[p * 4 + 3] = 140;
      }
    }

    let maskImg = sharp(rgbaData, {
      raw: { width: mask.width, height: mask.height, channels: 4 },
    });
    if (mask.width !== W || mask.height !== H) {
      maskImg = maskImg.resize(W, H, { fit: "fill" });
    }
    const maskBuf = await maskImg.png().toBuffer();
    composites.push({ input: maskBuf, blend: "over" });
  }

  await mkdir(dirname(outputPath), { recursive: true });
  await sharp(inputPath).composite(composites).toFile(outputPath);

  return { segments, outputPath, width: W, height: H };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      output: { type: "string" },
      model: { type: "string" },
      json: { type: "boolean" },
    },
  });

  const [filePath] = positionals;
  if (!filePath) {
    console.error(
      "Usage: tsx skills/transformers-js/scripts/segment-image.ts <image> [--output <path>] [--model <id>] [--json]",
    );
    process.exit(1);
  }

  const inputPath = resolve(filePath);

  if (values.output) {
    const result = await segmentAndVisualize({
      inputPath,
      outputPath: resolve(values.output),
      model: values.model ?? DEFAULT_MODEL,
    });
    const relOutput = relative(process.cwd(), result.outputPath) || ".";
    console.log(
      `Segmented ${result.segments.length} regions → ${relOutput} (${result.width}x${result.height})`,
    );
    if (values.json) {
      console.log(JSON.stringify(result.segments, null, 2));
    } else {
      for (const s of result.segments) {
        console.log(
          `  ${s.label} (${s.pixelCount} px${s.score !== null ? `, ${(s.score * 100).toFixed(0)}%` : ""})`,
        );
      }
    }
  } else {
    const { segments } = await segmentImage({
      inputPath,
      model: values.model ?? DEFAULT_MODEL,
    });
    console.log(`Found ${segments.length} segments:`);
    if (values.json) {
      console.log(JSON.stringify(segments, null, 2));
    } else {
      for (const s of segments) {
        console.log(
          `  ${s.label} (${s.pixelCount} px${s.score !== null ? `, ${(s.score * 100).toFixed(0)}%` : ""})`,
        );
      }
    }
  }
}
