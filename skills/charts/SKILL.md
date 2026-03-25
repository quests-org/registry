---
name: charts
description: "Create chart and graph images (PNG/PDF) from data. Use for bar charts, line charts, pie charts, doughnut charts, radar charts, data visualization, plotting data, or any Chart.js rendering."
---

# Charts

Create chart images server-side using Chart.js via `chartjs-node-canvas`. Supports PNG and PDF output.

## Scripts

### `create-chart.ts` Render a chart from a Chart.js JSON config file

Exports:

- `createChartFromConfig({ configPath, outputPath, width, height, format, }: { configPath: string; outputPath?: string; width?: number; height?: number; format?: ChartFormat; }): Promise<{ bytes: number; outputPath: string; }>`

```text
create-chart

Usage:
  $ create-chart --config <path> [--output <path>] [--width <px>] [--height <px>] [--format png|pdf]

Options:
  --config <path>  Chart.js config JSON file path
  --output <path>  Output chart file path (default: chart.png)
  --width <px>     Chart width in pixels (default: 800)
  --height <px>    Chart height in pixels (default: 600)
  --format <name>  Output format: png or pdf (default: png)
  -h, --help       Display this message
```

### `quick-chart.ts` Create a simple chart from inline labels and data values

Exports:

- `createQuickChart({ type, labels, data, title, outputPath, width, height, }: { type: QuickChartType; labels: string[]; data: number[]; title?: string; outputPath?: string; width?: number; height?: number; }): Promise<{ bytes: number; outputPath: string; }>`

```text
quick-chart

Usage:
  $ quick-chart --type <bar|line|pie|doughnut|radar> --labels <a,b,c> --data <1,2,3> [--title <text>] [--output <path>] [--width <px>] [--height <px>]

Options:
  --type <name>     Chart type
  --labels <a,b,c>  Comma-separated label list
  --data <1,2,3>    Comma-separated numeric values
  --title <text>    Optional chart title
  --output <path>   Output chart file path (default: chart.png)
  --width <px>      Chart width in pixels (default: 800)
  --height <px>     Chart height in pixels (default: 600)
  -h, --help        Display this message
```

## Example Chart.js Config JSON

Use this as a template for `--config` files:

```json
{
  "type": "bar",
  "data": {
    "labels": ["January", "February", "March", "April", "May"],
    "datasets": [
      {
        "label": "Revenue ($k)",
        "data": [12, 19, 3, 5, 15],
        "backgroundColor": [
          "rgba(255, 99, 132, 0.5)",
          "rgba(54, 162, 235, 0.5)",
          "rgba(255, 206, 86, 0.5)",
          "rgba(75, 192, 192, 0.5)",
          "rgba(153, 102, 255, 0.5)"
        ],
        "borderColor": [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)"
        ],
        "borderWidth": 1
      }
    ]
  },
  "options": {
    "plugins": {
      "title": {
        "display": true,
        "text": "Monthly Revenue"
      }
    },
    "scales": {
      "y": {
        "beginAtZero": true
      }
    }
  }
}
```

## Supported Chart Types

`bar`, `line`, `pie`, `doughnut`, `radar`, `scatter`, `bubble`, `polarArea` — any type supported by Chart.js.

## Known Limitations

- PDF output requires the canvas type to be set to `pdf`
- Custom fonts must be registered before rendering
