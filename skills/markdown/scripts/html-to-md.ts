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

  cli
    .command("[htmlFile]")
    .option("--html-file <path>", "Input HTML file path")
    .option("--html <htmlString>", "Inline HTML string input")
    .option("--output <path>", "Output Markdown file path")
    .option("--gfm", "Enable GitHub-Flavored Markdown", { default: true })
    .option("--heading-style <style>", "Heading style: atx or setext")
    .option(
      "--code-block-style <style>",
      "Code block style: fenced or indented",
    )
    .action(async (legacyFilePath: string | undefined, options) => {
      const htmlFile = options.htmlFile ?? legacyFilePath;

      if (!htmlFile && !options.html) {
        console.error(
          "Usage: tsx scripts/html-to-md.ts --html-file <path> [--output <path>] [--gfm] [--no-gfm] [--heading-style <style>] [--code-block-style <style>]",
        );
        console.error(
          "       tsx scripts/html-to-md.ts --html <html-string> [--gfm] [--no-gfm] [--heading-style <style>] [--code-block-style <style>]",
        );
        process.exit(1);
      }

      const headingStyle = (options.headingStyle ?? "atx") as HeadingStyle;
      const codeBlockStyle = (options.codeBlockStyle ??
        "fenced") as CodeBlockStyle;

      if (options.html) {
        const markdown = convertHtmlString({
          codeBlockStyle,
          gfm: options.gfm,
          headingStyle,
          html: options.html,
        });
        process.stdout.write(markdown);
        return;
      }

      const inputPath = resolve(htmlFile);
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
    });

  cli.help();
  cli.parse();
}
