import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { convertHtmlFile } from "../scripts/html-to-md.ts";
import { convertHtmlString } from "../scripts/html-string-to-md.ts";
import { convertMdToPdf } from "../scripts/md-to-pdf.ts";

describe("convertHtmlString", () => {
  it("converts basic HTML to markdown", () => {
    const result = convertHtmlString({ html: "<h1>Hello</h1><p>World</p>" });
    expect(result).toMatchInlineSnapshot(`
      "# Hello

      World"
    `);
  });

  it("converts nested elements", () => {
    const result = convertHtmlString({
      html: "<ul><li>One</li><li>Two</li><li>Three</li></ul>",
    });
    expect(result).toMatchInlineSnapshot(`
      "*   One
      *   Two
      *   Three"
    `);
  });

  it("converts links and emphasis", () => {
    const result = convertHtmlString({
      html: '<p>Visit <a href="https://example.com">Example</a> for <strong>important</strong> info.</p>',
    });
    expect(result).toMatchInlineSnapshot(
      `"Visit [Example](https://example.com) for **important** info."`,
    );
  });

  it("uses setext heading style when configured", () => {
    const result = convertHtmlString({
      headingStyle: "setext",
      html: "<h1>Title</h1><h2>Subtitle</h2>",
    });
    expect(result).toMatchInlineSnapshot(`
      "Title
      =====

      Subtitle
      --------"
    `);
  });

  it("uses indented code block style when configured", () => {
    const result = convertHtmlString({
      codeBlockStyle: "indented",
      html: "<pre><code>const x = 1;</code></pre>",
    });
    expect(result).toMatchInlineSnapshot(`"    const x = 1;"`);
  });

  it("converts strikethrough with GFM enabled", () => {
    const result = convertHtmlString({
      gfm: true,
      html: "<p>This is <del>deleted</del> text</p>",
    });
    expect(result).toMatchInlineSnapshot(`"This is ~deleted~ text"`);
  });

  it("converts tables with GFM enabled", () => {
    const result = convertHtmlString({
      gfm: true,
      html: "<table><thead><tr><th>Name</th><th>Age</th></tr></thead><tbody><tr><td>Alice</td><td>30</td></tr></tbody></table>",
    });
    expect(result).toMatchInlineSnapshot(`
      "| Name | Age |
      | --- | --- |
      | Alice | 30 |"
    `);
  });

  it("does not convert strikethrough with GFM disabled", () => {
    const result = convertHtmlString({
      gfm: false,
      html: "<p>This is <del>deleted</del> text</p>",
    });
    expect(result).not.toContain("~~");
  });

  it("converts fenced code blocks by default", () => {
    const result = convertHtmlString({
      html: "<pre><code>console.log('hi');</code></pre>",
    });
    expect(result).toMatchInlineSnapshot(`
      "\`\`\`
      console.log('hi');
      \`\`\`"
    `);
  });

  it("converts ATX headings by default", () => {
    const result = convertHtmlString({
      html: "<h1>One</h1><h2>Two</h2><h3>Three</h3>",
    });
    expect(result).toMatchInlineSnapshot(`
      "# One

      ## Two

      ### Three"
    `);
  });
});

describe("convertHtmlFile", () => {
  it("reads an HTML file and returns markdown", async () => {
    const tmpInput = path.join(os.tmpdir(), "test-convert-input.html");
    await fs.writeFile(tmpInput, "<h1>File Test</h1><p>Content here.</p>");

    const result = await convertHtmlFile({ inputPath: tmpInput });

    expect(result.markdown).toMatchInlineSnapshot(`
      "# File Test

      Content here."
    `);
    expect(result.outputPath).toBeUndefined();
  });

  it("writes markdown to output file when specified", async () => {
    const tmpInput = path.join(os.tmpdir(), "test-convert-write-input.html");
    const tmpOutput = path.join(os.tmpdir(), "test-convert-write-output.md");
    await fs.writeFile(tmpInput, "<h2>Output Test</h2><p>Written.</p>");

    const result = await convertHtmlFile({
      inputPath: tmpInput,
      outputPath: tmpOutput,
    });

    expect(result.outputPath).toBe(tmpOutput);
    const written = await fs.readFile(tmpOutput, "utf-8");
    expect(written).toBe(result.markdown);
  });

  it("respects GFM option for file conversion", async () => {
    const tmpInput = path.join(os.tmpdir(), "test-convert-gfm.html");
    await fs.writeFile(
      tmpInput,
      "<table><thead><tr><th>A</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table>",
    );

    const withGfm = await convertHtmlFile({ gfm: true, inputPath: tmpInput });
    const withoutGfm = await convertHtmlFile({
      gfm: false,
      inputPath: tmpInput,
    });

    expect(withGfm.markdown).toContain("|");
    expect(withoutGfm.markdown).not.toContain("|");
  });
});

describe("convertMdToPdf", () => {
  it("converts a markdown file to PDF", async () => {
    const tmpInput = path.join(os.tmpdir(), "test-md-to-pdf.md");
    const tmpOutput = path.join(os.tmpdir(), "test-md-to-pdf.pdf");
    await fs.writeFile(tmpInput, "# Hello\n\nThis is a test document.\n");

    const result = await convertMdToPdf({
      inputPath: tmpInput,
      outputPath: tmpOutput,
    });

    expect(result.outputPath).toBe(tmpOutput);
    const pdfBytes = await fs.readFile(tmpOutput);
    expect(pdfBytes.length).toBeGreaterThan(0);
    expect(pdfBytes.subarray(0, 5).toString()).toBe("%PDF-");
  });

  it("defaults output path to .pdf extension", async () => {
    const tmpInput = path.join(os.tmpdir(), "test-md-to-pdf-default.md");
    await fs.writeFile(tmpInput, "# Default Output\n");

    const result = await convertMdToPdf({ inputPath: tmpInput });

    expect(result.outputPath).toBe(
      path.join(os.tmpdir(), "test-md-to-pdf-default.pdf"),
    );
    const pdfBytes = await fs.readFile(result.outputPath);
    expect(pdfBytes.subarray(0, 5).toString()).toBe("%PDF-");

    await fs.unlink(result.outputPath);
  });

  it("handles markdown with code blocks and lists", async () => {
    const tmpInput = path.join(os.tmpdir(), "test-md-to-pdf-complex.md");
    const tmpOutput = path.join(os.tmpdir(), "test-md-to-pdf-complex.pdf");
    const markdown = [
      "# Complex Document",
      "",
      "## Features",
      "",
      "- Item one",
      "- Item two",
      "",
      "```javascript",
      "const x = 42;",
      "```",
      "",
    ].join("\n");
    await fs.writeFile(tmpInput, markdown);

    const result = await convertMdToPdf({
      inputPath: tmpInput,
      outputPath: tmpOutput,
    });

    const pdfBytes = await fs.readFile(result.outputPath);
    expect(pdfBytes.length).toBeGreaterThan(0);
    expect(pdfBytes.subarray(0, 5).toString()).toBe("%PDF-");
  });
});
