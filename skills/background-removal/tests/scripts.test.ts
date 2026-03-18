import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  generateOutputPath,
  removeImageBackground,
} from "../scripts/lib/background-remover";

const FIXTURES_DIR = path.join(import.meta.dirname, "fixtures");
const kittenJpg = path.join(FIXTURES_DIR, "kitten-realistic.jpg");

describe("generateOutputPath", () => {
  it.each([
    {
      inputPath: "/photos/cat.jpg",
      format: undefined,
      expected: "/photos/cat-no-bg.png",
    },
    {
      inputPath: "/photos/cat.jpg",
      format: "image/jpeg" as const,
      expected: "/photos/cat-no-bg.jpg",
    },
    {
      inputPath: "/photos/cat.png",
      format: "image/webp" as const,
      expected: "/photos/cat-no-bg.webp",
    },
    {
      inputPath: "/nested/dir/photo.webp",
      format: "image/png" as const,
      expected: "/nested/dir/photo-no-bg.png",
    },
  ])(
    "generates $expected for $inputPath (format=$format)",
    ({ inputPath, format, expected }) => {
      expect(generateOutputPath({ inputPath, format })).toBe(expected);
    },
  );
});

describe("removeImageBackground", () => {
  it("throws on unsupported file extension", async () => {
    const outputPath = path.join(os.tmpdir(), "test-bg-unsupported.png");
    await expect(
      removeImageBackground({ inputPath: "/fake/file.gif", outputPath }),
    ).rejects.toThrow("Unsupported file type");
  });

  it("removes background and produces a PNG", async () => {
    const outputPath = path.join(os.tmpdir(), "test-bg-foreground.png");
    const result = await removeImageBackground({
      inputPath: kittenJpg,
      outputPath,
      model: "small",
    });

    expect(result.outputPath).toBe(outputPath);
    expect(result.format).toBe("image/png");
    expect(result.outputType).toBe("foreground");
    expect(result.model).toBe("small");
    expect(result.bytes).toBeGreaterThan(0);

    const stat = await fs.stat(outputPath);
    expect(stat.size).toBe(result.bytes);
  }, 120_000);

  it("produces a mask output", async () => {
    const outputPath = path.join(os.tmpdir(), "test-bg-mask.png");
    const result = await removeImageBackground({
      inputPath: kittenJpg,
      outputPath,
      outputType: "mask",
      model: "small",
    });

    expect(result.outputType).toBe("mask");
    expect(result.bytes).toBeGreaterThan(0);

    const stat = await fs.stat(outputPath);
    expect(stat.size).toBe(result.bytes);
  }, 120_000);

  it("outputs as JPEG when format is image/jpeg", async () => {
    const outputPath = path.join(os.tmpdir(), "test-bg-jpeg.jpg");
    const result = await removeImageBackground({
      inputPath: kittenJpg,
      outputPath,
      format: "image/jpeg",
      model: "small",
    });

    expect(result.format).toBe("image/jpeg");
    expect(result.bytes).toBeGreaterThan(0);
  }, 120_000);

  it("produces background-only output", async () => {
    const outputPath = path.join(os.tmpdir(), "test-bg-background.png");
    const result = await removeImageBackground({
      inputPath: kittenJpg,
      outputPath,
      outputType: "background",
      model: "small",
    });

    expect(result.outputType).toBe("background");
    expect(result.bytes).toBeGreaterThan(0);
  }, 120_000);
});
