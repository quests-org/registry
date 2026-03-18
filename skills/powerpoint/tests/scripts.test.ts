import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  createPresentation,
  type SlideInput,
} from "../scripts/create-presentation.ts";
import { extractPptxText } from "../scripts/extract-text.ts";

describe("createPresentation", () => {
  it("creates a pptx file with only a title slide", async () => {
    const outputPath = path.join(os.tmpdir(), "test-pptx-title-only.pptx");
    const result = await createPresentation({
      title: "Title Only",
      slides: [],
      outputPath,
    });

    expect(result.slideCount).toBe(1);
    expect(result.outputPath).toBe(outputPath);

    const stat = await fs.stat(outputPath);
    expect(stat.size).toBeGreaterThan(0);
  });

  it("creates a pptx with multiple slides containing bullets", async () => {
    const outputPath = path.join(os.tmpdir(), "test-pptx-bullets.pptx");
    const slides: SlideInput[] = [
      { title: "Slide One", bullets: ["Point A", "Point B", "Point C"] },
      { title: "Slide Two", bullets: ["Item 1", "Item 2"] },
    ];

    const result = await createPresentation({
      title: "Bullet Presentation",
      slides,
      outputPath,
    });

    expect(result.slideCount).toBe(3);
    const stat = await fs.stat(outputPath);
    expect(stat.size).toBeGreaterThan(0);
  });

  it("creates a pptx with body text slides", async () => {
    const outputPath = path.join(os.tmpdir(), "test-pptx-body.pptx");
    const slides: SlideInput[] = [
      { title: "Text Slide", body: "This is paragraph text on the slide." },
    ];

    const result = await createPresentation({
      title: "Body Presentation",
      slides,
      outputPath,
    });

    expect(result.slideCount).toBe(2);
  });
});

describe("extractPptxText", () => {
  it("extracts text from a created pptx file", async () => {
    const outputPath = path.join(os.tmpdir(), "test-pptx-extract.pptx");
    await createPresentation({
      title: "Extract Test",
      slides: [
        { title: "First Slide", body: "Hello from body" },
        { title: "Second Slide", bullets: ["Bullet one", "Bullet two"] },
      ],
      outputPath,
    });

    const result = await extractPptxText({ inputPath: outputPath });

    expect(result.text).toContain("Extract Test");
    expect(result.text).toContain("First Slide");
    expect(result.text).toContain("Hello from body");
    expect(result.text).toContain("Second Slide");
    expect(result.text).toContain("Bullet one");
    expect(result.text).toContain("Bullet two");
  });

  it("returns empty-ish text for a title-only presentation", async () => {
    const outputPath = path.join(
      os.tmpdir(),
      "test-pptx-extract-title-only.pptx",
    );
    await createPresentation({
      title: "Only Title Here",
      slides: [],
      outputPath,
    });

    const result = await extractPptxText({ inputPath: outputPath });
    expect(result.text).toContain("Only Title Here");
  });
});
