import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { beforeAll, describe, expect, it } from "vitest";
import { adjustImage } from "../scripts/adjust.ts";
import { annotateImage } from "../scripts/annotate.ts";
import { compositeImages } from "../scripts/composite.ts";
import { convertImage } from "../scripts/convert.ts";
import { cropImage } from "../scripts/crop.ts";
import { getImageMetadata } from "../scripts/get-metadata.ts";
import { optimizeImage } from "../scripts/optimize.ts";
import { resizeImage } from "../scripts/resize.ts";
import { rotateImage } from "../scripts/rotate.ts";

let testPng: string;
let testPngWithAlpha: string;

beforeAll(async () => {
  const buffer = await sharp({
    create: {
      background: { b: 0, g: 0, r: 255 },
      channels: 3,
      height: 200,
      width: 300,
    },
  })
    .png()
    .toBuffer();

  testPng = path.join(os.tmpdir(), "image-test-input.png");
  await fs.writeFile(testPng, buffer);

  const alphaBuffer = await sharp({
    create: {
      background: { alpha: 0.5, b: 255, g: 0, r: 0 },
      channels: 4,
      height: 100,
      width: 100,
    },
  })
    .png()
    .toBuffer();

  testPngWithAlpha = path.join(os.tmpdir(), "image-test-alpha.png");
  await fs.writeFile(testPngWithAlpha, alphaBuffer);
});

describe("resizeImage", () => {
  it("resizes to a specific width", async () => {
    const outputPath = path.join(os.tmpdir(), "resize-width.png");
    const result = await resizeImage({
      inputPath: testPng,
      outputPath,
      width: 50,
    });

    expect(result.width).toBe(50);
    expect(result.bytes).toBeGreaterThan(0);

    const stat = await fs.stat(outputPath);
    expect(stat.size).toBe(result.bytes);
  });

  it("resizes to a specific height", async () => {
    const outputPath = path.join(os.tmpdir(), "resize-height.png");
    const result = await resizeImage({
      inputPath: testPng,
      outputPath,
      height: 50,
    });

    expect(result.height).toBe(50);
    expect(result.bytes).toBeGreaterThan(0);
  });

  it("resizes with contain fit and background", async () => {
    const outputPath = path.join(os.tmpdir(), "resize-contain.png");
    const result = await resizeImage({
      background: "#ff0000",
      fit: "contain",
      height: 100,
      inputPath: testPng,
      outputPath,
      width: 100,
    });

    expect(result.width).toBe(100);
    expect(result.height).toBe(100);
    expect(result.fit).toBe("contain");
  });

  it("resizes with fill fit mode", async () => {
    const outputPath = path.join(os.tmpdir(), "resize-fill.png");
    const result = await resizeImage({
      fit: "fill",
      height: 30,
      inputPath: testPng,
      outputPath,
      width: 80,
    });

    expect(result.width).toBe(80);
    expect(result.height).toBe(30);
  });

  it("respects withoutEnlargement", async () => {
    const outputPath = path.join(os.tmpdir(), "resize-no-enlarge.png");
    const result = await resizeImage({
      inputPath: testPng,
      outputPath,
      width: 500,
      withoutEnlargement: true,
    });

    expect(result.width).toBe(300);
  });
});

describe("cropImage", () => {
  it("extracts a region with explicit coordinates", async () => {
    const outputPath = path.join(os.tmpdir(), "crop-region.png");
    const result = await cropImage({
      height: 50,
      inputPath: testPng,
      left: 10,
      outputPath,
      top: 10,
      width: 100,
    });

    expect(result.width).toBe(100);
    expect(result.height).toBe(50);
  });

  it("smart crops with entropy strategy", async () => {
    const outputPath = path.join(os.tmpdir(), "crop-entropy.png");
    const result = await cropImage({
      height: 100,
      inputPath: testPng,
      outputPath,
      strategy: "entropy",
      width: 100,
    });

    expect(result.width).toBe(100);
    expect(result.height).toBe(100);
  });

  it("smart crops with attention strategy", async () => {
    const outputPath = path.join(os.tmpdir(), "crop-attention.png");
    const result = await cropImage({
      height: 80,
      inputPath: testPng,
      outputPath,
      strategy: "attention",
      width: 80,
    });

    expect(result.width).toBe(80);
    expect(result.height).toBe(80);
  });
});

