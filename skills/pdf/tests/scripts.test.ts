import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { PDF } from "@libpdf/core";
import { addPageNumbers } from "../scripts/add-page-numbers";
import { createPdf } from "../scripts/create-pdf";
import { extractPdfImages } from "../scripts/extract-images";
import { extractPdfLinks } from "../scripts/extract-links";
import { extractPdfText } from "../scripts/extract-text";
import { fillForm, parseFillFormFieldsJson } from "../scripts/fill-form";
import { getPdfMeta } from "../scripts/get-meta";
import { imageToPdf } from "../scripts/image-to-pdf";
import { insertImage } from "../scripts/insert-image";
import { mergePdfs } from "../scripts/merge-pdfs";
import { renderPdfPages } from "../scripts/render-pages";
import { rotatePages } from "../scripts/rotate-pages";
import { setMeta } from "../scripts/set-meta";
import { splitPdf } from "../scripts/split-pdf";
import { watermarkPdf } from "../scripts/watermark-pdf";

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
  it("creates a PDF with the given content", async () => {
    const outputPath = path.join(os.tmpdir(), "test-create.pdf");
    const result = await createPdf({
      content: "Line one\nLine two",
      outputPath,
    });
    expect(result.pageCount).toBe(1);
    expect(result.outputPath).toBe(outputPath);

    const { text } = await extractPdfText({ inputPath: outputPath });
    expect(text).toContain("Line one");
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

describe("splitPdf", () => {
  it("extracts a single page", async () => {
    const sourcePath = path.join(os.tmpdir(), "test-split-source.pdf");
    await createPdf({
      content: "First page",
      outputPath: sourcePath,
    });
    const sourcePath2 = path.join(os.tmpdir(), "test-split-source2.pdf");
    await createPdf({
      content: "Second page",
      outputPath: sourcePath2,
    });
    const mergedPath = path.join(os.tmpdir(), "test-split-merged.pdf");
    await mergePdfs({
      inputPaths: [sourcePath, sourcePath2],
      outputPath: mergedPath,
    });

    const outputPath = path.join(os.tmpdir(), "test-split-out.pdf");
    const result = await splitPdf({
      inputPath: mergedPath,
      outputPath,
      pages: 1,
    });
    expect(result.pageCount).toBe(1);

    const { text } = await extractPdfText({ inputPath: outputPath });
    expect(text).toContain("First page");
  });

  it("extracts a page range", async () => {
    const sourcePaths = await Promise.all(
      ["A", "B", "C"].map(async (label, i) => {
        const p = path.join(os.tmpdir(), `test-split-range-${i}.pdf`);
        await createPdf({
          content: `Content ${label}`,
          outputPath: p,
        });
        return p;
      }),
    );
    const mergedPath = path.join(os.tmpdir(), "test-split-range-merged.pdf");
    await mergePdfs({ inputPaths: sourcePaths, outputPath: mergedPath });

    const outputPath = path.join(os.tmpdir(), "test-split-range-out.pdf");
    const result = await splitPdf({
      inputPath: mergedPath,
      outputPath,
      pages: { start: 1, end: 2 },
    });
    expect(result.pageCount).toBe(2);
  });

  it("throws on out-of-range page", async () => {
    const outputPath = path.join(os.tmpdir(), "test-split-oob.pdf");
    await expect(
      splitPdf({ inputPath: samplePdf, outputPath, pages: 999 }),
    ).rejects.toThrow("out of range");
  });
});

describe("fillForm", () => {
  const sampleFormPdf = path.join(FIXTURES_DIR, "sample-form.pdf");

  it("returns empty filled array for a PDF with no form fields", async () => {
    const outputPath = path.join(os.tmpdir(), "test-fill-noop.pdf");
    const result = await fillForm({
      inputPath: samplePdf,
      outputPath,
      fields: { nonexistent: "value" },
    });
    expect(result.filled).toHaveLength(0);
    expect(result.skipped).toContain("nonexistent");
  });

  it("fills text fields and reports filled names", async () => {
    const outputPath = path.join(os.tmpdir(), "test-fill-out.pdf");
    const result = await fillForm({
      inputPath: sampleFormPdf,
      outputPath,
      fields: { Name_First: "Alice", Name_Last: "Smith" },
    });

    expect(result.filled).toContain("Name_First");
    expect(result.filled).toContain("Name_Last");
    expect(result.skipped).toHaveLength(0);

    const filledBytes = await fs.readFile(outputPath);
    const filledDoc = await PDF.load(new Uint8Array(filledBytes));
    const form = filledDoc.getForm();
    expect(form?.getTextField("Name_First")?.getValue()).toBe("Alice");
    expect(form?.getTextField("Name_Last")?.getValue()).toBe("Smith");
  });

  it("fills checkboxes", async () => {
    const outputPath = path.join(os.tmpdir(), "test-fill-checkbox.pdf");
    const result = await fillForm({
      inputPath: sampleFormPdf,
      outputPath,
      fields: { "BACHELORS DEGREE": true, PHD: false },
    });

    expect(result.filled).toContain("BACHELORS DEGREE");
    expect(result.filled).toContain("PHD");
    expect(result.skipped).toHaveLength(0);
  });

  it("skips fields that do not exist", async () => {
    const outputPath = path.join(os.tmpdir(), "test-fill-skip.pdf");
    const result = await fillForm({
      inputPath: sampleFormPdf,
      outputPath,
      fields: { Name_First: "Bob", DoesNotExist: "nope" },
    });

    expect(result.filled).toContain("Name_First");
    expect(result.skipped).toContain("DoesNotExist");
  });
});

describe("parseFillFormFieldsJson", () => {
  it("preserves array values for multi-select fields", () => {
    expect(
      parseFillFormFieldsJson(
        JSON.stringify({
          Departments: ["Engineering", "Finance"],
          Level: 2,
          Agree: true,
        }),
      ),
    ).toEqual({
      Departments: ["Engineering", "Finance"],
      Level: "2",
      Agree: true,
    });
  });

  it("rejects non-object JSON input", () => {
    expect(() => parseFillFormFieldsJson(JSON.stringify(["nope"]))).toThrow(
      "JSON must be an object of key/value pairs",
    );
  });
});

describe("rotatePages", () => {
  it("rotates all pages by 90 degrees", async () => {
    const outputPath = path.join(os.tmpdir(), "test-rotate-all.pdf");
    const result = await rotatePages({
      inputPath: samplePdf,
      outputPath,
      rotation: 90,
    });
    expect(result.rotatedCount).toBeGreaterThanOrEqual(1);
    expect(result.pageCount).toBe(result.rotatedCount);

    const bytes = await fs.readFile(outputPath);
    const doc = await PDF.load(new Uint8Array(bytes));
    expect(doc.getPage(0)?.rotation).toBe(90);
  });

  it("rotates only specified pages", async () => {
    const twoPagePath = path.join(os.tmpdir(), "test-rotate-source.pdf");
    const p2 = path.join(os.tmpdir(), "test-rotate-p2.pdf");
    await createPdf({ content: "page two", outputPath: p2 });
    await mergePdfs({ inputPaths: [samplePdf, p2], outputPath: twoPagePath });

    const outputPath = path.join(os.tmpdir(), "test-rotate-partial.pdf");
    const result = await rotatePages({
      inputPath: twoPagePath,
      outputPath,
      rotation: 180,
      pages: [1],
    });
    expect(result.rotatedCount).toBe(1);

    const bytes = await fs.readFile(outputPath);
    const doc = await PDF.load(new Uint8Array(bytes));
    expect(doc.getPage(0)?.rotation).toBe(180);
    expect(doc.getPage(1)?.rotation).toBe(0);
  });
});

describe("addPageNumbers", () => {
  it("adds page numbers to all pages", async () => {
    const outputPath = path.join(os.tmpdir(), "test-page-numbers.pdf");
    const result = await addPageNumbers({ inputPath: samplePdf, outputPath });
    expect(result.pageCount).toBeGreaterThanOrEqual(1);
    expect(result.outputPath).toBe(outputPath);

    const { text } = await extractPdfText({ inputPath: outputPath });
    expect(text).toContain("1");
  });

  it("respects startAt and format options", async () => {
    const outputPath = path.join(os.tmpdir(), "test-page-numbers-custom.pdf");
    await addPageNumbers({
      inputPath: samplePdf,
      outputPath,
      startAt: 5,
      format: "Page {page}",
    });
    const { text } = await extractPdfText({ inputPath: outputPath });
    expect(text).toContain("Page 5");
  });

  it("adds a centered header to all pages", async () => {
    const outputPath = path.join(os.tmpdir(), "test-page-numbers-header.pdf");
    await addPageNumbers({
      inputPath: samplePdf,
      outputPath,
      header: "MY DOCUMENT",
    });
    const { text } = await extractPdfText({ inputPath: outputPath });
    expect(text).toContain("MY DOCUMENT");
  });

  it("adds a centered footer to all pages", async () => {
    const outputPath = path.join(os.tmpdir(), "test-page-numbers-footer.pdf");
    await addPageNumbers({
      inputPath: samplePdf,
      outputPath,
      footer: "CONFIDENTIAL",
    });
    const { text } = await extractPdfText({ inputPath: outputPath });
    expect(text).toContain("CONFIDENTIAL");
  });
});

describe("setMeta", () => {
  it("sets title and author metadata", async () => {
    const outputPath = path.join(os.tmpdir(), "test-set-meta.pdf");
    await setMeta({
      inputPath: samplePdf,
      outputPath,
      title: "My Report",
      author: "Alice",
    });

    const bytes = await fs.readFile(outputPath);
    const doc = await PDF.load(new Uint8Array(bytes));
    expect(doc.getTitle()).toBe("My Report");
    expect(doc.getAuthor()).toBe("Alice");
  });

  it("sets keywords as an array", async () => {
    const outputPath = path.join(os.tmpdir(), "test-set-meta-kw.pdf");
    await setMeta({
      inputPath: samplePdf,
      outputPath,
      keywords: ["finance", "Q4"],
    });

    const bytes = await fs.readFile(outputPath);
    const doc = await PDF.load(new Uint8Array(bytes));
    const kw = doc.getKeywords();
    expect(kw).toContain("finance");
  });
});

const samplePng = path.join(FIXTURES_DIR, "sample.png");

describe("imageToPdf", () => {
  it("creates a single-page PDF from a PNG", async () => {
    const outputPath = path.join(os.tmpdir(), "test-image-to-pdf.pdf");
    const result = await imageToPdf({ imagePaths: [samplePng], outputPath });
    expect(result.pageCount).toBe(1);
    expect(result.outputPath).toBe(outputPath);

    const bytes = await fs.readFile(outputPath);
    expect(bytes.length).toBeGreaterThan(0);
  });

  it("creates a multi-page PDF from multiple images", async () => {
    const outputPath = path.join(os.tmpdir(), "test-image-to-pdf-multi.pdf");
    const result = await imageToPdf({
      imagePaths: [samplePng, samplePng],
      outputPath,
    });
    expect(result.pageCount).toBe(2);
  });

  it("respects the size option", async () => {
    const outputPath = path.join(os.tmpdir(), "test-image-to-pdf-a4.pdf");
    const result = await imageToPdf({
      imagePaths: [samplePng],
      outputPath,
      size: "a4",
    });

    const bytes = await fs.readFile(outputPath);
    const doc = await PDF.load(new Uint8Array(bytes));
    const page = doc.getPage(0);
    expect(page?.width).toBe(595);
    expect(page?.height).toBe(842);
  });
});

describe("insertImage", () => {
  it("inserts an image into the first page of an existing PDF", async () => {
    const outputPath = path.join(os.tmpdir(), "test-insert-image.pdf");
    const result = await insertImage({
      inputPath: samplePdf,
      outputPath,
      imagePath: samplePng,
      x: 50,
      y: 50,
      width: 100,
    });
    expect(result.pageCount).toBeGreaterThanOrEqual(1);
    expect(result.outputPath).toBe(outputPath);

    const bytes = await fs.readFile(outputPath);
    expect(bytes.length).toBeGreaterThan(0);
  });

  it("inserts an image with custom opacity", async () => {
    const outputPath = path.join(os.tmpdir(), "test-insert-image-opacity.pdf");
    const result = await insertImage({
      inputPath: samplePdf,
      outputPath,
      imagePath: samplePng,
      x: 100,
      y: 100,
      opacity: 0.5,
    });
    expect(result.pageCount).toBeGreaterThanOrEqual(1);
  });

  it("throws when the page is out of range", async () => {
    const outputPath = path.join(os.tmpdir(), "test-insert-image-oob.pdf");
    await expect(
      insertImage({
        inputPath: samplePdf,
        outputPath,
        imagePath: samplePng,
        x: 0,
        y: 0,
        page: 999,
      }),
    ).rejects.toThrow("out of range");
  });
});

describe("watermarkPdf", () => {
  it("applies a diagonal watermark to all pages", async () => {
    const outputPath = path.join(os.tmpdir(), "test-watermark.pdf");
    const result = await watermarkPdf({
      inputPath: samplePdf,
      outputPath,
      text: "DRAFT",
    });
    expect(result.pageCount).toBeGreaterThanOrEqual(1);
    expect(result.outputPath).toBe(outputPath);
  });

  it("respects custom opacity and font size", async () => {
    const outputPath = path.join(os.tmpdir(), "test-watermark-custom.pdf");
    const result = await watermarkPdf({
      inputPath: samplePdf,
      outputPath,
      text: "CONFIDENTIAL",
      opacity: 0.1,
      fontSize: 40,
    });
    expect(result.pageCount).toBeGreaterThanOrEqual(1);
  });
});
