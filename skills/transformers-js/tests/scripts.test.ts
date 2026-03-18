import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  classifyImage,
  classifyImageZeroShot,
} from "../scripts/classify-image.ts";
import {
  classifyText,
  classifyTextZeroShot,
} from "../scripts/classify-text.ts";
import { describeImage } from "../scripts/describe-image.ts";
import { detectAndAnnotate, detectObjects } from "../scripts/detect-objects.ts";
import {
  computeSimilarity,
  embedText,
  rankBySimilarity,
} from "../scripts/embed-text.ts";
import { estimateDepth } from "../scripts/estimate-depth.ts";
import {
  extractEntities,
  extractEntitiesByType,
} from "../scripts/extract-entities.ts";
import { segmentAndVisualize, segmentImage } from "../scripts/segment-image.ts";
import {
  validateAudioPath,
  validateImagePath,
} from "../scripts/lib/pipeline.ts";

const FIXTURES_DIR = path.join(import.meta.dirname, "fixtures");
const kittenJpg = path.join(FIXTURES_DIR, "kitten-small.jpg");
const kittenTinyJpg = path.join(FIXTURES_DIR, "kitten-tiny.jpg");

describe("validateImagePath", () => {
  it.each([".jpg", ".jpeg", ".png", ".webp", ".bmp", ".gif"])(
    "accepts %s extension",
    (ext) => {
      expect(() => validateImagePath(`/fake/image${ext}`)).not.toThrow();
    },
  );

  it.each([".pdf", ".txt", ".mp4", ".svg"])("rejects %s extension", (ext) => {
    expect(() => validateImagePath(`/fake/file${ext}`)).toThrow(
      "Unsupported image type",
    );
  });
});

describe("validateAudioPath", () => {
  it.each([".wav", ".flac", ".mp3", ".ogg"])("accepts %s extension", (ext) => {
    expect(() => validateAudioPath(`/fake/audio${ext}`)).not.toThrow();
  });

  it.each([".pdf", ".txt", ".jpg", ".mp4"])("rejects %s extension", (ext) => {
    expect(() => validateAudioPath(`/fake/file${ext}`)).toThrow(
      "Unsupported audio type",
    );
  });
});

describe("detectObjects", () => {
  it("returns detections array with bounding boxes", async () => {
    const { detections } = await detectObjects({
      inputPath: kittenJpg,
      threshold: 0.1,
    });
    expect(Array.isArray(detections)).toBe(true);
    for (const d of detections) {
      expect(d).toHaveProperty("label");
      expect(d).toHaveProperty("score");
      expect(d).toHaveProperty("box");
      expect(d.box).toHaveProperty("xmin");
      expect(d.box).toHaveProperty("ymin");
      expect(d.box).toHaveProperty("xmax");
      expect(d.box).toHaveProperty("ymax");
      expect(d.box.xmax).toBeGreaterThan(d.box.xmin);
      expect(d.box.ymax).toBeGreaterThan(d.box.ymin);
    }
  }, 120_000);

  it("respects threshold filtering", async () => {
    const low = await detectObjects({ inputPath: kittenJpg, threshold: 0.01 });
    const high = await detectObjects({ inputPath: kittenJpg, threshold: 0.99 });
    expect(low.detections.length).toBeGreaterThanOrEqual(
      high.detections.length,
    );
  }, 120_000);
});

describe("detectAndAnnotate", () => {
  it("produces an annotated output image", async () => {
    const outputPath = path.join(os.tmpdir(), "test-detect-annotated.jpg");
    const result = await detectAndAnnotate({
      inputPath: kittenJpg,
      outputPath,
      threshold: 0.1,
    });
    expect(result.outputPath).toBe(outputPath);
    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
    expect(Array.isArray(result.detections)).toBe(true);

    const stat = await fs.stat(outputPath);
    expect(stat.size).toBeGreaterThan(0);
  }, 120_000);
});

