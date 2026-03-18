import { relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import PptxGenJS from "pptxgenjs";

export interface SlideInput {
  title: string;
  body?: string;
  bullets?: string[];
}

export async function createPresentation({
  title,
  slides,
  outputPath,
}: {
  title: string;
  slides: SlideInput[];
  outputPath: string;
}) {
  const pptx = new PptxGenJS();
  pptx.title = title;

  const titleSlide = pptx.addSlide();
  titleSlide.addText(title, {
    x: "10%",
    y: "40%",
    w: "80%",
    h: "20%",
    fontSize: 36,
    bold: true,
    align: "center",
    color: "1F2937",
  });

  for (const slide of slides) {
    const s = pptx.addSlide();

    s.addText(slide.title, {
      x: 0.5,
      y: 0.3,
      w: 9,
      h: 0.8,
      fontSize: 24,
      bold: true,
      color: "1F2937",
    });

    if (slide.bullets && slide.bullets.length > 0) {
      const textObjects = slide.bullets.map((text) => ({
        text,
        options: { bullet: true as const, breakLine: true as const },
      }));
      s.addText(textObjects, {
        x: 0.5,
        y: 1.3,
        w: 9,
        h: 4,
        fontSize: 16,
        color: "374151",
      });
    } else if (slide.body) {
      s.addText(slide.body, {
        x: 0.5,
        y: 1.3,
        w: 9,
        h: 4,
        fontSize: 16,
        color: "374151",
      });
    }
  }

  await pptx.writeFile({ fileName: outputPath });

  return { slideCount: slides.length + 1, outputPath };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values } = parseArgs({
    options: {
      title: { type: "string" },
      output: { type: "string" },
      slides: { type: "string" },
    },
  });

  if (!values.title || !values.output) {
    console.error(
      "Usage: tsx skills/powerpoint/scripts/create-presentation.ts --title <title> --output <path> [--slides <json>]",
    );
    process.exit(1);
  }

  const slides: SlideInput[] = values.slides
    ? (JSON.parse(values.slides) as SlideInput[])
    : [];

  const result = await createPresentation({
    title: values.title,
    slides,
    outputPath: resolve(values.output),
  });

  const relOutput = relative(process.cwd(), result.outputPath) || ".";
  console.log(
    `Created presentation with ${result.slideCount} slide(s) at ${relOutput}`,
  );
}
