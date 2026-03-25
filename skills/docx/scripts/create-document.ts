import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
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
  const { values } = parseArgs({
    options: {
      output: { type: "string" },
      sections: { type: "string" },
      title: { type: "string" },
    },
  });

  if (!values.output) {
    console.error(
      "Usage: tsx skills/docx/scripts/create-document.ts --output <path> --sections <json>\n       tsx skills/docx/scripts/create-document.ts --output <path> --title <title>",
    );
    process.exit(1);
  }

  let sections: SectionInput[];

  if (values.sections) {
    sections = JSON.parse(values.sections) as SectionInput[];
  } else if (values.title) {
    sections = [
      {
        children: [{ type: "heading", level: 1, text: values.title }],
      },
    ];
  } else {
    console.error("Provide either --sections <json> or --title <title>");
    process.exit(1);
  }

  const outputPath = resolve(values.output);
  const result = await createDocument({ outputPath, sections });
  const relOutput = result.outputPath;
  console.log(`Created ${relOutput}`);
}
