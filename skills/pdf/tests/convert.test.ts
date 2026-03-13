import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { convertPdfToMarkdown } from "../scripts/pdf-to-markdown/convert";

const FIXTURES_DIR = path.join(import.meta.dirname, "fixtures");

describe("convertPdfToMarkdown", () => {
  it("converts a valid PDF to a markdown file", async () => {
    const inputPath = path.join(FIXTURES_DIR, "sample.pdf");
    const outputPath = path.join(os.tmpdir(), `test-output-${Date.now()}.md`);

    const result = await convertPdfToMarkdown({ inputPath, outputPath });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.input).toBe(inputPath);
    expect(result.output).toBe(outputPath);
    expect(result.pages).toBeGreaterThanOrEqual(1);
    expect(fs.existsSync(outputPath)).toBe(true);

    const content = fs.readFileSync(outputPath, "utf-8");
    expect(content.split("\n").slice(0, 4).join("\n")).toMatchInlineSnapshot(`
      "Hello World

      -- 1 of 1 --"
    `);

    fs.rmSync(outputPath);
  });
});
