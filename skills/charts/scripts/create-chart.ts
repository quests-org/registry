import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

import type { ChartConfiguration } from "chart.js";

import { type ChartFormat, renderChart } from "./lib/chart-renderer.ts";

export async function createChartFromConfig({
  configPath,
  outputPath = "chart.png",
  width = 800,
  height = 600,
  format = "png",
}: {
  configPath: string;
  outputPath?: string;
  width?: number;
  height?: number;
  format?: ChartFormat;
}) {
  const raw = await readFile(configPath, "utf-8");
  const config = JSON.parse(raw) as ChartConfiguration;

  return renderChart({
    config,
    format,
    height,
    outputPath: resolve(outputPath),
    width,
  });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values } = parseArgs({
    options: {
      config: { type: "string" },
      format: { type: "string" },
      height: { type: "string" },
      output: { type: "string" },
      width: { type: "string" },
    },
  });

  if (!values.config) {
    console.error(
      "Usage: tsx scripts/create-chart.ts --config <path> [--output <path>] [--width <px>] [--height <px>] [--format png|pdf]",
    );
    process.exit(1);
  }

  const format = (values.format ?? "png") as ChartFormat;
  const width = values.width ? Number(values.width) : 800;
  const height = values.height ? Number(values.height) : 600;
  const outputPath = values.output ?? "chart.png";

  const result = await createChartFromConfig({
    configPath: resolve(values.config),
    format,
    height,
    outputPath,
    width,
  });

  const relOutput = result.outputPath;
  console.log(`Created chart → ${relOutput} (${result.bytes} bytes)`);
}
