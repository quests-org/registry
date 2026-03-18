import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { optimizeSvg } from "../scripts/optimize-svg.ts";
import { svgToPng } from "../scripts/svg-to-png.ts";

const UNOPTIMIZED_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <style type="text/css">
      .unused-class { fill: red; }
    </style>
  </defs>
  <!-- this comment should be removed -->
  <g id="layer1">
    <rect x="10" y="10" width="80" height="80" fill="#ff0000" stroke="#000000" stroke-width="2"/>
    <circle cx="50" cy="50" r="30" fill="#00ff00" stroke="#000000" stroke-width="1"/>
    <rect x="0" y="0" width="0" height="0" fill="none"/>
  </g>
</svg>`;

const SIMPLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
  <rect x="2" y="2" width="20" height="20" fill="blue"/>
</svg>`;

describe("optimizeSvg", () => {
  it("produces smaller output than input", async () => {
    const inputPath = path.join(os.tmpdir(), "test-optimize-input.svg");
    const outputPath = path.join(os.tmpdir(), "test-optimize-output.svg");

    await fs.writeFile(inputPath, UNOPTIMIZED_SVG, "utf-8");

    const result = await optimizeSvg({ inputPath, outputPath });

    expect(result.outputBytes).toBeLessThan(result.inputBytes);
    expect(result.outputPath).toBe(outputPath);

    const outputContent = await fs.readFile(outputPath, "utf-8");
    expect(outputContent).not.toContain("<!-- ");
    expect(outputContent).not.toContain("unused-class");
  });

  it("overwrites input when no output is specified", async () => {
    const inputPath = path.join(os.tmpdir(), "test-optimize-overwrite.svg");
    await fs.writeFile(inputPath, UNOPTIMIZED_SVG, "utf-8");

    const result = await optimizeSvg({ inputPath });

    expect(result.outputPath).toBe(inputPath);

    const content = await fs.readFile(inputPath, "utf-8");
    expect(content.length).toBeLessThan(UNOPTIMIZED_SVG.length);
  });

  it("supports pretty output", async () => {
    const inputPath = path.join(os.tmpdir(), "test-optimize-pretty.svg");
    const outputPath = path.join(os.tmpdir(), "test-optimize-pretty-out.svg");

    await fs.writeFile(inputPath, UNOPTIMIZED_SVG, "utf-8");

    const result = await optimizeSvg({ inputPath, outputPath, pretty: true });

    const content = await fs.readFile(result.outputPath, "utf-8");
    expect(content).toContain("\n");
  });
});

describe("svgToPng", () => {
  it("converts SVG to PNG", async () => {
    const inputPath = path.join(os.tmpdir(), "test-svg-to-png.svg");
    const outputPath = path.join(os.tmpdir(), "test-svg-to-png.png");

    await fs.writeFile(inputPath, SIMPLE_SVG, "utf-8");

    const result = await svgToPng({ inputPath, outputPath });

    expect(result.outputPath).toBe(outputPath);
    expect(result.bytes).toBeGreaterThan(0);
    expect(result.density).toBe(96);

    const stat = await fs.stat(outputPath);
    expect(stat.size).toBe(result.bytes);
  });

  it("converts with custom dimensions", async () => {
    const inputPath = path.join(os.tmpdir(), "test-svg-resize.svg");
    const outputPath = path.join(os.tmpdir(), "test-svg-resize.png");

    await fs.writeFile(inputPath, SIMPLE_SVG, "utf-8");

    const result = await svgToPng({ inputPath, outputPath, width: 200 });

    expect(result.bytes).toBeGreaterThan(0);

    const stat = await fs.stat(outputPath);
    expect(stat.size).toBe(result.bytes);
  });

  it("generates output path from input when not specified", async () => {
    const inputPath = path.join(os.tmpdir(), "test-svg-autoname.svg");
    await fs.writeFile(inputPath, SIMPLE_SVG, "utf-8");

    const result = await svgToPng({ inputPath });

    expect(result.outputPath).toBe(
      path.join(os.tmpdir(), "test-svg-autoname.png"),
    );

    const stat = await fs.stat(result.outputPath);
    expect(stat.size).toBe(result.bytes);
  });
});
