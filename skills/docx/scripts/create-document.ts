/**
 * Create a Word document from a structured sections and blocks JSON input
 * @note Sections contain a `children` array of block objects. Block types: `heading` (level 1–6), `paragraph`, `table` (rows as string arrays). Headings and paragraphs support optional `bold` and `italic` fields.
 */
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { cac } from "cac";
import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

export interface BlockInput {
  bold?: boolean;
  italic?: boolean;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  rows?: string[][];
  text?: string;
  type: "heading" | "paragraph" | "table";
}

export interface SectionInput {
  children: BlockInput[];
}

const HEADING_LEVELS = {
  1: HeadingLevel.HEADING_1,
  2: HeadingLevel.HEADING_2,
  3: HeadingLevel.HEADING_3,
  4: HeadingLevel.HEADING_4,
  5: HeadingLevel.HEADING_5,
  6: HeadingLevel.HEADING_6,
} as const;

function blockToDocxElement(block: BlockInput) {
  switch (block.type) {
    case "heading":
      return new Paragraph({
        children: [
          new TextRun({
            bold: block.bold,
            italics: block.italic,
            text: block.text ?? "",
          }),
        ],
        heading: HEADING_LEVELS[block.level ?? 1],
      });

    case "paragraph":
      return new Paragraph({
        children: [
          new TextRun({
            bold: block.bold,
            italics: block.italic,
            text: block.text ?? "",
          }),
        ],
      });

    case "table": {
      const rows = block.rows ?? [];
      const colCount = Math.max(0, ...rows.map((r) => r.length));
      const colWidth = colCount > 0 ? Math.floor(9026 / colCount) : 9026;
      return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: Array<number>(colCount).fill(colWidth),
        rows: rows.map(
          (cells, rowIndex) =>
            new TableRow({
              children: cells.map(
                (cellText) =>
                  new TableCell({
                    width: { size: colWidth, type: WidthType.DXA },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: cellText,
                            bold: rowIndex === 0,
                          }),
                        ],
                      }),
                    ],
                  }),
              ),
            }),
        ),
      });
    }
  }
}

export async function createDocument({
  outputPath,
  sections,
}: {
  outputPath: string;
  sections: SectionInput[];
}) {
  const doc = new Document({
    sections: sections.map((section) => ({
      children: section.children.map(blockToDocxElement),
    })),
  });

  const buffer = await Packer.toBuffer(doc);
  await writeFile(outputPath, buffer);

  return { outputPath };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cli = cac("create-document");
  cli.usage("--output <path> --sections <json>");
  cli.option("--output <path>", "Output DOCX file path");
  cli.option("--sections <json>", "Sections JSON input");
  cli.help();
  const parsed = cli.parse();
  const { options } = parsed;
  if (options.help) process.exit(0);

  if (!options.output || !options.sections) {
    cli.outputHelp();
    process.exit(1);
  }

  const sections = JSON.parse(options.sections) as SectionInput[];
  const outputPath = resolve(options.output);
  const result = await createDocument({ outputPath, sections });
  console.log(`Created ${result.outputPath}`);
}
