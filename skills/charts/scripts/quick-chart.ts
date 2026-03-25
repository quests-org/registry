import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { cac } from "cac";

import type { ChartConfiguration } from "chart.js";

import { renderChart } from "./lib/chart-renderer.ts";

type QuickChartType = "bar" | "doughnut" | "line" | "pie" | "radar";

const VALID_TYPES = new Set<QuickChartType>([
  "bar",
  "doughnut",
  "line",
  "pie",
  "radar",
]);

export async function createQuickChart({
  type,
  labels,
  data,
  title,
  outputPath = "chart.png",
  width = 800,
  height = 600,
}: {
  type: QuickChartType;
  labels: string[];
  data: number[];
  title?: string;
  outputPath?: string;
  width?: number;
  height?: number;
}) {
  const config: ChartConfiguration = {
    data: {
      datasets: [
        {
          data,
          label: title ?? "Dataset",
        },
      ],
      labels,
    },
    options: {
      plugins: {
        title: title ? { display: true, text: title } : undefined,
      },
    },
    type,
  };

  return renderChart({
    config,
    height,
    outputPath: resolve(outputPath),
    width,
  });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cli = cac("quick-chart");
  cli.option("--type <name>", "Chart type");
  cli.option("--labels <a,b,c>", "Comma-separated label list");
  cli.option("--data <1,2,3>", "Comma-separated numeric values");
  cli.option("--title <text>", "Optional chart title");
  cli.option("--output <path>", "Output chart file path");
  cli.option("--width <px>", "Chart width in pixels");
  cli.option("--height <px>", "Chart height in pixels");
  cli.help();
  const parsed = cli.parse();
  const { options } = parsed;

  if (!options.type || !options.labels || !options.data) {
    console.error(
      "Usage: tsx scripts/quick-chart.ts --type <bar|line|pie|doughnut|radar> --labels <a,b,c> --data <1,2,3> [--title <text>] [--output <path>] [--width <px>] [--height <px>]",
    );
    process.exit(1);
  }

  const type = options.type as QuickChartType;
  if (!VALID_TYPES.has(type)) {
    console.error(
      `Invalid chart type "${type}". Valid types: ${[...VALID_TYPES].join(", ")}`,
    );
    process.exit(1);
  }

  const labels = options.labels.split(",").map((s: string) => s.trim());
  const data = options.data.split(",").map((s: string) => Number(s.trim()));
  const width = options.width ? Number(options.width) : 800;
  const height = options.height ? Number(options.height) : 600;
  const outputPath = options.output ?? "chart.png";

  const result = await createQuickChart({
    data,
    height,
    labels,
    outputPath,
    title: options.title,
    type,
    width,
  });

  const relOutput = result.outputPath;
  console.log(`Created ${type} chart → ${relOutput} (${result.bytes} bytes)`);
}
