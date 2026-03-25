import { mkdir, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { buildHtml } from "./lib/template.ts";

export async function createWireframe({
  outputPath,
  title,
}: {
  outputPath: string;
  title: string;
}) {
  const html = buildHtml({ title });
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, html, "utf-8");
  return { outputPath };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values } = parseArgs({
    options: {
      output: { type: "string" },
      title: { type: "string", default: "Wireframe" },
    },
  });

  if (!values.output) {
    console.error("--output <path> is required");
    process.exit(1);
  }

  const result = await createWireframe({
    outputPath: resolve(values.output),
    title: values.title ?? "Wireframe",
  });

  const relOutput = relative(process.cwd(), result.outputPath) || ".";
  console.log(`Created ${relOutput}`);
}
