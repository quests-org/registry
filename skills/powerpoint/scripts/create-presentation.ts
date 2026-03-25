import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { cac } from "cac";
import PptxGenJS from "pptxgenjs";

export interface SlideInput {
  title: string;
  body?: string;
  bullets?: string[];
}

export async function createPresentation({
  slides,
  outputPath,
}: {
  slides: SlideInput[];
  outputPath: string;
}) {
  const pptx = new PptxGenJS();

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

  return { slideCount: slides.length, outputPath };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cli = cac("create-presentation");
  cli.option("--output <path>", "Output PPTX file path");
  cli.option("--slides <json>", "Slides JSON array");
  cli.help();
  const parsed = cli.parse();
  const { options } = parsed;

  if (!options.output) {
    console.error(
      "Usage: tsx scripts/create-presentation.ts --output <path> [--slides <json>]",
    );
    process.exit(1);
  }

  const slides: SlideInput[] = options.slides
    ? (JSON.parse(options.slides) as SlideInput[])
    : [];

  const result = await createPresentation({
    slides,
    outputPath: resolve(options.output),
  });

  const relOutput = result.outputPath;
  console.log(
    `Created presentation with ${result.slideCount} slide(s) at ${relOutput}`,
  );
}
