import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import {
  createDocument,
  type SectionInput,
} from "../scripts/create-document.ts";
import { detectPlaceholders } from "../scripts/detect-placeholders.ts";
import { extractDocxText } from "../scripts/extract-text.ts";
import { patchDocxDocument } from "../scripts/patch-document.ts";

const tmpDir = path.join(os.tmpdir(), "docx-skill-tests");

beforeAll(async () => {
  await fs.mkdir(tmpDir, { recursive: true });
});

describe("extractDocxText", () => {
  it("extracts text from a created document", async () => {
    const docPath = path.join(tmpDir, "extract-test.docx");
    await createDocument({
      outputPath: docPath,
      sections: [
        {
          children: [
            { type: "heading", level: 1, text: "Main Title" },
            { type: "paragraph", text: "Hello world from the test document." },
          ],
        },
      ],
    });

    const result = await extractDocxText({ inputPath: docPath });

    expect(result.text).toContain("Main Title");
    expect(result.text).toContain("Hello world from the test document.");
  });

  it("extracts text from a document with multiple sections", async () => {
    const docPath = path.join(tmpDir, "multi-section.docx");
    await createDocument({
      outputPath: docPath,
      sections: [
        {
          children: [
            { type: "heading", level: 1, text: "Section One" },
            { type: "paragraph", text: "First section content." },
          ],
        },
        {
          children: [
            { type: "heading", level: 1, text: "Section Two" },
            { type: "paragraph", text: "Second section content." },
          ],
        },
      ],
    });

    const result = await extractDocxText({ inputPath: docPath });

    expect(result.text).toContain("Section One");
    expect(result.text).toContain("First section content.");
    expect(result.text).toContain("Section Two");
    expect(result.text).toContain("Second section content.");
  });
});

describe("createDocument", () => {
  it("creates a document with a heading", async () => {
    const outputPath = path.join(tmpDir, "heading-only.docx");
    const sections: SectionInput[] = [
      { children: [{ type: "heading", level: 1, text: "Test Heading" }] },
    ];

    const result = await createDocument({ outputPath, sections });

    expect(result.outputPath).toBe(outputPath);
    const stat = await fs.stat(outputPath);
    expect(stat.size).toBeGreaterThan(0);
  });

  it("creates a document with bold and italic text", async () => {
    const outputPath = path.join(tmpDir, "formatted.docx");
    await createDocument({
      outputPath,
      sections: [
        {
          children: [
            { type: "paragraph", text: "Bold text", bold: true },
            { type: "paragraph", text: "Italic text", italic: true },
          ],
        },
      ],
    });

    const result = await extractDocxText({ inputPath: outputPath });
    expect(result.text).toContain("Bold text");
    expect(result.text).toContain("Italic text");
  });

  it("creates a document with a table", async () => {
    const outputPath = path.join(tmpDir, "table.docx");
    await createDocument({
      outputPath,
      sections: [
        {
          children: [
            {
              type: "table",
              rows: [
                ["Name", "Age"],
                ["Alice", "30"],
                ["Bob", "25"],
              ],
            },
          ],
        },
      ],
    });

    const result = await extractDocxText({ inputPath: outputPath });
    expect(result.text).toContain("Name");
    expect(result.text).toContain("Alice");
    expect(result.text).toContain("Bob");
  });

  it("creates a document with mixed content", async () => {
    const outputPath = path.join(tmpDir, "mixed.docx");
    await createDocument({
      outputPath,
      sections: [
        {
          children: [
            { type: "heading", level: 1, text: "Report" },
            { type: "paragraph", text: "Introduction paragraph." },
            { type: "heading", level: 2, text: "Data" },
            {
              type: "table",
              rows: [
                ["Metric", "Value"],
                ["Revenue", "$1M"],
              ],
            },
            { type: "paragraph", text: "Conclusion paragraph." },
          ],
        },
      ],
    });

    const result = await extractDocxText({ inputPath: outputPath });
    expect(result.text).toContain("Report");
    expect(result.text).toContain("Introduction paragraph.");
    expect(result.text).toContain("Data");
    expect(result.text).toContain("Revenue");
    expect(result.text).toContain("Conclusion paragraph.");
  });
});

describe("patchDocxDocument", () => {
  it("replaces placeholders with text", async () => {
    const templatePath = path.join(tmpDir, "template.docx");
    await createDocument({
      outputPath: templatePath,
      sections: [
        {
          children: [
            { type: "heading", level: 1, text: "Contract for {{name}}" },
            { type: "paragraph", text: "Date: {{date}}" },
            { type: "paragraph", text: "Amount: {{amount}}" },
          ],
        },
      ],
    });

    const outputPath = path.join(tmpDir, "patched.docx");
    await patchDocxDocument({
      inputPath: templatePath,
      outputPath,
      patches: {
        name: "John Doe",
        date: "2026-03-20",
        amount: "$5,000",
      },
    });

    const result = await extractDocxText({ inputPath: outputPath });
    expect(result.text).toContain("John Doe");
    expect(result.text).toContain("2026-03-20");
    expect(result.text).toContain("$5,000");
    expect(result.text).not.toContain("{{name}}");
    expect(result.text).not.toContain("{{date}}");
    expect(result.text).not.toContain("{{amount}}");
  });
});

describe("detectPlaceholders", () => {
  it("finds all placeholders in a template", async () => {
    const templatePath = path.join(tmpDir, "detect-template.docx");
    await createDocument({
      outputPath: templatePath,
      sections: [
        {
          children: [
            { type: "paragraph", text: "Hello {{firstName}} {{lastName}}" },
            { type: "paragraph", text: "Your role is {{role}}" },
          ],
        },
      ],
    });

    const result = await detectPlaceholders({ inputPath: templatePath });
    expect(result.placeholders).toContain("firstName");
    expect(result.placeholders).toContain("lastName");
    expect(result.placeholders).toContain("role");
  });

  it("returns empty array when no placeholders exist", async () => {
    const docPath = path.join(tmpDir, "no-placeholders.docx");
    await createDocument({
      outputPath: docPath,
      sections: [
        { children: [{ type: "paragraph", text: "No placeholders here." }] },
      ],
    });

    const result = await detectPlaceholders({ inputPath: docPath });
    expect(result.placeholders).toEqual([]);
  });
});
