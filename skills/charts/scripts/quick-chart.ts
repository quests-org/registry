import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

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
  const { values } = parseArgs({
    options: {
      data: { type: "string" },
      height: { type: "string" },
      labels: { type: "string" },
      output: { type: "string" },
      title: { type: "string" },
      type: { type: "string" },
      width: { type: "string" },
    },
  });

  if (!values.type || !values.labels || !values.data) {
    console.error(
      "Usage: tsx scripts/quick-chart.ts --type <bar|line|pie|doughnut|radar> --labels <a,b,c> --data <1,2,3> [--title <text>] [--output <path>] [--width <px>] [--height <px>]",
    );
    process.exit(1);
  }

  const type = values.type as QuickChartType;
  if (!VALID_TYPES.has(type)) {
    console.error(
      `Invalid chart type "${type}". Valid types: ${[...VALID_TYPES].join(", ")}`,
    );
    process.exit(1);
  }

  const labels = values.labels.split(",").map((s) => s.trim());
  const data = values.data.split(",").map((s) => Number(s.trim()));
  const width = values.width ? Number(values.width) : 800;
  const height = values.height ? Number(values.height) : 600;
  const outputPath = values.output ?? "chart.png";

  const result = await createQuickChart({
    data,
    height,
    labels,
    outputPath,
    title: values.title,
    type,
    width,
  });

  const relOutput = result.outputPath;
  console.log(`Created ${type} chart → ${relOutput} (${result.bytes} bytes)`);
}
