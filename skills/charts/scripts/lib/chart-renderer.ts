import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import type { ChartConfiguration } from "chart.js";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";

export type ChartFormat = "png" | "pdf";

export async function renderChart({
  config,
  width = 800,
  height = 600,
  format = "png",
  outputPath,
}: {
  config: ChartConfiguration;
  width?: number;
  height?: number;
  format?: ChartFormat;
  outputPath: string;
}) {
  const isPdf = format === "pdf";

  const renderer = new ChartJSNodeCanvas({
    backgroundColour: "white",
    height,
    type: isPdf ? "pdf" : undefined,
    width,
  });

  const buffer = isPdf
    ? renderer.renderToBufferSync(config, "application/pdf")
    : await renderer.renderToBuffer(config, "image/png");

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, buffer);

  return { bytes: buffer.byteLength, outputPath };
}
