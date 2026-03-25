import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { cac } from "cac";

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
  const cli = cac("create-chart");
  cli.option("--config <path>", "Chart.js config JSON file path");
  cli.option("--output <path>", "Output chart file path");
  cli.option("--width <px>", "Chart width in pixels");
  cli.option("--height <px>", "Chart height in pixels");
  cli.option("--format <name>", "Output format: png or pdf");
  cli.help();
  const parsed = cli.parse();
  const { options } = parsed;

  if (!options.config) {
    console.error(
      "Usage: tsx scripts/create-chart.ts --config <path> [--output <path>] [--width <px>] [--height <px>] [--format png|pdf]",
    );
    process.exit(1);
  }

  const format = (options.format ?? "png") as ChartFormat;
  const width = options.width ? Number(options.width) : 800;
  const height = options.height ? Number(options.height) : 600;
  const outputPath = options.output ?? "chart.png";

  const result = await createChartFromConfig({
    configPath: resolve(options.config),
    format,
    height,
    outputPath,
    width,
  });

  const relOutput = result.outputPath;
  console.log(`Created chart → ${relOutput} (${result.bytes} bytes)`);
}
