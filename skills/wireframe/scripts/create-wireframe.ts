import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { cac } from "cac";
import { buildHtml } from "./lib/template.ts";

const require = createRequire(import.meta.url);

function checkTailwindDep() {
  try {
    require.resolve("@tailwindcss/browser");
  } catch {
    console.warn(
      `Warning: @tailwindcss/browser not found. ` +
        `Make sure dependencies are installed.`,
    );
  }
}

export async function createWireframe({
  body,
  outputPath,
  theme,
}: {
  body?: string;
  outputPath: string;
  theme?: string;
}) {
  checkTailwindDep();
  const html = buildHtml({ body, theme });
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, html, "utf-8");
  return { outputPath };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cli = cac("create-wireframe");
  cli.option("--output <path>", "Output HTML file path");
  cli.option("--body <html>", "Inline HTML body content");
  cli.option("--theme <name>", "Theme name");
  cli.help();
  const parsed = cli.parse();
  const { options } = parsed;

  if (!options.output) {
    console.error("--output <path> is required");
    process.exit(1);
  }

  const result = await createWireframe({
    body: options.body,
    outputPath: resolve(options.output),
    theme: options.theme,
  });

  const relOutput = result.outputPath;
  console.log(`Created ${relOutput}`);
}
