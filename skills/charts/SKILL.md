---
name: charts
description: "Create chart and graph images (PNG/PDF) from data. Use for bar charts, line charts, pie charts, doughnut charts, radar charts, data visualization, plotting data, or any Chart.js rendering."
---

# Charts

Create chart images server-side using Chart.js via `chartjs-node-canvas`. Supports PNG and PDF output.

## Scripts

### `create-chart.ts` Create a chart from a JSON config file

Export: `createChartFromConfig({ configPath, outputPath?, width?, height?, format? })`

```bash
tsx skills/charts/scripts/create-chart.ts --config <path> [--output <path>] [--width <px>] [--height <px>] [--format png|pdf]
```

| Argument          | Required | Default     | Description                            |
| ----------------- | -------- | ----------- | -------------------------------------- |
| `--config <path>` | Yes      |             | Path to JSON file with Chart.js config |
| `--output <path>` | No       | `chart.png` | Output image path                      |
| `--width <px>`    | No       | `800`       | Chart width in pixels                  |
| `--height <px>`   | No       | `600`       | Chart height in pixels                 |
| `--format <fmt>`  | No       | `png`       | Output format: `png` or `pdf`          |

### `quick-chart.ts` Create common charts with simple CLI args

Export: `createQuickChart({ type, labels, data, title?, outputPath?, width?, height? })`

```bash
tsx skills/charts/scripts/quick-chart.ts --type <type> --labels <a,b,c> --data <1,2,3> [--title <text>] [--output <path>] [--width <px>] [--height <px>]
```

| Argument          | Required | Default     | Description                                           |
| ----------------- | -------- | ----------- | ----------------------------------------------------- |
| `--type <type>`   | Yes      |             | Chart type: `bar`, `line`, `pie`, `doughnut`, `radar` |
| `--labels <list>` | Yes      |             | Comma-separated labels                                |
| `--data <list>`   | Yes      |             | Comma-separated numbers                               |
| `--title <text>`  | No       |             | Chart title                                           |
| `--output <path>` | No       | `chart.png` | Output image path                                     |
| `--width <px>`    | No       | `800`       | Chart width in pixels                                 |
| `--height <px>`   | No       | `600`       | Chart height in pixels                                |

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
