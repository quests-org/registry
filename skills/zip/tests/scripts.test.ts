import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createZip } from "../scripts/create-zip.ts";
import { extractZip } from "../scripts/extract-zip.ts";
import { listZip } from "../scripts/list-zip.ts";

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "zip-test-"));
}

describe("zip scripts", () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    for (const dir of tempDirs) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    tempDirs.length = 0;
  });

  it("creates, lists, and extracts a zip with files", () => {
    const sourceDir = makeTempDir();
    tempDirs.push(sourceDir);

    const file1 = path.join(sourceDir, "hello.txt");
    const file2 = path.join(sourceDir, "data.json");
    fs.writeFileSync(file1, "Hello, world!");
    fs.writeFileSync(file2, JSON.stringify({ key: "value" }));

    const zipPath = path.join(sourceDir, "output.zip");
    const createResult = createZip({
      outputPath: zipPath,
      inputPaths: [file1, file2],
    });

    expect(createResult.outputPath).toBe(zipPath);
    expect(createResult.entryCount).toBe(2);
    expect(fs.existsSync(zipPath)).toBe(true);

    const entries = listZip({ inputPath: zipPath });
    expect(entries).toHaveLength(2);

    const names = entries.map((e) => e.name).sort();
    expect(names).toEqual(["data.json", "hello.txt"]);

    for (const entry of entries) {
      expect(entry.size).toBeGreaterThan(0);
      expect(entry.compressedSize).toBeGreaterThan(0);
      expect(entry.isDirectory).toBe(false);
    }

    const extractDir = path.join(sourceDir, "extracted");
    const extractResult = extractZip({
      inputPath: zipPath,
      outputDir: extractDir,
    });

    expect(extractResult.outputDir).toBe(extractDir);
    expect(extractResult.files.sort()).toEqual(["data.json", "hello.txt"]);
    expect(fs.readFileSync(path.join(extractDir, "hello.txt"), "utf-8")).toBe(
      "Hello, world!",
    );
    expect(
      JSON.parse(fs.readFileSync(path.join(extractDir, "data.json"), "utf-8")),
    ).toEqual({ key: "value" });
  });

  it("creates a zip from a directory", () => {
    const sourceDir = makeTempDir();
    tempDirs.push(sourceDir);

    const subDir = path.join(sourceDir, "mydir");
    fs.mkdirSync(subDir);
    fs.writeFileSync(path.join(subDir, "a.txt"), "aaa");
    fs.writeFileSync(path.join(subDir, "b.txt"), "bbb");

    const zipPath = path.join(sourceDir, "dir.zip");
    const result = createZip({
      outputPath: zipPath,
      inputPaths: [subDir],
    });

    expect(result.entryCount).toBeGreaterThanOrEqual(2);

    const entries = listZip({ inputPath: zipPath });
    const fileEntries = entries.filter((e) => !e.isDirectory);
    expect(fileEntries).toHaveLength(2);

    const names = fileEntries.map((e) => e.name).sort();
    expect(names).toEqual(["mydir/a.txt", "mydir/b.txt"]);
  });

  it("extracts to default directory based on zip filename", () => {
    const sourceDir = makeTempDir();
    tempDirs.push(sourceDir);

    const file = path.join(sourceDir, "test.txt");
    fs.writeFileSync(file, "content");

    const zipPath = path.join(sourceDir, "archive.zip");
    createZip({ outputPath: zipPath, inputPaths: [file] });

    const result = extractZip({ inputPath: zipPath });
    expect(result.outputDir).toBe(path.join(sourceDir, "archive"));
    expect(result.files).toEqual(["test.txt"]);
    expect(
      fs.readFileSync(path.join(result.outputDir, "test.txt"), "utf-8"),
    ).toBe("content");
  });

  it("lists entries with correct metadata", () => {
    const sourceDir = makeTempDir();
    tempDirs.push(sourceDir);

    const content = "x".repeat(1000);
    const file = path.join(sourceDir, "large.txt");
    fs.writeFileSync(file, content);

    const zipPath = path.join(sourceDir, "meta.zip");
    createZip({ outputPath: zipPath, inputPaths: [file] });

    const entries = listZip({ inputPath: zipPath });
    expect(entries).toHaveLength(1);
    expect(entries[0].name).toBe("large.txt");
    expect(entries[0].size).toBe(1000);
    expect(entries[0].compressedSize).toBeLessThan(1000);
    expect(entries[0].isDirectory).toBe(false);
  });
});
