/**
 * Render a chart from a Chart.js JSON config file
 */

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
  cli.usage(
    "--config <path> [--output <path>] [--width <px>] [--height <px>] [--format png|pdf]",
  );
  cli.option("--config <path>", "Chart.js config JSON file path");
  cli.option("--output <path>", "Output chart file path", {
    default: "chart.png",
  });
  cli.option("--width <px>", "Chart width in pixels", { default: 800 });
  cli.option("--height <px>", "Chart height in pixels", { default: 600 });
  cli.option("--format <name>", "Output format: png or pdf", {
    default: "png",
  });
  cli.help();
  const parsed = cli.parse();
  const { options } = parsed;
  if (options.help) process.exit(0);

  if (!options.config) {
    cli.outputHelp();
    process.exit(1);
  }

  const format = options.format as ChartFormat;
  const width = Number(options.width);
  const height = Number(options.height);
  const outputPath = options.output;

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
