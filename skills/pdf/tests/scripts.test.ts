import path from "node:path";
import os from "node:os";
import { describe, expect, it } from "vitest";
import { extractPdfImages } from "../scripts/extract-images";
import { extractPdfLinks } from "../scripts/extract-links";
import { extractPdfText } from "../scripts/extract-text";
import { getPdfMeta } from "../scripts/get-meta";
import { createPdf } from "../scripts/create-pdf";
import { modifyPdf } from "../scripts/modify-pdf";
import { mergePdfs } from "../scripts/merge-pdfs";
import { renderPdfPages } from "../scripts/render-pages";

const FIXTURES_DIR = path.join(import.meta.dirname, "fixtures");
const samplePdf = path.join(FIXTURES_DIR, "sample.pdf");

describe("extractPdfText", () => {
  it("extracts merged text from a PDF", async () => {
    const { totalPages, text } = await extractPdfText({ inputPath: samplePdf });
    expect(totalPages).toBeGreaterThanOrEqual(1);
    expect(typeof text).toBe("string");
    expect(text).toMatchInlineSnapshot(`"Hello World"`);
  });

  it("extracts text per page when mergePages is false", async () => {
    const { totalPages, text } = await extractPdfText({
      inputPath: samplePdf,
      mergePages: false,
    });
    expect(totalPages).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(text)).toBe(true);
    expect(text).toMatchInlineSnapshot(`
      [
        "Hello World",
      ]
    `);
  });
});

describe("extractPdfLinks", () => {
  it("extracts links from a PDF", async () => {
    const { totalPages, links } = await extractPdfLinks({
      inputPath: samplePdf,
    });
    expect(totalPages).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(links)).toBe(true);
    expect(links).toMatchInlineSnapshot(`[]`);
  });
});

describe("extractPdfImages", () => {
  it("extracts images from all pages by default", async () => {
    const images = await extractPdfImages({ inputPath: samplePdf });
    expect(Array.isArray(images)).toBe(true);
    expect(images).toMatchInlineSnapshot(`[]`);
  });

  it("extracts images from a specific page", async () => {
    const images = await extractPdfImages({ inputPath: samplePdf, page: 1 });
    expect(Array.isArray(images)).toBe(true);
    expect(images).toMatchInlineSnapshot(`[]`);
  });
});

describe("getPdfMeta", () => {
  it("extracts metadata from a PDF", async () => {
    const { info, metadata } = await getPdfMeta({ inputPath: samplePdf });
    expect(info).toMatchInlineSnapshot(`
      {
        "EncryptFilterName": null,
        "IsAcroFormPresent": false,
        "IsCollectionPresent": false,
        "IsLinearized": false,
        "IsSignaturesPresent": false,
        "IsXFAPresent": false,
        "Language": null,
        "PDFFormatVersion": "1.4",
      }
    `);
    expect(metadata).toMatchInlineSnapshot(`{}`);
  });
});

describe("createPdf", () => {
  it("creates a PDF with the given title and content", async () => {
    const outputPath = path.join(os.tmpdir(), "test-create.pdf");
    const result = await createPdf({
      title: "Test Title",
      content: "Line one\nLine two",
      outputPath,
    });
    expect(result.pageCount).toBe(1);
    expect(result.outputPath).toBe(outputPath);

    const { text } = await extractPdfText({ inputPath: outputPath });
    expect(text).toContain("Test Title");
    expect(text).toContain("Line one");
  });
});

describe("modifyPdf", () => {
  it("adds a watermark to all pages", async () => {
    const outputPath = path.join(os.tmpdir(), "test-watermark.pdf");
    const result = await modifyPdf({
      inputPath: samplePdf,
      outputPath,
      watermark: "DRAFT",
    });
    expect(result.pageCount).toBeGreaterThanOrEqual(1);
    expect(result.outputPath).toBe(outputPath);
  });

  it("appends a new page with text", async () => {
    const outputPath = path.join(os.tmpdir(), "test-append.pdf");
    const result = await modifyPdf({
      inputPath: samplePdf,
      outputPath,
      appendText: "Appended content",
    });
    expect(result.pageCount).toBeGreaterThan(0);

    const { text } = await extractPdfText({ inputPath: outputPath });
    expect(text).toContain("Appended content");
  });
});

describe("renderPdfPages", () => {
  it("renders all pages by default", async () => {
    const { numPages, results } = await renderPdfPages({
      inputPath: samplePdf,
    });
    expect(numPages).toBeGreaterThanOrEqual(1);
    expect(results).toHaveLength(numPages);
    expect(results[0].buffer).toBeInstanceOf(ArrayBuffer);
  });

  it("renders a single page when specified", async () => {
    const { results } = await renderPdfPages({ inputPath: samplePdf, page: 1 });
    expect(results).toHaveLength(1);
    expect(results[0].page).toBe(1);
    expect(results[0].buffer).toBeInstanceOf(ArrayBuffer);
  });
});

describe("mergePdfs", () => {
  it("merges multiple PDFs into one", async () => {
    const createdPath = path.join(os.tmpdir(), "test-merge-source.pdf");
    await createPdf({
      title: "Merge Source",
      content: "Merge source content",
      outputPath: createdPath,
    });

    const outputPath = path.join(os.tmpdir(), "test-merged.pdf");
    const result = await mergePdfs({
      inputPaths: [samplePdf, createdPath],
      outputPath,
    });

    const { totalPages } = await extractPdfText({ inputPath: samplePdf });
    expect(result.pageCount).toBeGreaterThan(totalPages);
    expect(result.outputPath).toBe(outputPath);
  });
});
