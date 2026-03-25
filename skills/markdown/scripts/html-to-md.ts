import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

import {
  type CodeBlockStyle,
  type HeadingStyle,
  convertHtml,
} from "./lib/converter.ts";

export async function convertHtmlFile({
  inputPath,
  outputPath,
  gfm = true,
  headingStyle = "atx",
  codeBlockStyle = "fenced",
}: {
  codeBlockStyle?: CodeBlockStyle;
  gfm?: boolean;
  headingStyle?: HeadingStyle;
  inputPath: string;
  outputPath?: string;
}) {
  const html = await readFile(inputPath, "utf-8");

  const markdown = convertHtml({
    codeBlockStyle,
    gfm,
    headingStyle,
    html,
  });

  if (outputPath) {
    await writeFile(outputPath, markdown, "utf-8");
    return { markdown, outputPath };
  }

  return { markdown };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      "code-block-style": { type: "string" },
      gfm: { default: true, type: "boolean" },
      "heading-style": { type: "string" },
      output: { type: "string" },
    },
  });

  const [filePath] = positionals;

  if (!filePath) {
    console.error(
      "Usage: tsx scripts/html-to-md.ts <path> [--output <path>] [--gfm] [--no-gfm] [--heading-style <style>] [--code-block-style <style>]",
    );
    process.exit(1);
  }

  const inputPath = resolve(filePath);
  const outputPath = values.output ? resolve(values.output) : undefined;
  const headingStyle = (values["heading-style"] ?? "atx") as HeadingStyle;
  const codeBlockStyle = (values["code-block-style"] ??
    "fenced") as CodeBlockStyle;

  const result = await convertHtmlFile({
    codeBlockStyle,
    gfm: values.gfm,
    headingStyle,
    inputPath,
    outputPath,
  });

  if (result.outputPath) {
    const relOutput = result.outputPath;
    console.log(`Converted → ${relOutput}`);
  } else {
    process.stdout.write(result.markdown);
  }
}
