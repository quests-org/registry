import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

import {
  type CodeBlockStyle,
  type HeadingStyle,
  convertHtml,
} from "./lib/converter.ts";

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
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      "code-block-style": { type: "string" },
      gfm: { default: true, type: "boolean" },
      "heading-style": { type: "string" },
    },
  });

  const [htmlString] = positionals;

  if (!htmlString) {
    console.error(
      "Usage: tsx skills/markdown/scripts/html-string-to-md.ts <html-string> [--gfm] [--no-gfm] [--heading-style <style>] [--code-block-style <style>]",
    );
    process.exit(1);
  }

  const headingStyle = (values["heading-style"] ?? "atx") as HeadingStyle;
  const codeBlockStyle = (values["code-block-style"] ??
    "fenced") as CodeBlockStyle;

  const markdown = convertHtmlString({
    codeBlockStyle,
    gfm: values.gfm,
    headingStyle,
    html: htmlString,
  });

  process.stdout.write(markdown);
}