describe("rotateImage", () => {
  it("rotates by 90 degrees", async () => {
    const outputPath = path.join(os.tmpdir(), "rotate-90.png");
    const result = await rotateImage({
      angle: 90,
      inputPath: testPng,
      outputPath,
    });

    expect(result.width).toBe(200);
    expect(result.height).toBe(300);
  });

  it("flips vertically", async () => {
    const outputPath = path.join(os.tmpdir(), "flip.png");
    const result = await rotateImage({
      flip: true,
      inputPath: testPng,
      outputPath,
    });

    expect(result.width).toBe(300);
    expect(result.height).toBe(200);
  });

  it("flops horizontally", async () => {
    const outputPath = path.join(os.tmpdir(), "flop.png");
    const result = await rotateImage({
      flop: true,
      inputPath: testPng,
      outputPath,
    });

    expect(result.width).toBe(300);
    expect(result.height).toBe(200);
  });

  it("rotates by arbitrary angle with background", async () => {
    const outputPath = path.join(os.tmpdir(), "rotate-45.png");
    const result = await rotateImage({
      angle: 45,
      background: "#000000",
      inputPath: testPng,
      outputPath,
    });

    expect(result.width).toBeGreaterThan(300);
    expect(result.height).toBeGreaterThan(200);
  });
});

describe("convertImage", () => {
  it.each(["jpeg", "webp", "avif", "tiff", "gif"] as const)(
    "converts PNG to %s",
    async (format) => {
      const ext = {
        avif: "avif",
        gif: "gif",
        jpeg: "jpg",
        tiff: "tiff",
        webp: "webp",
      }[format];
      const outputPath = path.join(os.tmpdir(), `convert-${format}.${ext}`);
      const result = await convertImage({
        format,
        inputPath: testPng,
        outputPath,
      });

      expect(result.format).toBe(format);
      expect(result.bytes).toBeGreaterThan(0);
      expect(result.width).toBe(300);
      expect(result.height).toBe(200);
    },
  );

  it("converts with custom quality", async () => {
    const outputPath = path.join(os.tmpdir(), "convert-quality.webp");
    const result = await convertImage({
      format: "webp",
      inputPath: testPng,
      outputPath,
      quality: 50,
    });

    expect(result.format).toBe("webp");
    expect(result.bytes).toBeGreaterThan(0);
  });
});

describe("optimizeImage", () => {
  it("re-encodes a PNG with reduced quality", async () => {
    const outputPath = path.join(os.tmpdir(), "optimize-png.png");
    const result = await optimizeImage({
      inputPath: testPng,
      outputPath,
      quality: 50,
    });

    expect(result.format).toBe("png");
    expect(result.bytes).toBeGreaterThan(0);
    expect(result.originalBytes).toBeGreaterThan(0);
  });

  it("re-encodes a JPEG for optimization", async () => {
    const jpegPath = path.join(os.tmpdir(), "optimize-input.jpg");
    await convertImage({
      format: "jpeg",
      inputPath: testPng,
      outputPath: jpegPath,
    });

    const outputPath = path.join(os.tmpdir(), "optimize-jpeg.jpg");
    const result = await optimizeImage({
      inputPath: jpegPath,
      outputPath,
      quality: 60,
    });

    expect(result.format).toBe("jpeg");
    expect(result.bytes).toBeGreaterThan(0);
  });
});

describe("compositeImages", () => {
  it("overlays one image on another", async () => {
    const outputPath = path.join(os.tmpdir(), "composite-basic.png");
    const result = await compositeImages({
      gravity: "center",
      inputPath: testPng,
      outputPath,
      overlayPath: testPngWithAlpha,
    });

    expect(result.width).toBe(300);
    expect(result.height).toBe(200);
    expect(result.bytes).toBeGreaterThan(0);
  });

  it("overlays with exact positioning", async () => {
    const outputPath = path.join(os.tmpdir(), "composite-positioned.png");
    const result = await compositeImages({
      inputPath: testPng,
      left: 10,
      outputPath,
      overlayPath: testPngWithAlpha,
      top: 10,
    });

    expect(result.width).toBe(300);
    expect(result.height).toBe(200);
  });

  it("overlays with reduced opacity", async () => {
    const outputPath = path.join(os.tmpdir(), "composite-opacity.png");
    const result = await compositeImages({
      inputPath: testPng,
      opacity: 0.5,
      outputPath,
      overlayPath: testPngWithAlpha,
    });

    expect(result.bytes).toBeGreaterThan(0);
  });
});