describe("classifyImage", () => {
  it("returns classification results", async () => {
    const { results } = await classifyImage({ inputPath: kittenJpg, topK: 3 });
    expect(results.length).toBeLessThanOrEqual(3);
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(r).toHaveProperty("label");
      expect(r).toHaveProperty("score");
      expect(r.score).toBeGreaterThan(0);
      expect(r.score).toBeLessThanOrEqual(1);
    }
  }, 120_000);
});

describe("classifyImageZeroShot", () => {
  it("scores custom labels for an image", async () => {
    const { results } = await classifyImageZeroShot({
      inputPath: kittenJpg,
      labels: ["a cat", "a dog", "a car"],
    });
    expect(results).toHaveLength(3);
    const labels = results.map((r) => r.label);
    expect(labels).toContain("a cat");
    expect(labels).toContain("a dog");
    expect(labels).toContain("a car");

    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    expect(totalScore).toBeCloseTo(1, 0);
  }, 120_000);

  it("throws when no labels provided", async () => {
    await expect(
      classifyImageZeroShot({ inputPath: kittenJpg, labels: [] }),
    ).rejects.toThrow("At least one label");
  });
});

describe("describeImage", () => {
  it("returns a text caption for an image", async () => {
    const { text } = await describeImage({ inputPath: kittenJpg });
    expect(typeof text).toBe("string");
    expect(text.length).toBeGreaterThan(0);
  }, 120_000);
});

describe("estimateDepth", () => {
  it("produces a colorized depth map", async () => {
    const outputPath = path.join(os.tmpdir(), "test-depth-color.png");
    const result = await estimateDepth({
      inputPath: kittenJpg,
      outputPath,
      colorize: true,
    });
    expect(result.outputPath).toBe(outputPath);
    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);

    const stat = await fs.stat(outputPath);
    expect(stat.size).toBeGreaterThan(0);
  }, 120_000);

  it("produces a grayscale depth map", async () => {
    const outputPath = path.join(os.tmpdir(), "test-depth-gray.png");
    const result = await estimateDepth({
      inputPath: kittenJpg,
      outputPath,
      colorize: false,
    });
    expect(result.width).toBeGreaterThan(0);

    const stat = await fs.stat(outputPath);
    expect(stat.size).toBeGreaterThan(0);
  }, 120_000);
});

describe("segmentImage", () => {
  it("returns labeled segments", async () => {
    const { segments } = await segmentImage({ inputPath: kittenJpg });
    expect(Array.isArray(segments)).toBe(true);
    expect(segments.length).toBeGreaterThan(0);
    for (const s of segments) {
      expect(s).toHaveProperty("label");
      expect(s).toHaveProperty("pixelCount");
      expect(s.pixelCount).toBeGreaterThan(0);
    }
  }, 120_000);
});

describe("segmentAndVisualize", () => {
  it("produces a segmented overlay image", async () => {
    const outputPath = path.join(os.tmpdir(), "test-segment-overlay.jpg");
    const result = await segmentAndVisualize({
      inputPath: kittenJpg,
      outputPath,
    });
    expect(result.outputPath).toBe(outputPath);
    expect(result.segments.length).toBeGreaterThan(0);

    const stat = await fs.stat(outputPath);
    expect(stat.size).toBeGreaterThan(0);
  }, 120_000);
});

describe("embedText", () => {
  it("returns embeddings for text inputs", async () => {
    const { embeddings, dimensions } = await embedText({
      texts: ["hello world", "goodbye world"],
    });
    expect(embeddings).toHaveLength(2);
    expect(dimensions).toBe(384);
    expect(embeddings[0]).toHaveLength(384);
    expect(embeddings[1]).toHaveLength(384);
  }, 120_000);

  it("throws when no texts provided", async () => {
    await expect(embedText({ texts: [] })).rejects.toThrow(
      "At least one text input",
    );
  });
});

describe("computeSimilarity", () => {
  it("returns higher similarity for related texts", async () => {
    const { similarity: high } = await computeSimilarity({
      textA: "The cat sat on the mat",
      textB: "A kitten is resting on a rug",
    });
    const { similarity: low } = await computeSimilarity({
      textA: "The cat sat on the mat",
      textB: "Stock prices rose sharply today",
    });
    expect(high).toBeGreaterThan(low);
  }, 120_000);
});

