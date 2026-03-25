/**
 * Convert an HTML file or string to Markdown
 */

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { cac } from "cac";

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

export function convertHtmlString({
  html,
  gfm = true,
  headingStyle = "atx",
  codeBlockStyle = "fenced",
}: {
  codeBlockStyle?: CodeBlockStyle;
  gfm?: boolean;
  headingStyle?: HeadingStyle;
  html: string;
}) {
  return convertHtml({
    codeBlockStyle,
    gfm,
    headingStyle,
    html,
  });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cli = cac("html-to-md");
  cli.usage("--html-file page.html --output page.md");
  cli.option("--html-file <path>", "Input HTML file path");
  cli.option("--html <htmlString>", "Inline HTML string input");
  cli.option("--output <path>", "Output Markdown file path");
  cli.option("--gfm", "Enable GitHub-Flavored Markdown", { default: true });
  cli.option("--heading-style <style>", "Heading style: atx or setext", {
    default: "atx",
  });
  cli.option(
    "--code-block-style <style>",
    "Code block style: fenced or indented",
    { default: "fenced" },
  );
  cli.help();
  const { options } = cli.parse();
  if (options.help) process.exit(0);

  if (!options.htmlFile && !options.html) {
    cli.outputHelp();
    process.exit(1);
  }

  const headingStyle = options.headingStyle as HeadingStyle;
  const codeBlockStyle = options.codeBlockStyle as CodeBlockStyle;

  if (options.html) {
    const markdown = convertHtmlString({
      codeBlockStyle,
      gfm: options.gfm,
      headingStyle,
      html: options.html,
    });
    process.stdout.write(markdown);
  } else {
    const inputPath = resolve(options.htmlFile);
    const outputPath = options.output ? resolve(options.output) : undefined;
    const result = await convertHtmlFile({
      codeBlockStyle,
      gfm: options.gfm,
      headingStyle,
      inputPath,
      outputPath,
    });

    if (result.outputPath) {
      console.log(`Converted → ${result.outputPath}`);
    } else {
      process.stdout.write(result.markdown);
    }
  }
}
