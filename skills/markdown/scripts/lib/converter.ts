import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

export type HeadingStyle = "atx" | "setext";
export type CodeBlockStyle = "fenced" | "indented";

export function createConverter({
  gfm: enableGfm = true,
  headingStyle = "atx" as HeadingStyle,
  codeBlockStyle = "fenced" as CodeBlockStyle,
}: {
  codeBlockStyle?: CodeBlockStyle;
  gfm?: boolean;
  headingStyle?: HeadingStyle;
} = {}) {
  const service = new TurndownService({
    codeBlockStyle,
    headingStyle,
  });

  if (enableGfm) {
    service.use(gfm);
  }

  return service;
}

export function convertHtml({
  html,
  gfm: enableGfm = true,
  headingStyle = "atx" as HeadingStyle,
  codeBlockStyle = "fenced" as CodeBlockStyle,
}: {
  codeBlockStyle?: CodeBlockStyle;
  gfm?: boolean;
  headingStyle?: HeadingStyle;
  html: string;
}) {
  const service = createConverter({
    codeBlockStyle,
    gfm: enableGfm,
    headingStyle,
  });

  return service.turndown(html);
}