describe("rankBySimilarity", () => {
  it("ranks candidates by relevance to query", async () => {
    const { ranked } = await rankBySimilarity({
      query: "cute animal",
      candidates: [
        "financial quarterly report",
        "adorable puppy playing",
        "server configuration guide",
      ],
    });
    expect(ranked).toHaveLength(3);
    expect(ranked[0].text).toBe("adorable puppy playing");
    expect(ranked[0].score).toBeGreaterThan(ranked[2].score);
  }, 120_000);
});

describe("classifyText", () => {
  it("returns sentiment classification", async () => {
    const { results } = await classifyText({
      text: "I absolutely love this product!",
    });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty("label");
    expect(results[0]).toHaveProperty("score");
    expect(results[0].label).toBe("POSITIVE");
  }, 120_000);

  it("throws on empty text", async () => {
    await expect(classifyText({ text: "  " })).rejects.toThrow(
      "Text input is required",
    );
  });
});

describe("classifyTextZeroShot", () => {
  it("scores custom labels for text", async () => {
    const { results } = await classifyTextZeroShot({
      text: "The quarterly earnings exceeded expectations with strong revenue growth",
      labels: ["finance", "sports", "cooking"],
    });
    expect(results).toHaveLength(3);
    const labels = results.map((r) => r.label);
    expect(labels).toContain("finance");
    const financeResult = results.find((r) => r.label === "finance");
    expect(financeResult?.score).toBeGreaterThan(0.5);
  }, 120_000);

  it("throws when no labels provided", async () => {
    await expect(
      classifyTextZeroShot({ text: "hello", labels: [] }),
    ).rejects.toThrow("At least one label");
  });
});

describe("extractEntities", () => {
  it("extracts named entities from text", async () => {
    const { entities } = await extractEntities({
      text: "John Smith works at Google in New York City",
    });
    expect(entities.length).toBeGreaterThan(0);
    const texts = entities.map((e) => e.text);
    expect(texts.some((t) => t.includes("John"))).toBe(true);
    for (const e of entities) {
      expect(e).toHaveProperty("type");
      expect(e).toHaveProperty("text");
      expect(e).toHaveProperty("score");
      expect(e).toHaveProperty("start");
      expect(e).toHaveProperty("end");
    }
  }, 120_000);

  it("throws on empty text", async () => {
    await expect(extractEntities({ text: "" })).rejects.toThrow(
      "Text input is required",
    );
  });
});

describe("extractEntitiesByType", () => {
  it("groups entities by type", async () => {
    const { grouped } = await extractEntitiesByType({
      text: "Jordan Carter is the CEO of TechNova based in Oregon",
    });
    expect(Object.keys(grouped).length).toBeGreaterThan(0);
    const allValues = Object.values(grouped).flat();
    expect(allValues.length).toBeGreaterThan(0);
  }, 120_000);
});

// Upscale uses a large super-resolution model that takes 6s+ even on a tiny
// image. The other image tests already exercise real pipeline() calls, so we
// mock here to keep CI fast and only verify our wiring (validation, mkdir,
// return shape).
describe("upscaleImage", () => {
  it("produces an upscaled output image", async () => {
    const fakeOutput = {
      width: 64,
      height: 64,
      save: vi.fn(),
    };
    vi.doMock("../scripts/lib/pipeline.ts", () => ({
      pipeline: vi
        .fn()
        .mockResolvedValue(vi.fn().mockResolvedValue(fakeOutput)),
      validateImagePath,
    }));

    const { upscaleImage: upscaleMocked } =
      await import("../scripts/upscale-image.ts");

    const outputPath = path.join(os.tmpdir(), "test-upscaled.png");
    const result = await upscaleMocked({
      inputPath: kittenTinyJpg,
      outputPath,
    });

    expect(result.outputPath).toBe(outputPath);
    expect(result.width).toBe(64);
    expect(result.height).toBe(64);
    expect(fakeOutput.save).toHaveBeenCalledWith(outputPath);

    vi.doUnmock("../scripts/lib/pipeline.ts");
  });
});
