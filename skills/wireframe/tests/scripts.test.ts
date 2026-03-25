import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createWireframe } from "../scripts/create-wireframe.ts";
import { buildHtml } from "../scripts/lib/template.ts";

let tmpDir: string;

afterEach(async () => {
  if (tmpDir) {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});

async function makeTmpDir() {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "wireframe-test-"));
  return tmpDir;
}

describe("buildHtml", () => {
  it("produces valid HTML structure", () => {
    const html = buildHtml({ title: "Test Page" });

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain('<html lang="en">');
    expect(html).toContain("<title>Test Page</title>");
    expect(html).toContain('<style type="text/tailwindcss">');
    expect(html).toContain('@import "tailwindcss"');
    expect(html).toContain(
      "/_quests/assets/skills/wireframe/node_modules/@tailwindcss/browser/dist/index.global.js",
    );
    expect(html).toContain("<main");
    expect(html).toContain("</html>");
  });

  it("escapes HTML in title", () => {
    const html = buildHtml({ title: '<script>alert("xss")</script>' });

    expect(html).not.toContain("<script>alert");
    expect(html).toContain("&lt;script&gt;");
  });

  it("contains a bare tailwindcss import and empty @theme block", () => {
    const html = buildHtml({ title: "Theme Test" });

    expect(html).toContain('@import "tailwindcss"');
    expect(html).toContain("@theme {");
  });

  it("does not inline the tailwind script", () => {
    const html = buildHtml({ title: "No Inline" });

    expect(html.length).toBeLessThan(5_000);
    expect(html).not.toContain("function tailwind");
  });
});

describe("createWireframe", () => {
  it("generates an HTML file with the fixed script URL", async () => {
    const dir = await makeTmpDir();
    const outputPath = path.join(dir, "out.html");

    const result = await createWireframe({
      outputPath,
      title: "Test wireframe",
    });

    expect(result.outputPath).toBe(outputPath);

    const content = await fs.readFile(outputPath, "utf-8");
    expect(content).toContain("<!DOCTYPE html>");
    expect(content).toContain("<title>Test wireframe</title>");
    expect(content).toContain('@import "tailwindcss"');
    expect(content).toContain(
      "/_quests/assets/skills/wireframe/node_modules/@tailwindcss/browser/dist/index.global.js",
    );
    expect(content.length).toBeLessThan(5_000);
  });

  it("same script URL regardless of output location", async () => {
    const dir = await makeTmpDir();
    const shallowOutput = path.join(dir, "out.html");
    const deepOutput = path.join(dir, "nested", "deep", "out.html");

    await createWireframe({ outputPath: shallowOutput, title: "Shallow" });
    await createWireframe({ outputPath: deepOutput, title: "Deep" });

    const shallowContent = await fs.readFile(shallowOutput, "utf-8");
    const deepContent = await fs.readFile(deepOutput, "utf-8");

    const shallowSrc = shallowContent.match(/src="([^"]+)"/)?.[1];
    const deepSrc = deepContent.match(/src="([^"]+)"/)?.[1];

    expect(shallowSrc).toBe(deepSrc);
    expect(shallowSrc).toBe(
      "/_quests/assets/skills/wireframe/node_modules/@tailwindcss/browser/dist/index.global.js",
    );
  });

  it("creates intermediate directories", async () => {
    const dir = await makeTmpDir();
    const outputPath = path.join(dir, "nested", "deep", "wireframe.html");

    await createWireframe({ outputPath, title: "Nested" });

    const stat = await fs.stat(outputPath);
    expect(stat.isFile()).toBe(true);
  });
});