describe("annotateImage", () => {
  it("draws bounding boxes on an image", async () => {
    const outputPath = path.join(os.tmpdir(), "annotate-basic.png");
    const result = await annotateImage({
      annotations: [
        { height: 40, label: "Region A", left: 10, top: 10, width: 80 },
        { color: "#00FF00", height: 30, left: 150, top: 50, width: 60 },
      ],
      inputPath: testPng,
      outputPath,
    });

    expect(result.width).toBe(300);
    expect(result.height).toBe(200);
    expect(result.annotationCount).toBe(2);
    expect(result.bytes).toBeGreaterThan(0);
  });

  it("renders without labels", async () => {
    const outputPath = path.join(os.tmpdir(), "annotate-no-labels.png");
    const result = await annotateImage({
      annotations: [{ height: 50, left: 0, top: 0, width: 50 }],
      inputPath: testPng,
      outputPath,
    });

    expect(result.annotationCount).toBe(1);
    expect(result.bytes).toBeGreaterThan(0);
  });

  it("applies custom stroke width and font size", async () => {
    const outputPath = path.join(os.tmpdir(), "annotate-custom.png");
    const result = await annotateImage({
      annotations: [
        { height: 60, label: "Big", left: 20, top: 20, width: 100 },
      ],
      fontSize: 24,
      inputPath: testPng,
      outputPath,
      strokeWidth: 4,
    });

    expect(result.annotationCount).toBe(1);
    expect(result.bytes).toBeGreaterThan(0);
  });
});

describe("adjustImage", () => {
  it("adjusts brightness", async () => {
    const outputPath = path.join(os.tmpdir(), "adjust-bright.png");
    const result = await adjustImage({
      brightness: 1.5,
      inputPath: testPng,
      outputPath,
    });

    expect(result.width).toBe(300);
    expect(result.height).toBe(200);
  });

  it("applies blur", async () => {
    const outputPath = path.join(os.tmpdir(), "adjust-blur.png");
    const result = await adjustImage({
      blur: 5,
      inputPath: testPng,
      outputPath,
    });

    expect(result.bytes).toBeGreaterThan(0);
  });

  it("converts to grayscale", async () => {
    const outputPath = path.join(os.tmpdir(), "adjust-gray.png");
    const result = await adjustImage({
      grayscale: true,
      inputPath: testPng,
      outputPath,
    });

    expect(result.bytes).toBeGreaterThan(0);
  });

  it("negates colors", async () => {
    const outputPath = path.join(os.tmpdir(), "adjust-negate.png");
    const result = await adjustImage({
      inputPath: testPng,
      negate: true,
      outputPath,
    });

    expect(result.bytes).toBeGreaterThan(0);
  });

  it("sharpens image", async () => {
    const outputPath = path.join(os.tmpdir(), "adjust-sharpen.png");
    const result = await adjustImage({
      inputPath: testPng,
      outputPath,
      sharpen: 2,
    });

    expect(result.bytes).toBeGreaterThan(0);
  });

  it("applies multiple adjustments", async () => {
    const outputPath = path.join(os.tmpdir(), "adjust-multi.png");
    const result = await adjustImage({
      brightness: 1.2,
      inputPath: testPng,
      outputPath,
      saturation: 0.8,
      sharpen: 1,
    });

    expect(result.width).toBe(300);
    expect(result.height).toBe(200);
  });

  it("normalizes contrast", async () => {
    const outputPath = path.join(os.tmpdir(), "adjust-normalize.png");
    const result = await adjustImage({
      inputPath: testPng,
      normalize: true,
      outputPath,
    });

    expect(result.bytes).toBeGreaterThan(0);
  });
});

describe("getImageMetadata", () => {
  it("returns metadata for a PNG", async () => {
    const metadata = await getImageMetadata({ inputPath: testPng });

    expect(metadata.width).toBe(300);
    expect(metadata.height).toBe(200);
    expect(metadata.format).toBe("png");
    expect(metadata.channels).toBe(3);
    expect(metadata.size).toBeGreaterThan(0);
    expect(metadata.hasAlpha).toBe(false);
  });

  it("returns metadata for a JPEG", async () => {
    const jpegPath = path.join(os.tmpdir(), "metadata-test.jpg");
    await convertImage({
      format: "jpeg",
      inputPath: testPng,
      outputPath: jpegPath,
    });

    const metadata = await getImageMetadata({ inputPath: jpegPath });

    expect(metadata.format).toBe("jpeg");
    expect(metadata.width).toBe(300);
    expect(metadata.height).toBe(200);
  });

  it("detects alpha channel", async () => {
    const metadata = await getImageMetadata({ inputPath: testPngWithAlpha });

    expect(metadata.hasAlpha).toBe(true);
    expect(metadata.channels).toBe(4);
  });
});
