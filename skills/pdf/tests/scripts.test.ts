import path from "node:path";
import { describe, expect, it } from "vitest";
import { extractPdfImages } from "../scripts/extract-images";
import { extractPdfLinks } from "../scripts/extract-links";
import { extractPdfText } from "../scripts/extract-text";
import { getPdfMeta } from "../scripts/get-meta";

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
