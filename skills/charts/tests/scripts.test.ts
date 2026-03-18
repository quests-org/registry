import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { createChartFromConfig } from "../scripts/create-chart.ts";
import { createQuickChart } from "../scripts/quick-chart.ts";

const PNG_MAGIC_BYTES = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

describe("create-chart", () => {
  it("creates a bar chart from a JSON config", async () => {
    const configPath = path.join(os.tmpdir(), "test-chart-config.json");
    const outputPath = path.join(os.tmpdir(), "test-chart-bar.png");

    await fs.writeFile(
      configPath,
      JSON.stringify({
        data: {
          datasets: [{ data: [10, 20, 30], label: "Sales" }],
          labels: ["A", "B", "C"],
        },
        type: "bar",
      }),
    );

    const result = await createChartFromConfig({ configPath, outputPath });

    expect(result.outputPath).toBe(outputPath);
    expect(result.bytes).toBeGreaterThan(0);

    const file = await fs.readFile(outputPath);
    expect(file.subarray(0, 8).equals(PNG_MAGIC_BYTES)).toBe(true);
  });
});

describe("quick-chart", () => {
  it("creates a bar chart", async () => {
    const outputPath = path.join(os.tmpdir(), "test-quick-bar.png");

    const result = await createQuickChart({
      data: [5, 10, 15],
      labels: ["X", "Y", "Z"],
      outputPath,
      title: "Test Bar",
      type: "bar",
    });

    expect(result.outputPath).toBe(outputPath);
    expect(result.bytes).toBeGreaterThan(0);

    const file = await fs.readFile(outputPath);
    expect(file.subarray(0, 8).equals(PNG_MAGIC_BYTES)).toBe(true);
  });

  it("creates a pie chart", async () => {
    const outputPath = path.join(os.tmpdir(), "test-quick-pie.png");

    const result = await createQuickChart({
      data: [40, 30, 20, 10],
      labels: ["Red", "Blue", "Green", "Yellow"],
      outputPath,
      title: "Test Pie",
      type: "pie",
    });

    expect(result.outputPath).toBe(outputPath);
    expect(result.bytes).toBeGreaterThan(0);

    const file = await fs.readFile(outputPath);
    expect(file.subarray(0, 8).equals(PNG_MAGIC_BYTES)).toBe(true);
  });
});
